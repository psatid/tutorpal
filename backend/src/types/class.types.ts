import type { PaginatedResponse, PaginationParams } from "./pagination.types";

// DTOs for clean data transfer between layers
export interface ClassDTO {
	id: string;
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
	findAll(params?: PaginationParams): Promise<PaginatedResponse<ClassDTO>>;
	findById(id: string): Promise<ClassDTO | null>;
	update(id: string, data: UpdateClassDTO): Promise<ClassDTO>;
	delete(id: string): Promise<void>;
}
