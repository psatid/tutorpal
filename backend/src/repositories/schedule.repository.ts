import type { Prisma, Weekday } from "@prisma/client";
import { prisma } from "../lib/db";
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
		date: schedule.date.toISOString().split("T")[0],
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

		const schedule = await prisma.schedule.create({
			data: {
				classId: data.classId,
				date: new Date(data.date),
				time: data.time,
				durationMinutes: data.durationMinutes,
				notes: data.notes || null,
				status: data.status || "SCHEDULED",
			},
			include: {
				class: true,
			},
		});

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
		const createdSchedules = await prisma.schedule.findMany({
			where: {
				classId: data[0].classId,
				date: {
					in: dateStrings.map((d) => new Date(d)),
				},
			},
			include: { class: true },
			orderBy: [{ date: "asc" }, { time: "asc" }],
		});

		// Get remaining hours once (optimization)
		const remainingHours = await this.getRemainingHours(data[0].classId);

		return createdSchedules.map((schedule) =>
			toDTO({ ...schedule, _remainingHours: remainingHours }),
		);
	}

	async findAll(query?: {
		date?: string;
		search?: string;
	}): Promise<ScheduleDTO[]> {
		const where: Prisma.ScheduleWhereInput = {};

		if (query?.date) {
			where.date = new Date(query.date);
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

		const schedulesWithHours = await Promise.all(
			schedules.map(async (schedule) => {
				const remainingHours = await this.getRemainingHours(schedule.classId);
				return toDTO({ ...schedule, _remainingHours: remainingHours });
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
		const schedule = await prisma.schedule.update({
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
		const remainingHours = await this.getRemainingHours(classId);
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

		const [updatedSchedule] = await prisma.$transaction([
			prisma.schedule.update({
				where: { id },
				data: { status: "COMPLETED" },
				include: { class: true },
			}),
			prisma.classHourDeduction.create({
				data: {
					scheduleId: id,
					classId: schedule.classId,
					hoursDeducted,
				},
			}),
		]);

		return toDTO(updatedSchedule);
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

		const [updatedSchedule] = await prisma.$transaction([
			prisma.schedule.update({
				where: { id },
				data: { status: "CANCELLED" },
				include: { class: true },
			}),
			prisma.classHourDeduction.update({
				where: { scheduleId: id },
				data: { restoredAt: new Date() },
			}),
		]);

		return toDTO(updatedSchedule);
	}

	async getRemainingHours(classId: string): Promise<number> {
		const classData = await prisma.class.findUnique({
			where: { id: classId },
		});

		if (!classData) {
			throw new Error("Class not found");
		}

		const deductions = await prisma.classHourDeduction.findMany({
			where: {
				classId,
				restoredAt: null,
			},
		});

		const totalDeducted = deductions.reduce(
			(sum: number, deduction: { hoursDeducted: number }) =>
				sum + deduction.hoursDeducted,
			0,
		);

		return classData.totalHours - totalDeducted;
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
			startDate: recurringSchedule.startDate.toISOString().split("T")[0],
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
