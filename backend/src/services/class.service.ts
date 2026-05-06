import { AppError } from "../lib/error";
import type {
	ClassDTO,
	CreateClassDTO,
	IClassRepository,
	UpdateClassDTO,
} from "../types";

export class ClassService {
	constructor(private readonly repository: IClassRepository) {}

	async createClass(data: CreateClassDTO): Promise<ClassDTO> {
		return this.repository.create(data);
	}

	async getAllClasses(): Promise<ClassDTO[]> {
		return this.repository.findAll();
	}

	async getClassById(id: string): Promise<ClassDTO> {
		const classData = await this.repository.findById(id);
		if (!classData) {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}
		return classData;
	}

	async updateClass(id: string, data: UpdateClassDTO): Promise<ClassDTO> {
		// Check if class exists first
		const existingClass = await this.repository.findById(id);
		if (!existingClass) {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}

		return this.repository.update(id, data);
	}

	async deleteClass(id: string): Promise<void> {
		// Check if class exists first
		const existingClass = await this.repository.findById(id);
		if (!existingClass) {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}

		await this.repository.delete(id);
	}
}
