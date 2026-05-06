import { prisma } from "../lib/db";
import type {
	CreateScheduleDTO,
	IScheduleRepository,
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
		date: schedule.date.toISOString(),
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

	async findAll(): Promise<ScheduleDTO[]> {
		const schedules = await prisma.schedule.findMany({
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
}

// Singleton instance for dependency injection
export const scheduleRepository = new ScheduleRepository();
