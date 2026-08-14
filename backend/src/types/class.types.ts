import type { ClassModel } from "../models/class.model";
import type { ClassHourAdditionModel } from "../models/class-hour-addition.model";
import type { PaginatedResponse, PaginationParams } from "./pagination.types";
import type { RecurringScheduleDTO } from "./schedule.types";

export interface ClassDTO {
	id: string;
	tutorId: string;
	name: string;
	displayName: string;
	totalHours: number;
	students: StudentInClassDTO[];
	createdAt: string;
	updatedAt: string;
	remainingHours: number;
	recurringSchedule?: RecurringScheduleDTO | null;
}

export interface ClassDetailDTO extends ClassDTO {
	recordedRevenue: number;
}

export interface StudentInClassDTO {
	id: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
}

export interface CreateClassDTO {
	tutorId: string;
	name: string;
	studentIds?: string[];
}

export interface UpdateClassDTO {
	name?: string;
	studentIds?: string[];
}

export type ClassDeleteOutcome = "deleted" | "not_found";

export type ClassListParams = PaginationParams;

export type ClassHourAdditionSource = "course" | "custom";

export interface ClassHourAdditionDTO {
	id: string;
	classId: string;
	source: ClassHourAdditionSource;
	hours: number;
	revenueAmount: number | null;
	sourceCourseId: string | null;
	sourceCourseName: string | null;
	requestId: string;
	createdAt: string;
}

export type CreateClassHourAdditionDTO =
	| {
			source: "course";
			courseId: string;
			revenueAmount?: number | null;
			requestId: string;
	  }
	| {
			source: "custom";
			hours: number;
			revenueAmount?: number | null;
			requestId: string;
	  };

export interface ClassDetail {
	classData: ClassModel;
	recordedRevenue: number;
}

export interface ClassHourAdditionResult {
	addition: ClassHourAdditionModel;
	totalHours: number;
	remainingHours: number;
}

export interface ClassHourAdditionResultDTO {
	addition: ClassHourAdditionDTO;
	totalHours: number;
	remainingHours: number;
}

export interface IClassRepository {
	create(data: CreateClassDTO): Promise<ClassModel>;
	findAll(
		tutorId: string,
		params?: ClassListParams,
	): Promise<PaginatedResponse<ClassModel>>;
	findById(id: string, tutorId: string): Promise<ClassModel | null>;
	findDetailById(id: string, tutorId: string): Promise<ClassDetail | null>;
	update(
		id: string,
		tutorId: string,
		data: UpdateClassDTO,
	): Promise<ClassModel>;
	addHourAddition(
		id: string,
		tutorId: string,
		data: CreateClassHourAdditionDTO,
	): Promise<ClassHourAdditionResult>;
	findHourAdditions(
		id: string,
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<ClassHourAdditionModel>>;
	delete(id: string, tutorId: string): Promise<ClassDeleteOutcome>;
}
