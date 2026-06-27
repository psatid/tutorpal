import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import type {
	ClassDTO,
	CreateClassDTO,
	IClassRepository,
	RecurringScheduleDTO,
	UpdateClassDTO,
} from "../types";
import type {
	PaginatedResponse,
	PaginationParams,
} from "../types/pagination.types";
import { getRemainingHoursForClass, getRemainingHoursMap } from "./class-hours";

// Helper to convert Prisma Class with relations to DTO
function toHoursNumber(value: Prisma.Decimal | number): number {
	return typeof value === "number" ? value : value.toNumber();
}

function toDTO(
	classData: {
		id: string;
		tutorId: string;
		name: string;
		totalHours: Prisma.Decimal | number;
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
		recurringSchedules?: Array<{
			id: string;
			classId: string;
			startDate: Date;
			notes: string | null;
			createdAt: Date;
			updatedAt: Date;
			scheduleItems: Array<{
				id: string;
				weekday:
					| "MONDAY"
					| "TUESDAY"
					| "WEDNESDAY"
					| "THURSDAY"
					| "FRIDAY"
					| "SATURDAY"
					| "SUNDAY";
				time: number;
				durationMinutes: number;
			}>;
		}>;
	},
	remainingHours?: number,
	recurringSchedule?: RecurringScheduleDTO | null,
): ClassDTO {
	return {
		id: classData.id,
		tutorId: classData.tutorId,
		name: classData.name,
		totalHours: toHoursNumber(classData.totalHours),
		students: classData.students.map((enrollment) => ({
			id: enrollment.student.id,
			name: enrollment.student.name,
			phoneNumber: enrollment.student.phoneNumber,
			grade: enrollment.student.grade,
		})),
		createdAt: classData.createdAt.toISOString(),
		updatedAt: classData.updatedAt.toISOString(),
		remainingHours,
		recurringSchedule,
	};
}

function toRecurringScheduleDTO(
	className: string,
	recurringSchedule: {
		id: string;
		classId: string;
		startDate: Date;
		notes: string | null;
		createdAt: Date;
		updatedAt: Date;
		scheduleItems: Array<{
			id: string;
			weekday:
				| "MONDAY"
				| "TUESDAY"
				| "WEDNESDAY"
				| "THURSDAY"
				| "FRIDAY"
				| "SATURDAY"
				| "SUNDAY";
			time: number;
			durationMinutes: number;
		}>;
	},
): RecurringScheduleDTO {
	return {
		id: recurringSchedule.id,
		classId: recurringSchedule.classId,
		className,
		startDate: recurringSchedule.startDate.toISOString().split("T")[0]!,
		notes: recurringSchedule.notes,
		createdAt: recurringSchedule.createdAt.toISOString(),
		updatedAt: recurringSchedule.updatedAt.toISOString(),
		scheduleItems: recurringSchedule.scheduleItems.map((item) => ({
			id: item.id,
			weekday: item.weekday,
			time: item.time,
			durationMinutes: item.durationMinutes,
		})),
	};
}

export class ClassRepository implements IClassRepository {
	async create(data: CreateClassDTO): Promise<ClassDTO> {
		const classData = await prisma.class.create({
			data: {
				tutorId: data.tutorId,
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

		const remainingHours = await getRemainingHoursForClass(classData.id);

		return toDTO(classData, remainingHours);
	}

	async findAll(
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<ClassDTO>> {
		const page = params?.page || 1;
		const limit = params?.limit || 10;
		const skip = (page - 1) * limit;
		const search = params?.search?.trim();
		const sortBy = params?.sortBy || "createdAt";
		const sortOrder = params?.sortOrder || "desc";

		// Build where clause for search (only name) with tutor scoping
		const where = {
			tutorId,
			...(search
				? { name: { contains: search, mode: "insensitive" as const } }
				: {}),
		};

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
		const remainingHoursMap = await getRemainingHoursMap(
			classes.map((classData) => classData.id),
		);

		const classesWithHours = classes.map((classData) =>
			toDTO(classData, remainingHoursMap.get(classData.id)),
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

	async findById(id: string, tutorId: string): Promise<ClassDTO | null> {
		const classData = await prisma.class.findFirst({
			where: { id, tutorId },
			include: {
				students: {
					include: {
						student: true,
					},
				},
				recurringSchedules: {
					orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
					take: 1,
					include: {
						scheduleItems: {
							orderBy: [{ weekday: "asc" }, { time: "asc" }],
						},
					},
				},
			},
		});

		if (!classData) {
			return null;
		}

		const remainingHours = await getRemainingHoursForClass(id);
		const latestRecurringSchedule = classData.recurringSchedules?.[0]
			? toRecurringScheduleDTO(
					classData.name,
					classData.recurringSchedules[0],
				)
			: null;

		return toDTO(classData, remainingHours, latestRecurringSchedule);
	}

	async update(
		id: string,
		tutorId: string,
		data: UpdateClassDTO,
	): Promise<ClassDTO> {
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
			where: { id, tutorId },
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

		const remainingHours = await getRemainingHoursForClass(id);

		return toDTO(classData, remainingHours);
	}

	async delete(id: string, tutorId: string): Promise<void> {
		await prisma.class.delete({
			where: { id, tutorId },
		});
	}
}

// Singleton instance for dependency injection
export const classRepository = new ClassRepository();
