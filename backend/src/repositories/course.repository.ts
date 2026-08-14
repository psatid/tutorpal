import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/db";
import { CourseModel } from "../models/course.model";
import type {
	CourseDeleteOutcome,
	CourseDetail,
	CreateCourseDTO,
	ICourseRepository,
	UpdateCourseDTO,
} from "../types/course.types";
import type {
	PaginatedResponse,
	PaginationParams,
} from "../types/pagination.types";

type AggregateValue = { toNumber(): number } | number | null;

function toAggregateNumber(value: AggregateValue): number {
	if (value === null) return 0;
	return typeof value === "number" ? value : value.toNumber();
}

export class CourseRepository implements ICourseRepository {
	constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

	async create(data: CreateCourseDTO): Promise<CourseModel> {
		const course = await this.prisma.course.create({
			data: {
				tutorId: data.tutorId,
				name: data.name.trim(),
				defaultTotalHours: data.defaultTotalHours,
				pricingMode:
					data.pricingMode === "hourly_rate" ? "HOURLY_RATE" : "FIXED_PRICE",
				priceAmount: data.priceAmount ?? null,
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
			this.prisma.course.count({ where }),
			this.prisma.course.findMany({
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
		const course = await this.prisma.course.findFirst({
			where: { id, tutorId },
		});
		return course ? CourseModel.fromPrisma(course) : null;
	}

	async findDetailById(
		id: string,
		tutorId: string,
	): Promise<CourseDetail | null> {
		const course = await this.prisma.course.findFirst({
			where: { id, tutorId },
		});
		if (!course) return null;

		const aggregate = await this.prisma.classHourAddition.aggregate({
			where: {
				source: "COURSE",
				sourceCourseId: id,
				class: { tutorId },
			},
			_sum: { hours: true, revenueAmount: true },
		});
		return {
			course: CourseModel.fromPrisma(course),
			recordedHours: toAggregateNumber(aggregate._sum.hours),
			recordedRevenue: toAggregateNumber(aggregate._sum.revenueAmount),
		};
	}

	async update(
		id: string,
		tutorId: string,
		data: UpdateCourseDTO,
	): Promise<CourseModel> {
		const course = await this.prisma.course.update({
			where: { id, tutorId },
			data: {
				...(data.name !== undefined ? { name: data.name.trim() } : {}),
				...(data.defaultTotalHours !== undefined
					? { defaultTotalHours: data.defaultTotalHours }
					: {}),
				...(data.pricingMode !== undefined
					? {
							pricingMode:
								data.pricingMode === "hourly_rate"
									? "HOURLY_RATE"
									: "FIXED_PRICE",
						}
					: {}),
				...(data.priceAmount !== undefined
					? { priceAmount: data.priceAmount }
					: {}),
			},
		});
		return CourseModel.fromPrisma(course);
	}

	async delete(id: string, tutorId: string): Promise<CourseDeleteOutcome> {
		try {
			await this.prisma.course.delete({ where: { id, tutorId } });
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
