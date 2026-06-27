import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import type {
	ClassInStudentDTO,
	CreateStudentDTO,
	IStudentRepository,
	PaginatedResponse,
	PaginationParams,
	StudentDetailDTO,
	StudentDTO,
	UpdateStudentDTO,
} from "../types";
import { getRemainingHoursMap } from "./class-hours";

// Helper to convert Prisma Date to ISO string
function toHoursNumber(value: Prisma.Decimal | number): number {
	return typeof value === "number" ? value : value.toNumber();
}

function toDTO(student: {
	id: string;
	tutorId: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
	lineUserId: string | null;
	createdAt: Date;
	updatedAt: Date;
}): StudentDTO {
	return {
		id: student.id,
		tutorId: student.tutorId,
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
				tutorId: data.tutorId,
				name: data.name,
				phoneNumber: data.phoneNumber || null,
				grade: data.grade,
			},
		});
		return toDTO(student);
	}

	async findAll(
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<StudentDTO>> {
		const page = params?.page || 1;
		const limit = params?.limit || 10;
		const skip = (page - 1) * limit;
		const search = params?.search?.trim();
		const sortBy = params?.sortBy || "createdAt";
		const sortOrder = params?.sortOrder || "desc";

		// Build where clause for search (only name and phoneNumber) with tutor scoping
		const where = {
			tutorId,
			...(search
				? {
						OR: [
							{ name: { contains: search, mode: "insensitive" as const } },
							{ phoneNumber: { contains: search } },
						],
					}
				: {}),
		};

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

	async findById(
		id: string,
		tutorId: string,
	): Promise<StudentDetailDTO | null> {
		const student = await prisma.student.findFirst({
			where: { id, tutorId },
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

		const remainingHoursMap = await getRemainingHoursMap(
			student.classes.map((enrollment) => enrollment.classId),
		);

		const classes: ClassInStudentDTO[] = student.classes.map((enrollment) => ({
			id: enrollment.class.id,
			name: enrollment.class.name,
			totalHours: toHoursNumber(enrollment.class.totalHours),
			remainingHours: remainingHoursMap.get(enrollment.classId),
		}));

		return {
			...toDTO(student),
			classes,
		};
	}

	async update(
		id: string,
		tutorId: string,
		data: UpdateStudentDTO,
	): Promise<StudentDTO> {
		const student = await prisma.student.update({
			where: { id, tutorId },
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

	async delete(id: string, tutorId: string): Promise<void> {
		await prisma.student.delete({
			where: { id, tutorId },
		});
	}
}

// Singleton instance for dependency injection
export const studentRepository = new StudentRepository();
