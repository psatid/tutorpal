import { AppError } from "../lib/error";
import type { ClassModel } from "../models/class.model";
import type { ClassHourAdditionModel } from "../models/class-hour-addition.model";
import type {
	ClassHourAdditionResult,
	ClassListParams,
	CreateClassDTO,
	CreateClassHourAdditionDTO,
	IClassRepository,
	PaginatedResponse,
	PaginationParams,
	UpdateClassDTO,
} from "../types";

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
		return this.repository.addHourAddition(id, tutorId, data);
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
