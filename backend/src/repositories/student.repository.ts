import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import {
	type ClassInStudent,
	Student,
	StudentDetail,
} from "../models/student.model";
import type {
	CreateStudentDTO,
	IStudentRepository,
	PaginatedResponse,
	PaginationParams,
	UpdateStudentDTO,
} from "../types";
import { getRemainingHoursMap } from "./class-hours";

// Helper to convert Prisma Date to ISO string
function toHoursNumber(value: Prisma.Decimal | number): number {
	return typeof value === "number" ? value : value.toNumber();
}

export class StudentRepository implements IStudentRepository {
	async create(data: CreateStudentDTO): Promise<Student> {
		const student = await prisma.student.create({
			data: {
				tutorId: data.tutorId,
				name: data.name,
				phoneNumber: data.phoneNumber || null,
				grade: data.grade,
			},
		});
		return Student.fromStudentPrisma(student);
	}

	async findAll(
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<Student>> {
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
			data: students.map((student) => Student.fromStudentPrisma(student)),
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

	async findById(id: string, tutorId: string): Promise<StudentDetail | null> {
		const student = await prisma.student.findFirst({
			where: { id, tutorId },
			include: {
				classes: {
					include: {
						class: {
							include: {},
						},
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

		const classes: ClassInStudent[] = student.classes.map((enrollment) => ({
			id: enrollment.class.id,
			name: enrollment.class.name,
			displayName: enrollment.class.name,
			totalHours: toHoursNumber(enrollment.class.totalHours),
			remainingHours: remainingHoursMap.get(enrollment.classId),
		}));

		return StudentDetail.fromStudentPrisma(student, classes);
	}

	async findByIdForLineLink(id: string): Promise<Student | null> {
		const student = await prisma.student.findUnique({
			where: { id },
		});

		if (!student) {
			return null;
		}

		return Student.fromStudentPrisma(student);
	}

	async update(
		id: string,
		tutorId: string,
		data: UpdateStudentDTO,
	): Promise<Student> {
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
		return Student.fromStudentPrisma(student);
	}

	async delete(id: string, tutorId: string): Promise<void> {
		await prisma.student.delete({
			where: { id, tutorId },
		});
	}

	async linkLineUser(
		studentId: string,
		lineUserId: string,
		lineConnectionId: string,
	): Promise<void> {
		await prisma.student.update({
			where: { id: studentId },
			data: { lineUserId, lineConnectionId },
		});
	}

	async unlinkLineUser(studentId: string): Promise<void> {
		await prisma.student.update({
			where: { id: studentId },
			data: { lineUserId: null, lineConnectionId: null },
		});
	}

	async invalidateLineLinks(
		tutorId: string,
		connectionId: string,
	): Promise<void> {
		await prisma.student.updateMany({
			where: { tutorId, lineConnectionId: connectionId },
			data: { lineConnectionId: null },
		});
	}
}

// Singleton instance for dependency injection
export const studentRepository = new StudentRepository();
