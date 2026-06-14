import { prisma } from "../lib/db";
import type {
	ClassDTO,
	CreateClassDTO,
	IClassRepository,
	UpdateClassDTO,
} from "../types";
import type { PaginatedResponse, PaginationParams } from "../types/pagination.types";

// Helper to convert Prisma Class with relations to DTO
function toDTO(
	classData: {
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
	},
	remainingHours?: number,
): ClassDTO {
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
		remainingHours,
	};
}

export class ClassRepository implements IClassRepository {
	async create(data: CreateClassDTO): Promise<ClassDTO> {
		const classData = await prisma.class.create({
			data: {
				name: data.name,
				totalHours: data.totalHours,
				students:
					data.studentIds && data.studentIds.length > 0
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

		const remainingHours = classData.totalHours;

		return toDTO(classData, remainingHours);
	}

	async findAll(
		params?: PaginationParams,
	): Promise<PaginatedResponse<ClassDTO>> {
		const page = params?.page || 1;
		const limit = params?.limit || 10;
		const skip = (page - 1) * limit;
		const search = params?.search?.trim();
		const sortBy = params?.sortBy || "createdAt";
		const sortOrder = params?.sortOrder || "desc";

		// Build where clause for search (only name)
		const where = search
			? {
					name: { contains: search, mode: "insensitive" as const },
				}
			: undefined;

		// Get total count matching the search criteria
		const total = await prisma.class.count({ where });

		// Get paginated results
		const classes = await prisma.class.findMany({
			where,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
			include: {
				students: {
					include: {
						student: true,
					},
				},
			},
		});

		const totalPages = Math.ceil(total / limit);

		const classesWithHours = await Promise.all(
			classes.map(async (classData) => {
				const deductions = await prisma.classHourDeduction.findMany({
					where: {
						classId: classData.id,
						restoredAt: null,
					},
				});

				const totalDeducted = deductions.reduce(
					(sum: number, deduction: { hoursDeducted: number }) =>
						sum + deduction.hoursDeducted,
					0,
				);

				const remainingHours = classData.totalHours - totalDeducted;

				return toDTO(classData, remainingHours);
			}),
		);

		return {
			data: classesWithHours,
			pagination: {
				total,
				page,
				limit,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		};
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

		if (!classData) {
			return null;
		}

		const deductions = await prisma.classHourDeduction.findMany({
			where: {
				classId: id,
				restoredAt: null,
			},
		});

		const totalDeducted = deductions.reduce(
			(sum: number, deduction: { hoursDeducted: number }) =>
				sum + deduction.hoursDeducted,
			0,
		);

		const remainingHours = classData.totalHours - totalDeducted;

		return toDTO(classData, remainingHours);
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

		const deductions = await prisma.classHourDeduction.findMany({
			where: {
				classId: id,
				restoredAt: null,
			},
		});

		const totalDeducted = deductions.reduce(
			(sum: number, deduction: { hoursDeducted: number }) =>
				sum + deduction.hoursDeducted,
			0,
		);

		const remainingHours = classData.totalHours - totalDeducted;

		return toDTO(classData, remainingHours);
	}

	async delete(id: string): Promise<void> {
		await prisma.class.delete({
			where: { id },
		});
	}
}

// Singleton instance for dependency injection
export const classRepository = new ClassRepository();
