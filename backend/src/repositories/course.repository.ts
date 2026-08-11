import { Prisma } from "@prisma/client";
import { prisma } from "../lib/db";
import { CourseModel } from "../models/course.model";
import type {
	CourseDeleteOutcome,
	CreateCourseDTO,
	ICourseRepository,
	UpdateCourseDTO,
} from "../types/course.types";
import type {
	PaginatedResponse,
	PaginationParams,
} from "../types/pagination.types";

export class CourseRepository implements ICourseRepository {
	async create(data: CreateCourseDTO): Promise<CourseModel> {
		const course = await prisma.course.create({
			data: {
				tutorId: data.tutorId,
				name: data.name.trim(),
				defaultTotalHours: data.defaultTotalHours,
			},
		});
		return CourseModel.fromPrisma(course);
	}

	async findAll(
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<CourseModel>> {
		const page = params?.page ?? 1;
		const limit = params?.limit ?? 100;
		const skip = (page - 1) * limit;
		const search = params?.search?.trim();
		const sortBy = params?.sortBy ?? "name";
		const sortOrder = params?.sortOrder ?? "asc";
		const where: Prisma.CourseWhereInput = {
			tutorId,
			...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
		};

		const [total, courses] = await Promise.all([
			prisma.course.count({ where }),
			prisma.course.findMany({
				where,
				skip,
				take: limit,
				orderBy: { [sortBy]: sortOrder },
			}),
		]);
		const totalPages = Math.ceil(total / limit);
		return {
			data: courses.map(CourseModel.fromPrisma),
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

	async findById(id: string, tutorId: string): Promise<CourseModel | null> {
		const course = await prisma.course.findFirst({
			where: { id, tutorId },
		});
		return course ? CourseModel.fromPrisma(course) : null;
	}

	async update(
		id: string,
		tutorId: string,
		data: UpdateCourseDTO,
	): Promise<CourseModel> {
		const course = await prisma.course.update({
			where: { id, tutorId },
			data: {
				...(data.name !== undefined ? { name: data.name.trim() } : {}),
				...(data.defaultTotalHours !== undefined
					? { defaultTotalHours: data.defaultTotalHours }
					: {}),
			},
		});
		return CourseModel.fromPrisma(course);
	}

	async delete(id: string, tutorId: string): Promise<CourseDeleteOutcome> {
		try {
			await prisma.course.delete({ where: { id, tutorId } });
			return "deleted";
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError) {
				if (error.code === "P2025") return "not_found";
			}
			throw error;
		}
	}
}

export const courseRepository = new CourseRepository();
