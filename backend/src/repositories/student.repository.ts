import { prisma } from "../lib/db";
import type {
	CreateStudentDTO,
	IStudentRepository,
	StudentDTO,
	UpdateStudentDTO,
} from "../types";

// Helper to convert Prisma Date to ISO string
function toDTO(student: {
	id: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
	createdAt: Date;
	updatedAt: Date;
}): StudentDTO {
	return {
		id: student.id,
		name: student.name,
		phoneNumber: student.phoneNumber,
		grade: student.grade,
		createdAt: student.createdAt.toISOString(),
		updatedAt: student.updatedAt.toISOString(),
	};
}

export class StudentRepository implements IStudentRepository {
	async create(data: CreateStudentDTO): Promise<StudentDTO> {
		const student = await prisma.student.create({
			data: {
				name: data.name,
				phoneNumber: data.phoneNumber || null,
				grade: data.grade,
			},
		});
		return toDTO(student);
	}

	async findAll(): Promise<StudentDTO[]> {
		const students = await prisma.student.findMany({
			orderBy: { createdAt: "desc" },
		});
		return students.map(toDTO);
	}

	async findById(id: string): Promise<StudentDTO | null> {
		const student = await prisma.student.findUnique({
			where: { id },
		});
		return student ? toDTO(student) : null;
	}

	async update(id: string, data: UpdateStudentDTO): Promise<StudentDTO> {
		const student = await prisma.student.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.phoneNumber !== undefined && {
					phoneNumber: data.phoneNumber || null,
				}),
				...(data.grade !== undefined && { grade: data.grade }),
			},
		});
		return toDTO(student);
	}

	async delete(id: string): Promise<void> {
		await prisma.student.delete({
			where: { id },
		});
	}
}

// Singleton instance for dependency injection
export const studentRepository = new StudentRepository();
