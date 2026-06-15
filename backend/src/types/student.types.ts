import type { PaginatedResponse, PaginationParams } from "./pagination.types";

// DTOs for clean data transfer between layers
export interface StudentDTO {
	id: string;
	tutorId: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
	lineUserId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface ClassInStudentDTO {
	id: string;
	name: string;
	totalHours: number;
	remainingHours?: number;
}

export interface StudentDetailDTO extends StudentDTO {
	classes: ClassInStudentDTO[];
}

export interface CreateStudentDTO {
	tutorId: string;
	name: string;
	phoneNumber?: string;
	grade: number;
}

export interface UpdateStudentDTO {
	name?: string;
	phoneNumber?: string;
	grade?: number;
}

// Repository interface - abstract data access
export interface IStudentRepository {
	create(data: CreateStudentDTO): Promise<StudentDTO>;
	findAll(
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<StudentDTO>>;
	findById(id: string, tutorId: string): Promise<StudentDetailDTO | null>;
	update(id: string, tutorId: string, data: UpdateStudentDTO): Promise<StudentDTO>;
	delete(id: string, tutorId: string): Promise<void>;
}
