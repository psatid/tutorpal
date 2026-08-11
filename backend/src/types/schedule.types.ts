import type { ScheduleStatus, ScheduleType, Weekday } from "@prisma/client";
import type {
	RecurringScheduleModel,
	RecurringScheduleUpdateResultModel,
	ScheduleModel,
} from "../models/schedule.model";

// DTOs for clean data transfer between layers
export interface ScheduleDTO {
	id: string;
	classId: string;
	className: string;
	courseName: string | null;
	recurringScheduleId?: string | null;
	date: string; // ISO date string (YYYY-MM-DD)
	time: number; // Minutes since midnight
	durationMinutes: number;
	notes: string | null;
	status: ScheduleStatus;
	type: ScheduleType;
	createdAt: string;
	updatedAt: string;
	remainingHours?: number; // Remaining hours for the class after this schedule
}

export interface CreateScheduleDTO {
	classId: string;
	date: string; // ISO date string (YYYY-MM-DD)
	type: ScheduleType;
	time?: number; // Minutes since midnight
	durationMinutes?: number;
	notes?: string;
	recurring?: RecurringPattern;
}

export interface RecurringPattern {
	startDate: string; // ISO date string (YYYY-MM-DD)
	scheduleItems: Array<{
		weekday: Weekday;
		time: number; // Minutes since midnight
		durationMinutes: number;
	}>;
}

export interface UpdateScheduleDTO {
	classId?: string;
	date?: string; // ISO date string (YYYY-MM-DD)
	type?: ScheduleType;
	time?: number; // Minutes since midnight
	durationMinutes?: number;
	notes?: string;
	status?: ScheduleStatus;
}

export interface ScheduleListQueryDTO {
	date?: string; // ISO date string (YYYY-MM-DD)
	startDate?: string; // Inclusive range start (YYYY-MM-DD)
	endDate?: string; // Inclusive range end (YYYY-MM-DD)
	search?: string; // Search by class name
	classId?: string; // Filter by class ID
}

// Recurring schedule DTOs
export interface RecurringScheduleDTO {
	id: string;
	classId: string;
	className: string;
	courseName: string | null;
	startDate: string;
	notes: string | null;
	type: ScheduleType;
	createdAt: string;
	updatedAt: string;
	scheduleItems: RecurringScheduleItemDTO[];
}

export interface RecurringScheduleItemDTO {
	id: string;
	weekday: Weekday;
	time: number;
	durationMinutes: number;
}

export interface UpdateRecurringScheduleDTO {
	effectiveDate: string;
	type?: ScheduleType;
	notes?: string;
	scheduleItems: Array<{
		weekday: Weekday;
		time: number;
		durationMinutes: number;
	}>;
}

export interface RecurringScheduleUpdateResultDTO {
	recurringSchedule: RecurringScheduleDTO;
	effectiveDate: string;
	deletedSchedulesCount: number;
	createdSchedulesCount: number;
}

export interface RecurringScheduleCreationData {
	classId: string;
	type: ScheduleType;
	notes?: string;
	recurring: RecurringPattern;
}

// Repository interface - abstract data access
export interface IScheduleRepository {
	create(data: CreateScheduleDTO): Promise<ScheduleModel>;
	createMany(
		data: Array<{
			classId: string;
			date: string;
			type: ScheduleType;
			time: number;
			durationMinutes: number;
		}>,
	): Promise<ScheduleModel[]>;
	findAll(
		tutorId: string,
		query?: ScheduleListQueryDTO,
	): Promise<ScheduleModel[]>;
	findById(id: string, tutorId?: string): Promise<ScheduleModel | null>;
	update(id: string, data: UpdateScheduleDTO): Promise<ScheduleModel>;
	delete(id: string): Promise<void>;
	completeSchedule(id: string): Promise<ScheduleModel>;
	restoreHours(id: string): Promise<ScheduleModel>;
	getRemainingHours(classId: string): Promise<number>;
	createRecurringSchedule(
		data: RecurringScheduleCreationData,
	): Promise<ScheduleModel>;
	findRecurringScheduleById(
		recurringScheduleId: string,
		tutorId: string,
	): Promise<RecurringScheduleModel | null>;
	updateRecurringSchedule(
		recurringScheduleId: string,
		data: UpdateRecurringScheduleDTO,
		tutorId: string,
	): Promise<RecurringScheduleUpdateResultModel>;
}
