import { describe, expect, mock, test } from "bun:test";

type Delegate = (args: unknown) => Promise<unknown>;

let classFindFirst: Delegate;
let classHourAdditionCount: Delegate;
let classHourAdditionFindMany: Delegate;

const prismaMock = {
	$transaction: async <T>(callback: (tx: never) => Promise<T>) =>
		callback(transactionClient as never),
	class: {
		findFirst: (args: unknown) => classFindFirst(args),
	},
	classHourAddition: {
		count: (args: unknown) => classHourAdditionCount(args),
		findMany: (args: unknown) => classHourAdditionFindMany(args),
	},
};

let transactionClient: unknown;

mock.module("../lib/db", () => ({ prisma: prismaMock }));

const { ClassRepository } = await import("./class.repository");

const requestId = "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c";
const createdAt = new Date("2026-08-11T03:00:00.000Z");

function classWithHours(totalHours: number) {
	return { id: "class-1", totalHours };
}

function customAddition(hours = 2.5) {
	return {
		id: "addition-1",
		classId: "class-1",
		source: "CUSTOM" as const,
		hours,
		sourceCourseId: null,
		sourceCourseName: null,
		requestId,
		createdAt,
	};
}

describe("ClassRepository hour additions", () => {
	test("creates a studentless class without querying the student table", async () => {
		let createdData: unknown;
		const originalFindById = ClassRepository.prototype.findById;
		ClassRepository.prototype.findById = async () => ({}) as never;
		transactionClient = {
			student: {
				count: async () => {
					throw new Error(
						"student validation must be skipped for an empty list",
					);
				},
			},
			class: {
				create: async (args: { data: unknown }) => {
					createdData = args.data;
					return { id: "class-1" };
				},
			},
		};

		try {
			await new ClassRepository().create({
				tutorId: "tutor-1",
				name: "  Algebra  ",
			});
			expect(createdData).toEqual({
				tutorId: "tutor-1",
				name: "Algebra",
				totalHours: 0,
			});
		} finally {
			ClassRepository.prototype.findById = originalFindById;
		}
	});

	test("normalizes custom hours before atomically incrementing the class", async () => {
		let createdData: unknown;
		let incrementData: unknown;
		transactionClient = {
			class: {
				findFirst: async () => classWithHours(0),
				updateMany: async (args: { data: unknown }) => {
					incrementData = args.data;
					return { count: 1 };
				},
				findUnique: async () => ({ totalHours: 0.3 }),
			},
			classHourAddition: {
				findUnique: async () => null,
				create: async (args: { data: unknown }) => {
					createdData = args.data;
					return customAddition(0.3);
				},
			},
			course: { findFirst: async () => null },
			schedule: {
				aggregate: async () => ({ _sum: { durationMinutes: 0 } }),
			},
		};

		const result = await new ClassRepository().addHourAddition(
			"class-1",
			"tutor-1",
			{ source: "custom", hours: 0.1 + 0.2, requestId },
		);

		expect(createdData).toEqual({
			classId: "class-1",
			source: "CUSTOM",
			hours: 0.3,
			sourceCourseId: null,
			sourceCourseName: null,
			requestId,
		});
		expect(incrementData).toEqual({ totalHours: { increment: 0.3 } });
		expect(result.addition.toClassHourAdditionDTO()).toMatchObject({
			source: "custom",
			hours: 0.3,
		});
		expect(result.totalHours).toBe(0.3);
		expect(result.remainingHours).toBe(0.3);
	});

	test("snapshots server-current course data without retaining a course relation", async () => {
		let createdData: unknown;
		transactionClient = {
			class: {
				findFirst: async () => classWithHours(1),
				updateMany: async () => ({ count: 1 }),
				findUnique: async () => ({ totalHours: 13 }),
			},
			classHourAddition: {
				findUnique: async () => null,
				create: async (args: { data: unknown }) => {
					createdData = args.data;
					return {
						...customAddition(12),
						source: "COURSE" as const,
						sourceCourseId: "course-1",
						sourceCourseName: "Mathematics",
					};
				},
			},
			course: {
				findFirst: async () => ({
					id: "course-1",
					name: "Mathematics",
					defaultTotalHours: { toNumber: () => 12 },
				}),
			},
			schedule: { aggregate: async () => ({ _sum: { durationMinutes: 0 } }) },
		};

		await new ClassRepository().addHourAddition("class-1", "tutor-1", {
			source: "course",
			courseId: "course-1",
			requestId,
		});

		expect(createdData).toEqual({
			classId: "class-1",
			source: "COURSE",
			hours: 12,
			sourceCourseId: "course-1",
			sourceCourseName: "Mathematics",
			requestId,
		});
	});

	test("replays a matching request ID without a second ledger write or increment", async () => {
		let createCalls = 0;
		let updateCalls = 0;
		transactionClient = {
			class: {
				findFirst: async () => classWithHours(5),
				updateMany: async () => {
					updateCalls += 1;
					return { count: 1 };
				},
			},
			classHourAddition: {
				findUnique: async () => customAddition(),
				create: async () => {
					createCalls += 1;
					return customAddition();
				},
			},
			course: { findFirst: async () => null },
			schedule: { aggregate: async () => ({ _sum: { durationMinutes: 120 } }) },
		};

		const result = await new ClassRepository().addHourAddition(
			"class-1",
			"tutor-1",
			{ source: "custom", hours: 2.5, requestId },
		);

		expect(createCalls).toBe(0);
		expect(updateCalls).toBe(0);
		expect(result.totalHours).toBe(5);
		expect(result.remainingHours).toBe(3);
	});

	test("normalizes floating-point custom retries to ledger precision", async () => {
		let createCalls = 0;
		let updateCalls = 0;
		transactionClient = {
			class: {
				findFirst: async () => classWithHours(5),
				updateMany: async () => {
					updateCalls += 1;
					return { count: 1 };
				},
			},
			classHourAddition: {
				findUnique: async () => ({
					...customAddition(0.3),
					hours: { toNumber: () => 0.3 },
				}),
				create: async () => {
					createCalls += 1;
					return customAddition(0.3);
				},
			},
			course: { findFirst: async () => null },
			schedule: { aggregate: async () => ({ _sum: { durationMinutes: 0 } }) },
		};

		const result = await new ClassRepository().addHourAddition(
			"class-1",
			"tutor-1",
			{ source: "custom", hours: 0.1 + 0.2, requestId },
		);

		expect(createCalls).toBe(0);
		expect(updateCalls).toBe(0);
		expect(result.addition.hours).toBe(0.3);
	});

	test("rejects conflicting request ID reuse", async () => {
		transactionClient = {
			class: {
				findFirst: async () => classWithHours(5),
				updateMany: async () => ({ count: 1 }),
			},
			classHourAddition: {
				findUnique: async () => customAddition(),
				create: async () => customAddition(),
			},
			course: { findFirst: async () => null },
			schedule: { aggregate: async () => ({ _sum: { durationMinutes: 0 } }) },
		};

		await expect(
			new ClassRepository().addHourAddition("class-1", "tutor-1", {
				source: "custom",
				hours: 3,
				requestId,
			}),
		).rejects.toMatchObject({
			errorCode: "HOUR_ADDITION_REQUEST_CONFLICT",
			status: 409,
		});
	});

	test("replays a concurrent matching request that loses the maximum-boundary update", async () => {
		let classReads = 0;
		let ledgerReads = 0;
		let createCalls = 0;
		transactionClient = {
			class: {
				findFirst: async () => {
					classReads += 1;
					return classWithHours(
						classReads === 1 ? 99_999_999.98 : 99_999_999.99,
					);
				},
				updateMany: async () => ({ count: 0 }),
			},
			classHourAddition: {
				findUnique: async () => {
					ledgerReads += 1;
					return ledgerReads === 1 ? null : customAddition(0.01);
				},
				create: async () => {
					createCalls += 1;
					return customAddition(0.01);
				},
			},
			course: { findFirst: async () => null },
			schedule: { aggregate: async () => ({ _sum: { durationMinutes: 0 } }) },
		};

		const result = await new ClassRepository().addHourAddition(
			"class-1",
			"tutor-1",
			{ source: "custom", hours: 0.01, requestId },
		);

		expect(createCalls).toBe(0);
		expect(ledgerReads).toBe(2);
		expect(result.addition.hours).toBe(0.01);
		expect(result.totalHours).toBe(99_999_999.99);
		expect(result.remainingHours).toBe(99_999_999.99);
	});

	test("keeps conflicting concurrent request reuses as conflicts", async () => {
		let ledgerReads = 0;
		let createCalls = 0;
		transactionClient = {
			class: {
				findFirst: async () => classWithHours(99_999_999.99),
				updateMany: async () => ({ count: 0 }),
			},
			classHourAddition: {
				findUnique: async () => {
					ledgerReads += 1;
					return ledgerReads === 1 ? null : customAddition(0.01);
				},
				create: async () => {
					createCalls += 1;
					return customAddition(0.01);
				},
			},
			course: { findFirst: async () => null },
			schedule: { aggregate: async () => ({ _sum: { durationMinutes: 0 } }) },
		};

		await expect(
			new ClassRepository().addHourAddition("class-1", "tutor-1", {
				source: "custom",
				hours: 0.02,
				requestId,
			}),
		).rejects.toMatchObject({
			errorCode: "HOUR_ADDITION_REQUEST_CONFLICT",
			status: 409,
		});
		expect(createCalls).toBe(0);
		expect(ledgerReads).toBe(2);
	});

	test("rejects additions that exceed the per-addition or class total limit", async () => {
		let createCalls = 0;
		let updateQuery: unknown;
		transactionClient = {
			class: {
				findFirst: async () => classWithHours(99_999_999.98),
				updateMany: async (args: { where: unknown }) => {
					updateQuery = args.where;
					return { count: 0 };
				},
			},
			classHourAddition: {
				findUnique: async () => null,
				create: async () => {
					createCalls += 1;
					return customAddition();
				},
			},
			course: { findFirst: async () => null },
			schedule: { aggregate: async () => ({ _sum: { durationMinutes: 0 } }) },
		};

		await expect(
			new ClassRepository().addHourAddition("class-1", "tutor-1", {
				source: "custom",
				hours: 0.02,
				requestId,
			}),
		).rejects.toMatchObject({
			errorCode: "HOUR_ADDITION_LIMIT_EXCEEDED",
			status: 400,
		});
		expect(createCalls).toBe(0);
		expect(updateQuery).toMatchObject({
			id: "class-1",
			tutorId: "tutor-1",
			totalHours: { lte: expect.anything() },
		});

		transactionClient = {
			class: {
				findFirst: async () => classWithHours(0),
			},
			classHourAddition: { findUnique: async () => null },
			course: { findFirst: async () => null },
			schedule: { aggregate: async () => ({ _sum: { durationMinutes: 0 } }) },
		};

		await expect(
			new ClassRepository().addHourAddition("class-1", "tutor-1", {
				source: "custom",
				hours: 100_000_000,
				requestId,
			}),
		).rejects.toMatchObject({
			errorCode: "HOUR_ADDITION_LIMIT_EXCEEDED",
			status: 400,
		});
	});

	test("rejects values that normalize below one hundredth without writing", async () => {
		let createCalls = 0;
		transactionClient = {
			class: {
				findFirst: async () => classWithHours(0),
			},
			classHourAddition: {
				findUnique: async () => null,
				create: async () => {
					createCalls += 1;
					return customAddition();
				},
			},
			course: { findFirst: async () => null },
			schedule: { aggregate: async () => ({ _sum: { durationMinutes: 0 } }) },
		};

		await expect(
			new ClassRepository().addHourAddition("class-1", "tutor-1", {
				source: "custom",
				hours: 1e-18,
				requestId,
			}),
		).rejects.toMatchObject({
			errorCode: "INVALID_HOUR_ADDITION",
			status: 400,
		});
		expect(createCalls).toBe(0);
	});

	test("scopes history to the tutor and reads pages newest first", async () => {
		let historyQuery: unknown;
		classFindFirst = async () => ({ id: "class-1" });
		classHourAdditionCount = async () => 3;
		classHourAdditionFindMany = async (args) => {
			historyQuery = args;
			return [customAddition()];
		};

		const result = await new ClassRepository().findHourAdditions(
			"class-1",
			"tutor-1",
			{ page: 2, limit: 2 },
		);

		expect(historyQuery).toEqual({
			where: { classId: "class-1" },
			skip: 2,
			take: 2,
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		});
		expect(result.pagination).toEqual({
			total: 3,
			page: 2,
			limit: 2,
			totalPages: 2,
			hasNext: false,
			hasPrev: true,
		});

		classFindFirst = async () => null;
		await expect(
			new ClassRepository().findHourAdditions("foreign-class", "tutor-1"),
		).rejects.toMatchObject({
			errorCode: "CLASS_NOT_FOUND",
			status: 404,
		});
	});
});
