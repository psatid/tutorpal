// DTOs for clean data transfer between layers
export interface StudentDTO {
	id: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
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
	findAll(): Promise<StudentDTO[]>;
	findById(id: string): Promise<StudentDTO | null>;
	update(id: string, data: UpdateStudentDTO): Promise<StudentDTO>;
	delete(id: string): Promise<void>;
}
