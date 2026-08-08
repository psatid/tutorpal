import type { CourseModel } from "../models/course.model";
import type { PaginatedResponse, PaginationParams } from "./pagination.types";

export interface CourseDTO {
	id: string;
	tutorId: string;
	name: string;
	defaultTotalHours: number;
	classCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface CreateCourseDTO {
	tutorId: string;
	name: string;
	defaultTotalHours: number;
}

export interface UpdateCourseDTO {
	name?: string;
	defaultTotalHours?: number;
}

export type CourseDeleteOutcome = "deleted" | "not_found" | "in_use";

export interface ICourseRepository {
	create(data: CreateCourseDTO): Promise<CourseModel>;
	findAll(
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<CourseModel>>;
	findById(id: string, tutorId: string): Promise<CourseModel | null>;
	update(
		id: string,
		tutorId: string,
		data: UpdateCourseDTO,
	): Promise<CourseModel>;
	delete(id: string, tutorId: string): Promise<CourseDeleteOutcome>;
}
