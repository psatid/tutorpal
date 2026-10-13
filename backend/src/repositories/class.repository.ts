import { Prisma, type PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "../lib/db";
import { AppError } from "../lib/error";
import { type ClassHourAdditionPlan, ClassModel } from "../models/class.model";
import { ClassHourAdditionModel } from "../models/class-hour-addition.model";
import { ClassHourBalance } from "../models/class-hour-balance.model";
import {
	type ClassDeleteOutcome,
	type ClassDetail,
	ClassHourAdditionPersistenceError,
	type ClassHourAdditionResult,
	type ClassHourAdditionTransaction,
	type ClassListParams,
	type CreateClassDTO,
	type IClassRepository,
	type UpdateClassDTO,
} from "../types/class.types";
import type {
	PaginatedResponse,
	PaginationParams,
} from "../types/pagination.types";
import {
	ACTIVE_SCHEDULE_STATUSES,
	getClassHourAccountingMap,
	getRemainingHoursForClass,
} from "./class-hours";

const classInclude = {
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

async function getRemainingHoursInTransaction(
	tx: Prisma.TransactionClient,
	classId: string,
	totalSeconds: bigint,
): Promise<number> {
	const reserved = await tx.schedule.aggregate({
		where: { classId, status: { in: ACTIVE_SCHEDULE_STATUSES } },
		_sum: { durationSeconds: true },
	});
	return ClassHourBalance.fromReservedSeconds({
		totalSeconds,
		reservedSeconds: reserved._sum.durationSeconds ?? 0n,
	}).remainingHours;
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
					totalSeconds: 0n,
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
		const sortBy =
			params?.sortBy === "totalHours"
				? "totalSeconds"
				: (params?.sortBy ?? "createdAt");
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
		return this.prisma.$transaction(
			async (tx) => {
				const [total, classes] = await Promise.all([
					tx.class.count({ where }),
					tx.class.findMany({
						where,
						skip,
						take: limit,
						orderBy: { [sortBy]: sortOrder },
						include: classInclude,
					}),
				]);
				const accounting = await getClassHourAccountingMap(
					tx,
					classes.map((item) => ({
						id: item.id,
						totalSeconds: item.totalSeconds,
					})),
				);
				const totalPages = Math.ceil(total / limit);
				return {
					data: classes.map((item) =>
						ClassModel.fromClassPrisma(item, accounting.get(item.id)),
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
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
		);
	}

	async findById(id: string, tutorId: string): Promise<ClassModel | null> {
		return this.prisma.$transaction(
			(tx) => this.findByIdWithAccounting(tx, id, tutorId),
			{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
		);
	}

	async findDetailById(
		id: string,
		tutorId: string,
	): Promise<ClassDetail | null> {
		return this.prisma.$transaction(
			async (tx) => {
				const classData = await this.findByIdWithAccounting(tx, id, tutorId);
				if (!classData) return null;

				const revenue = await tx.classHourAddition.aggregate({
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
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
		);
	}

	private async findByIdWithAccounting(
		tx: Prisma.TransactionClient,
		id: string,
		tutorId: string,
	): Promise<ClassModel | null> {
		const item = await tx.class.findFirst({
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
		const accounting = await getClassHourAccountingMap(tx, [
			{ id: item.id, totalSeconds: item.totalSeconds },
		]);
		return ClassModel.fromClassPrisma(item, accounting.get(item.id));
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

	withHourAdditionTransaction<T>(
		work: (transaction: ClassHourAdditionTransaction) => Promise<T>,
	): Promise<T> {
		let appliedPlan:
			| { tutorId: string; plan: ClassHourAdditionPlan }
			| undefined;

		return this.prisma
			.$transaction((tx) =>
				work({
					loadOwnedClass: async (classId, tutorId) => {
						const classData = await tx.class.findFirst({
							where: { id: classId, tutorId },
							include: classInclude,
						});
						return classData ? ClassModel.fromClassPrisma(classData) : null;
					},
					findByRequestId: async (classId, requestId) => {
						const addition = await tx.classHourAddition.findUnique({
							where: { classId_requestId: { classId, requestId } },
						});
						return addition
							? ClassHourAdditionModel.fromPrisma(addition)
							: null;
					},
					loadOwnedCourse: (courseId, tutorId) =>
						tx.course.findFirst({
							where: { id: courseId, tutorId },
							select: { id: true, name: true, defaultTotalSeconds: true },
						}),
					resultForExisting: (classData, addition) =>
						this.toHourAdditionResult(tx, classData.totalSeconds, addition),
					apply: async (tutorId, plan) => {
						appliedPlan = { tutorId, plan };
						return this.applyHourAdditionPlan(tx, tutorId, plan);
					},
				}),
			)
			.catch(async (error) => {
				if (
					error instanceof Prisma.PrismaClientKnownRequestError &&
					error.code === "P2002" &&
					appliedPlan
				) {
					return this.recoverConcurrentHourAddition(
						appliedPlan.tutorId,
						appliedPlan.plan,
					) as Promise<T>;
				}
				throw error;
			});
	}

	private async applyHourAdditionPlan(
		tx: Prisma.TransactionClient,
		tutorId: string,
		plan: ClassHourAdditionPlan,
	): Promise<ClassHourAdditionResult> {
		const updateResult = await tx.class.updateMany({
			where: {
				id: plan.classId,
				tutorId,
				totalSeconds: { lte: plan.maximumCurrentTotalSeconds },
			},
			data: { totalSeconds: { increment: plan.incrementSeconds } },
		});
		if (updateResult.count !== 1) {
			const [currentClass, concurrentAddition] = await Promise.all([
				tx.class.findFirst({
					where: { id: plan.classId, tutorId },
					select: { totalSeconds: true },
				}),
				tx.classHourAddition.findUnique({
					where: {
						classId_requestId: {
							classId: plan.classId,
							requestId: plan.draft.requestId,
						},
					},
				}),
			]);
			if (!currentClass) {
				throw new ClassHourAdditionPersistenceError(
					"class_not_found",
					"Class not found",
				);
			}
			if (concurrentAddition) {
				const addition = ClassHourAdditionModel.fromPrisma(concurrentAddition);
				plan.request.assertMatches(addition);
				return this.toHourAdditionResult(
					tx,
					currentClass.totalSeconds,
					addition,
				);
			}
			throw new ClassHourAdditionPersistenceError(
				"limit_exceeded",
				"Adding these hours would exceed the class total hour limit",
			);
		}

		const updatedClass = await tx.class.findUnique({
			where: { id: plan.classId },
			select: { totalSeconds: true },
		});
		if (!updatedClass) {
			throw new ClassHourAdditionPersistenceError(
				"class_not_found",
				"Class not found",
			);
		}

		const addition = await tx.classHourAddition.create({
			data: {
				classId: plan.classId,
				source: plan.draft.source === "course" ? "COURSE" : "CUSTOM",
				secondsAdded: plan.draft.secondsAdded,
				revenueAmount: plan.draft.revenueAmount,
				sourceCourseId: plan.draft.sourceCourseId,
				sourceCourseName: plan.draft.sourceCourseName,
				requestId: plan.draft.requestId,
			},
		});

		return this.toHourAdditionResult(
			tx,
			updatedClass.totalSeconds,
			ClassHourAdditionModel.fromPrisma(addition),
		);
	}

	private async toHourAdditionResult(
		tx: Prisma.TransactionClient,
		totalSeconds: bigint,
		addition: ClassHourAdditionModel,
	): Promise<ClassHourAdditionResult> {
		return {
			addition,
			totalHours: ClassHourBalance.fromSeconds({ totalSeconds }).totalHours,
			remainingHours: await getRemainingHoursInTransaction(
				tx,
				addition.classId,
				totalSeconds,
			),
		};
	}

	private async recoverConcurrentHourAddition(
		tutorId: string,
		plan: ClassHourAdditionPlan,
	): Promise<ClassHourAdditionResult> {
		const [classData, existing] = await Promise.all([
			this.prisma.class.findFirst({
				where: { id: plan.classId, tutorId },
				select: { totalSeconds: true },
			}),
			this.prisma.classHourAddition.findUnique({
				where: {
					classId_requestId: {
						classId: plan.classId,
						requestId: plan.draft.requestId,
					},
				},
			}),
		]);
		if (!classData) {
			throw new ClassHourAdditionPersistenceError(
				"class_not_found",
				"Class not found",
			);
		}
		if (!existing) {
			throw new Error(
				"Hour addition was not found after a unique constraint conflict",
			);
		}

		const addition = ClassHourAdditionModel.fromPrisma(existing);
		plan.request.assertMatches(addition);
		return {
			addition,
			totalHours: ClassHourBalance.fromSeconds({
				totalSeconds: classData.totalSeconds,
			}).totalHours,
			remainingHours: await getRemainingHoursForClass(
				this.prisma,
				plan.classId,
			),
		};
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
}

export const classRepository = new ClassRepository();
