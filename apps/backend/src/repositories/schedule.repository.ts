import {
	Prisma,
	type PrismaClient,
	type ScheduleStatus,
	type ScheduleType,
} from "@prisma/client";
import { DateTime } from "../lib/date-time";
import { prisma as defaultPrisma } from "../lib/db";
import { minutesToSeconds } from "../lib/teaching-time";
import {
	RecurringScheduleModel,
	RecurringScheduleUpdateResultModel,
	ScheduleModel,
} from "../models/schedule.model";
import type {
	AwaitingConfirmationAfter,
	AwaitingConfirmationRepositoryPage,
	CreateScheduleDTO,
	IScheduleRepository,
	RecurringScheduleTransaction,
	ScheduleLifecycleTransaction,
	ScheduleListQueryDTO,
	UpdateScheduleDTO,
} from "../types";
import { ScheduleLifecyclePersistenceError } from "../types/schedule.types";
import {
	getRemainingHoursForClass,
	getRemainingHoursMap,
	getRemainingSecondsForClass,
} from "./class-hours";

const classContextInclude = {} as const;

type AwaitingConfirmationScheduleRow = {
	id: string;
	classId: string;
	recurringScheduleId: string | null;
	date: Date;
	time: number;
	durationSeconds: bigint;
	notes: string | null;
	noShowNote: string | null;
	status: ScheduleStatus;
	type: ScheduleType;
	createdAt: Date;
	updatedAt: Date;
	className: string;
};

type AwaitingConfirmationCountRow = {
	total: bigint;
};

function toSafeAwaitingConfirmationTotal(total: bigint): number {
	if (total < 0n || total > BigInt(Number.MAX_SAFE_INTEGER)) {
		throw new RangeError(
			"Awaiting-confirmation total cannot be represented safely as a number",
		);
	}

	return Number(total);
}

export class ScheduleRepository implements IScheduleRepository {
	constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

	async create(data: CreateScheduleDTO): Promise<ScheduleModel> {
		if (data.time === undefined || data.durationMinutes === undefined) {
			throw new Error("Time and duration are required");
		}

		const time = data.time;
		const durationSeconds = minutesToSeconds(data.durationMinutes);

		const scheduleId = await this.prisma.$transaction(async (tx) => {
			const createdSchedule = await tx.schedule.create({
				data: {
					classId: data.classId,
					date: DateTime.fromDateOnlyString(data.date).toDate(),
					time,
					durationSeconds,
					notes: data.notes || null,
					status: "SCHEDULED",
					type: data.type,
				},
				include: {
					class: { include: classContextInclude },
				},
			});

			return createdSchedule.id;
		});

		const schedule = await this.prisma.schedule.findUnique({
			where: { id: scheduleId },
			include: {
				class: { include: classContextInclude },
			},
		});

		if (!schedule) {
			throw new Error("Schedule not found after creation");
		}

		const remainingHours = await this.getRemainingHours(schedule.classId);
		return ScheduleModel.fromSchedulePrisma(schedule, remainingHours);
	}

	async createMany(
		data: Array<{
			classId: string;
			date: string;
			type: ScheduleType;
			time: number;
			durationMinutes: number;
		}>,
	): Promise<ScheduleModel[]> {
		if (data.length === 0) {
			return [];
		}

		await this.prisma.schedule.createMany({
			data: data.map((item) => ({
				classId: item.classId,
				date: DateTime.fromDateOnlyString(item.date).toDate(),
				time: item.time,
				durationSeconds: minutesToSeconds(item.durationMinutes),
				notes: null,
				status: "SCHEDULED",
				type: item.type,
			})),
		});

		const dateStrings = data.map((d) => d.date);
		const firstClassId = data[0]?.classId;
		if (!firstClassId) {
			return [];
		}

		const createdSchedules = await this.prisma.schedule.findMany({
			where: {
				classId: firstClassId,
				date: {
					in: dateStrings.map((date) =>
						DateTime.fromDateOnlyString(date).toDate(),
					),
				},
			},
			include: { class: { include: classContextInclude } },
			orderBy: [{ date: "asc" }, { time: "asc" }],
		});

		const remainingHours = await this.getRemainingHours(firstClassId);

		return createdSchedules.map((schedule) =>
			ScheduleModel.fromSchedulePrisma(schedule, remainingHours),
		);
	}

	async findAll(
		tutorId: string,
		query?: ScheduleListQueryDTO,
	): Promise<ScheduleModel[]> {
		const where: Prisma.ScheduleWhereInput = {
			class: {
				tutorId,
			},
		};

		if (query?.date) {
			where.date = DateTime.fromDateOnlyString(query.date).toDate();
		} else if (query?.startDate && query.endDate) {
			where.date = {
				gte: DateTime.fromDateOnlyString(query.startDate).toDate(),
				lte: DateTime.fromDateOnlyString(query.endDate).toDate(),
			};
		}

		if (query?.classId) {
			where.classId = query.classId;
		}

		if (query?.search) {
			where.class = {
				tutorId,
				OR: [
					{ name: { contains: query.search, mode: "insensitive" } },
					{
						students: {
							some: {
								student: {
									name: { contains: query.search, mode: "insensitive" },
								},
							},
						},
					},
				],
			};
		}

		const schedules = await this.prisma.schedule.findMany({
			where,
			orderBy: [{ date: "asc" }, { time: "asc" }],
			include: {
				class: { include: classContextInclude },
			},
		});

		const remainingHoursMap = await getRemainingHoursMap(
			this.prisma,
			schedules.map((schedule) => schedule.classId),
		);

		return schedules.map((schedule) =>
			ScheduleModel.fromSchedulePrisma(
				schedule,
				remainingHoursMap.get(schedule.classId),
			),
		);
	}

	async findAwaitingConfirmationPage(
		tutorId: string,
		input: {
			asOf: DateTime;
			after?: AwaitingConfirmationAfter;
			limit: number;
		},
	): Promise<AwaitingConfirmationRepositoryPage> {
		const eligibilityPredicate = Prisma.sql`
			class_record."tutorId" = ${tutorId}
			AND schedule.status = 'SCHEDULED'
			AND (
				(
					schedule.date::timestamp
					+ schedule.time * INTERVAL '1 minute'
					+ schedule."durationSeconds" * INTERVAL '1 second'
				) AT TIME ZONE 'Asia/Bangkok'
			) <= ${input.asOf.toDate()}
		`;
		const afterPredicate = input.after
			? Prisma.sql`
				AND (
					schedule.date > ${input.after.date}::date
					OR (schedule.date = ${input.after.date}::date AND schedule.time > ${input.after.time})
					OR (
						schedule.date = ${input.after.date}::date
						AND schedule.time = ${input.after.time}
						AND schedule.id > ${input.after.id}
					)
				)
			`
			: Prisma.empty;

		return this.prisma.$transaction(
			async (tx) => {
				const countRows = await tx.$queryRaw<AwaitingConfirmationCountRow[]>`
					SELECT COUNT(*) AS total
					FROM schedules AS schedule
					INNER JOIN classes AS class_record
						ON class_record.id = schedule."classId"
					WHERE ${eligibilityPredicate}
				`;
				const total = countRows[0]?.total;
				if (total === undefined) {
					throw new Error("Awaiting-confirmation count query returned no row");
				}

				const rows = await tx.$queryRaw<AwaitingConfirmationScheduleRow[]>`
					SELECT
						schedule.id,
						schedule."classId",
						schedule."recurringScheduleId",
						schedule.date,
						schedule.time,
						schedule."durationSeconds",
						schedule.notes,
						schedule."noShowNote",
						schedule.status,
						schedule.type,
						schedule."createdAt",
						schedule."updatedAt",
						class_record.name AS "className"
					FROM schedules AS schedule
					INNER JOIN classes AS class_record
						ON class_record.id = schedule."classId"
					WHERE ${eligibilityPredicate}
						${afterPredicate}
					ORDER BY schedule.date ASC, schedule.time ASC, schedule.id ASC
					LIMIT ${input.limit + 1}
				`;
				const hasNext = rows.length > input.limit;
				const data = rows.slice(0, input.limit).map((row) =>
					ScheduleModel.fromSchedulePrisma({
						...row,
						class: { name: row.className },
					}),
				);
				const lastSchedule = data[data.length - 1];

				return {
					data,
					total: toSafeAwaitingConfirmationTotal(total),
					hasNext,
					nextAfter:
						hasNext && lastSchedule
							? {
									date: DateTime.from(lastSchedule.date).toDateOnlyString(),
									time: lastSchedule.time,
									id: lastSchedule.id,
								}
							: undefined,
				};
			},
			{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
		);
	}

	async findById(id: string, tutorId?: string): Promise<ScheduleModel | null> {
		const schedule = await this.prisma.schedule.findFirst({
			where: { id, ...(tutorId && { class: { tutorId } }) },
			include: {
				class: { include: classContextInclude },
			},
		});

		if (!schedule) {
			return null;
		}

		const remainingHours = await this.getRemainingHours(schedule.classId);
		return ScheduleModel.fromSchedulePrisma(schedule, remainingHours);
	}

	async update(id: string, data: UpdateScheduleDTO): Promise<ScheduleModel> {
		const schedule = await this.prisma.$transaction(async (tx) => {
			const updatedSchedule = await tx.schedule.update({
				where: { id },
				data: {
					...(data.classId !== undefined && { classId: data.classId }),
					...(data.date !== undefined && {
						date: DateTime.fromDateOnlyString(data.date).toDate(),
					}),
					...(data.time !== undefined && { time: data.time }),
					...(data.durationMinutes !== undefined && {
						durationSeconds: minutesToSeconds(data.durationMinutes),
					}),
					...(data.type !== undefined && { type: data.type }),
					...(data.notes !== undefined && { notes: data.notes || null }),
				},
				include: {
					class: { include: classContextInclude },
				},
			});

			if (ScheduleModel.isRestorableStatus(updatedSchedule.status)) {
				await tx.classHourDeduction.upsert({
					where: { scheduleId: updatedSchedule.id },
					update: {
						classId: updatedSchedule.classId,
						secondsDeducted: updatedSchedule.durationSeconds,
						restoredAt: null,
					},
					create: {
						scheduleId: updatedSchedule.id,
						classId: updatedSchedule.classId,
						secondsDeducted: updatedSchedule.durationSeconds,
					},
				});
			}

			return updatedSchedule;
		});

		const remainingHours = await this.getRemainingHours(schedule.classId);
		return ScheduleModel.fromSchedulePrisma(schedule, remainingHours);
	}

	async delete(id: string): Promise<void> {
		await this.prisma.schedule.delete({
			where: { id },
		});
	}

	withLifecycleTransaction<T>(
		work: (transaction: ScheduleLifecycleTransaction) => Promise<T>,
	): Promise<T> {
		return this.prisma.$transaction((tx) =>
			work({
				loadOwned: async (scheduleId, tutorId) => {
					const schedule = await tx.schedule.findFirst({
						where: { id: scheduleId, class: { tutorId } },
						include: { class: { include: classContextInclude } },
					});
					return schedule ? ScheduleModel.fromSchedulePrisma(schedule) : null;
				},
				apply: async (tutorId, plan) => {
					const transition = await tx.schedule.updateMany({
						where: {
							id: plan.expected.id,
							classId: plan.expected.classId,
							durationSeconds: plan.expected.durationSeconds,
							status: plan.expected.status,
							class: { tutorId },
						},
						data: plan.patch,
					});
					if (transition.count !== 1) {
						const ownedSchedule = await tx.schedule.findFirst({
							where: {
								id: plan.expected.id,
								class: { tutorId },
							},
							select: { id: true },
						});
						if (!ownedSchedule) {
							throw new ScheduleLifecyclePersistenceError(
								"not_found",
								"Schedule not found",
							);
						}
						throw new ScheduleLifecyclePersistenceError(
							"stale",
							"The schedule status changed before this action",
						);
					}

					if (plan.deduction.kind === "upsert") {
						await tx.classHourDeduction.upsert({
							where: { scheduleId: plan.expected.id },
							update: {
								classId: plan.deduction.classId,
								secondsDeducted: plan.deduction.seconds,
								restoredAt: null,
							},
							create: {
								scheduleId: plan.expected.id,
								classId: plan.deduction.classId,
								secondsDeducted: plan.deduction.seconds,
							},
						});
					} else if (plan.deduction.kind === "restore") {
						const deduction = await tx.classHourDeduction.updateMany({
							where: {
								scheduleId: plan.expected.id,
								classId: plan.deduction.classId,
								restoredAt: null,
							},
							data: { restoredAt: DateTime.now().toDate() },
						});
						if (deduction.count !== 1) {
							throw new ScheduleLifecyclePersistenceError(
								"active_deduction_missing",
								"The schedule no longer has an active hour deduction",
							);
						}
					}

					const schedule = await tx.schedule.findFirst({
						where: {
							id: plan.expected.id,
							class: { tutorId },
						},
						include: { class: { include: classContextInclude } },
					});
					if (!schedule) {
						throw new ScheduleLifecyclePersistenceError(
							"not_found",
							"Schedule not found",
						);
					}

					const remainingHours = await getRemainingHoursForClass(
						tx,
						schedule.classId,
					);
					return ScheduleModel.fromSchedulePrisma(schedule, remainingHours);
				},
			}),
		);
	}

	withRecurringScheduleTransaction<T>(
		work: (transaction: RecurringScheduleTransaction) => Promise<T>,
	): Promise<T> {
		return this.prisma.$transaction((tx) =>
			work({
				loadCreateContext: async (classId, tutorId) => {
					const classData = await tx.class.findFirst({
						where: { id: classId, tutorId },
						select: { id: true },
					});
					if (!classData) {
						return null;
					}

					return Object.freeze({
						classId: classData.id,
						remainingSeconds: await getRemainingSecondsForClass(
							tx,
							classData.id,
						),
					});
				},
				loadUpdateContext: async (
					recurringScheduleId,
					tutorId,
					effectiveDate,
				) => {
					const recurringSchedule = await tx.recurringSchedule.findFirst({
						where: {
							id: recurringScheduleId,
							class: { tutorId },
						},
						select: {
							id: true,
							classId: true,
							startDate: true,
							notes: true,
							type: true,
							scheduleItems: {
								select: {
									weekday: true,
									time: true,
									durationSeconds: true,
								},
							},
						},
					});
					if (!recurringSchedule) {
						return null;
					}

					const [remainingSeconds, replaceableSchedules] = await Promise.all([
						getRemainingSecondsForClass(tx, recurringSchedule.classId),
						tx.schedule.findMany({
							where: {
								classId: recurringSchedule.classId,
								date: {
									gte: DateTime.fromDateOnlyString(effectiveDate).toDate(),
								},
							},
							select: {
								id: true,
								date: true,
								time: true,
								durationSeconds: true,
								status: true,
								recurringScheduleId: true,
							},
						}),
					]);

					return Object.freeze({
						existingSeries: Object.freeze({
							id: recurringSchedule.id,
							classId: recurringSchedule.classId,
							startDate: DateTime.from(
								recurringSchedule.startDate,
							).toDateOnlyString(),
							notes: recurringSchedule.notes,
							type: recurringSchedule.type,
							scheduleItems: Object.freeze(
								recurringSchedule.scheduleItems.map((item) =>
									Object.freeze({ ...item }),
								),
							),
						}),
						remainingSeconds,
						replaceableSchedules: Object.freeze(
							replaceableSchedules.map((schedule) =>
								Object.freeze({
									...schedule,
									date: DateTime.from(schedule.date).toDateOnlyString(),
								}),
							),
						),
					});
				},
				loadExistingSchedules: async (classId, dates) => {
					const uniqueDates = [...new Set(dates)];
					if (uniqueDates.length === 0) {
						return [];
					}

					const schedules = await tx.schedule.findMany({
						where: {
							classId,
							date: {
								in: uniqueDates.map((date) =>
									DateTime.fromDateOnlyString(date).toDate(),
								),
							},
						},
						select: {
							id: true,
							date: true,
							time: true,
							durationSeconds: true,
							status: true,
						},
					});

					return Object.freeze(
						schedules.map((schedule) =>
							Object.freeze({
								...schedule,
								date: DateTime.from(schedule.date).toDateOnlyString(),
							}),
						),
					);
				},
				applyCreate: async (plan) => {
					const recurringSchedule = await tx.recurringSchedule.create({
						data: {
							classId: plan.series.classId,
							startDate: DateTime.fromDateOnlyString(
								plan.series.startDate,
							).toDate(),
							notes: plan.series.notes,
							type: plan.series.type,
						},
						select: { id: true },
					});
					await tx.recurringScheduleItem.createMany({
						data: plan.series.scheduleItems.map((item) => ({
							recurringScheduleId: recurringSchedule.id,
							weekday: item.weekday,
							time: item.time,
							durationSeconds: item.durationSeconds,
						})),
					});
					await tx.schedule.createMany({
						data: plan.generatedSchedules.map((schedule) => ({
							classId: plan.series.classId,
							recurringScheduleId: recurringSchedule.id,
							date: DateTime.fromDateOnlyString(schedule.date).toDate(),
							time: schedule.time,
							durationSeconds: schedule.durationSeconds,
							notes: plan.series.notes,
							status: "SCHEDULED",
							type: schedule.type,
						})),
					});

					const schedules = await tx.schedule.findMany({
						where: {
							classId: plan.series.classId,
							date: {
								in: plan.generatedSchedules.map((schedule) =>
									DateTime.fromDateOnlyString(schedule.date).toDate(),
								),
							},
						},
						include: { class: { include: classContextInclude } },
						orderBy: [{ date: "asc" }, { time: "asc" }],
					});
					const firstSchedule = schedules[0];
					if (!firstSchedule) {
						throw new Error("No schedules were created");
					}

					const remainingHours = await getRemainingHoursForClass(
						tx,
						plan.series.classId,
					);
					return ScheduleModel.fromSchedulePrisma(
						firstSchedule,
						remainingHours,
					);
				},
				applyUpdate: async (plan) => {
					if (plan.replacementScheduleIds.length > 0) {
						await tx.schedule.deleteMany({
							where: {
								id: { in: [...plan.replacementScheduleIds] },
								classId: plan.series.classId,
							},
						});
					}

					const recurringSchedule = await tx.recurringSchedule.create({
						data: {
							classId: plan.series.classId,
							startDate: DateTime.fromDateOnlyString(
								plan.series.startDate,
							).toDate(),
							notes: plan.series.notes,
							type: plan.series.type,
						},
						select: { id: true },
					});
					await tx.recurringScheduleItem.createMany({
						data: plan.series.scheduleItems.map((item) => ({
							recurringScheduleId: recurringSchedule.id,
							weekday: item.weekday,
							time: item.time,
							durationSeconds: item.durationSeconds,
						})),
					});
					await tx.schedule.createMany({
						data: plan.generatedSchedules.map((schedule) => ({
							classId: plan.series.classId,
							recurringScheduleId: recurringSchedule.id,
							date: DateTime.fromDateOnlyString(schedule.date).toDate(),
							time: schedule.time,
							durationSeconds: schedule.durationSeconds,
							notes: plan.series.notes,
							status: "SCHEDULED",
							type: schedule.type,
						})),
					});

					const recurringScheduleWithItems =
						await tx.recurringSchedule.findUnique({
							where: { id: recurringSchedule.id },
							include: {
								class: { include: classContextInclude },
								scheduleItems: {
									orderBy: [{ weekday: "asc" }, { time: "asc" }],
								},
							},
						});
					if (!recurringScheduleWithItems) {
						throw new Error("Recurring schedule not found after update");
					}

					return new RecurringScheduleUpdateResultModel({
						recurringSchedule:
							RecurringScheduleModel.fromRecurringSchedulePrisma(
								recurringScheduleWithItems,
							),
						effectiveDate: plan.effectiveDate,
						deletedSchedulesCount: plan.replacementScheduleIds.length,
						createdSchedulesCount: plan.generatedSchedules.length,
					});
				},
			}),
		);
	}

	async getRemainingSeconds(classId: string): Promise<bigint> {
		return getRemainingSecondsForClass(this.prisma, classId);
	}

	async getRemainingHours(classId: string): Promise<number> {
		return getRemainingHoursForClass(this.prisma, classId);
	}
}

export const scheduleRepository = new ScheduleRepository();
