import { describe, expect, test } from "bun:test";
import { createHmac, hkdfSync } from "node:crypto";
import { DateTime } from "../lib/date-time";
import type {
	RecurringScheduleCreatePlan,
	RecurringScheduleSeriesSnapshot,
} from "../models/recurring-schedule-planner.model";
import {
	type RecurringScheduleUpdateResultModel,
	ScheduleModel,
} from "../models/schedule.model";
import {
	type IClassRepository,
	type IScheduleRepository,
	type RecurringScheduleTransaction,
	ScheduleLifecyclePersistenceError,
	type ScheduleLifecycleTransaction,
} from "../types";
import { ScheduleService } from "./schedule.service";

const createdAt = new Date("2026-08-01T00:00:00.000Z");
const confirmationCursorSecret = "test-confirmation-cursor-secret";
const confirmationCursorSalt = "tutorpal.cursor-signing";
const confirmationCursorInfo = "schedules.awaiting-confirmation.v1";

type ConfirmationCursorPayload = {
	tutorId: string;
	asOf: string;
	after: {
		date: string;
		time: number;
		id: string;
	};
};

function schedule(
	status: "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED" = "SCHEDULED",
) {
	return ScheduleModel.fromSchedulePrisma({
		id: "schedule-1",
		classId: "class-1",
		date: new Date("2026-08-10T00:00:00.000Z"),
		time: 540,
		durationSeconds: 1_800n,
		notes: null,
		noShowNote: null,
		status,
		type: "ON_SITE",
		createdAt,
		updatedAt: createdAt,
		class: { name: "Algebra" },
	});
}

function base64Url(value: string): string {
	return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlBytes(value: Uint8Array): string {
	let binary = "";
	for (const byte of value) {
		binary += String.fromCharCode(byte);
	}
	return base64Url(binary);
}

function confirmationCursorSigningKey(
	secret = confirmationCursorSecret,
): Uint8Array {
	return new Uint8Array(
		hkdfSync(
			"sha256",
			secret,
			confirmationCursorSalt,
			confirmationCursorInfo,
			32,
		),
	);
}

function signedConfirmationCursorJson(
	payloadJson: string,
	secret = confirmationCursorSecret,
	version = "v1",
): string {
	const payloadSegment = base64Url(payloadJson);
	const macInput = `${version}.${payloadSegment}`;
	const signature = createHmac("sha256", confirmationCursorSigningKey(secret))
		.update(macInput, "ascii")
		.digest();
	return `${macInput}.${base64UrlBytes(signature)}`;
}

function signedConfirmationCursor(
	payload: unknown,
	secret = confirmationCursorSecret,
	version = "v1",
): string {
	return signedConfirmationCursorJson(JSON.stringify(payload), secret, version);
}

function decodeBase64Url(value: string): string {
	const padded = `${value.replace(/-/g, "+").replace(/_/g, "/")}${"=".repeat(
		(4 - (value.length % 4)) % 4,
	)}`;
	return atob(padded);
}

function tamperConfirmationCursor(
	cursor: string,
	tamper: (payload: ConfirmationCursorPayload) => ConfirmationCursorPayload,
): string {
	const [version, payloadSegment, signatureSegment] = cursor.split(".");
	if (!version || !payloadSegment || !signatureSegment) {
		throw new Error("Expected a three-segment confirmation cursor");
	}

	const payload = JSON.parse(
		decodeBase64Url(payloadSegment),
	) as ConfirmationCursorPayload;
	return `${version}.${base64Url(JSON.stringify(tamper(payload)))}.${signatureSegment}`;
}

function confirmationService(
	repository: IScheduleRepository,
	secret = confirmationCursorSecret,
): ScheduleService {
	return new ScheduleService(repository, {} as IClassRepository, secret);
}

async function expectInvalidConfirmationCursor(
	service: ScheduleService,
	cursor: string,
	tutorId = "tutor-1",
): Promise<void> {
	await expect(
		service.getSchedulesAwaitingConfirmation(tutorId, { limit: 10, cursor }),
	).rejects.toMatchObject({
		errorCode: "INVALID_AWAITING_CONFIRMATION_CURSOR",
		message: "The confirmation cursor is invalid",
		status: 400,
	});
}

function existingSeries(
	overrides: Partial<RecurringScheduleSeriesSnapshot> = {},
): RecurringScheduleSeriesSnapshot {
	return {
		id: "recurring-old",
		classId: "class-1",
		startDate: "2026-08-10",
		notes: "Existing note",
		type: "ON_SITE",
		scheduleItems: [{ weekday: "MONDAY", time: 540, durationSeconds: 3_600n }],
		...overrides,
	};
}

function recurringTransaction(
	overrides: Partial<RecurringScheduleTransaction> = {},
): RecurringScheduleTransaction {
	return {
		loadCreateContext: async () => ({
			classId: "class-1",
			remainingSeconds: 3_600n,
		}),
		loadUpdateContext: async () => ({
			existingSeries: existingSeries(),
			remainingSeconds: 3_600n,
			replaceableSchedules: [],
		}),
		loadExistingSchedules: async () => [],
		applyCreate: async () => schedule(),
		applyUpdate: async () => ({}) as RecurringScheduleUpdateResultModel,
		...overrides,
	};
}

function recurringRepository(transaction: RecurringScheduleTransaction) {
	let transactionCalls = 0;
	const repository = {
		withRecurringScheduleTransaction: async <T>(
			work: (transaction: RecurringScheduleTransaction) => Promise<T>,
		): Promise<T> => {
			transactionCalls += 1;
			return work(transaction);
		},
	} as unknown as IScheduleRepository;

	return { repository, getTransactionCalls: () => transactionCalls };
}

function unexpectedClassRepository(): IClassRepository {
	return {
		findById: async () => {
			throw new Error("Recurring scheduling must use the transaction context");
		},
	} as unknown as IClassRepository;
}

function lifecycleRepository(transaction: ScheduleLifecycleTransaction) {
	return {
		withLifecycleTransaction: <T>(
			work: (transaction: ScheduleLifecycleTransaction) => Promise<T>,
		) => work(transaction),
	} as unknown as IScheduleRepository;
}

describe("ScheduleService ownership", () => {
	test("does not expose a schedule owned by another tutor", async () => {
		const repository = {
			findById: async () => null,
		} as unknown as IScheduleRepository;

		await expect(
			new ScheduleService(repository).getScheduleById("schedule-1", "tutor-2"),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_NOT_FOUND",
			message: "Schedule not found",
			status: 404,
		});
	});

	test("does not delete a schedule owned by another tutor", async () => {
		let deleted = false;
		const repository = {
			findById: async () => null,
			delete: async () => {
				deleted = true;
			},
		} as unknown as IScheduleRepository;

		await expect(
			new ScheduleService(repository).deleteSchedule("schedule-1", "tutor-2"),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_NOT_FOUND",
			message: "Schedule not found",
			status: 404,
		});
		expect(deleted).toBe(false);
	});

	test("continues to block a one-time schedule when the class has no remaining hours", async () => {
		let createCalls = 0;
		const repository = {
			getRemainingSeconds: async () => 0n,
			create: async () => {
				createCalls += 1;
				return schedule();
			},
		} as unknown as IScheduleRepository;
		const classRepository = {
			findById: async () => ({}),
		} as unknown as IClassRepository;

		await expect(
			new ScheduleService(repository, classRepository).createSchedule(
				{
					classId: "class-1",
					date: "2026-08-10",
					type: "ON_SITE",
					time: 600,
					durationMinutes: 60,
				},
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "INSUFFICIENT_HOURS",
			status: 400,
		});
		expect(createCalls).toBe(0);
	});
});

describe("ScheduleService awaiting confirmation", () => {
	test("signs a fixed snapshot and tuple boundary across a status change", async () => {
		const calls: Array<{
			tutorId: string;
			asOf: string;
			after: unknown;
			limit: number;
		}> = [];
		let boundaryStatus: "SCHEDULED" | "COMPLETED" = "SCHEDULED";
		const boundary = {
			date: "2026-08-10",
			time: 1_410,
			id: "schedule-at-boundary",
		};
		const repository = {
			findAwaitingConfirmationPage: async (
				tutorId: string,
				input: {
					asOf: DateTime;
					after?: typeof boundary;
					limit: number;
				},
			) => {
				calls.push({
					tutorId,
					asOf: input.asOf.toISOString(),
					after: input.after,
					limit: input.limit,
				});
				if (calls.length === 1) {
					return {
						data: [schedule()],
						hasNext: true,
						nextAfter: boundary,
					};
				}

				if (boundaryStatus !== "COMPLETED") {
					throw new Error("The cursor boundary must change before page two");
				}
				return { data: [schedule()], hasNext: false };
			},
		} as unknown as IScheduleRepository;
		const service = confirmationService(repository);

		const firstPage = await service.getSchedulesAwaitingConfirmation(
			"tutor-1",
			{
				limit: 1,
			},
		);
		const nextCursor = firstPage.pagination.nextCursor;
		if (!nextCursor) throw new Error("Expected a cursor for the second page");

		boundaryStatus = "COMPLETED";
		const secondPage = await service.getSchedulesAwaitingConfirmation(
			"tutor-1",
			{
				limit: 1,
				cursor: nextCursor,
			},
		);

		expect(firstPage.pagination).toEqual({
			hasNext: true,
			nextCursor: expect.any(String),
		});
		expect(nextCursor).toMatch(/^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
		expect(calls).toHaveLength(2);
		expect(calls[0]).toMatchObject({
			tutorId: "tutor-1",
			after: undefined,
			limit: 1,
		});
		expect(calls[1]).toEqual({
			tutorId: "tutor-1",
			asOf: calls[0]?.asOf,
			after: boundary,
			limit: 1,
		});
		expect(secondPage.pagination).toEqual({ hasNext: false, nextCursor: null });
	});

	test("rejects a client-forged future snapshot or keyset tuple before querying", async () => {
		let repositoryCalls = 0;
		const boundary = {
			date: "2026-08-10",
			time: 1_410,
			id: "schedule-at-boundary",
		};
		const repository = {
			findAwaitingConfirmationPage: async () => {
				repositoryCalls += 1;
				return {
					data: [schedule()],
					hasNext: true,
					nextAfter: boundary,
				};
			},
		} as unknown as IScheduleRepository;
		const service = confirmationService(repository);
		const issuedPage = await service.getSchedulesAwaitingConfirmation(
			"tutor-1",
			{ limit: 1 },
		);
		const cursor = issuedPage.pagination.nextCursor;
		if (!cursor) throw new Error("Expected a cursor to tamper with");

		repositoryCalls = 0;
		for (const tamper of [
			(payload: ConfirmationCursorPayload) => ({
				...payload,
				asOf: "2099-01-01T00:00:00.000Z",
			}),
			(payload: ConfirmationCursorPayload) => ({
				...payload,
				after: { ...payload.after, date: "2099-01-01" },
			}),
			(payload: ConfirmationCursorPayload) => ({
				...payload,
				after: { ...payload.after, time: 0 },
			}),
			(payload: ConfirmationCursorPayload) => ({
				...payload,
				after: { ...payload.after, id: "forged-schedule" },
			}),
		]) {
			await expectInvalidConfirmationCursor(
				service,
				tamperConfirmationCursor(cursor, tamper),
			);
		}

		expect(repositoryCalls).toBe(0);
	});

	test("rejects cross-tutor and rotated-secret cursors before querying", async () => {
		let repositoryCalls = 0;
		const boundary = {
			date: "2026-08-10",
			time: 1_410,
			id: "schedule-at-boundary",
		};
		const repository = {
			findAwaitingConfirmationPage: async () => {
				repositoryCalls += 1;
				return {
					data: [schedule()],
					hasNext: true,
					nextAfter: boundary,
				};
			},
		} as unknown as IScheduleRepository;
		const service = confirmationService(repository);
		const issuedPage = await service.getSchedulesAwaitingConfirmation(
			"tutor-1",
			{ limit: 1 },
		);
		const cursor = issuedPage.pagination.nextCursor;
		if (!cursor) throw new Error("Expected a cursor for the next page");

		repositoryCalls = 0;
		await expectInvalidConfirmationCursor(service, cursor, "tutor-2");
		await expectInvalidConfirmationCursor(
			confirmationService(repository, "rotated-confirmation-cursor-secret"),
			cursor,
		);
		expect(repositoryCalls).toBe(0);
	});

	test("accepts a contract-signed cursor and rejects malformed signed payloads before querying", async () => {
		let repositoryCalls = 0;
		const received: Array<{
			tutorId: string;
			asOf: string;
			after: unknown;
			limit: number;
		}> = [];
		const repository = {
			findAwaitingConfirmationPage: async (
				tutorId: string,
				input: {
					asOf: DateTime;
					after?: unknown;
					limit: number;
				},
			) => {
				repositoryCalls += 1;
				received.push({
					tutorId,
					asOf: input.asOf.toISOString(),
					after: input.after,
					limit: input.limit,
				});
				return { data: [], hasNext: false };
			},
		} as unknown as IScheduleRepository;
		const validPayload: ConfirmationCursorPayload = {
			tutorId: "tutor-1",
			asOf: "2026-08-10T17:30:00.000Z",
			after: {
				date: "2026-08-10",
				time: 1_410,
				id: "schedule-at-boundary",
			},
		};
		const service = confirmationService(repository);

		await service.getSchedulesAwaitingConfirmation("tutor-1", {
			limit: 10,
			cursor: signedConfirmationCursor(validPayload),
		});
		expect(received).toEqual([
			{
				tutorId: "tutor-1",
				asOf: "2026-08-10T17:30:00.000Z",
				after: validPayload.after,
				limit: 10,
			},
		]);

		repositoryCalls = 0;

		for (const cursor of [
			"A",
			base64Url(JSON.stringify(validPayload)),
			"v1.payload",
			"v1..signature",
			signedConfirmationCursor(validPayload, confirmationCursorSecret, "v2"),
			"v1.payload!.signature",
			"v1.payload.A",
			signedConfirmationCursorJson("not JSON"),
			signedConfirmationCursor({
				...validPayload,
				after: { ...validPayload.after, date: "2026-02-30" },
			}),
			signedConfirmationCursor({
				...validPayload,
				asOf: "2026-08-10T17:30:00Z",
			}),
			signedConfirmationCursor({
				...validPayload,
				after: { ...validPayload.after, time: 1_440 },
			}),
		]) {
			await expectInvalidConfirmationCursor(service, cursor);
		}

		expect(repositoryCalls).toBe(0);
	});

	test("fails closed when the confirmation signing source is blank", () => {
		const repository = {} as unknown as IScheduleRepository;

		expect(() => confirmationService(repository, "")).toThrow(
			"BETTER_AUTH_SECRET must not be blank for cursor signing",
		);
		expect(() => confirmationService(repository, "   ")).toThrow(
			"BETTER_AUTH_SECRET must not be blank for cursor signing",
		);
	});
});

describe("ScheduleService recurring scheduling", () => {
	test("coordinates recurring creation through the tutor-scoped transaction port", async () => {
		let createContextArgs: [string, string] | undefined;
		let conflictArgs: [string, readonly string[]] | undefined;
		let appliedPlan: RecurringScheduleCreatePlan | undefined;
		const result = schedule();
		const fixture = recurringRepository(
			recurringTransaction({
				loadCreateContext: async (classId, tutorId) => {
					createContextArgs = [classId, tutorId];
					return { classId, remainingSeconds: 3_600n };
				},
				loadExistingSchedules: async (classId, dates) => {
					conflictArgs = [classId, dates];
					return [];
				},
				applyCreate: async (plan) => {
					appliedPlan = plan;
					return result;
				},
			}),
		);

		await expect(
			new ScheduleService(
				fixture.repository,
				unexpectedClassRepository(),
			).createSchedule(
				{
					classId: "class-1",
					date: "2026-08-10",
					type: "ONLINE",
					recurring: {
						startDate: "2026-08-10",
						scheduleItems: [
							{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
						],
					},
				},
				"tutor-1",
			),
		).resolves.toBe(result);

		expect(fixture.getTransactionCalls()).toBe(1);
		expect(createContextArgs).toEqual(["class-1", "tutor-1"]);
		expect(conflictArgs).toEqual(["class-1", ["2026-08-10"]]);
		expect(appliedPlan).toMatchObject({
			series: { classId: "class-1", notes: null, type: "ONLINE" },
			generatedSchedules: [
				{ date: "2026-08-10", time: 540, durationSeconds: 3_600n },
			],
		});
	});

	test("maps missing class ownership to 400 without applying", async () => {
		let applyCalls = 0;
		const fixture = recurringRepository(
			recurringTransaction({
				loadCreateContext: async () => null,
				applyCreate: async () => {
					applyCalls += 1;
					return schedule();
				},
			}),
		);

		await expect(
			new ScheduleService(fixture.repository).createSchedule(
				{
					classId: "foreign-class",
					date: "2026-08-10",
					type: "ON_SITE",
					recurring: {
						startDate: "2026-08-10",
						scheduleItems: [
							{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
						],
					},
				},
				"tutor-2",
			),
		).rejects.toMatchObject({
			errorCode: "CLASS_NOT_FOUND",
			message: "The specified class does not exist",
			status: 400,
		});
		expect(applyCalls).toBe(0);
	});

	test("keeps create insufficient-hours and conflict failures out of transaction application", async () => {
		let conflictReads = 0;
		let insufficientApplyCalls = 0;
		const insufficient = recurringRepository(
			recurringTransaction({
				loadCreateContext: async () => ({
					classId: "class-1",
					remainingSeconds: 0n,
				}),
				loadExistingSchedules: async () => {
					conflictReads += 1;
					return [];
				},
				applyCreate: async () => {
					insufficientApplyCalls += 1;
					return schedule();
				},
			}),
		);
		const createData = {
			classId: "class-1",
			date: "2026-08-10",
			type: "ON_SITE" as const,
			recurring: {
				startDate: "2026-08-10",
				scheduleItems: [
					{ weekday: "MONDAY" as const, time: 540, durationMinutes: 60 },
				],
			},
		};

		await expect(
			new ScheduleService(insufficient.repository).createSchedule(
				createData,
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "INSUFFICIENT_HOURS",
			message:
				"The class does not have enough remaining hours to create any schedule",
			status: 400,
		});
		expect(conflictReads).toBe(0);
		expect(insufficientApplyCalls).toBe(0);

		let conflictApplyCalls = 0;
		const conflict = recurringRepository(
			recurringTransaction({
				loadExistingSchedules: async () => [
					{
						id: "conflict",
						date: "2026-08-10",
						time: 540,
						durationSeconds: 3_600n,
						status: "SCHEDULED",
					},
				],
				applyCreate: async () => {
					conflictApplyCalls += 1;
					return schedule();
				},
			}),
		);
		await expect(
			new ScheduleService(conflict.repository).createSchedule(
				createData,
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "RECURRING_CONFLICT",
			message:
				"Recurring schedule conflicts with existing schedules on 2026-08-10",
			status: 400,
		});
		expect(conflictApplyCalls).toBe(0);
	});

	test("maps missing series, past dates, and update insufficient-hours without applying", async () => {
		let missingApplyCalls = 0;
		const missing = recurringRepository(
			recurringTransaction({
				loadUpdateContext: async () => null,
				applyUpdate: async () => {
					missingApplyCalls += 1;
					return {} as RecurringScheduleUpdateResultModel;
				},
			}),
		);
		const today = DateTime.todayDateOnlyString();
		const updateData = {
			effectiveDate: today,
			scheduleItems: [
				{ weekday: "MONDAY" as const, time: 540, durationMinutes: 60 },
			],
		};
		await expect(
			new ScheduleService(missing.repository).updateRecurringSchedule(
				"foreign-series",
				updateData,
				"tutor-2",
			),
		).rejects.toMatchObject({
			errorCode: "RECURRING_SCHEDULE_NOT_FOUND",
			message: "Recurring schedule not found",
			status: 404,
		});
		expect(missingApplyCalls).toBe(0);

		let pastConflictReads = 0;
		let pastApplyCalls = 0;
		const past = recurringRepository(
			recurringTransaction({
				loadExistingSchedules: async () => {
					pastConflictReads += 1;
					return [];
				},
				applyUpdate: async () => {
					pastApplyCalls += 1;
					return {} as RecurringScheduleUpdateResultModel;
				},
			}),
		);
		const yesterday = DateTime.fromDateOnlyString(today)
			.addDays(-1)
			.toDateOnlyString();
		await expect(
			new ScheduleService(past.repository).updateRecurringSchedule(
				"recurring-old",
				{ ...updateData, effectiveDate: yesterday },
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "INVALID_EFFECTIVE_DATE",
			message: "Effective date must be today or later",
			status: 400,
		});
		expect(pastConflictReads).toBe(0);
		expect(pastApplyCalls).toBe(0);

		let insufficientApplyCalls = 0;
		const insufficient = recurringRepository(
			recurringTransaction({
				loadUpdateContext: async () => ({
					existingSeries: existingSeries(),
					remainingSeconds: 0n,
					replaceableSchedules: [],
				}),
				applyUpdate: async () => {
					insufficientApplyCalls += 1;
					return {} as RecurringScheduleUpdateResultModel;
				},
			}),
		);
		await expect(
			new ScheduleService(insufficient.repository).updateRecurringSchedule(
				"recurring-old",
				updateData,
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "INSUFFICIENT_HOURS",
			message:
				"The class does not have enough remaining hours to recreate any recurring schedule",
			status: 400,
		});
		expect(insufficientApplyCalls).toBe(0);
	});

	test("maps update conflicts and leaves impossible post-write refresh failures unmodified", async () => {
		let conflictDate: string | undefined;
		const conflict = recurringRepository(
			recurringTransaction({
				loadExistingSchedules: async (_classId, dates) => {
					conflictDate = dates[0];
					return [
						{
							id: "conflict",
							date: dates[0] ?? "",
							time: 540,
							durationSeconds: 3_600n,
							status: "NO_SHOW",
						},
					];
				},
			}),
		);
		const updateData = {
			effectiveDate: DateTime.todayDateOnlyString(),
			scheduleItems: [
				{ weekday: "MONDAY" as const, time: 540, durationMinutes: 60 },
			],
		};
		let conflictError: unknown;
		try {
			await new ScheduleService(conflict.repository).updateRecurringSchedule(
				"recurring-old",
				updateData,
				"tutor-1",
			);
		} catch (error) {
			conflictError = error;
		}
		expect(conflictDate).toBeDefined();
		expect(conflictError).toMatchObject({
			errorCode: "RECURRING_CONFLICT",
			message: `Recurring schedule conflicts with existing schedules on ${conflictDate}`,
			status: 400,
		});

		const refreshFailure = new Error("No schedules were created");
		const failure = recurringRepository(
			recurringTransaction({
				applyCreate: async () => {
					throw refreshFailure;
				},
			}),
		);
		await expect(
			new ScheduleService(failure.repository).createSchedule(
				{
					classId: "class-1",
					date: "2026-08-10",
					type: "ON_SITE",
					recurring: {
						startDate: "2026-08-10",
						scheduleItems: [
							{ weekday: "MONDAY", time: 540, durationMinutes: 60 },
						],
					},
				},
				"tutor-1",
			),
		).rejects.toBe(refreshFailure);
	});
});

describe("ScheduleService lifecycle transitions", () => {
	test("loads the owner-scoped schedule and applies the model plan in one transaction", async () => {
		const current = schedule();
		const result = schedule("NO_SHOW");
		let loadArgs: [string, string] | undefined;
		let applyArgs: unknown;
		const repository = lifecycleRepository({
			loadOwned: async (id, tutorId) => {
				loadArgs = [id, tutorId];
				return current;
			},
			apply: async (tutorId, plan) => {
				applyArgs = [tutorId, plan];
				return result;
			},
		});

		await expect(
			new ScheduleService(repository).markNoShow(
				"schedule-1",
				{ deductHours: true, note: "  Absent  " },
				"tutor-1",
			),
		).resolves.toBe(result);
		expect(loadArgs).toEqual(["schedule-1", "tutor-1"]);
		expect(applyArgs).toEqual([
			"tutor-1",
			{
				expected: {
					id: "schedule-1",
					classId: "class-1",
					status: "SCHEDULED",
					durationSeconds: 1_800n,
				},
				patch: { status: "NO_SHOW", noShowNote: "Absent" },
				deduction: { kind: "upsert", classId: "class-1", seconds: 1_800n },
			},
		]);
	});

	test("maps missing and stale lifecycle transactions to established AppErrors", async () => {
		let applyCalls = 0;
		const missing = lifecycleRepository({
			loadOwned: async () => null,
			apply: async () => {
				applyCalls += 1;
				return schedule();
			},
		});
		await expect(
			new ScheduleService(missing).completeSchedule("schedule-1", "tutor-2"),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_NOT_FOUND",
			message: "Schedule not found",
			status: 404,
		});
		expect(applyCalls).toBe(0);

		const stale = lifecycleRepository({
			loadOwned: async () => schedule(),
			apply: async () => {
				throw new ScheduleLifecyclePersistenceError(
					"stale",
					"The schedule status changed before this action",
				);
			},
		});
		await expect(
			new ScheduleService(stale).completeSchedule("schedule-1", "tutor-1"),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_STATUS_CONFLICT",
			message: "The schedule status changed before this action",
			status: 409,
		});
	});

	test("maps invalid transitions and lifecycle persistence failures to established AppErrors", async () => {
		const invalidStatusRepository = lifecycleRepository({
			loadOwned: async () => schedule("COMPLETED"),
			apply: async () => schedule("COMPLETED"),
		});

		await expect(
			new ScheduleService(invalidStatusRepository).completeSchedule(
				"schedule-1",
				"tutor-1",
			),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_STATUS_CONFLICT",
			message: "Only scheduled schedules can be completed",
			status: 409,
		});

		for (const [error, expected] of [
			[
				new ScheduleLifecyclePersistenceError(
					"not_found",
					"Schedule not found",
				),
				{
					errorCode: "SCHEDULE_NOT_FOUND",
					message: "Schedule not found",
					status: 404,
				},
			],
			[
				new ScheduleLifecyclePersistenceError(
					"stale",
					"The schedule status changed before this action",
				),
				{
					errorCode: "SCHEDULE_STATUS_CONFLICT",
					message: "The schedule status changed before this action",
					status: 409,
				},
			],
			[
				new ScheduleLifecyclePersistenceError(
					"active_deduction_missing",
					"The schedule no longer has an active hour deduction",
				),
				{
					errorCode: "SCHEDULE_STATUS_CONFLICT",
					message: "The schedule no longer has an active hour deduction",
					status: 409,
				},
			],
		] as const) {
			const repository = lifecycleRepository({
				loadOwned: async () => schedule(),
				apply: async () => {
					throw error;
				},
			});

			await expect(
				new ScheduleService(repository).completeSchedule(
					"schedule-1",
					"tutor-1",
				),
			).rejects.toMatchObject(expected);
		}
	});

	test("propagates unexpected lifecycle transaction failures unchanged", async () => {
		const unexpected = new Error("database connection ended");
		const repository = lifecycleRepository({
			loadOwned: async () => schedule(),
			apply: async () => {
				throw unexpected;
			},
		});

		await expect(
			new ScheduleService(repository).completeSchedule("schedule-1", "tutor-1"),
		).rejects.toBe(unexpected);
	});
});
