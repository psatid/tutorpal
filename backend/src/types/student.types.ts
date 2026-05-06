import type { PaginatedResponse, PaginationParams } from "./pagination.types";

// DTOs for clean data transfer between layers
export interface StudentDTO {
	id: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
	lineUserId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateStudentDTO {
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
	findAll(params?: PaginationParams): Promise<PaginatedResponse<StudentDTO>>;
	findById(id: string): Promise<StudentDTO | null>;
	update(id: string, data: UpdateStudentDTO): Promise<StudentDTO>;
	delete(id: string): Promise<void>;
}
