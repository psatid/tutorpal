import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import { AppError } from "../lib/error";
import { ClassModel } from "../models/class.model";
import type {
	ClassListParams,
	CreateClassDTO,
	IClassRepository,
	UpdateClassDTO,
} from "../types/class.types";
import type { PaginatedResponse } from "../types/pagination.types";
import {
	ACTIVE_SCHEDULE_STATUSES,
	getRemainingHoursForClass,
	getRemainingHoursMap,
} from "./class-hours";

const classInclude = {
	course: true,
	students: {
		orderBy: { createdAt: "asc" as const },
		include: { student: true },
	},
} as const;

async function assertStudentsBelongToTutor(
	tx: Prisma.TransactionClient,
	studentIds: string[],
	tutorId: string,
) {
	const count = await tx.student.count({
		where: { id: { in: studentIds }, tutorId },
	});
	if (count !== studentIds.length)
		throw AppError.badRequest(
			"INVALID_STUDENTS",
			"One or more selected students are unavailable",
		);
}

export class ClassRepository implements IClassRepository {
	async create(data: CreateClassDTO): Promise<ClassModel> {
		const classId = await prisma.$transaction(async (tx) => {
			await assertStudentsBelongToTutor(tx, data.studentIds, data.tutorId);
			const course = data.courseId
				? await tx.course.findFirst({
						where: { id: data.courseId, tutorId: data.tutorId },
					})
				: null;
			if (data.courseId && !course)
				throw AppError.badRequest(
					"COURSE_NOT_FOUND",
					"The selected course is unavailable",
				);
			const name = data.name?.trim() || null;
			if (!course && !name)
				throw AppError.badRequest(
					"CUSTOM_CLASS_NAME_REQUIRED",
					"Enter a name for the custom class",
				);
			const totalHours =
				data.totalHours ?? (course ? course.defaultTotalHours : undefined);
			if (!totalHours)
				throw AppError.badRequest(
					"TOTAL_HOURS_REQUIRED",
					"Enter total hours for the custom class",
				);

			const created = await tx.class.create({
				data: {
					tutorId: data.tutorId,
					courseId: course?.id ?? null,
					name,
					totalHours,
					students: {
						create: data.studentIds.map((studentId) => ({ studentId })),
					},
				},
				select: { id: true },
			});
			return created.id;
		});
		const created = await this.findById(classId, data.tutorId);
		if (!created) throw new Error("Class not found after creation");
		return created;
	}

	async findAll(
		tutorId: string,
		params?: ClassListParams,
	): Promise<PaginatedResponse<ClassModel>> {
		const page = params?.page ?? 1;
		const limit = params?.limit ?? 10;
		const skip = (page - 1) * limit;
		const search = params?.search?.trim();
		const sortBy = params?.sortBy ?? "createdAt";
		const sortOrder = params?.sortOrder ?? "desc";
		const where: Prisma.ClassWhereInput = {
			tutorId,
			...(params?.courseId ? { courseId: params.courseId } : {}),
			...(params?.classType === "custom" ? { courseId: null } : {}),
			...(params?.classType === "course-linked"
				? { courseId: { not: null } }
				: {}),
			...(search
				? {
						OR: [
							{ name: { contains: search, mode: "insensitive" } },
							{ course: { name: { contains: search, mode: "insensitive" } } },
							{
								students: {
									some: {
										student: {
											name: { contains: search, mode: "insensitive" },
										},
									},
								},
							},
						],
					}
				: {}),
		};
		const [total, classes] = await Promise.all([
			prisma.class.count({ where }),
			prisma.class.findMany({
				where,
				skip,
				take: limit,
				orderBy: { [sortBy]: sortOrder },
				include: classInclude,
			}),
		]);
		const remaining = await getRemainingHoursMap(
			classes.map((item) => item.id),
		);
		const totalPages = Math.ceil(total / limit);
		return {
			data: classes.map((item) =>
				ClassModel.fromClassPrisma(item, remaining.get(item.id)),
			),
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

	async findById(id: string, tutorId: string): Promise<ClassModel | null> {
		const item = await prisma.class.findFirst({
			where: { id, tutorId },
			include: {
				...classInclude,
				recurringSchedules: {
					orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
					take: 1,
					include: {
						scheduleItems: { orderBy: [{ weekday: "asc" }, { time: "asc" }] },
					},
				},
			},
		});
		if (!item) return null;
		return ClassModel.fromClassPrisma(
			item,
			await getRemainingHoursForClass(id),
		);
	}

	async update(
		id: string,
		tutorId: string,
		data: UpdateClassDTO,
	): Promise<ClassModel> {
		await prisma.$transaction(async (tx) => {
			const existing = await tx.class.findFirst({
				where: { id, tutorId },
				include: { course: true },
			});
			if (!existing)
				throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
			if (!existing.courseId && data.name !== undefined && !data.name?.trim()) {
				throw AppError.badRequest(
					"CUSTOM_CLASS_NAME_REQUIRED",
					"Custom classes must have a name",
				);
			}
			if (data.totalHours !== undefined) {
				const reserved = await tx.schedule.aggregate({
					where: { classId: id, status: { in: ACTIVE_SCHEDULE_STATUSES } },
					_sum: { durationMinutes: true },
				});
				const reservedHours = (reserved._sum.durationMinutes ?? 0) / 60;
				if (data.totalHours < reservedHours)
					throw AppError.badRequest(
						"TOTAL_HOURS_BELOW_RESERVED",
						`Total hours cannot be less than ${reservedHours}`,
					);
			}
			if (data.studentIds) {
				await assertStudentsBelongToTutor(tx, data.studentIds, tutorId);
				await tx.classEnrollment.deleteMany({ where: { classId: id } });
				await tx.classEnrollment.createMany({
					data: data.studentIds.map((studentId) => ({
						classId: id,
						studentId,
					})),
				});
			}
			await tx.class.update({
				where: { id, tutorId },
				data: {
					...(data.name !== undefined
						? { name: data.name?.trim() || null }
						: {}),
					...(data.totalHours !== undefined
						? { totalHours: data.totalHours }
						: {}),
				},
			});
		});
		const updated = await this.findById(id, tutorId);
		if (!updated) throw new Error("Class not found after update");
		return updated;
	}

	async delete(id: string, tutorId: string): Promise<void> {
		await prisma.class.delete({ where: { id, tutorId } });
	}
}

export const classRepository = new ClassRepository();
