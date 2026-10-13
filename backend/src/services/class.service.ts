import { AppError } from "../lib/error";
import type { ClassModel } from "../models/class.model";
import {
	ClassHourAdditionLimitError,
	ClassHourAdditionModel,
	ClassHourAdditionRequestConflictError,
	ClassHourAdditionValidationError,
} from "../models/class-hour-addition.model";
import type {
	ClassDetail,
	ClassHourAdditionResult,
	ClassListParams,
	CreateClassDTO,
	CreateClassHourAdditionDTO,
	IClassRepository,
	PaginatedResponse,
	PaginationParams,
	UpdateClassDTO,
} from "../types";
import { ClassHourAdditionPersistenceError } from "../types";

export class ClassService {
	constructor(private readonly repository: IClassRepository) {}

	async createClass(data: CreateClassDTO): Promise<ClassModel> {
		return this.repository.create(data);
	}

	async getAllClasses(
		tutorId: string,
		params?: ClassListParams,
	): Promise<PaginatedResponse<ClassModel>> {
		return this.repository.findAll(tutorId, params);
	}

	async getClassById(id: string, tutorId: string): Promise<ClassModel> {
		const classData = await this.repository.findById(id, tutorId);
		if (!classData) {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}
		return classData;
	}

	async getClassDetailById(id: string, tutorId: string): Promise<ClassDetail> {
		const classData = await this.repository.findDetailById(id, tutorId);
		if (!classData) {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}
		return classData;
	}

	async updateClass(
		id: string,
		tutorId: string,
		data: UpdateClassDTO,
	): Promise<ClassModel> {
		// Check if class exists first
		const existingClass = await this.repository.findById(id, tutorId);
		if (!existingClass) {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}

		return this.repository.update(id, tutorId, data);
	}

	async addHourAddition(
		id: string,
		tutorId: string,
		data: CreateClassHourAdditionDTO,
	): Promise<ClassHourAdditionResult> {
		try {
			const request = ClassHourAdditionModel.prepare(data);
			return await this.repository.withHourAdditionTransaction(async (tx) => {
				const classData = await tx.loadOwnedClass(id, tutorId);
				if (!classData) {
					throw new ClassHourAdditionPersistenceError(
						"class_not_found",
						"Class not found",
					);
				}

				const existing = await tx.findByRequestId(id, request.requestId);
				if (existing) {
					request.assertMatches(existing);
					return tx.resultForExisting(classData, existing);
				}

				const course =
					request.source === "course"
						? await tx.loadOwnedCourse(request.courseId ?? "", tutorId)
						: undefined;
				if (request.source === "course" && !course) {
					throw new ClassHourAdditionPersistenceError(
						"course_not_found",
						"The selected course is unavailable",
					);
				}

				const plan = classData.planHourAddition(
					request.toDraft(course ?? undefined),
				);
				return tx.apply(tutorId, plan);
			});
		} catch (error) {
			if (error instanceof ClassHourAdditionValidationError) {
				throw AppError.badRequest(
					error.reason === "revenue"
						? "INVALID_REVENUE_AMOUNT"
						: "INVALID_HOUR_ADDITION",
					error.message,
				);
			}
			if (error instanceof ClassHourAdditionRequestConflictError) {
				throw AppError.conflict(
					"HOUR_ADDITION_REQUEST_CONFLICT",
					error.message,
				);
			}
			if (error instanceof ClassHourAdditionLimitError) {
				throw AppError.badRequest(
					"HOUR_ADDITION_LIMIT_EXCEEDED",
					error.message,
				);
			}
			if (error instanceof ClassHourAdditionPersistenceError) {
				if (error.reason === "class_not_found") {
					throw AppError.notFound("CLASS_NOT_FOUND", error.message);
				}
				if (error.reason === "course_not_found") {
					throw AppError.badRequest("COURSE_NOT_FOUND", error.message);
				}
				throw AppError.badRequest(
					"HOUR_ADDITION_LIMIT_EXCEEDED",
					error.message,
				);
			}
			throw error;
		}
	}

	async getHourAdditions(
		id: string,
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<ClassHourAdditionModel>> {
		return this.repository.findHourAdditions(id, tutorId, params);
	}

	async deleteClass(id: string, tutorId: string): Promise<void> {
		const outcome = await this.repository.delete(id, tutorId);
		if (outcome === "not_found") {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}
	}
}
