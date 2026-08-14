import { Prisma, type PrismaClient } from "@prisma/client";
import { MAX_CLASS_HOURS } from "../lib/class-hour-addition";
import { prisma as defaultPrisma } from "../lib/db";
import { AppError } from "../lib/error";
import {
	hasAtMostTwoDecimalPlaces,
	MAX_CURRENCY_AMOUNT,
	normalizeCurrencyAmount,
} from "../lib/money";
import { ClassModel } from "../models/class.model";
import { ClassHourAdditionModel } from "../models/class-hour-addition.model";
import type {
	ClassDeleteOutcome,
	ClassDetail,
	ClassHourAdditionResult,
	ClassListParams,
	CreateClassDTO,
	CreateClassHourAdditionDTO,
	IClassRepository,
	UpdateClassDTO,
} from "../types/class.types";
import type {
	PaginatedResponse,
	PaginationParams,
} from "../types/pagination.types";
import {
	ACTIVE_SCHEDULE_STATUSES,
	getRemainingHoursForClass,
	getRemainingHoursMap,
} from "./class-hours";

const classInclude = {
	students: {
		orderBy: { createdAt: "asc" as const },
		include: { student: true },
	},
} as const;

type DecimalLike = { toNumber(): number };
type HoursValue = DecimalLike | number;
type MoneyValue = DecimalLike | number;

function toHoursNumber(value: HoursValue): number {
	return typeof value === "number" ? value : value.toNumber();
}

function hourAdditionLimitExceeded(message: string) {
	return AppError.badRequest("HOUR_ADDITION_LIMIT_EXCEEDED", message);
}

function normalizePositiveHours(hours: number): number {
	const scaledHours = hours * 100;
	const hasAtMostTwoDecimalPlaces =
		Math.abs(scaledHours - Math.round(scaledHours)) <=
		Number.EPSILON * Math.max(1, Math.abs(scaledHours)) * 4;
	if (!Number.isFinite(hours) || hours <= 0 || !hasAtMostTwoDecimalPlaces) {
		throw AppError.badRequest(
			"INVALID_HOUR_ADDITION",
			"Hours must be a positive value with at most two decimal places",
		);
	}

	const normalizedHours = Math.round(scaledHours) / 100;
	if (normalizedHours <= 0) {
		throw AppError.badRequest(
			"INVALID_HOUR_ADDITION",
			"Hours must be at least 0.01",
		);
	}
	return normalizedHours;
}

function normalizeRevenueAmount(
	revenueAmount: number | null | undefined,
): number | null {
	if (revenueAmount === null || revenueAmount === undefined) return null;

	if (
		!Number.isFinite(revenueAmount) ||
		revenueAmount < 0 ||
		revenueAmount > MAX_CURRENCY_AMOUNT ||
		!hasAtMostTwoDecimalPlaces(revenueAmount)
	) {
		throw AppError.badRequest(
			"INVALID_REVENUE_AMOUNT",
			"Revenue amount must be a non-negative value with at most two decimal places",
		);
	}

	return normalizeCurrencyAmount(revenueAmount);
}

function assertHoursFitClassTotal(hours: number) {
	if (hours > MAX_CLASS_HOURS) {
		throw hourAdditionLimitExceeded(
			`Hours must not exceed ${MAX_CLASS_HOURS.toFixed(2)}`,
		);
	}
}

async function assertStudentsBelongToTutor(
	tx: Prisma.TransactionClient,
	studentIds: string[],
	tutorId: string,
) {
	if (studentIds.length === 0) return;

	const count = await tx.student.count({
		where: { id: { in: studentIds }, tutorId },
	});
	if (count !== studentIds.length)
		throw AppError.badRequest(
			"INVALID_STUDENTS",
			"One or more selected students are unavailable",
		);
}

function isMatchingHourAddition(
	existing: {
		source: "COURSE" | "CUSTOM";
		hours: HoursValue;
		revenueAmount: MoneyValue | null;
		sourceCourseId: string | null;
	},
	data: CreateClassHourAdditionDTO,
): boolean {
	if (
		normalizeRevenueAmount(
			existing.revenueAmount === null
				? null
				: toHoursNumber(existing.revenueAmount),
		) !== normalizeRevenueAmount(data.revenueAmount)
	) {
		return false;
	}

	if (data.source === "course") {
		return (
			existing.source === "COURSE" && existing.sourceCourseId === data.courseId
		);
	}

	return (
		existing.source === "CUSTOM" &&
		normalizePositiveHours(toHoursNumber(existing.hours)) ===
			normalizePositiveHours(data.hours)
	);
}

function assertMatchingHourAddition(
	existing: {
		source: "COURSE" | "CUSTOM";
		hours: HoursValue;
		revenueAmount: MoneyValue | null;
		sourceCourseId: string | null;
	},
	data: CreateClassHourAdditionDTO,
) {
	if (!isMatchingHourAddition(existing, data)) {
		throw AppError.conflict(
			"HOUR_ADDITION_REQUEST_CONFLICT",
			"This request ID was already used for a different hour addition",
		);
	}
}

async function getRemainingHoursInTransaction(
	tx: Prisma.TransactionClient,
	classId: string,
	totalHours: HoursValue,
): Promise<number> {
	const reserved = await tx.schedule.aggregate({
		where: { classId, status: { in: ACTIVE_SCHEDULE_STATUSES } },
		_sum: { durationMinutes: true },
	});
	return toHoursNumber(totalHours) - (reserved._sum.durationMinutes ?? 0) / 60;
}

export class ClassRepository implements IClassRepository {
	constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

	async create(data: CreateClassDTO): Promise<ClassModel> {
		const studentIds = data.studentIds ?? [];
		const name = data.name.trim();
		if (!name) {
			throw AppError.badRequest(
				"CLASS_NAME_REQUIRED",
				"Class name is required",
			);
		}

		const classId = await this.prisma.$transaction(async (tx) => {
			await assertStudentsBelongToTutor(tx, studentIds, data.tutorId);
			const created = await tx.class.create({
				data: {
					tutorId: data.tutorId,
					name,
					totalHours: 0,
					...(studentIds.length > 0
						? {
								students: {
									create: studentIds.map((studentId) => ({ studentId })),
								},
							}
						: {}),
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
			...(search
				? {
						OR: [
							{ name: { contains: search, mode: "insensitive" } },
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
			this.prisma.class.count({ where }),
			this.prisma.class.findMany({
				where,
				skip,
				take: limit,
				orderBy: { [sortBy]: sortOrder },
				include: classInclude,
			}),
		]);
		const remaining = await getRemainingHoursMap(
			this.prisma,
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
		const item = await this.prisma.class.findFirst({
			where: { id, tutorId },
			include: {
				...classInclude,
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
		if (!item) return null;
		return ClassModel.fromClassPrisma(
			item,
			await getRemainingHoursForClass(this.prisma, id),
		);
	}

	async findDetailById(
		id: string,
		tutorId: string,
	): Promise<ClassDetail | null> {
		const classData = await this.findById(id, tutorId);
		if (!classData) return null;

		const revenue = await this.prisma.classHourAddition.aggregate({
			where: { classId: id },
			_sum: { revenueAmount: true },
		});
		return {
			classData,
			recordedRevenue:
				revenue._sum.revenueAmount === null
					? 0
					: revenue._sum.revenueAmount.toNumber(),
		};
	}

	async update(
		id: string,
		tutorId: string,
		data: UpdateClassDTO,
	): Promise<ClassModel> {
		if (data.name !== undefined && !data.name.trim()) {
			throw AppError.badRequest(
				"CLASS_NAME_REQUIRED",
				"Class name is required",
			);
		}

		await this.prisma.$transaction(async (tx) => {
			const existing = await tx.class.findFirst({
				where: { id, tutorId },
				select: { id: true },
			});
			if (!existing) {
				throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
			}

			if (data.studentIds !== undefined) {
				await assertStudentsBelongToTutor(tx, data.studentIds, tutorId);
				await tx.classEnrollment.deleteMany({ where: { classId: id } });
				if (data.studentIds.length > 0) {
					await tx.classEnrollment.createMany({
						data: data.studentIds.map((studentId) => ({
							classId: id,
							studentId,
						})),
					});
				}
			}

			await tx.class.update({
				where: { id, tutorId },
				data: {
					...(data.name !== undefined ? { name: data.name.trim() } : {}),
				},
			});
		});
		const updated = await this.findById(id, tutorId);
		if (!updated) throw new Error("Class not found after update");
		return updated;
	}

	async addHourAddition(
		id: string,
		tutorId: string,
		data: CreateClassHourAdditionDTO,
	): Promise<ClassHourAdditionResult> {
		const normalizedData =
			data.source === "custom"
				? {
						...data,
						hours: normalizePositiveHours(data.hours),
						revenueAmount: normalizeRevenueAmount(data.revenueAmount),
					}
				: {
						...data,
						revenueAmount: normalizeRevenueAmount(data.revenueAmount),
					};

		try {
			return await this.prisma.$transaction(async (tx) => {
				const classData = await tx.class.findFirst({
					where: { id, tutorId },
					select: { id: true, totalHours: true },
				});
				if (!classData) {
					throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
				}

				const existing = await tx.classHourAddition.findUnique({
					where: {
						classId_requestId: { classId: id, requestId: data.requestId },
					},
				});
				if (existing) {
					assertMatchingHourAddition(existing, normalizedData);
					return {
						addition: ClassHourAdditionModel.fromPrisma(existing),
						totalHours: toHoursNumber(classData.totalHours),
						remainingHours: await getRemainingHoursInTransaction(
							tx,
							id,
							classData.totalHours,
						),
					};
				}

				let hours: number;
				let sourceCourseId: string | null = null;
				let sourceCourseName: string | null = null;
				if (normalizedData.source === "course") {
					const course = await tx.course.findFirst({
						where: { id: normalizedData.courseId, tutorId },
						select: { id: true, name: true, defaultTotalHours: true },
					});
					if (!course) {
						throw AppError.badRequest(
							"COURSE_NOT_FOUND",
							"The selected course is unavailable",
						);
					}
					hours = normalizePositiveHours(
						toHoursNumber(course.defaultTotalHours),
					);
					sourceCourseId = course.id;
					sourceCourseName = course.name;
				} else {
					hours = normalizedData.hours;
				}
				assertHoursFitClassTotal(hours);

				const updateResult = await tx.class.updateMany({
					where: {
						id,
						tutorId,
						totalHours: {
							lte: new Prisma.Decimal(MAX_CLASS_HOURS.toFixed(2)).minus(
								hours.toFixed(2),
							),
						},
					},
					data: { totalHours: { increment: hours } },
				});
				if (updateResult.count !== 1) {
					const [currentClass, concurrentAddition] = await Promise.all([
						tx.class.findFirst({
							where: { id, tutorId },
							select: { totalHours: true },
						}),
						tx.classHourAddition.findUnique({
							where: {
								classId_requestId: {
									classId: id,
									requestId: normalizedData.requestId,
								},
							},
						}),
					]);
					if (!currentClass) {
						throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
					}
					if (concurrentAddition) {
						assertMatchingHourAddition(concurrentAddition, normalizedData);
						return {
							addition: ClassHourAdditionModel.fromPrisma(concurrentAddition),
							totalHours: toHoursNumber(currentClass.totalHours),
							remainingHours: await getRemainingHoursInTransaction(
								tx,
								id,
								currentClass.totalHours,
							),
						};
					}
					throw hourAdditionLimitExceeded(
						"Adding these hours would exceed the class total hour limit",
					);
				}

				const updatedClass = await tx.class.findUnique({
					where: { id },
					select: { totalHours: true },
				});
				if (!updatedClass) {
					throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
				}

				const addition = await tx.classHourAddition.create({
					data: {
						classId: id,
						source: normalizedData.source === "course" ? "COURSE" : "CUSTOM",
						hours,
						revenueAmount: normalizedData.revenueAmount,
						sourceCourseId,
						sourceCourseName,
						requestId: normalizedData.requestId,
					},
				});

				return {
					addition: ClassHourAdditionModel.fromPrisma(addition),
					totalHours: toHoursNumber(updatedClass.totalHours),
					remainingHours: await getRemainingHoursInTransaction(
						tx,
						id,
						updatedClass.totalHours,
					),
				};
			});
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2002"
			) {
				return this.getExistingHourAdditionResult(id, tutorId, normalizedData);
			}
			throw error;
		}
	}

	async findHourAdditions(
		id: string,
		tutorId: string,
		params?: PaginationParams,
	): Promise<PaginatedResponse<ClassHourAdditionModel>> {
		const classData = await this.prisma.class.findFirst({
			where: { id, tutorId },
			select: { id: true },
		});
		if (!classData) {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}

		const page = params?.page ?? 1;
		const limit = params?.limit ?? 20;
		const skip = (page - 1) * limit;
		const [total, additions] = await Promise.all([
			this.prisma.classHourAddition.count({ where: { classId: id } }),
			this.prisma.classHourAddition.findMany({
				where: { classId: id },
				skip,
				take: limit,
				orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			}),
		]);
		const totalPages = Math.ceil(total / limit);
		return {
			data: additions.map(ClassHourAdditionModel.fromPrisma),
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

	async delete(id: string, tutorId: string): Promise<ClassDeleteOutcome> {
		try {
			await this.prisma.class.delete({ where: { id, tutorId } });
			return "deleted";
		} catch (error) {
			if (
				error instanceof Prisma.PrismaClientKnownRequestError &&
				error.code === "P2025"
			) {
				return "not_found";
			}
			throw error;
		}
	}

	private async getExistingHourAdditionResult(
		id: string,
		tutorId: string,
		data: CreateClassHourAdditionDTO,
	): Promise<ClassHourAdditionResult> {
		const [classData, existing] = await Promise.all([
			this.prisma.class.findFirst({
				where: { id, tutorId },
				select: { totalHours: true },
			}),
			this.prisma.classHourAddition.findUnique({
				where: {
					classId_requestId: { classId: id, requestId: data.requestId },
				},
			}),
		]);
		if (!classData) {
			throw AppError.notFound("CLASS_NOT_FOUND", "Class not found");
		}
		if (!existing) {
			throw new Error(
				"Hour addition was not found after a unique constraint conflict",
			);
		}

		assertMatchingHourAddition(existing, data);
		return {
			addition: ClassHourAdditionModel.fromPrisma(existing),
			totalHours: toHoursNumber(classData.totalHours),
			remainingHours: await getRemainingHoursForClass(this.prisma, id),
		};
	}
}

export const classRepository = new ClassRepository();
