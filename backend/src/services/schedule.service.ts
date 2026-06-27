import type { Prisma, ScheduleStatus, Weekday } from "@prisma/client";
import { prisma } from "../lib/db";
import { AppError } from "../lib/error";
import { classRepository } from "../repositories";
import type {
	CreateScheduleDTO,
	IScheduleRepository,
	RecurringScheduleDTO,
	RecurringScheduleUpdateResultDTO,
	ScheduleDTO,
	UpdateScheduleDTO,
	UpdateRecurringScheduleDTO,
} from "../types";

const ACTIVE_SCHEDULE_STATUSES: ScheduleStatus[] = [
	"SCHEDULED",
	"COMPLETED",
	"NO_SHOW",
];

const RECURRING_REPLACEABLE_STATUSES: ScheduleStatus[] = [
	"SCHEDULED",
	"CANCELLED",
];

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

	private toHoursNumber(value: Prisma.Decimal | number): number {
		return typeof value === "number" ? value : value.toNumber();
	}

	private getTodayDateString(): string {
		return new Date().toISOString().split("T")[0]!;
	}

	private toRecurringScheduleDTO(recurringSchedule: {
		id: string;
		classId: string;
		startDate: Date;
		notes: string | null;
		createdAt: Date;
		updatedAt: Date;
		class: {
			name: string;
		};
		scheduleItems: Array<{
			id: string;
			weekday: Weekday;
			time: number;
			durationMinutes: number;
		}>;
	}): RecurringScheduleDTO {
		return {
			id: recurringSchedule.id,
			classId: recurringSchedule.classId,
			className: recurringSchedule.class.name,
			startDate: recurringSchedule.startDate.toISOString().split("T")[0]!,
			notes: recurringSchedule.notes,
			createdAt: recurringSchedule.createdAt.toISOString(),
			updatedAt: recurringSchedule.updatedAt.toISOString(),
			scheduleItems: recurringSchedule.scheduleItems.map((item) => ({
				id: item.id,
				weekday: item.weekday,
				time: item.time,
				durationMinutes: item.durationMinutes,
			})),
		};
	}

	private async getRemainingHoursInTransaction(
		tx: Prisma.TransactionClient,
		classId: string,
	): Promise<number> {
		const classData = await tx.class.findUnique({
			where: { id: classId },
			select: {
				totalHours: true,
				schedules: {
					where: {
						status: {
							in: ACTIVE_SCHEDULE_STATUSES,
						},
					},
					select: {
						durationMinutes: true,
					},
				},
			},
		});

		if (!classData) {
			throw AppError.badRequest(
				"CLASS_NOT_FOUND",
				"The specified class does not exist",
			);
		}

		const reservedHours =
			classData.schedules.reduce(
				(total, schedule) => total + schedule.durationMinutes,
				0,
			) / 60;

		return this.toHoursNumber(classData.totalHours) - reservedHours;
	}

	private async assertNoRecurringConflicts(
		tx: Prisma.TransactionClient,
		classId: string,
		scheduleData: Array<{
			date: string;
			time: number;
			durationMinutes: number;
		}>,
	): Promise<void> {
		if (scheduleData.length === 0) {
			return;
		}

		const uniqueDates = [...new Set(scheduleData.map((item) => item.date))];
		const existingSchedules = await tx.schedule.findMany({
			where: {
				classId,
				date: {
					in: uniqueDates.map((date) => new Date(date)),
				},
				status: {
					in: ACTIVE_SCHEDULE_STATUSES,
				},
			},
			select: {
				date: true,
				time: true,
				durationMinutes: true,
			},
		});

		const groupedGeneratedSchedules = scheduleData.reduce<
			Record<string, Array<{ time: number; durationMinutes: number }>>
		>((groups, item) => {
			if (!groups[item.date]) {
				groups[item.date] = [];
			}
			groups[item.date]!.push({
				time: item.time,
				durationMinutes: item.durationMinutes,
			});
			return groups;
		}, {});

		const conflictDates = new Set<string>();

		for (const [date, generatedSchedules] of Object.entries(
			groupedGeneratedSchedules,
		)) {
			const existingForDate = existingSchedules.filter(
				(schedule) => schedule.date.toISOString().split("T")[0] === date,
			);

			const allSchedules = [
				...generatedSchedules.map((item) => ({ ...item, source: "generated" })),
				...existingForDate.map((item) => ({
					time: item.time,
					durationMinutes: item.durationMinutes,
					source: "existing",
				})),
			].sort((a, b) => a.time - b.time);

			for (let index = 0; index < allSchedules.length; index += 1) {
				const current = allSchedules[index];
				if (!current) {
					continue;
				}

				for (let nextIndex = index + 1; nextIndex < allSchedules.length; nextIndex += 1) {
					const next = allSchedules[nextIndex];
					if (!next) {
						continue;
					}

					if (next.time >= current.time + current.durationMinutes) {
						break;
					}

					if (current.source !== next.source || current.source === "generated") {
						conflictDates.add(date);
					}
				}
			}
		}

		if (conflictDates.size > 0) {
			const orderedDates = [...conflictDates].sort().join(", ");
			throw AppError.badRequest(
				"RECURRING_CONFLICT",
				`Recurring schedule conflicts with existing schedules on ${orderedDates}`,
			);
		}
	}

	async createSchedule(
		data: CreateScheduleDTO,
		tutorId: string,
	): Promise<ScheduleDTO> {
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
				await this.assertNoRecurringConflicts(tx, classId, scheduleData);

				await tx.schedule.createMany({
					data: scheduleData.map((item) => ({
						classId,
						recurringScheduleId: recurringSchedule.id,
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
			recurringScheduleId: firstSchedule.recurringScheduleId,
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

	private matchesRecurringScheduleItem(
		schedule: {
			date: Date;
			time: number;
			durationMinutes: number;
			recurringScheduleId: string | null;
		},
		recurringSchedule: {
			id: string;
			startDate: Date;
			scheduleItems: Array<{
				weekday: Weekday;
				time: number;
				durationMinutes: number;
			}>;
		},
	): boolean {
		if (schedule.recurringScheduleId === recurringSchedule.id) {
			return true;
		}

		if (schedule.recurringScheduleId) {
			return false;
		}

		if (schedule.date < recurringSchedule.startDate) {
			return false;
		}

		const weekdayMap: Record<Weekday, number> = {
			MONDAY: 1,
			TUESDAY: 2,
			WEDNESDAY: 3,
			THURSDAY: 4,
			FRIDAY: 5,
			SATURDAY: 6,
			SUNDAY: 0,
		};

		return recurringSchedule.scheduleItems.some(
			(item) =>
				weekdayMap[item.weekday] === schedule.date.getDay() &&
				item.time === schedule.time &&
				item.durationMinutes === schedule.durationMinutes,
		);
	}

	async getAllSchedules(
		tutorId: string,
		query?: {
			date?: string;
			search?: string;
			classId?: string;
		},
	): Promise<ScheduleDTO[]> {
		return this.repository.findAll(tutorId, query);
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
	): Promise<RecurringScheduleUpdateResultDTO> {
		const existingRecurringSchedule = await prisma.recurringSchedule.findFirst({
			where: {
				id: recurringScheduleId,
				class: {
					tutorId,
				},
			},
			include: {
				class: true,
				scheduleItems: true,
			},
		});

		if (!existingRecurringSchedule) {
			throw AppError.notFound(
				"RECURRING_SCHEDULE_NOT_FOUND",
				"Recurring schedule not found",
			);
		}

		if (data.effectiveDate < this.getTodayDateString()) {
			throw AppError.badRequest(
				"INVALID_EFFECTIVE_DATE",
				"Effective date must be today or later",
			);
		}

		const result = await prisma.$transaction(async (tx) => {
			const candidateSchedules = await tx.schedule.findMany({
				where: {
					classId: existingRecurringSchedule.classId,
					date: {
						gte: new Date(data.effectiveDate),
					},
					status: {
						in: RECURRING_REPLACEABLE_STATUSES,
					},
				},
				select: {
					id: true,
					date: true,
					time: true,
					durationMinutes: true,
					recurringScheduleId: true,
				},
			});
			const schedulesToReplace = candidateSchedules.filter((schedule) =>
				this.matchesRecurringScheduleItem(schedule, existingRecurringSchedule),
			);

			if (schedulesToReplace.length > 0) {
				await tx.schedule.deleteMany({
					where: {
						id: {
							in: schedulesToReplace.map((schedule) => schedule.id),
						},
					},
				});
			}

			const remainingHours = await this.getRemainingHoursInTransaction(
				tx,
				existingRecurringSchedule.classId,
			);
			const scheduleData = this.generateScheduleData(
				existingRecurringSchedule.classId,
				data.effectiveDate,
				data.scheduleItems,
				remainingHours,
			);

			if (scheduleData.length < 1) {
				throw AppError.badRequest(
					"INSUFFICIENT_HOURS",
					"The class does not have enough remaining hours to recreate any recurring schedule",
				);
			}

			await this.assertNoRecurringConflicts(
				tx,
				existingRecurringSchedule.classId,
				scheduleData,
			);

			const newRecurringSchedule = await tx.recurringSchedule.create({
				data: {
					classId: existingRecurringSchedule.classId,
					startDate: new Date(data.effectiveDate),
					notes: data.notes ?? existingRecurringSchedule.notes,
				},
				include: {
					class: true,
				},
			});

			await tx.recurringScheduleItem.createMany({
				data: data.scheduleItems.map((item) => ({
					recurringScheduleId: newRecurringSchedule.id,
					weekday: item.weekday,
					time: item.time,
					durationMinutes: item.durationMinutes,
				})),
			});

			await tx.schedule.createMany({
				data: scheduleData.map((item) => ({
					classId: existingRecurringSchedule.classId,
					recurringScheduleId: newRecurringSchedule.id,
					date: new Date(item.date),
					time: item.time,
					durationMinutes: item.durationMinutes,
					notes: data.notes ?? existingRecurringSchedule.notes,
					status: "SCHEDULED",
				})),
			});

			const recurringScheduleWithItems = await tx.recurringSchedule.findUnique({
				where: {
					id: newRecurringSchedule.id,
				},
				include: {
					class: true,
					scheduleItems: {
						orderBy: [{ weekday: "asc" }, { time: "asc" }],
					},
				},
			});

			if (!recurringScheduleWithItems) {
				throw new Error("Recurring schedule not found after update");
			}

			return {
				recurringSchedule: this.toRecurringScheduleDTO(
					recurringScheduleWithItems,
				),
				effectiveDate: data.effectiveDate,
				deletedSchedulesCount: schedulesToReplace.length,
				createdSchedulesCount: scheduleData.length,
			};
		});

		return result;
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
