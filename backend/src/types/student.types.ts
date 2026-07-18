import type { Student, StudentDetail } from "../models/student.model";
import type { PaginatedResponse, PaginationParams } from "./pagination.types";

// DTOs for clean data transfer between layers
export interface StudentDTO {
	id: string;
	tutorId: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
	lineUserId: string | null;
	lineConnectionId: string | null;
	lineLinkStatus: "linked" | "needs_relink" | "not_linked";
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
	create(data: CreateStudentDTO): Promise<Student>;
	findAll(
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<Student>>;
	findById(id: string, tutorId: string): Promise<StudentDetail | null>;
	findByIdForLineLink(id: string): Promise<Student | null>;
	update(id: string, tutorId: string, data: UpdateStudentDTO): Promise<Student>;
	delete(id: string, tutorId: string): Promise<void>;
	linkLineUser(
		studentId: string,
		lineUserId: string,
		lineConnectionId: string,
	): Promise<void>;
	unlinkLineUser(studentId: string): Promise<void>;
	invalidateLineLinks(tutorId: string, connectionId: string): Promise<void>;
}
