import type { ScheduleStatus } from "@prisma/client";

// DTOs for clean data transfer between layers
export interface ScheduleDTO {
	id: string;
	classId: string;
	className: string;
	date: string; // ISO date string (YYYY-MM-DD)
	time: number; // Minutes since midnight
	durationMinutes: number;
	notes: string | null;
	status: ScheduleStatus;
	createdAt: string;
	updatedAt: string;
	remainingHours?: number; // Remaining hours for the class after this schedule
}

export interface CreateScheduleDTO {
	classId: string;
	date: string; // ISO date string (YYYY-MM-DD)
	time: number; // Minutes since midnight
	durationMinutes: number;
	notes?: string;
	status?: ScheduleStatus;
}

export interface UpdateScheduleDTO {
	classId?: string;
	date?: string; // ISO date string (YYYY-MM-DD)
	time?: number; // Minutes since midnight
	durationMinutes?: number;
	notes?: string;
	status?: ScheduleStatus;
}

// Repository interface - abstract data access
export interface IScheduleRepository {
	create(data: CreateScheduleDTO): Promise<ScheduleDTO>;
	findAll(): Promise<ScheduleDTO[]>;
	findById(id: string): Promise<ScheduleDTO | null>;
	update(id: string, data: UpdateScheduleDTO): Promise<ScheduleDTO>;
	delete(id: string): Promise<void>;
	validateAndReserveHours(classId: string, hours: number): Promise<boolean>;
	completeSchedule(id: string): Promise<ScheduleDTO>;
	restoreHours(id: string): Promise<ScheduleDTO>;
	getRemainingHours(classId: string): Promise<number>;
}
