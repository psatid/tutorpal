import type { ScheduleStatus } from "@prisma/client";
import { DateTime } from "../lib/date-time";
import { AppError } from "../lib/error";
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
	CreateScheduleDTO,
	IClassRepository,
	IScheduleRepository,
	NoShowScheduleDTO,
	UpdateRecurringScheduleDTO,
	UpdateScheduleDTO,
} from "../types";
import { ScheduleLifecyclePersistenceError } from "../types";

export class ScheduleService {
	constructor(
		private readonly repository: IScheduleRepository,
		private readonly classRepository: IClassRepository = defaultClassRepository,
	) {}

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
