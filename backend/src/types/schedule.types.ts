import type { ScheduleStatus, ScheduleType, Weekday } from "@prisma/client";
import type {
	RecurringScheduleCandidate,
	RecurringScheduleCreatePlan,
	RecurringScheduleExistingSchedule,
	RecurringScheduleSeriesSnapshot,
	RecurringScheduleUpdatePlan,
} from "../models/recurring-schedule-planner.model";
import type {
	RecurringScheduleUpdateResultModel,
	ScheduleModel,
	ScheduleTransitionPlan,
} from "../models/schedule.model";

export type ScheduleLifecycleFailureReason =
	| "not_found"
	| "stale"
	| "active_deduction_missing";

export class ScheduleLifecyclePersistenceError extends Error {
	constructor(
		readonly reason: ScheduleLifecycleFailureReason,
		message: string,
	) {
		super(message);
		this.name = "ScheduleLifecyclePersistenceError";
	}
}

export interface ScheduleLifecycleTransaction {
	loadOwned(scheduleId: string, tutorId: string): Promise<ScheduleModel | null>;
	apply(tutorId: string, plan: ScheduleTransitionPlan): Promise<ScheduleModel>;
}

export type RecurringScheduleCreateContext = Readonly<{
	classId: string;
	remainingSeconds: bigint;
}>;

export type RecurringScheduleUpdateContext = Readonly<{
	existingSeries: RecurringScheduleSeriesSnapshot;
	remainingSeconds: bigint;
	replaceableSchedules: readonly RecurringScheduleCandidate[];
}>;

export interface RecurringScheduleTransaction {
	loadCreateContext(
		classId: string,
		tutorId: string,
	): Promise<RecurringScheduleCreateContext | null>;
	loadUpdateContext(
		recurringScheduleId: string,
		tutorId: string,
		effectiveDate: string,
	): Promise<RecurringScheduleUpdateContext | null>;
	loadExistingSchedules(
		classId: string,
		dates: readonly string[],
	): Promise<readonly RecurringScheduleExistingSchedule[]>;
	applyCreate(plan: RecurringScheduleCreatePlan): Promise<ScheduleModel>;
	applyUpdate(
		plan: RecurringScheduleUpdatePlan,
	): Promise<RecurringScheduleUpdateResultModel>;
}

// DTOs for clean data transfer between layers
export interface ScheduleDTO {
	id: string;
	classId: string;
	className: string;
	recurringScheduleId?: string | null;
	date: string; // ISO date string (YYYY-MM-DD)
	time: number; // Minutes since midnight
	durationMinutes: number;
	notes: string | null;
	noShowNote: string | null;
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
}

export interface NoShowScheduleDTO {
	deductHours: boolean;
	note?: string;
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

// Repository interface - abstract data access
export interface IScheduleRepository {
	withLifecycleTransaction<T>(
		work: (transaction: ScheduleLifecycleTransaction) => Promise<T>,
	): Promise<T>;
	withRecurringScheduleTransaction<T>(
		work: (transaction: RecurringScheduleTransaction) => Promise<T>,
	): Promise<T>;
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
	getRemainingSeconds(classId: string): Promise<bigint>;
	getRemainingHours(classId: string): Promise<number>;
}
