import type { ScheduleStatus, Weekday } from "@prisma/client";

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
	recurring?: RecurringPattern;
}

export interface RecurringPattern {
	startDate: string; // ISO date string (YYYY-MM-DD)
	scheduleItems: Array<{
		weekday: Weekday;
		time: number; // Minutes since midnight
	}>;
}

export interface UpdateScheduleDTO {
	classId?: string;
	date?: string; // ISO date string (YYYY-MM-DD)
	time?: number; // Minutes since midnight
	durationMinutes?: number;
	notes?: string;
	status?: ScheduleStatus;
}

export interface ScheduleListQueryDTO {
	date?: string; // ISO date string (YYYY-MM-DD)
	search?: string; // Search by class name
}

// Recurring schedule DTOs
export interface RecurringScheduleDTO {
	id: string;
	classId: string;
	className: string;
	startDate: string;
	durationMinutes: number;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
	scheduleItems: RecurringScheduleItemDTO[];
}

export interface RecurringScheduleItemDTO {
	id: string;
	weekday: Weekday;
	time: number;
}

// Repository interface - abstract data access
export interface IScheduleRepository {
	create(data: CreateScheduleDTO): Promise<ScheduleDTO>;
	createMany(data: Array<Omit<CreateScheduleDTO, 'notes' | 'status'>>): Promise<ScheduleDTO[]>;
	findAll(query?: ScheduleListQueryDTO): Promise<ScheduleDTO[]>;
	findById(id: string): Promise<ScheduleDTO | null>;
	update(id: string, data: UpdateScheduleDTO): Promise<ScheduleDTO>;
	delete(id: string): Promise<void>;
	validateAndReserveHours(classId: string, hours: number): Promise<boolean>;
	completeSchedule(id: string): Promise<ScheduleDTO>;
	restoreHours(id: string): Promise<ScheduleDTO>;
	getRemainingHours(classId: string): Promise<number>;
	createRecurringSchedule(
		data: Omit<RecurringScheduleDTO, 'id' | 'className' | 'createdAt' | 'updatedAt'>
	): Promise<RecurringScheduleDTO>;
	createRecurringScheduleItems(
		recurringScheduleId: string,
		items: Array<{ weekday: Weekday; time: number }>
	): Promise<RecurringScheduleItemDTO[]>;
}
