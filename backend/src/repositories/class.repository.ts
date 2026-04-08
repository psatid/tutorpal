import { prisma } from "../lib/db";
import type {
	CreateClassDTO,
	IClassRepository,
	ClassDTO,
	UpdateClassDTO,
} from "../types";

// Helper to convert Prisma Class with relations to DTO
function toDTO(classData: {
	id: string;
	name: string;
	totalHours: number;
	createdAt: Date;
	updatedAt: Date;
	students: Array<{
		student: {
			id: string;
			name: string;
			phoneNumber: string | null;
			grade: number;
		};
	}>;
}): ClassDTO {
	return {
		id: classData.id,
		name: classData.name,
		totalHours: classData.totalHours,
		students: classData.students.map((enrollment) => ({
			id: enrollment.student.id,
			name: enrollment.student.name,
			phoneNumber: enrollment.student.phoneNumber,
			grade: enrollment.student.grade,
		})),
		createdAt: classData.createdAt.toISOString(),
		updatedAt: classData.updatedAt.toISOString(),
	};
}

export class ClassRepository implements IClassRepository {
	async create(data: CreateClassDTO): Promise<ClassDTO> {
		const classData = await prisma.class.create({
			data: {
				name: data.name,
				totalHours: data.totalHours,
				students: data.studentIds && data.studentIds.length > 0
					? {
							create: data.studentIds.map((studentId) => ({
								student: {
									connect: { id: studentId },
								},
							})),
						}
					: undefined,
			},
			include: {
				students: {
					include: {
						student: true,
					},
				},
			},
		});
		return toDTO(classData);
	}

	async findAll(): Promise<ClassDTO[]> {
		const classes = await prisma.class.findMany({
			orderBy: { createdAt: "desc" },
			include: {
				students: {
					include: {
						student: true,
					},
				},
			},
		});
		return classes.map(toDTO);
	}

	async findById(id: string): Promise<ClassDTO | null> {
		const classData = await prisma.class.findUnique({
			where: { id },
			include: {
				students: {
					include: {
						student: true,
					},
				},
			},
		});
		return classData ? toDTO(classData) : null;
	}

	async update(id: string, data: UpdateClassDTO): Promise<ClassDTO> {
		// Handle student enrollment updates if studentIds is provided
		if (data.studentIds !== undefined) {
			// Delete existing enrollments
			await prisma.classEnrollment.deleteMany({
				where: { classId: id },
			});

			// Create new enrollments
			if (data.studentIds.length > 0) {
				await prisma.classEnrollment.createMany({
					data: data.studentIds.map((studentId) => ({
						classId: id,
						studentId,
					})),
				});
			}
		}

		const classData = await prisma.class.update({
			where: { id },
			data: {
				...(data.name !== undefined && { name: data.name }),
				...(data.totalHours !== undefined && { totalHours: data.totalHours }),
			},
			include: {
				students: {
					include: {
						student: true,
					},
				},
			},
		});
		return toDTO(classData);
	}

	async delete(id: string): Promise<void> {
		await prisma.class.delete({
			where: { id },
		});
	}
}

// Singleton instance for dependency injection
export const classRepository = new ClassRepository();
