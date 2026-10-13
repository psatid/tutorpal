import { describe, expect, test } from "bun:test";
import type { ClassHourAdditionPlan } from "../models/class.model";
import { ClassModel } from "../models/class.model";
import { ClassHourAdditionModel } from "../models/class-hour-addition.model";
import type {
	ClassDeleteOutcome,
	ClassHourAdditionTransaction,
	IClassRepository,
} from "../types/class.types";
import { ClassHourAdditionPersistenceError } from "../types/class.types";
import { ClassService } from "./class.service";

const createdAt = new Date("2026-08-11T03:00:00.000Z");
const requestId = "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c";

function classWithHours(totalSeconds = 0n) {
	return ClassModel.fromClassPrisma({
		id: "class-1",
		tutorId: "tutor-1",
		name: "Algebra",
		totalSeconds,
		createdAt,
		updatedAt: createdAt,
		students: [],
	});
}

function customAddition(revenueAmount: number | null = 500) {
	return ClassHourAdditionModel.fromPrisma({
		id: "addition-1",
		classId: "class-1",
		source: "CUSTOM",
		secondsAdded: 9_000n,
		revenueAmount,
		sourceCourseId: null,
		sourceCourseName: null,
		requestId,
		createdAt,
	});
}

function resultFor(addition = customAddition()) {
	return { addition, totalHours: 2.5, remainingHours: 2.5 };
}

function transactionWith(
	overrides: Partial<ClassHourAdditionTransaction> = {},
): ClassHourAdditionTransaction {
	return {
		loadOwnedClass: async () => classWithHours(),
		findByRequestId: async () => null,
		loadOwnedCourse: async () => null,
		resultForExisting: async (_classData, addition) => resultFor(addition),
		apply: async () => resultFor(),
		...overrides,
	};
}

function repositoryWithTransaction(
	transaction: ClassHourAdditionTransaction,
): IClassRepository {
	return {
		withHourAdditionTransaction: async (work) => work(transaction),
	} as IClassRepository;
}

function repositoryForDelete(outcome: ClassDeleteOutcome) {
	let deleteCalls = 0;
	let deleteArgs: [string, string] | undefined;
	const repository = {
		delete: async (id: string, tutorId: string) => {
			deleteCalls += 1;
			deleteArgs = [id, tutorId];
			return outcome;
		},
		findById: async () => {
			throw new Error("delete should not prefetch the class");
		},
	} as unknown as IClassRepository;

	return {
		repository,
		getDeleteArgs: () => deleteArgs,
		getDeleteCalls: () => deleteCalls,
	};
}

describe("ClassService", () => {
	test("coordinates a normalized custom addition through the tutor-scoped transaction port", async () => {
		let loadArgs: [string, string] | undefined;
		let requestLookupArgs: [string, string] | undefined;
		let applied: { tutorId: string; plan: ClassHourAdditionPlan } | undefined;
		const result = resultFor();
		const transaction = transactionWith({
			loadOwnedClass: async (classId, tutorId) => {
				loadArgs = [classId, tutorId];
				return classWithHours();
			},
			findByRequestId: async (classId, id) => {
				requestLookupArgs = [classId, id];
				return null;
			},
			loadOwnedCourse: async () => {
				throw new Error("custom additions must not load a course");
			},
			apply: async (tutorId, plan) => {
				applied = { tutorId, plan };
				return result;
			},
		});
		const service = new ClassService(repositoryWithTransaction(transaction));

		await expect(
			service.addHourAddition("class-1", "tutor-1", {
				source: "custom",
				hours: 0.1 + 0.2,
				revenueAmount: 0.1 + 0.2,
				requestId,
			}),
		).resolves.toBe(result);
		expect(loadArgs).toEqual(["class-1", "tutor-1"]);
		expect(requestLookupArgs).toEqual(["class-1", requestId]);
		expect(applied?.tutorId).toBe("tutor-1");
		expect(applied?.plan.incrementSeconds).toBe(1_080n);
		expect(applied?.plan.draft.revenueAmount).toBe(0.3);
	});

	test("replays a matching course request before reading mutable course data", async () => {
		const existing = ClassHourAdditionModel.fromPrisma({
			id: "addition-2",
			classId: "class-1",
			source: "COURSE",
			secondsAdded: 3_600n,
			revenueAmount: 500,
			sourceCourseId: "course-1",
			sourceCourseName: "Original Mathematics",
			requestId,
			createdAt,
		});
		let courseLoads = 0;
		let applyCalls = 0;
		const replayResult = resultFor(existing);
		const service = new ClassService(
			repositoryWithTransaction(
				transactionWith({
					findByRequestId: async () => existing,
					loadOwnedCourse: async () => {
						courseLoads += 1;
						return null;
					},
					resultForExisting: async () => replayResult,
					apply: async () => {
						applyCalls += 1;
						return resultFor();
					},
				}),
			),
		);

		await expect(
			service.addHourAddition("class-1", "tutor-1", {
				source: "course",
				courseId: "course-1",
				revenueAmount: 500,
				requestId,
			}),
		).resolves.toBe(replayResult);
		expect(courseLoads).toBe(0);
		expect(applyCalls).toBe(0);
	});

	test("maps hour-addition validation, ownership, and persistence failures to established API errors", async () => {
		let transactionCalls = 0;
		const validationService = new ClassService({
			withHourAdditionTransaction: async () => {
				transactionCalls += 1;
				throw new Error("invalid input must not open a transaction");
			},
		} as unknown as IClassRepository);
		await expect(
			validationService.addHourAddition("class-1", "tutor-1", {
				source: "custom",
				hours: 1,
				revenueAmount: 0.001,
				requestId,
			}),
		).rejects.toMatchObject({
			errorCode: "INVALID_REVENUE_AMOUNT",
			status: 400,
		});
		expect(transactionCalls).toBe(0);

		const missingClassService = new ClassService(
			repositoryWithTransaction(
				transactionWith({ loadOwnedClass: async () => null }),
			),
		);
		await expect(
			missingClassService.addHourAddition("foreign-class", "tutor-1", {
				source: "custom",
				hours: 1,
				requestId,
			}),
		).rejects.toMatchObject({ errorCode: "CLASS_NOT_FOUND", status: 404 });

		const missingCourseService = new ClassService(
			repositoryWithTransaction(transactionWith()),
		);
		await expect(
			missingCourseService.addHourAddition("class-1", "tutor-1", {
				source: "course",
				courseId: "foreign-course",
				requestId,
			}),
		).rejects.toMatchObject({ errorCode: "COURSE_NOT_FOUND", status: 400 });

		const persistenceLimitService = new ClassService(
			repositoryWithTransaction(
				transactionWith({
					apply: async () => {
						throw new ClassHourAdditionPersistenceError(
							"limit_exceeded",
							"Adding these hours would exceed the class total hour limit",
						);
					},
				}),
			),
		);
		await expect(
			persistenceLimitService.addHourAddition("class-1", "tutor-1", {
				source: "custom",
				hours: 1,
				requestId,
			}),
		).rejects.toMatchObject({
			errorCode: "HOUR_ADDITION_LIMIT_EXCEEDED",
			status: 400,
		});
	});

	test("returns the tutor-scoped class detail result and preserves not-found behavior", async () => {
		let detailArgs: [string, string] | undefined;
		const detail = { classData: {} as never, recordedRevenue: 0 };
		const repository = {
			findDetailById: async (id: string, tutorId: string) => {
				detailArgs = [id, tutorId];
				return detail;
			},
		} as unknown as IClassRepository;
		const service = new ClassService(repository);

		await expect(
			service.getClassDetailById("class-1", "tutor-1"),
		).resolves.toBe(detail);
		expect(detailArgs).toEqual(["class-1", "tutor-1"]);

		const missingRepository = {
			findDetailById: async () => null,
		} as unknown as IClassRepository;
		await expect(
			new ClassService(missingRepository).getClassDetailById(
				"foreign-class",
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "CLASS_NOT_FOUND",
			status: 404,
		});
	});

	test("deletes a tutor-owned class with one repository call", async () => {
		const { repository, getDeleteArgs, getDeleteCalls } =
			repositoryForDelete("deleted");
		const service = new ClassService(repository);

		await service.deleteClass("class-1", "tutor-1");
		expect(getDeleteCalls()).toBe(1);
		expect(getDeleteArgs()).toEqual(["class-1", "tutor-1"]);
	});

	test("returns the same not-found error for missing and foreign-owned classes", async () => {
		for (const classId of ["missing-class", "foreign-class"]) {
			const { repository } = repositoryForDelete("not_found");
			const service = new ClassService(repository);

			await expect(
				service.deleteClass(classId, "tutor-1"),
			).rejects.toMatchObject({
				errorCode: "CLASS_NOT_FOUND",
				status: 404,
			});
		}
	});
});
