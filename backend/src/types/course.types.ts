import type { CourseModel } from "../models/course.model";
import type { PaginatedResponse, PaginationParams } from "./pagination.types";

export type CoursePricingMode = "hourly_rate" | "fixed_price";

export interface CourseDTO {
	id: string;
	tutorId: string;
	name: string;
	defaultTotalHours: number;
	pricingMode: CoursePricingMode;
	priceAmount: number | null;
	createdAt: string;
	updatedAt: string;
}

export interface CourseDetailDTO extends CourseDTO {
	recordedHours: number;
	recordedRevenue: number;
}

export interface CreateCourseDTO {
	tutorId: string;
	name: string;
	defaultTotalHours: number;
	pricingMode: CoursePricingMode;
	priceAmount?: number | null;
}

export interface UpdateCourseDTO {
	name?: string;
	defaultTotalHours?: number;
	pricingMode?: CoursePricingMode;
	priceAmount?: number | null;
}

export interface CourseDetail {
	course: CourseModel;
	recordedHours: number;
	recordedRevenue: number;
}

export type CourseDeleteOutcome = "deleted" | "not_found";

export interface ICourseRepository {
	create(data: CreateCourseDTO): Promise<CourseModel>;
	findAll(
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<CourseModel>>;
	findById(id: string, tutorId: string): Promise<CourseModel | null>;
	findDetailById(id: string, tutorId: string): Promise<CourseDetail | null>;
	update(
		id: string,
		tutorId: string,
		data: UpdateCourseDTO,
	): Promise<CourseModel>;
	delete(id: string, tutorId: string): Promise<CourseDeleteOutcome>;
}
