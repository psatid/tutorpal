import { describe, expect, mock, test } from "bun:test";
import { Prisma } from "@prisma/client";

type DeleteArgs = Prisma.ClassDeleteArgs;
type TransactionCallback = (transaction: unknown) => Promise<unknown>;
type TransactionRunner = (
	callback: TransactionCallback,
	options: unknown,
) => Promise<unknown>;

let deleteClass: (args: DeleteArgs) => Promise<unknown>;
let runTransaction: TransactionRunner = async () => {
	throw new Error("read must run inside the accounting transaction");
};

function unexpectedRootRead(): never {
	throw new Error("accounting reads must use the transaction client");
}

mock.module("../lib/db", () => ({
	prisma: {
		$transaction: (callback: TransactionCallback, options: unknown) =>
			runTransaction(callback, options),
		class: {
			delete: (args: DeleteArgs) => deleteClass(args),
			count: unexpectedRootRead,
			findFirst: unexpectedRootRead,
			findMany: unexpectedRootRead,
		},
		schedule: { groupBy: unexpectedRootRead },
		classHourDeduction: {
			groupBy: unexpectedRootRead,
		},
		classHourAddition: { aggregate: unexpectedRootRead },
	},
}));

const { ClassRepository } = await import("./class.repository");

function knownRequestError(code: "P2022" | "P2025") {
	return new Prisma.PrismaClientKnownRequestError("Database request failed", {
		code,
		clientVersion: Prisma.prismaVersion.client,
	});
}

const classRecord = {
	id: "class-1",
	tutorId: "tutor-1",
	name: "Algebra",
	totalSeconds: 36_000n,
	createdAt: new Date("2026-10-12T00:00:00.000Z"),
	updatedAt: new Date("2026-10-12T01:00:00.000Z"),
	students: [],
};

function useAccountingRows() {
	return [
		{
			classId: "class-1",
			status: "SCHEDULED",
			_sum: { durationSeconds: 5_400n },
		},
		{
			classId: "class-1",
			status: "COMPLETED",
			_sum: { durationSeconds: 7_200n },
		},
		{
			classId: "class-1",
			status: "NO_SHOW",
			_sum: { durationSeconds: 1_800n },
		},
	];
}

function useAccountingTransactionFixture({
	count = 1,
	listRows = [classRecord],
	findFirstResult = classRecord,
	revenueAmount = 1_250,
}: {
	count?: number;
	listRows?: (typeof classRecord)[];
	findFirstResult?: typeof classRecord | null;
	revenueAmount?: number | null;
} = {}) {
	let transactionCalls = 0;
	let transactionOptions: unknown;
	let countArgs: unknown;
	let findManyArgs: unknown;
	let findFirstArgs: unknown;
	let scheduleGroupByArgs: unknown;
	let deductionGroupByArgs: unknown;
	let revenueAggregateArgs: unknown;
	const transactionClient = {
		class: {
			count: async (args: unknown) => {
				countArgs = args;
				return count;
			},
			findMany: async (args: unknown) => {
				findManyArgs = args;
				return listRows;
			},
			findFirst: async (args: unknown) => {
				findFirstArgs = args;
				return findFirstResult;
			},
		},
		schedule: {
			groupBy: async (args: unknown) => {
				scheduleGroupByArgs = args;
				return useAccountingRows();
			},
		},
		classHourDeduction: {
			groupBy: async (args: unknown) => {
				deductionGroupByArgs = args;
				return [{ classId: "class-1", _sum: { secondsDeducted: 7_200n } }];
			},
		},
		classHourAddition: {
			aggregate: async (args: unknown) => {
				revenueAggregateArgs = args;
				return {
					_sum: {
						revenueAmount:
							revenueAmount === null ? null : { toNumber: () => revenueAmount },
					},
				};
			},
		},
	};
	runTransaction = async (callback, options) => {
		transactionCalls += 1;
		transactionOptions = options;
		return callback(transactionClient);
	};

	return {
		transactionClient,
		getTransactionCalls: () => transactionCalls,
		getTransactionOptions: () => transactionOptions,
		getCountArgs: () => countArgs,
		getFindManyArgs: () => findManyArgs,
		getFindFirstArgs: () => findFirstArgs,
		getScheduleGroupByArgs: () => scheduleGroupByArgs,
		getDeductionGroupByArgs: () => deductionGroupByArgs,
		getRevenueAggregateArgs: () => revenueAggregateArgs,
	};
}

describe("ClassRepository.delete", () => {
	test("deletes only the tutor-owned class", async () => {
		let deleteArgs: DeleteArgs | undefined;
		let deleteCalls = 0;
		deleteClass = async (args) => {
			deleteCalls += 1;
			deleteArgs = args;
			return {};
		};

		await expect(
			new ClassRepository().delete("class-1", "tutor-1"),
		).resolves.toBe("deleted");
		expect(deleteArgs).toEqual({
			where: { id: "class-1", tutorId: "tutor-1" },
		});
		expect(deleteCalls).toBe(1);
	});

	test("maps P2025 to not_found", async () => {
		deleteClass = async () => {
			throw knownRequestError("P2025");
		};

		await expect(
			new ClassRepository().delete("class-1", "tutor-1"),
		).resolves.toBe("not_found");
	});

	test("rethrows unrelated Prisma errors", async () => {
		const unexpectedError = knownRequestError("P2022");
		deleteClass = async () => {
			throw unexpectedError;
		};

		await expect(
			new ClassRepository().delete("class-1", "tutor-1"),
		).rejects.toBe(unexpectedError);
	});
});

describe("ClassRepository class accounting", () => {
	test("uses one RepeatableRead transaction for the tutor-scoped list and accounting", async () => {
		const fixture = useAccountingTransactionFixture();

		const result = await new ClassRepository().findAll("tutor-1", {
			page: 2,
			limit: 5,
		});

		expect(fixture.getTransactionCalls()).toBe(1);
		expect(fixture.getTransactionOptions()).toEqual({
			isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
		});
		expect(fixture.getCountArgs()).toEqual({ where: { tutorId: "tutor-1" } });
		expect(fixture.getFindManyArgs()).toMatchObject({
			where: { tutorId: "tutor-1" },
			skip: 5,
			take: 5,
		});
		expect(fixture.getScheduleGroupByArgs()).toEqual(
			expect.objectContaining({
				where: expect.objectContaining({ classId: { in: ["class-1"] } }),
			}),
		);
		expect(fixture.getDeductionGroupByArgs()).toEqual(
			expect.objectContaining({
				where: expect.objectContaining({ classId: { in: ["class-1"] } }),
			}),
		);
		expect(result.data[0]?.toClassDTO()).toMatchObject({
			remainingHours: 6,
			scheduledHours: 1.5,
			usedHours: 2,
		});
	});

	test("uses one RepeatableRead transaction for the tutor-scoped class lookup and accounting", async () => {
		const fixture = useAccountingTransactionFixture();

		const result = await new ClassRepository().findById("class-1", "tutor-1");

		expect(fixture.getTransactionCalls()).toBe(1);
		expect(fixture.getTransactionOptions()).toEqual({
			isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
		});
		expect(fixture.getFindFirstArgs()).toMatchObject({
			where: { id: "class-1", tutorId: "tutor-1" },
		});
		expect(fixture.getScheduleGroupByArgs()).toBeDefined();
		expect(fixture.getDeductionGroupByArgs()).toBeDefined();
		expect(result?.toClassDTO()).toMatchObject({
			remainingHours: 6,
			scheduledHours: 1.5,
			usedHours: 2,
		});
	});

	test("uses the same RepeatableRead transaction for class detail accounting and revenue", async () => {
		const fixture = useAccountingTransactionFixture({ revenueAmount: 1_250 });

		const result = await new ClassRepository().findDetailById(
			"class-1",
			"tutor-1",
		);

		expect(fixture.getTransactionCalls()).toBe(1);
		expect(fixture.getTransactionOptions()).toEqual({
			isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
		});
		expect(fixture.getFindFirstArgs()).toMatchObject({
			where: { id: "class-1", tutorId: "tutor-1" },
		});
		expect(fixture.getScheduleGroupByArgs()).toBeDefined();
		expect(fixture.getDeductionGroupByArgs()).toBeDefined();
		expect(fixture.getRevenueAggregateArgs()).toEqual({
			where: { classId: "class-1" },
			_sum: { revenueAmount: true },
		});
		expect(result?.recordedRevenue).toBe(1_250);
		expect(result?.classData.toClassDTO()).toMatchObject({
			remainingHours: 6,
			scheduledHours: 1.5,
			usedHours: 2,
		});
	});

	test("keeps an empty list in its RepeatableRead transaction without accounting queries", async () => {
		const fixture = useAccountingTransactionFixture({ count: 0, listRows: [] });

		const result = await new ClassRepository().findAll("tutor-1");

		expect(fixture.getTransactionCalls()).toBe(1);
		expect(fixture.getTransactionOptions()).toEqual({
			isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
		});
		expect(fixture.getCountArgs()).toEqual({ where: { tutorId: "tutor-1" } });
		expect(fixture.getFindManyArgs()).toMatchObject({
			where: { tutorId: "tutor-1" },
		});
		expect(fixture.getScheduleGroupByArgs()).toBeUndefined();
		expect(fixture.getDeductionGroupByArgs()).toBeUndefined();
		expect(result).toMatchObject({
			data: [],
			pagination: {
				total: 0,
				page: 1,
				limit: 10,
				totalPages: 0,
				hasNext: false,
				hasPrev: false,
			},
		});
	});

	test("returns missing class detail without accounting or revenue reads", async () => {
		const fixture = useAccountingTransactionFixture({ findFirstResult: null });

		await expect(
			new ClassRepository().findDetailById("foreign-class", "tutor-1"),
		).resolves.toBeNull();

		expect(fixture.getTransactionCalls()).toBe(1);
		expect(fixture.getTransactionOptions()).toEqual({
			isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
		});
		expect(fixture.getFindFirstArgs()).toMatchObject({
			where: { id: "foreign-class", tutorId: "tutor-1" },
		});
		expect(fixture.getScheduleGroupByArgs()).toBeUndefined();
		expect(fixture.getDeductionGroupByArgs()).toBeUndefined();
		expect(fixture.getRevenueAggregateArgs()).toBeUndefined();
	});
});
