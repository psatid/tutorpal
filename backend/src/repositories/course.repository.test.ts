import { describe, expect, mock, test } from "bun:test";
import { Prisma } from "@prisma/client";

type DeleteArgs = Prisma.CourseDeleteArgs;
type Delegate = (args: unknown) => Promise<unknown>;

let deleteCourse: (args: DeleteArgs) => Promise<unknown>;
let courseCreate: Delegate;
let courseFindFirst: Delegate;
let classHourAdditionAggregate: Delegate;

mock.module("../lib/db", () => ({
	prisma: {
		course: {
			create: (args: unknown) => courseCreate(args),
			delete: (args: DeleteArgs) => deleteCourse(args),
			findFirst: (args: unknown) => courseFindFirst(args),
		},
		classHourAddition: {
			aggregate: (args: unknown) => classHourAdditionAggregate(args),
		},
	},
}));

const { CourseRepository } = await import("./course.repository");

function knownRequestError(code: "P2022" | "P2025") {
	return new Prisma.PrismaClientKnownRequestError("Database request failed", {
		code,
		clientVersion: Prisma.prismaVersion.client,
	});
}

function courseRecord() {
	return {
		id: "course-1",
		tutorId: "tutor-1",
		name: "Mathematics",
		defaultTotalHours: { toNumber: () => 20 },
		pricingMode: "FIXED_PRICE" as const,
		priceAmount: { toNumber: () => 9_999 },
		createdAt: new Date("2026-08-13T00:00:00.000Z"),
		updatedAt: new Date("2026-08-13T00:00:00.000Z"),
	};
}

describe("CourseRepository.delete", () => {
	test("deletes only the tutor-owned course", async () => {
		let deleteArgs: DeleteArgs | undefined;
		deleteCourse = async (args) => {
			deleteArgs = args;
			return {};
		};

		await expect(
			new CourseRepository().delete("course-1", "tutor-1"),
		).resolves.toBe("deleted");
		expect(deleteArgs).toEqual({
			where: { id: "course-1", tutorId: "tutor-1" },
		});
	});

	test("maps P2025 to not_found", async () => {
		deleteCourse = async () => {
			throw knownRequestError("P2025");
		};

		await expect(
			new CourseRepository().delete("course-1", "tutor-1"),
		).resolves.toBe("not_found");
	});

	test("rethrows unrelated Prisma errors", async () => {
		const unexpectedError = knownRequestError("P2022");
		deleteCourse = async () => {
			throw unexpectedError;
		};

		await expect(
			new CourseRepository().delete("course-1", "tutor-1"),
		).rejects.toBe(unexpectedError);
	});
});

describe("CourseRepository.create", () => {
	test("persists an omitted price as null", async () => {
		let createArgs: unknown;
		courseCreate = async (args) => {
			createArgs = args;
			return courseRecord();
		};

		await new CourseRepository().create({
			tutorId: "tutor-1",
			name: "  Mathematics  ",
			defaultTotalHours: 20,
			pricingMode: "hourly_rate",
		});

		expect(createArgs).toEqual({
			data: {
				tutorId: "tutor-1",
				name: "Mathematics",
				defaultTotalHours: 20,
				pricingMode: "HOURLY_RATE",
				priceAmount: null,
			},
		});
	});
});

describe("CourseRepository.findDetailById", () => {
	test("authorizes the course before aggregating and excludes foreign classes", async () => {
		let courseQuery: unknown;
		let aggregateQuery: unknown;
		courseFindFirst = async (args) => {
			courseQuery = args;
			return courseRecord();
		};
		classHourAdditionAggregate = async (args) => {
			aggregateQuery = args;
			return { _sum: { hours: null, revenueAmount: null } };
		};

		const result = await new CourseRepository().findDetailById(
			"course-1",
			"tutor-1",
		);

		expect(courseQuery).toEqual({
			where: { id: "course-1", tutorId: "tutor-1" },
		});
		expect(aggregateQuery).toEqual({
			where: {
				source: "COURSE",
				sourceCourseId: "course-1",
				class: { tutorId: "tutor-1" },
			},
			_sum: { hours: true, revenueAmount: true },
		});
		expect(result?.recordedHours).toBe(0);
		expect(result?.recordedRevenue).toBe(0);
	});

	test("does not aggregate for a missing or foreign-owned course", async () => {
		let aggregateCalls = 0;
		courseFindFirst = async () => null;
		classHourAdditionAggregate = async () => {
			aggregateCalls += 1;
			return { _sum: { revenueAmount: { toNumber: () => 1 } } };
		};

		await expect(
			new CourseRepository().findDetailById("foreign-course", "tutor-1"),
		).resolves.toBeNull();
		expect(aggregateCalls).toBe(0);
	});

	test("uses immutable ledger revenue rather than the mutable course price", async () => {
		courseFindFirst = async () => courseRecord();
		classHourAdditionAggregate = async () => ({
			_sum: {
				hours: { toNumber: () => 12 },
				revenueAmount: { toNumber: () => 1_250 },
			},
		});

		const result = await new CourseRepository().findDetailById(
			"course-1",
			"tutor-1",
		);

		expect(result?.course.toCourseDTO()).toMatchObject({ priceAmount: 9_999 });
		expect(result?.recordedHours).toBe(12);
		expect(result?.recordedRevenue).toBe(1_250);
	});

	test("includes legacy linked additions in hours but excludes null revenue", async () => {
		courseFindFirst = async () => courseRecord();
		classHourAdditionAggregate = async () => ({
			_sum: {
				hours: { toNumber: () => 8.5 },
				revenueAmount: null,
			},
		});

		const result = await new CourseRepository().findDetailById(
			"course-1",
			"tutor-1",
		);

		expect(result?.recordedHours).toBe(8.5);
		expect(result?.recordedRevenue).toBe(0);
	});
});
