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
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<StudentDTO>> {
		return this.repository.findAll(tutorId, params);
	}

	async getStudentById(id: string, tutorId: string): Promise<StudentDetailDTO> {
		const student = await this.repository.findById(id, tutorId);
		if (!student) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}
		return student;
	}

	async updateStudent(id: string, tutorId: string, data: UpdateStudentDTO): Promise<StudentDTO> {
		// Check if student exists first
		const existingStudent = await this.repository.findById(id, tutorId);
		if (!existingStudent) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}

		return this.repository.update(id, tutorId, data);
	}

	async deleteStudent(id: string, tutorId: string): Promise<void> {
		// Check if student exists first
		const existingStudent = await this.repository.findById(id, tutorId);
		if (!existingStudent) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}

		await this.repository.delete(id, tutorId);
	}
}
