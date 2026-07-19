import { AppError } from "../lib/error";
import type { CourseModel } from "../models/course.model";
import type {
	CreateCourseDTO,
	ICourseRepository,
	UpdateCourseDTO,
} from "../types/course.types";
import type {
	PaginatedResponse,
	PaginationParams,
} from "../types/pagination.types";

export class CourseService {
	constructor(private readonly repository: ICourseRepository) {}

	createCourse(data: CreateCourseDTO): Promise<CourseModel> {
		return this.repository.create(data);
	}

	getAllCourses(
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<CourseModel>> {
		return this.repository.findAll(tutorId, params);
	}

	async getCourseById(id: string, tutorId: string): Promise<CourseModel> {
		const course = await this.repository.findById(id, tutorId);
		if (!course)
			throw AppError.notFound("COURSE_NOT_FOUND", "Course not found");
		return course;
	}

	async updateCourse(
		id: string,
		tutorId: string,
		data: UpdateCourseDTO,
	): Promise<CourseModel> {
		await this.getCourseById(id, tutorId);
		return this.repository.update(id, tutorId, data);
	}

	async deleteCourse(id: string, tutorId: string): Promise<void> {
		const course = await this.getCourseById(id, tutorId);
		if (course.classCount > 0) {
			throw AppError.conflict(
				"COURSE_IN_USE",
				"Delete or move this course's classes before deleting the course",
			);
		}
		await this.repository.delete(id, tutorId);
	}
}
