import { createHmac, hkdfSync, timingSafeEqual } from "node:crypto";
import type { ScheduleStatus } from "@prisma/client";
import { DateTime } from "../lib/date-time";
import { AppError } from "../lib/error";
import { getLocalAppConfig } from "../lib/local-config";
import { minutesToSeconds } from "../lib/teaching-time";
import {
	RecurringSchedulePlanner,
	RecurringSchedulePlanningError,
} from "../models/recurring-schedule-planner.model";
import {
	type RecurringScheduleUpdateResultModel,
	ScheduleModel,
	type ScheduleTransitionPlan,
	ScheduleTransitionViolation,
} from "../models/schedule.model";
import { classRepository as defaultClassRepository } from "../repositories";
import type {
	AwaitingConfirmationAfter,
	AwaitingConfirmationPage,
	AwaitingConfirmationQueryDTO,
	CreateScheduleDTO,
	IClassRepository,
	IScheduleRepository,
	NoShowScheduleDTO,
	UpdateRecurringScheduleDTO,
	UpdateScheduleDTO,
} from "../types";
import { ScheduleLifecyclePersistenceError } from "../types";

const AWAITING_CONFIRMATION_CURSOR_VERSION = "v1";
const AWAITING_CONFIRMATION_CURSOR_MAX_LENGTH = 1024;
const AWAITING_CONFIRMATION_CURSOR_KEY_LENGTH = 32;
const AWAITING_CONFIRMATION_CURSOR_SALT = "tutorpal.cursor-signing";
const AWAITING_CONFIRMATION_CURSOR_INFO = "schedules.awaiting-confirmation.v1";
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const BASE64_URL_REGEX = /^[A-Za-z0-9_-]+$/;

type AwaitingConfirmationCursorPayload = {
	tutorId: string;
	asOf: string;
	after: AwaitingConfirmationAfter;
};

function invalidAwaitingConfirmationCursor(): never {
	throw AppError.badRequest(
		"INVALID_AWAITING_CONFIRMATION_CURSOR",
		"The confirmation cursor is invalid",
	);
}

function deriveAwaitingConfirmationCursorKey(secret: string): Uint8Array {
	if (secret.trim().length === 0) {
		throw new Error("BETTER_AUTH_SECRET must not be blank for cursor signing");
	}

	return new Uint8Array(
		hkdfSync(
			"sha256",
			secret,
			AWAITING_CONFIRMATION_CURSOR_SALT,
			AWAITING_CONFIRMATION_CURSOR_INFO,
			AWAITING_CONFIRMATION_CURSOR_KEY_LENGTH,
		),
	);
}

function encodeBase64UrlBytes(bytes: Uint8Array): string {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function encodeBase64Url(value: string): string {
	return encodeBase64UrlBytes(new TextEncoder().encode(value));
}

function decodeBase64UrlBytes(value: string): Uint8Array {
	if (!BASE64_URL_REGEX.test(value) || value.length % 4 === 1) {
		return invalidAwaitingConfirmationCursor();
	}

	try {
		const padded = `${value.replace(/-/g, "+").replace(/_/g, "/")}${"=".repeat(
			(4 - (value.length % 4)) % 4,
		)}`;
		const binary = atob(padded);
		return Uint8Array.from(binary, (character) => character.charCodeAt(0));
	} catch {
		return invalidAwaitingConfirmationCursor();
	}
}

function decodeBase64Url(value: string): string {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(
			decodeBase64UrlBytes(value),
		);
	} catch {
		return invalidAwaitingConfirmationCursor();
	}
}

function isValidCursorDate(value: string): boolean {
	if (!DATE_ONLY_REGEX.test(value)) return false;

	try {
		return DateTime.fromDateOnlyString(value).toDateOnlyString() === value;
	} catch {
		return false;
	}
}

function decodeAwaitingConfirmationCursor(
	cursor: string,
	tutorId: string,
	signingKey: Uint8Array,
): {
	asOf: DateTime;
	after: AwaitingConfirmationAfter;
} {
	if (
		cursor.length === 0 ||
		cursor.length > AWAITING_CONFIRMATION_CURSOR_MAX_LENGTH
	) {
		return invalidAwaitingConfirmationCursor();
	}

	const segments = cursor.split(".");
	if (segments.length !== 3) {
		return invalidAwaitingConfirmationCursor();
	}

	const [version, payloadSegment, signatureSegment] = segments;
	if (
		version !== AWAITING_CONFIRMATION_CURSOR_VERSION ||
		!payloadSegment ||
		!BASE64_URL_REGEX.test(payloadSegment) ||
		!signatureSegment
	) {
		return invalidAwaitingConfirmationCursor();
	}

	const signature = decodeBase64UrlBytes(signatureSegment);
	if (signature.byteLength !== AWAITING_CONFIRMATION_CURSOR_KEY_LENGTH) {
		return invalidAwaitingConfirmationCursor();
	}

	const expectedSignature = createHmac("sha256", signingKey)
		.update(`${version}.${payloadSegment}`, "ascii")
		.digest();
	if (
		expectedSignature.byteLength !== signature.byteLength ||
		!timingSafeEqual(expectedSignature, signature)
	) {
		return invalidAwaitingConfirmationCursor();
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(decodeBase64Url(payloadSegment));
	} catch {
		return invalidAwaitingConfirmationCursor();
	}

	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
		return invalidAwaitingConfirmationCursor();
	}

	const payload = parsed as Partial<AwaitingConfirmationCursorPayload>;
	if (
		typeof payload.tutorId !== "string" ||
		payload.tutorId !== tutorId ||
		typeof payload.asOf !== "string" ||
		typeof payload.after !== "object" ||
		payload.after === null ||
		Array.isArray(payload.after) ||
		typeof payload.after.date !== "string" ||
		!isValidCursorDate(payload.after.date) ||
		typeof payload.after.time !== "number" ||
		!Number.isInteger(payload.after.time) ||
		payload.after.time < 0 ||
		payload.after.time > 1439 ||
		typeof payload.after.id !== "string" ||
		payload.after.id.length === 0
	) {
		return invalidAwaitingConfirmationCursor();
	}

	try {
		const asOf = DateTime.from(payload.asOf);
		if (asOf.toISOString() !== payload.asOf) {
			return invalidAwaitingConfirmationCursor();
		}
		return { asOf, after: payload.after };
	} catch {
		return invalidAwaitingConfirmationCursor();
	}
}

function encodeAwaitingConfirmationCursor(
	signingKey: Uint8Array,
	tutorId: string,
	asOf: DateTime,
	after: AwaitingConfirmationAfter,
): string {
	const payloadSegment = encodeBase64Url(
		JSON.stringify({
			tutorId,
			asOf: asOf.toISOString(),
			after,
		} satisfies AwaitingConfirmationCursorPayload),
	);
	const macInput = `${AWAITING_CONFIRMATION_CURSOR_VERSION}.${payloadSegment}`;
	const signature = createHmac("sha256", signingKey)
		.update(macInput, "ascii")
		.digest();

	return `${macInput}.${encodeBase64UrlBytes(signature)}`;
}

export class ScheduleService {
	private readonly awaitingConfirmationCursorKey: Uint8Array;

	constructor(
		private readonly repository: IScheduleRepository,
		private readonly classRepository: IClassRepository = defaultClassRepository,
		cursorSigningSecret: string = getLocalAppConfig().BETTER_AUTH_SECRET,
	) {
		this.awaitingConfirmationCursorKey =
			deriveAwaitingConfirmationCursorKey(cursorSigningSecret);
	}

	private isActiveStatus(status: ScheduleStatus): boolean {
		return ScheduleModel.isCapacityReservingStatus(status);
	}

	private async validateScheduleCapacity(
		classId: string,
		durationMinutes: number,
		status: ScheduleStatus,
		existingSchedule?: Pick<
			ScheduleModel,
			"classId" | "durationMinutes" | "status"
		>,
	): Promise<boolean> {
		if (!this.isActiveStatus(status)) {
			return true;
		}

		let remainingSeconds = await this.repository.getRemainingSeconds(classId);

		if (
			existingSchedule &&
			existingSchedule.classId === classId &&
			this.isActiveStatus(existingSchedule.status)
		) {
			remainingSeconds += minutesToSeconds(existingSchedule.durationMinutes);
		}

		return remainingSeconds >= minutesToSeconds(durationMinutes);
	}

	async createSchedule(
		data: CreateScheduleDTO,
		tutorId: string,
	): Promise<ScheduleModel> {
		if (data.recurring) {
			return this.createRecurringSchedule(data, tutorId);
		}

		// Verify that the class exists and belongs to this tutor
		const classData = await this.classRepository.findById(
			data.classId,
			tutorId,
		);
		if (!classData) {
			throw AppError.badRequest(
				"CLASS_NOT_FOUND",
				"The specified class does not exist",
			);
		}

		if (data.time === undefined || data.durationMinutes === undefined) {
			throw AppError.badRequest(
				"INVALID_SCHEDULE",
				"Time and duration are required for one-time schedules",
			);
		}

		// Validate and reserve hours for the schedule
		const hasEnoughHours = await this.validateScheduleCapacity(
			data.classId,
			data.durationMinutes,
			"SCHEDULED",
		);

		if (!hasEnoughHours) {
			throw AppError.badRequest(
				"INSUFFICIENT_HOURS",
				"The class does not have enough remaining hours for this schedule",
			);
		}

		return this.repository.create(data);
	}

	private async createRecurringSchedule(
		data: CreateScheduleDTO,
		tutorId: string,
	): Promise<ScheduleModel> {
		const { classId, notes, recurring, type } = data;
		if (!recurring) {
			throw new Error("Recurring pattern is required");
		}

		try {
			return await this.repository.withRecurringScheduleTransaction(
				async (transaction) => {
					const context = await transaction.loadCreateContext(classId, tutorId);
					if (!context) {
						throw AppError.badRequest(
							"CLASS_NOT_FOUND",
							"The specified class does not exist",
						);
					}

					const plan = RecurringSchedulePlanner.planCreate({
						classId: context.classId,
						startDate: recurring.startDate,
						type,
						notes,
						scheduleItems: recurring.scheduleItems,
						remainingSeconds: context.remainingSeconds,
					});
					const existingSchedules = await transaction.loadExistingSchedules(
						context.classId,
						plan.generatedSchedules.map((schedule) => schedule.date),
					);
					RecurringSchedulePlanner.assertNoOverlap(
						plan.generatedSchedules,
						existingSchedules,
					);

					return transaction.applyCreate(plan);
				},
			);
		} catch (error) {
			this.rethrowRecurringScheduleFailure(error, "create");
		}
	}

	async getAllSchedules(
		tutorId: string,
		query?: {
			date?: string;
			search?: string;
			classId?: string;
		},
	): Promise<ScheduleModel[]> {
		return this.repository.findAll(tutorId, query);
	}

	async getSchedulesAwaitingConfirmation(
		tutorId: string,
		query: AwaitingConfirmationQueryDTO,
	): Promise<AwaitingConfirmationPage> {
		const cursor =
			query.cursor !== undefined
				? decodeAwaitingConfirmationCursor(
						query.cursor,
						tutorId,
						this.awaitingConfirmationCursorKey,
					)
				: undefined;
		const asOf = cursor?.asOf ?? DateTime.now();
		const page = await this.repository.findAwaitingConfirmationPage(tutorId, {
			asOf,
			after: cursor?.after,
			limit: query.limit,
		});

		return {
			data: page.data,
			pagination: {
				total: page.total,
				hasNext: page.hasNext,
				nextCursor:
					page.hasNext && page.nextAfter
						? encodeAwaitingConfirmationCursor(
								this.awaitingConfirmationCursorKey,
								tutorId,
								asOf,
								page.nextAfter,
							)
						: null,
			},
		};
	}

	async getScheduleById(id: string, tutorId: string): Promise<ScheduleModel> {
		const schedule = await this.repository.findById(id, tutorId);
		if (!schedule) {
			throw AppError.notFound("SCHEDULE_NOT_FOUND", "Schedule not found");
		}
		return schedule;
	}

	async updateSchedule(
		id: string,
		data: UpdateScheduleDTO,
		tutorId: string,
	): Promise<ScheduleModel> {
		// Check if schedule exists first
		const existingSchedule = await this.repository.findById(id, tutorId);
		if (!existingSchedule) {
			throw AppError.notFound("SCHEDULE_NOT_FOUND", "Schedule not found");
		}

		// If classId is being updated, verify the new class exists and belongs to this tutor
		if (data.classId !== undefined) {
			const classData = await this.classRepository.findById(
				data.classId,
				tutorId,
			);
			if (!classData) {
				throw AppError.badRequest(
					"CLASS_NOT_FOUND",
					"The specified class does not exist",
				);
			}
		}

		const targetClassId = data.classId ?? existingSchedule.classId;
		const targetDurationMinutes =
			data.durationMinutes ?? existingSchedule.durationMinutes;

		const hasEnoughHours = await this.validateScheduleCapacity(
			targetClassId,
			targetDurationMinutes,
			existingSchedule.status,
			existingSchedule,
		);

		if (!hasEnoughHours) {
			throw AppError.badRequest(
				"INSUFFICIENT_HOURS",
				"The class does not have enough remaining hours for this schedule",
			);
		}

		return this.repository.update(id, data);
	}

	async updateRecurringSchedule(
		recurringScheduleId: string,
		data: UpdateRecurringScheduleDTO,
		tutorId: string,
	): Promise<RecurringScheduleUpdateResultModel> {
		try {
			return await this.repository.withRecurringScheduleTransaction(
				async (transaction) => {
					const context = await transaction.loadUpdateContext(
						recurringScheduleId,
						tutorId,
						data.effectiveDate,
					);
					if (!context) {
						throw AppError.notFound(
							"RECURRING_SCHEDULE_NOT_FOUND",
							"Recurring schedule not found",
						);
					}

					if (
						DateTime.fromDateOnlyString(data.effectiveDate).isBefore(
							DateTime.fromDateOnlyString(DateTime.todayDateOnlyString()),
						)
					) {
						throw AppError.badRequest(
							"INVALID_EFFECTIVE_DATE",
							"Effective date must be today or later",
						);
					}

					const plan = RecurringSchedulePlanner.planUpdate({
						existingSeries: context.existingSeries,
						effectiveDate: data.effectiveDate,
						type: data.type,
						notes: data.notes,
						scheduleItems: data.scheduleItems,
						remainingSeconds: context.remainingSeconds,
						replaceableSchedules: context.replaceableSchedules,
					});
					const existingSchedules = await transaction.loadExistingSchedules(
						plan.series.classId,
						plan.generatedSchedules.map((schedule) => schedule.date),
					);
					RecurringSchedulePlanner.assertNoOverlap(
						plan.generatedSchedules,
						existingSchedules,
						plan.replacementScheduleIds,
					);

					return transaction.applyUpdate(plan);
				},
			);
		} catch (error) {
			this.rethrowRecurringScheduleFailure(error, "update");
		}
	}

	private rethrowRecurringScheduleFailure(
		error: unknown,
		operation: "create" | "update",
	): never {
		if (error instanceof AppError) {
			throw error;
		}

		if (error instanceof RecurringSchedulePlanningError) {
			if (error.reason === "insufficient_hours") {
				throw AppError.badRequest(
					"INSUFFICIENT_HOURS",
					operation === "create"
						? "The class does not have enough remaining hours to create any schedule"
						: "The class does not have enough remaining hours to recreate any recurring schedule",
				);
			}

			throw AppError.badRequest(
				"RECURRING_CONFLICT",
				`Recurring schedule conflicts with existing schedules on ${error.conflictDates.join(", ")}`,
			);
		}

		throw error;
	}

	async deleteSchedule(id: string, tutorId: string): Promise<void> {
		// Check if schedule exists first
		const existingSchedule = await this.repository.findById(id, tutorId);
		if (!existingSchedule) {
			throw AppError.notFound("SCHEDULE_NOT_FOUND", "Schedule not found");
		}

		await this.repository.delete(id);
	}

	async completeSchedule(id: string, tutorId: string): Promise<ScheduleModel> {
		return this.transitionSchedule(id, tutorId, (schedule) =>
			schedule.planCompletion(),
		);
	}

	async markNoShow(
		id: string,
		data: NoShowScheduleDTO,
		tutorId: string,
	): Promise<ScheduleModel> {
		return this.transitionSchedule(id, tutorId, (schedule) =>
			schedule.planNoShow(data),
		);
	}

	async restoreHours(id: string, tutorId: string): Promise<ScheduleModel> {
		return this.transitionSchedule(id, tutorId, (schedule) =>
			schedule.planRestoration(),
		);
	}

	private async transitionSchedule(
		id: string,
		tutorId: string,
		decide: (schedule: ScheduleModel) => ScheduleTransitionPlan,
	): Promise<ScheduleModel> {
		try {
			return await this.repository.withLifecycleTransaction(async (tx) => {
				const schedule = await tx.loadOwned(id, tutorId);
				if (!schedule) {
					throw AppError.notFound("SCHEDULE_NOT_FOUND", "Schedule not found");
				}
				return tx.apply(tutorId, decide(schedule));
			});
		} catch (error) {
			if (error instanceof ScheduleTransitionViolation) {
				throw AppError.conflict("SCHEDULE_STATUS_CONFLICT", error.message);
			}
			if (error instanceof AppError) throw error;
			if (error instanceof ScheduleLifecyclePersistenceError) {
				if (error.reason === "not_found") {
					throw AppError.notFound("SCHEDULE_NOT_FOUND", error.message);
				}
				throw AppError.conflict("SCHEDULE_STATUS_CONFLICT", error.message);
			}
			throw error;
		}
	}

	async getRemainingHours(classId: string, tutorId: string): Promise<number> {
		const classData = await this.classRepository.findById(classId, tutorId);
		if (!classData) {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}
		return this.repository.getRemainingHours(classId);
	}
}
