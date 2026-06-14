import { prisma } from "../lib/db";
import type {
	ClassInStudentDTO,
	CreateStudentDTO,
	IStudentRepository,
	PaginatedResponse,
	PaginationParams,
	StudentDTO,
	StudentDetailDTO,
	UpdateStudentDTO,
} from "../types";

// Helper to convert Prisma Date to ISO string
function toDTO(student: {
	id: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
	lineUserId: string | null;
	createdAt: Date;
	updatedAt: Date;
}): StudentDTO {
	return {
		id: student.id,
		name: student.name,
		phoneNumber: student.phoneNumber,
		grade: student.grade,
		lineUserId: student.lineUserId,
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

	async findAll(
		params?: PaginationParams,
	): Promise<PaginatedResponse<StudentDTO>> {
		const page = params?.page || 1;
		const limit = params?.limit || 10;
		const skip = (page - 1) * limit;
		const search = params?.search?.trim();
		const sortBy = params?.sortBy || "createdAt";
		const sortOrder = params?.sortOrder || "desc";

		// Build where clause for search (only name and phoneNumber)
		const where = search
			? {
					OR: [
						{ name: { contains: search, mode: "insensitive" } },
						{ phoneNumber: { contains: search } },
					],
				}
			: undefined;

		// Get total count matching the search criteria
		const total = await prisma.student.count({ where });

		// Get paginated results
		const students = await prisma.student.findMany({
			where,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
		});

		const totalPages = Math.ceil(total / limit);

		return {
			data: students.map(toDTO),
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

	async findById(id: string): Promise<StudentDetailDTO | null> {
		const student = await prisma.student.findUnique({
			where: { id },
			include: {
				classes: {
					include: {
						class: true,
					},
				},
			},
		});

		if (!student) {
			return null;
		}

		const classes: ClassInStudentDTO[] = await Promise.all(
			student.classes.map(async (enrollment) => {
				const deductions = await prisma.classHourDeduction.findMany({
					where: {
						classId: enrollment.classId,
						restoredAt: null,
					},
				});

				const totalDeducted = deductions.reduce(
					(sum: number, deduction: { hoursDeducted: number }) =>
						sum + deduction.hoursDeducted,
					0,
				);

				return {
					id: enrollment.class.id,
					name: enrollment.class.name,
					totalHours: enrollment.class.totalHours,
					remainingHours: enrollment.class.totalHours - totalDeducted,
				};
			}),
		);

		return {
			...toDTO(student),
			classes,
		};
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
