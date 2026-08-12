import type { ScheduleStatus } from "@prisma/client";
import { DateTime } from "../lib/date-time";
import { AppError } from "../lib/error";
import type {
	RecurringScheduleUpdateResultModel,
	ScheduleModel,
} from "../models/schedule.model";
import { classRepository as defaultClassRepository } from "../repositories";
import type {
	CreateScheduleDTO,
	IClassRepository,
	IScheduleRepository,
	UpdateRecurringScheduleDTO,
	UpdateScheduleDTO,
} from "../types";

const ACTIVE_SCHEDULE_STATUSES: ScheduleStatus[] = [
	"SCHEDULED",
	"COMPLETED",
	"NO_SHOW",
];

export class ScheduleService {
	constructor(
		private readonly repository: IScheduleRepository,
		private readonly classRepository: IClassRepository = defaultClassRepository,
	) {}

	private isActiveStatus(status: ScheduleStatus): boolean {
		return ACTIVE_SCHEDULE_STATUSES.includes(status);
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

		let remainingHours = await this.repository.getRemainingHours(classId);

		if (
			existingSchedule &&
			existingSchedule.classId === classId &&
			this.isActiveStatus(existingSchedule.status)
		) {
			remainingHours += existingSchedule.durationMinutes / 60;
		}

		return remainingHours >= durationMinutes / 60;
	}

	async createSchedule(
		data: CreateScheduleDTO,
		tutorId: string,
	): Promise<ScheduleModel> {
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

		// If recurring pattern is provided
		if (data.recurring) {
			return this.createRecurringSchedule(data, tutorId);
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

		// Validate class exists and belongs to this tutor
		const classData = await this.classRepository.findById(classId, tutorId);
		if (!classData) {
			throw AppError.badRequest(
				"CLASS_NOT_FOUND",
				"The specified class does not exist",
			);
		}

		return this.repository.createRecurringSchedule({
			classId,
			type,
			notes,
			recurring,
		});
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
		const targetStatus = data.status ?? existingSchedule.status;
		const hasNonStatusUpdates =
			data.classId !== undefined ||
			data.date !== undefined ||
			data.time !== undefined ||
			data.durationMinutes !== undefined ||
			data.type !== undefined ||
			data.notes !== undefined;

		const hasEnoughHours = await this.validateScheduleCapacity(
			targetClassId,
			targetDurationMinutes,
			targetStatus,
			existingSchedule,
		);

		if (!hasEnoughHours) {
			throw AppError.badRequest(
				"INSUFFICIENT_HOURS",
				"The class does not have enough remaining hours for this schedule",
			);
		}

		if (
			data.status === "COMPLETED" &&
			existingSchedule.status === "SCHEDULED"
		) {
			if (hasNonStatusUpdates) {
				const updatedSchedule = await this.repository.update(id, {
					...data,
					status: "SCHEDULED",
				});
				return this.repository.completeSchedule(updatedSchedule.id);
			}

			return this.repository.completeSchedule(id);
		}

		if (data.status === "NO_SHOW" && existingSchedule.status !== "NO_SHOW") {
			if (
				existingSchedule.status !== "SCHEDULED" &&
				existingSchedule.status !== "COMPLETED"
			) {
				throw AppError.badRequest(
					"INVALID_STATUS_TRANSITION",
					"Only scheduled or completed schedules can be marked as no-show",
				);
			}
		}

		if (
			(existingSchedule.status === "COMPLETED" ||
				existingSchedule.status === "NO_SHOW") &&
			data.status === "CANCELLED"
		) {
			if (hasNonStatusUpdates) {
				await this.repository.update(id, {
					...data,
					status: existingSchedule.status,
				});
			}

			return this.repository.restoreHours(id);
		}

		return this.repository.update(id, data);
	}

	async updateRecurringSchedule(
		recurringScheduleId: string,
		data: UpdateRecurringScheduleDTO,
		tutorId: string,
	): Promise<RecurringScheduleUpdateResultModel> {
		const existingRecurringSchedule =
			await this.repository.findRecurringScheduleById(
				recurringScheduleId,
				tutorId,
			);
		if (!existingRecurringSchedule) {
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

		return this.repository.updateRecurringSchedule(
			recurringScheduleId,
			data,
			tutorId,
		);
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
		await this.getScheduleById(id, tutorId);
		return this.repository.completeSchedule(id);
	}

	async restoreHours(id: string, tutorId: string): Promise<ScheduleModel> {
		await this.getScheduleById(id, tutorId);
		return this.repository.restoreHours(id);
	}

	async getRemainingHours(classId: string, tutorId: string): Promise<number> {
		const classData = await this.classRepository.findById(classId, tutorId);
		if (!classData) {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}
		return this.repository.getRemainingHours(classId);
	}
}
