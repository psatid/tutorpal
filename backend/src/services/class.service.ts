import { AppError } from "../lib/error";
import type { ClassModel } from "../models/class.model";
import type {
	CreateClassDTO,
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
		params?: PaginationParams,
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

	async deleteClass(id: string, tutorId: string): Promise<void> {
		// Check if class exists first
		const existingClass = await this.repository.findById(id, tutorId);
		if (!existingClass) {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}

		await this.repository.delete(id, tutorId);
	}
}
