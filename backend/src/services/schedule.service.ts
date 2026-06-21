import type { ScheduleStatus, Weekday } from "@prisma/client";
import { prisma } from "../lib/db";
import { AppError } from "../lib/error";
import { classRepository } from "../repositories";
import type {
	CreateScheduleDTO,
	IScheduleRepository,
	ScheduleDTO,
	UpdateScheduleDTO,
} from "../types";

const ACTIVE_SCHEDULE_STATUSES: ScheduleStatus[] = ["SCHEDULED", "COMPLETED"];

export class ScheduleService {
	constructor(private readonly repository: IScheduleRepository) {}

	private isActiveStatus(status: ScheduleStatus): boolean {
		return ACTIVE_SCHEDULE_STATUSES.includes(status);
	}

	private async validateScheduleCapacity(
		classId: string,
		durationMinutes: number,
		status: ScheduleStatus,
		existingSchedule?: Pick<
			ScheduleDTO,
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

	async createSchedule(data: CreateScheduleDTO, tutorId: string): Promise<ScheduleDTO> {
		// Verify that the class exists and belongs to this tutor
		const classData = await classRepository.findById(data.classId, tutorId);
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
			data.status || "SCHEDULED",
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
	): Promise<ScheduleDTO> {
		const { classId, notes, recurring } = data;
		if (!recurring) {
			throw new Error("Recurring pattern is required");
		}

		// Validate class exists and belongs to this tutor
		const classData = await classRepository.findById(classId, tutorId);
		if (!classData) {
			throw AppError.badRequest(
				"CLASS_NOT_FOUND",
				"The specified class does not exist",
			);
		}

		// Validate class has remaining hours BEFORE transaction
		const remainingHours = await this.repository.getRemainingHours(classId);
		const scheduleData = this.generateScheduleData(
			classId,
			recurring.startDate,
			recurring.scheduleItems,
			remainingHours,
		);

		if (scheduleData.length < 1) {
			throw AppError.badRequest(
				"INSUFFICIENT_HOURS",
				"The class does not have enough remaining hours to create any schedule",
			);
		}

		// Execute entire recurring schedule creation in a transaction
		const result = await prisma.$transaction(async (tx) => {
			// 1. Create recurring schedule record
			const recurringSchedule = await tx.recurringSchedule.create({
				data: {
					classId,
					startDate: new Date(recurring.startDate),
					notes: notes || null,
				},
				include: { class: true },
			});

			// 2. Create schedule items (also in transaction)
			await tx.recurringScheduleItem.createMany({
				data: recurring.scheduleItems.map((item) => ({
					recurringScheduleId: recurringSchedule.id,
					weekday: item.weekday,
					time: item.time,
					durationMinutes: item.durationMinutes,
				})),
			});

			// Bulk insert all schedules at once
			if (scheduleData.length > 0) {
				await tx.schedule.createMany({
					data: scheduleData.map((item) => ({
						classId,
						date: new Date(item.date),
						time: item.time,
						durationMinutes: item.durationMinutes,
						notes: notes || null,
						status: "SCHEDULED",
					})),
				});
			}

			// Fetch created schedules to return
			const createdSchedules = await tx.schedule.findMany({
				where: {
					classId,
					date: {
						in: scheduleData.map((d) => new Date(d.date)),
					},
				},
				include: { class: true },
				orderBy: [{ date: "asc" }, { time: "asc" }],
			});

			return { recurringSchedule, schedules: createdSchedules };
		});

		// Get remaining hours for DTOs (after transaction commits)
		const finalRemainingHours =
			await this.repository.getRemainingHours(classId);

		// Return first schedule with remaining hours
		if (result.schedules.length === 0) {
			throw new Error("No schedules were created");
		}

		const firstSchedule = result.schedules[0]!;
		return {
			id: firstSchedule.id,
			classId: firstSchedule.classId,
			className: firstSchedule.class.name,
			date: firstSchedule.date.toISOString().split("T")[0]!,
			time: firstSchedule.time,
			durationMinutes: firstSchedule.durationMinutes,
			notes: firstSchedule.notes,
			status: firstSchedule.status,
			createdAt: firstSchedule.createdAt.toISOString(),
			updatedAt: firstSchedule.updatedAt.toISOString(),
			remainingHours: finalRemainingHours,
		};
	}

	private generateScheduleData(
		classId: string,
		startDate: string,
		items: Array<{ weekday: Weekday; time: number; durationMinutes: number }>,
		remainingHours: number,
	): Array<{
		classId: string;
		date: string;
		time: number;
		durationMinutes: number;
	}> {
		const scheduleData: Array<{
			classId: string;
			date: string;
			time: number;
			durationMinutes: number;
		}> = [];
		let currentDate = new Date(startDate);
		let remainingMinutes = Math.max(0, Math.round(remainingHours * 60));

		while (remainingMinutes > 0) {
			const nextOccurrence = items
				.map((item) => ({
					item,
					date: this.getNextDateForWeekday(currentDate, item.weekday),
				}))
				.sort((a, b) => {
					const dateDiff = a.date.getTime() - b.date.getTime();
					if (dateDiff !== 0) {
						return dateDiff;
					}

					return a.item.time - b.item.time;
				})[0];

			if (!nextOccurrence) {
				break;
			}

			if (nextOccurrence.item.durationMinutes > remainingMinutes) {
				return scheduleData;
			}

			scheduleData.push({
				classId,
				date: nextOccurrence.date.toISOString().split("T")[0]!,
				time: nextOccurrence.item.time,
				durationMinutes: nextOccurrence.item.durationMinutes,
			});

			remainingMinutes -= nextOccurrence.item.durationMinutes;
			currentDate = new Date(nextOccurrence.date);
			currentDate.setDate(currentDate.getDate() + 1);
		}

		return scheduleData;
	}

	private getNextDateForWeekday(startDate: Date, weekday: Weekday): Date {
		const weekdayMap: Record<Weekday, number> = {
			MONDAY: 1,
			TUESDAY: 2,
			WEDNESDAY: 3,
			THURSDAY: 4,
			FRIDAY: 5,
			SATURDAY: 6,
			SUNDAY: 0,
		};

		const targetDay = weekdayMap[weekday];
		const currentDay = startDate.getDay();

		const date = new Date(startDate);
		const daysUntilTarget = (targetDay - currentDay + 7) % 7;

		if (daysUntilTarget === 0) {
			// If today is the target weekday, use today
			// But only if it's the first iteration or we're moving forward
			return date;
		} else {
			date.setDate(date.getDate() + daysUntilTarget);
		}

		return date;
	}

	async getAllSchedules(query?: {
		date?: string;
		search?: string;
		classId?: string;
	}): Promise<ScheduleDTO[]> {
		return this.repository.findAll(query);
	}

	async getScheduleById(id: string): Promise<ScheduleDTO> {
		const schedule = await this.repository.findById(id);
		if (!schedule) {
			throw AppError.notFound("SCHEDULE_NOT_FOUND", "Schedule not found");
		}
		return schedule;
	}

	async updateSchedule(
		id: string,
		data: UpdateScheduleDTO,
		tutorId: string,
	): Promise<ScheduleDTO> {
		// Check if schedule exists first
		const existingSchedule = await this.repository.findById(id);
		if (!existingSchedule) {
			throw AppError.notFound("SCHEDULE_NOT_FOUND", "Schedule not found");
		}

		// If classId is being updated, verify the new class exists and belongs to this tutor
		if (data.classId !== undefined) {
			const classData = await classRepository.findById(data.classId, tutorId);
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
			existingSchedule.status !== "COMPLETED"
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

		if (
			existingSchedule.status === "COMPLETED" &&
			data.status === "CANCELLED"
		) {
			if (hasNonStatusUpdates) {
				await this.repository.update(id, {
					...data,
					status: "COMPLETED",
				});
			}

			return this.repository.restoreHours(id);
		}

		return this.repository.update(id, data);
	}

	async deleteSchedule(id: string): Promise<void> {
		// Check if schedule exists first
		const existingSchedule = await this.repository.findById(id);
		if (!existingSchedule) {
			throw AppError.notFound("SCHEDULE_NOT_FOUND", "Schedule not found");
		}

		await this.repository.delete(id);
	}

	async completeSchedule(id: string): Promise<ScheduleDTO> {
		return this.repository.completeSchedule(id);
	}

	async restoreHours(id: string): Promise<ScheduleDTO> {
		return this.repository.restoreHours(id);
	}

	async getRemainingHours(classId: string): Promise<number> {
		return this.repository.getRemainingHours(classId);
	}
}
