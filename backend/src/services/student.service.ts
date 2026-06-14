import { AppError } from "../lib/error";
import type {
	CreateStudentDTO,
	IStudentRepository,
	PaginatedResponse,
	PaginationParams,
	StudentDTO,
	StudentDetailDTO,
	UpdateStudentDTO,
} from "../types";

export class StudentService {
	constructor(private readonly repository: IStudentRepository) {}

	async createStudent(data: CreateStudentDTO): Promise<StudentDTO> {
		return this.repository.create(data);
	}

	async getAllStudents(
		params?: PaginationParams,
	): Promise<PaginatedResponse<StudentDTO>> {
		return this.repository.findAll(params);
	}

	async getStudentById(id: string): Promise<StudentDetailDTO> {
		const student = await this.repository.findById(id);
		if (!student) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}
		return student;
	}

	async updateStudent(id: string, data: UpdateStudentDTO): Promise<StudentDTO> {
		// Check if student exists first
		const existingStudent = await this.repository.findById(id);
		if (!existingStudent) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}

		return this.repository.update(id, data);
	}

	async deleteStudent(id: string): Promise<void> {
		// Check if student exists first
		const existingStudent = await this.repository.findById(id);
		if (!existingStudent) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}

		await this.repository.delete(id);
	}
}
