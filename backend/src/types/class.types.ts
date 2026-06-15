import type { PaginatedResponse, PaginationParams } from "./pagination.types";

// DTOs for clean data transfer between layers
export interface ClassDTO {
	id: string;
	tutorId: string;
	name: string;
	totalHours: number;
	students: StudentInClassDTO[];
	createdAt: string;
	updatedAt: string;
	remainingHours?: number;
}

export interface StudentInClassDTO {
	id: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
}

export interface CreateClassDTO {
	tutorId: string;
	name: string;
	totalHours: number;
	studentIds?: string[];
}

export interface UpdateClassDTO {
	name?: string;
	totalHours?: number;
	studentIds?: string[];
}

// Repository interface - abstract data access
export interface IClassRepository {
	create(data: CreateClassDTO): Promise<ClassDTO>;
	findAll(
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<ClassDTO>>;
	findById(id: string, tutorId: string): Promise<ClassDTO | null>;
	update(id: string, tutorId: string, data: UpdateClassDTO): Promise<ClassDTO>;
	delete(id: string, tutorId: string): Promise<void>;
}
