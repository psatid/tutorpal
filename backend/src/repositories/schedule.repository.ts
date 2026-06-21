import type { Prisma, Weekday } from "@prisma/client";
import { prisma } from "../lib/db";
import { getRemainingHoursForClass, getRemainingHoursMap } from "./class-hours";
import type {
	CreateScheduleDTO,
	IScheduleRepository,
	RecurringScheduleDTO,
	RecurringScheduleItemDTO,
	ScheduleDTO,
	UpdateScheduleDTO,
} from "../types";

// Helper to convert Prisma Schedule with class relation to DTO
function toDTO(schedule: {
	id: string;
	classId: string;
	date: Date;
	time: number;
	durationMinutes: number;
	notes: string | null;
	status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
	createdAt: Date;
	updatedAt: Date;
	class: {
		name: string;
	};
	_remainingHours?: number;
}): ScheduleDTO {
	return {
		id: schedule.id,
		classId: schedule.classId,
		className: schedule.class.name,
		date: schedule.date.toISOString().split("T")[0]!,
		time: schedule.time,
		durationMinutes: schedule.durationMinutes,
		notes: schedule.notes,
		status: schedule.status,
		createdAt: schedule.createdAt.toISOString(),
		updatedAt: schedule.updatedAt.toISOString(),
		remainingHours: schedule._remainingHours,
	};
}

export class ScheduleRepository implements IScheduleRepository {
	async create(data: CreateScheduleDTO): Promise<ScheduleDTO> {
		if (data.time === undefined || data.durationMinutes === undefined) {
			throw new Error("Time and duration are required");
		}

		const time = data.time;
		const durationMinutes = data.durationMinutes;

		const scheduleId = await prisma.$transaction(async (tx) => {
			const createdSchedule = await tx.schedule.create({
				data: {
					classId: data.classId,
					date: new Date(data.date),
					time,
					durationMinutes,
					notes: data.notes || null,
					status: data.status || "SCHEDULED",
				},
				include: {
					class: true,
				},
			});

			if (createdSchedule.status === "COMPLETED") {
				await tx.classHourDeduction.create({
					data: {
						scheduleId: createdSchedule.id,
						classId: createdSchedule.classId,
						hoursDeducted: createdSchedule.durationMinutes / 60,
					},
				});
			}

			return createdSchedule.id;
		});

		const schedule = await prisma.schedule.findUnique({
			where: { id: scheduleId },
			include: {
				class: true,
			},
		});

		if (!schedule) {
			throw new Error("Schedule not found after creation");
		}

		const remainingHours = await this.getRemainingHours(schedule.classId);
		return toDTO({ ...schedule, _remainingHours: remainingHours });
	}

	async createMany(
		data: Array<{
			classId: string;
			date: string;
			time: number;
			durationMinutes: number;
		}>,
	): Promise<ScheduleDTO[]> {
		if (data.length === 0) {
			return [];
		}

		// Bulk insert schedules
		await prisma.schedule.createMany({
			data: data.map((item) => ({
				classId: item.classId,
				date: new Date(item.date),
				time: item.time,
				durationMinutes: item.durationMinutes,
				notes: null,
				status: "SCHEDULED",
			})),
		});

		// Fetch the created schedules to return DTOs with class names
		const dateStrings = data.map((d) => d.date);
		const firstClassId = data[0]?.classId;
		if (!firstClassId) {
			return [];
		}
		const createdSchedules = await prisma.schedule.findMany({
			where: {
				classId: firstClassId,
				date: {
					in: dateStrings.map((d) => new Date(d)),
				},
			},
			include: { class: true },
			orderBy: [{ date: "asc" }, { time: "asc" }],
		});

		// Get remaining hours once (optimization)
		const remainingHours = await this.getRemainingHours(firstClassId);

		return createdSchedules.map((schedule) =>
			toDTO({ ...schedule, _remainingHours: remainingHours }),
		);
	}

	async findAll(query?: {
		date?: string;
		search?: string;
		classId?: string;
	}): Promise<ScheduleDTO[]> {
		const where: Prisma.ScheduleWhereInput = {};

		if (query?.date) {
			where.date = new Date(query.date);
		}

		if (query?.classId) {
			where.classId = query.classId;
		}

		if (query?.search) {
			where.class = {
				name: {
					contains: query.search,
					mode: "insensitive",
				},
			};
		}

		const schedules = await prisma.schedule.findMany({
			where,
			orderBy: [{ date: "asc" }, { time: "asc" }],
			include: {
				class: true,
			},
		});

		const remainingHoursMap = await getRemainingHoursMap(
			schedules.map((schedule) => schedule.classId),
		);

		const schedulesWithHours = schedules.map((schedule) =>
			toDTO({
				...schedule,
				_remainingHours: remainingHoursMap.get(schedule.classId),
			}),
		);

		return schedulesWithHours;
	}

	async findById(id: string): Promise<ScheduleDTO | null> {
		const schedule = await prisma.schedule.findUnique({
			where: { id },
			include: {
				class: true,
			},
		});

		if (!schedule) {
			return null;
		}

		const remainingHours = await this.getRemainingHours(schedule.classId);
		return toDTO({ ...schedule, _remainingHours: remainingHours });
	}

	async update(id: string, data: UpdateScheduleDTO): Promise<ScheduleDTO> {
		const schedule = await prisma.$transaction(async (tx) => {
			const updatedSchedule = await tx.schedule.update({
				where: { id },
				data: {
					...(data.classId !== undefined && { classId: data.classId }),
					...(data.date !== undefined && { date: new Date(data.date) }),
					...(data.time !== undefined && { time: data.time }),
					...(data.durationMinutes !== undefined && {
						durationMinutes: data.durationMinutes,
					}),
					...(data.notes !== undefined && { notes: data.notes || null }),
					...(data.status !== undefined && { status: data.status }),
				},
				include: {
					class: true,
				},
			});

			if (updatedSchedule.status === "COMPLETED") {
				await tx.classHourDeduction.upsert({
					where: { scheduleId: updatedSchedule.id },
					update: {
						classId: updatedSchedule.classId,
						hoursDeducted: updatedSchedule.durationMinutes / 60,
						restoredAt: null,
					},
					create: {
						scheduleId: updatedSchedule.id,
						classId: updatedSchedule.classId,
						hoursDeducted: updatedSchedule.durationMinutes / 60,
					},
				});
			}

			return updatedSchedule;
		});

		const remainingHours = await this.getRemainingHours(schedule.classId);
		return toDTO({ ...schedule, _remainingHours: remainingHours });
	}

	async delete(id: string): Promise<void> {
		await prisma.schedule.delete({
			where: { id },
		});
	}

	async validateAndReserveHours(
		classId: string,
		hours: number,
	): Promise<boolean> {
		const remainingHours = await getRemainingHoursForClass(classId);
		return remainingHours >= hours;
	}

	async completeSchedule(id: string): Promise<ScheduleDTO> {
		const schedule = await prisma.schedule.findUnique({
			where: { id },
			include: { class: true },
		});

		if (!schedule) {
			throw new Error("Schedule not found");
		}

		if (schedule.status !== "SCHEDULED") {
			throw new Error("Only scheduled schedules can be completed");
		}

		const hoursDeducted = schedule.durationMinutes / 60;

		const updatedSchedule = await prisma.$transaction(async (tx) => {
			const completedSchedule = await tx.schedule.update({
				where: { id },
				data: { status: "COMPLETED" },
				include: { class: true },
			});

			await tx.classHourDeduction.upsert({
				where: { scheduleId: id },
				update: {
					hoursDeducted,
					restoredAt: null,
				},
				create: {
					scheduleId: id,
					classId: schedule.classId,
					hoursDeducted,
				},
			});

			return completedSchedule;
		});

		const remainingHours = await this.getRemainingHours(schedule.classId);
		return toDTO({ ...updatedSchedule, _remainingHours: remainingHours });
	}

	async restoreHours(id: string): Promise<ScheduleDTO> {
		const schedule = await prisma.schedule.findUnique({
			where: { id },
			include: { class: true },
		});

		if (!schedule) {
			throw new Error("Schedule not found");
		}

		const hourDeduction = await prisma.classHourDeduction.findUnique({
			where: { scheduleId: id },
		});

		if (!hourDeduction) {
			throw new Error("No hours have been deducted for this schedule");
		}

		if (hourDeduction.restoredAt) {
			throw new Error("Hours have already been restored for this schedule");
		}

		const updatedSchedule = await prisma.$transaction(async (tx) => {
			const cancelledSchedule = await tx.schedule.update({
				where: { id },
				data: { status: "CANCELLED" },
				include: { class: true },
			});

			await tx.classHourDeduction.update({
				where: { scheduleId: id },
				data: { restoredAt: new Date() },
			});

			return cancelledSchedule;
		});

		const remainingHours = await this.getRemainingHours(schedule.classId);
		return toDTO({ ...updatedSchedule, _remainingHours: remainingHours });
	}

	async getRemainingHours(classId: string): Promise<number> {
		return getRemainingHoursForClass(classId);
	}

	async createRecurringSchedule(
		data: Omit<
			RecurringScheduleDTO,
			"id" | "className" | "createdAt" | "updatedAt"
		>,
	): Promise<RecurringScheduleDTO> {
		const recurringSchedule = await prisma.recurringSchedule.create({
			data: {
				classId: data.classId,
				startDate: new Date(data.startDate),
				notes: data.notes || null,
			},
			include: {
				class: true,
			},
		});

		return {
			id: recurringSchedule.id,
			classId: recurringSchedule.classId,
			className: recurringSchedule.class.name,
			startDate: recurringSchedule.startDate.toISOString().split("T")[0]!,
			notes: recurringSchedule.notes,
			createdAt: recurringSchedule.createdAt.toISOString(),
			updatedAt: recurringSchedule.updatedAt.toISOString(),
			scheduleItems: [],
		};
	}

	async createRecurringScheduleItems(
		recurringScheduleId: string,
		items: Array<{ weekday: Weekday; time: number; durationMinutes: number }>,
	): Promise<RecurringScheduleItemDTO[]> {
		await prisma.recurringScheduleItem.createMany({
			data: items.map((item) => ({
				recurringScheduleId,
				weekday: item.weekday,
				time: item.time,
				durationMinutes: item.durationMinutes,
			})),
		});

		// Fetch and return the created items
		const scheduleItems = await prisma.recurringScheduleItem.findMany({
			where: { recurringScheduleId },
		});

		return scheduleItems.map((item) => ({
			id: item.id,
			weekday: item.weekday,
			time: item.time,
			durationMinutes: item.durationMinutes,
		}));
	}
}

// Singleton instance for dependency injection
export const scheduleRepository = new ScheduleRepository();
