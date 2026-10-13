import type {
	Prisma,
	PrismaClient,
	ScheduleStatus,
	ScheduleType,
	Weekday,
} from "@prisma/client";
import { DateTime } from "../lib/date-time";
import { prisma as defaultPrisma } from "../lib/db";
import { AppError } from "../lib/error";
import { minutesToSeconds } from "../lib/teaching-time";
import { ClassHourBalance } from "../models/class-hour-balance.model";
import {
	RecurringScheduleModel,
	RecurringScheduleUpdateResultModel,
	ScheduleModel,
} from "../models/schedule.model";
import type {
	CreateScheduleDTO,
	IScheduleRepository,
	RecurringScheduleCreationData,
	ScheduleLifecycleTransaction,
	ScheduleListQueryDTO,
	UpdateRecurringScheduleDTO,
	UpdateScheduleDTO,
} from "../types";
import { ScheduleLifecyclePersistenceError } from "../types/schedule.types";
import {
	ACTIVE_SCHEDULE_STATUSES,
	getRemainingHoursForClass,
	getRemainingHoursMap,
	getRemainingSecondsForClass,
} from "./class-hours";

const RECURRING_REPLACEABLE_STATUSES: ScheduleStatus[] = [
	"SCHEDULED",
	"CANCELLED",
];

const classContextInclude = {} as const;

type GeneratedScheduleData = {
	classId: string;
	date: string;
	type: ScheduleType;
	time: number;
	durationSeconds: bigint;
};

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

	async getRemainingSeconds(classId: string): Promise<bigint> {
		return getRemainingSecondsForClass(this.prisma, classId);
	}

	async getRemainingHours(classId: string): Promise<number> {
		return getRemainingHoursForClass(this.prisma, classId);
	}

	async createRecurringSchedule(
		data: RecurringScheduleCreationData,
	): Promise<ScheduleModel> {
		const remainingSeconds = await this.getRemainingSeconds(data.classId);
		const scheduleData = this.generateScheduleData(
			data.classId,
			data.recurring.startDate,
			data.recurring.scheduleItems,
			data.type,
			remainingSeconds,
		);

		if (scheduleData.length < 1) {
			throw AppError.badRequest(
				"INSUFFICIENT_HOURS",
				"The class does not have enough remaining hours to create any schedule",
			);
		}

		const result = await this.prisma.$transaction(async (tx) => {
			const recurringSchedule = await tx.recurringSchedule.create({
				data: {
					classId: data.classId,
					startDate: DateTime.fromDateOnlyString(
						data.recurring.startDate,
					).toDate(),
					notes: data.notes || null,
					type: data.type,
				},
				include: { class: { include: classContextInclude } },
			});

			await tx.recurringScheduleItem.createMany({
				data: data.recurring.scheduleItems.map((item) => ({
					recurringScheduleId: recurringSchedule.id,
					weekday: item.weekday,
					time: item.time,
					durationSeconds: minutesToSeconds(item.durationMinutes),
				})),
			});

			if (scheduleData.length > 0) {
				await this.assertNoRecurringConflicts(tx, data.classId, scheduleData);

				await tx.schedule.createMany({
					data: scheduleData.map((item) => ({
						classId: data.classId,
						recurringScheduleId: recurringSchedule.id,
						date: DateTime.fromDateOnlyString(item.date).toDate(),
						time: item.time,
						durationSeconds: item.durationSeconds,
						notes: data.notes || null,
						status: "SCHEDULED",
						type: item.type,
					})),
				});
			}

			const createdSchedules = await tx.schedule.findMany({
				where: {
					classId: data.classId,
					date: {
						in: scheduleData.map((item) =>
							DateTime.fromDateOnlyString(item.date).toDate(),
						),
					},
				},
				include: { class: { include: classContextInclude } },
				orderBy: [{ date: "asc" }, { time: "asc" }],
			});

			return { schedules: createdSchedules };
		});

		const finalRemainingHours = await this.getRemainingHours(data.classId);

		const firstSchedule = result.schedules[0];
		if (!firstSchedule) {
			throw new Error("No schedules were created");
		}

		return ScheduleModel.fromSchedulePrisma(firstSchedule, finalRemainingHours);
	}

	async findRecurringScheduleById(
		recurringScheduleId: string,
		tutorId: string,
	): Promise<RecurringScheduleModel | null> {
		const recurringSchedule = await this.prisma.recurringSchedule.findFirst({
			where: {
				id: recurringScheduleId,
				class: {
					tutorId,
				},
			},
			include: {
				class: { include: classContextInclude },
				scheduleItems: true,
			},
		});

		if (!recurringSchedule) {
			return null;
		}

		return RecurringScheduleModel.fromRecurringSchedulePrisma(
			recurringSchedule,
		);
	}

	async updateRecurringSchedule(
		recurringScheduleId: string,
		data: UpdateRecurringScheduleDTO,
		tutorId: string,
	): Promise<RecurringScheduleUpdateResultModel> {
		const existingRecurringSchedule =
			await this.prisma.recurringSchedule.findFirst({
				where: {
					id: recurringScheduleId,
					class: {
						tutorId,
					},
				},
				include: {
					class: { include: classContextInclude },
					scheduleItems: true,
				},
			});

		if (!existingRecurringSchedule) {
			throw AppError.notFound(
				"RECURRING_SCHEDULE_NOT_FOUND",
				"Recurring schedule not found",
			);
		}

		return this.prisma.$transaction(async (tx) => {
			const candidateSchedules = await tx.schedule.findMany({
				where: {
					classId: existingRecurringSchedule.classId,
					date: {
						gte: DateTime.fromDateOnlyString(data.effectiveDate).toDate(),
					},
					status: {
						in: RECURRING_REPLACEABLE_STATUSES,
					},
				},
				select: {
					id: true,
					date: true,
					time: true,
					durationSeconds: true,
					recurringScheduleId: true,
				},
			});
			const schedulesToReplace = candidateSchedules.filter((schedule) =>
				this.matchesRecurringScheduleItem(schedule, existingRecurringSchedule),
			);

			if (schedulesToReplace.length > 0) {
				await tx.schedule.deleteMany({
					where: {
						id: {
							in: schedulesToReplace.map((schedule) => schedule.id),
						},
					},
				});
			}

			const remainingSeconds = await this.getRemainingSecondsInTransaction(
				tx,
				existingRecurringSchedule.classId,
			);
			const recurringType = data.type ?? existingRecurringSchedule.type;
			const scheduleData = this.generateScheduleData(
				existingRecurringSchedule.classId,
				data.effectiveDate,
				data.scheduleItems,
				recurringType,
				remainingSeconds,
			);

			if (scheduleData.length < 1) {
				throw AppError.badRequest(
					"INSUFFICIENT_HOURS",
					"The class does not have enough remaining hours to recreate any recurring schedule",
				);
			}

			await this.assertNoRecurringConflicts(
				tx,
				existingRecurringSchedule.classId,
				scheduleData,
			);

			const newRecurringSchedule = await tx.recurringSchedule.create({
				data: {
					classId: existingRecurringSchedule.classId,
					startDate: DateTime.fromDateOnlyString(data.effectiveDate).toDate(),
					notes: data.notes ?? existingRecurringSchedule.notes,
					type: recurringType,
				},
				include: {
					class: { include: classContextInclude },
				},
			});

			await tx.recurringScheduleItem.createMany({
				data: data.scheduleItems.map((item) => ({
					recurringScheduleId: newRecurringSchedule.id,
					weekday: item.weekday,
					time: item.time,
					durationSeconds: minutesToSeconds(item.durationMinutes),
				})),
			});

			await tx.schedule.createMany({
				data: scheduleData.map((item) => ({
					classId: existingRecurringSchedule.classId,
					recurringScheduleId: newRecurringSchedule.id,
					date: DateTime.fromDateOnlyString(item.date).toDate(),
					time: item.time,
					durationSeconds: item.durationSeconds,
					notes: data.notes ?? existingRecurringSchedule.notes,
					status: "SCHEDULED",
					type: item.type,
				})),
			});

			const recurringScheduleWithItems = await tx.recurringSchedule.findUnique({
				where: {
					id: newRecurringSchedule.id,
				},
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
				recurringSchedule: RecurringScheduleModel.fromRecurringSchedulePrisma(
					recurringScheduleWithItems,
				),
				effectiveDate: data.effectiveDate,
				deletedSchedulesCount: schedulesToReplace.length,
				createdSchedulesCount: scheduleData.length,
			});
		});
	}

	private generateScheduleData(
		classId: string,
		startDate: string,
		items: Array<{ weekday: Weekday; time: number; durationMinutes: number }>,
		type: ScheduleType,
		remainingSeconds: bigint,
	): GeneratedScheduleData[] {
		const scheduleData: GeneratedScheduleData[] = [];
		let currentDate = DateTime.fromDateOnlyString(startDate);
		let availableSeconds = remainingSeconds > 0n ? remainingSeconds : 0n;

		if (items.length === 0) {
			return scheduleData;
		}

		while (availableSeconds > 0n) {
			const itemsForDate = items
				.filter(
					(item) =>
						this.getNextDateForWeekday(currentDate, item.weekday).compareAsc(
							currentDate,
						) === 0,
				)
				.sort((a, b) => a.time - b.time);

			for (const item of itemsForDate) {
				const durationSeconds = minutesToSeconds(item.durationMinutes);
				if (durationSeconds > availableSeconds) {
					return scheduleData;
				}

				scheduleData.push({
					classId,
					date: currentDate.toDateOnlyString(),
					type,
					time: item.time,
					durationSeconds,
				});

				availableSeconds -= durationSeconds;
			}

			currentDate = currentDate.addDays(1);
		}

		return scheduleData;
	}

	private getNextDateForWeekday(
		startDate: DateTime,
		weekday: Weekday,
	): DateTime {
		const weekdayMap: Record<Weekday, number> = {
			MONDAY: 1,
			TUESDAY: 2,
			WEDNESDAY: 3,
			THURSDAY: 4,
			FRIDAY: 5,
			SATURDAY: 6,
			SUNDAY: 0,
		};

		const targetDay = weekdayMap[weekday];
		const currentDay = startDate.getWeekdayIndex();

		const daysUntilTarget = (targetDay - currentDay + 7) % 7;
		return startDate.addDays(daysUntilTarget);
	}

	private async assertNoRecurringConflicts(
		tx: Prisma.TransactionClient,
		classId: string,
		scheduleData: GeneratedScheduleData[],
	): Promise<void> {
		if (scheduleData.length === 0) {
			return;
		}

		const uniqueDates = [...new Set(scheduleData.map((item) => item.date))];
		const existingSchedules = await tx.schedule.findMany({
			where: {
				classId,
				date: {
					in: uniqueDates.map((date) =>
						DateTime.fromDateOnlyString(date).toDate(),
					),
				},
				status: {
					in: ACTIVE_SCHEDULE_STATUSES,
				},
			},
			select: {
				date: true,
				time: true,
				durationSeconds: true,
			},
		});

		const groupedGeneratedSchedules = scheduleData.reduce<
			Record<string, Array<{ time: number; durationSeconds: bigint }>>
		>((groups, item) => {
			const group = groups[item.date] ?? [];
			group.push({
				time: item.time,
				durationSeconds: item.durationSeconds,
			});
			groups[item.date] = group;
			return groups;
		}, {});

		const conflictDates = new Set<string>();

		for (const [date, generatedSchedules] of Object.entries(
			groupedGeneratedSchedules,
		)) {
			const existingForDate = existingSchedules.filter(
				(schedule) => DateTime.from(schedule.date).toDateOnlyString() === date,
			);

			const allSchedules = [
				...generatedSchedules.map((item) => ({ ...item, source: "generated" })),
				...existingForDate.map((item) => ({
					time: item.time,
					durationSeconds: item.durationSeconds,
					source: "existing",
				})),
			].sort((a, b) => a.time - b.time);

			for (let index = 0; index < allSchedules.length; index += 1) {
				const current = allSchedules[index];
				if (!current) {
					continue;
				}

				for (
					let nextIndex = index + 1;
					nextIndex < allSchedules.length;
					nextIndex += 1
				) {
					const next = allSchedules[nextIndex];
					if (!next) {
						continue;
					}

					if (
						BigInt(next.time) * 60n >=
						BigInt(current.time) * 60n + current.durationSeconds
					) {
						break;
					}

					if (
						current.source !== next.source ||
						current.source === "generated"
					) {
						conflictDates.add(date);
					}
				}
			}
		}

		if (conflictDates.size > 0) {
			const orderedDates = [...conflictDates].sort().join(", ");
			throw AppError.badRequest(
				"RECURRING_CONFLICT",
				`Recurring schedule conflicts with existing schedules on ${orderedDates}`,
			);
		}
	}

	private async getRemainingSecondsInTransaction(
		tx: Prisma.TransactionClient,
		classId: string,
	): Promise<bigint> {
		const classData = await tx.class.findUnique({
			where: { id: classId },
			select: {
				totalSeconds: true,
				schedules: {
					where: {
						status: {
							in: ACTIVE_SCHEDULE_STATUSES,
						},
					},
					select: {
						durationSeconds: true,
					},
				},
			},
		});

		if (!classData) {
			throw AppError.badRequest(
				"CLASS_NOT_FOUND",
				"The specified class does not exist",
			);
		}

		const reservedSeconds = classData.schedules.reduce(
			(total, schedule) => total + schedule.durationSeconds,
			0n,
		);

		return ClassHourBalance.fromReservedSeconds({
			totalSeconds: classData.totalSeconds,
			reservedSeconds,
		}).remainingSeconds;
	}

	private matchesRecurringScheduleItem(
		schedule: {
			date: Date;
			time: number;
			durationSeconds: bigint;
			recurringScheduleId: string | null;
		},
		recurringSchedule: {
			id: string;
			startDate: Date;
			scheduleItems: Array<{
				weekday: Weekday;
				time: number;
				durationSeconds: bigint;
			}>;
		},
	): boolean {
		if (schedule.recurringScheduleId === recurringSchedule.id) {
			return true;
		}

		if (schedule.recurringScheduleId) {
			return false;
		}

		if (DateTime.from(schedule.date).isBefore(recurringSchedule.startDate)) {
			return false;
		}

		const weekdayMap: Record<Weekday, number> = {
			MONDAY: 1,
			TUESDAY: 2,
			WEDNESDAY: 3,
			THURSDAY: 4,
			FRIDAY: 5,
			SATURDAY: 6,
			SUNDAY: 0,
		};

		return recurringSchedule.scheduleItems.some(
			(item) =>
				weekdayMap[item.weekday] ===
					DateTime.from(schedule.date).getWeekdayIndex() &&
				item.time === schedule.time &&
				item.durationSeconds === schedule.durationSeconds,
		);
	}
}

export const scheduleRepository = new ScheduleRepository();
