import { prisma } from "../lib/db";
import { ClassModel } from "../models/class.model";
import type {
	CreateClassDTO,
	IClassRepository,
	UpdateClassDTO,
} from "../types";
import type {
	PaginatedResponse,
	PaginationParams,
} from "../types/pagination.types";
import { getRemainingHoursForClass, getRemainingHoursMap } from "./class-hours";

export class ClassRepository implements IClassRepository {
	async create(data: CreateClassDTO): Promise<ClassModel> {
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

		return ClassModel.fromClassPrisma(classData, remainingHours);
	}

	async findAll(
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<ClassModel>> {
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
			ClassModel.fromClassPrisma(
				classData,
				remainingHoursMap.get(classData.id),
			),
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

	async findById(id: string, tutorId: string): Promise<ClassModel | null> {
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

		return ClassModel.fromClassPrisma(classData, remainingHours);
	}

	async update(
		id: string,
		tutorId: string,
		data: UpdateClassDTO,
	): Promise<ClassModel> {
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

		return ClassModel.fromClassPrisma(classData, remainingHours);
	}

	async delete(id: string, tutorId: string): Promise<void> {
		await prisma.class.delete({
			where: { id, tutorId },
		});
	}
}

// Singleton instance for dependency injection
export const classRepository = new ClassRepository();
