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
import {
	RecurringScheduleModel,
	RecurringScheduleUpdateResultModel,
	ScheduleModel,
} from "../models/schedule.model";
import type {
	CreateScheduleDTO,
	IScheduleRepository,
	RecurringScheduleCreationData,
	ScheduleListQueryDTO,
	UpdateRecurringScheduleDTO,
	UpdateScheduleDTO,
} from "../types";
import { getRemainingHoursForClass, getRemainingHoursMap } from "./class-hours";

const ACTIVE_SCHEDULE_STATUSES: ScheduleStatus[] = [
	"SCHEDULED",
	"COMPLETED",
	"NO_SHOW",
];

const DEDUCTED_SCHEDULE_STATUSES: ScheduleStatus[] = ["COMPLETED", "NO_SHOW"];

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
	durationMinutes: number;
};

function toHoursNumber(value: Prisma.Decimal | number): number {
	return typeof value === "number" ? value : value.toNumber();
}

export class ScheduleRepository implements IScheduleRepository {
	constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

	async create(data: CreateScheduleDTO): Promise<ScheduleModel> {
		if (data.time === undefined || data.durationMinutes === undefined) {
			throw new Error("Time and duration are required");
		}

		const time = data.time;
		const durationMinutes = data.durationMinutes;

		const scheduleId = await this.prisma.$transaction(async (tx) => {
			const createdSchedule = await tx.schedule.create({
				data: {
					classId: data.classId,
					date: DateTime.fromDateOnlyString(data.date).toDate(),
					time,
					durationMinutes,
					notes: data.notes || null,
					status: "SCHEDULED",
					type: data.type,
				},
				include: {
					class: { include: classContextInclude },
				},
			});

			if (DEDUCTED_SCHEDULE_STATUSES.includes(createdSchedule.status)) {
				await tx.classHourDeduction.create({
					data: {
						scheduleId: createdSchedule.id,
						classId: createdSchedule.classId,
						hoursDeducted: createdSchedule.durationMinutes / 60,
					},
				});
			}

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
				durationMinutes: item.durationMinutes,
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
						durationMinutes: data.durationMinutes,
					}),
					...(data.type !== undefined && { type: data.type }),
					...(data.notes !== undefined && { notes: data.notes || null }),
					...(data.status !== undefined && { status: data.status }),
				},
				include: {
					class: { include: classContextInclude },
				},
			});

			if (DEDUCTED_SCHEDULE_STATUSES.includes(updatedSchedule.status)) {
				await tx.classHourDeduction.upsert({
					where: { scheduleId: updatedSchedule.id },
					update: {
						classId: updatedSchedule.classId,
						hoursDeducted: updatedSchedule.durationMinutes / 60,
						restoredAt: null,
					},
					create: {
						scheduleId: updatedSchedule.id,
						classId: updatedSchedule.classId,
						hoursDeducted: updatedSchedule.durationMinutes / 60,
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

	async completeSchedule(id: string): Promise<ScheduleModel> {
		const schedule = await this.prisma.schedule.findUnique({
			where: { id },
			include: { class: { include: classContextInclude } },
		});

		if (!schedule) {
			throw new Error("Schedule not found");
		}

		if (schedule.status !== "SCHEDULED") {
			throw new Error("Only scheduled schedules can be completed");
		}

		const hoursDeducted = schedule.durationMinutes / 60;

		const updatedSchedule = await this.prisma.$transaction(async (tx) => {
			const completedSchedule = await tx.schedule.update({
				where: { id },
				data: { status: "COMPLETED" },
				include: { class: { include: classContextInclude } },
			});

			await tx.classHourDeduction.upsert({
				where: { scheduleId: id },
				update: {
					hoursDeducted,
					restoredAt: null,
				},
				create: {
					scheduleId: id,
					classId: schedule.classId,
					hoursDeducted,
				},
			});

			return completedSchedule;
		});

		const remainingHours = await this.getRemainingHours(schedule.classId);
		return ScheduleModel.fromSchedulePrisma(updatedSchedule, remainingHours);
	}

	async restoreHours(id: string): Promise<ScheduleModel> {
		const schedule = await this.prisma.schedule.findUnique({
			where: { id },
			include: { class: { include: classContextInclude } },
		});

		if (!schedule) {
			throw new Error("Schedule not found");
		}

		const hourDeduction = await this.prisma.classHourDeduction.findUnique({
			where: { scheduleId: id },
		});

		if (!hourDeduction) {
			throw new Error("No reserved hours were found for this schedule");
		}

		if (hourDeduction.restoredAt) {
			throw new Error("Hours have already been restored for this schedule");
		}

		const updatedSchedule = await this.prisma.$transaction(async (tx) => {
			const cancelledSchedule = await tx.schedule.update({
				where: { id },
				data: { status: "CANCELLED" },
				include: { class: { include: classContextInclude } },
			});

			await tx.classHourDeduction.update({
				where: { scheduleId: id },
				data: { restoredAt: DateTime.now().toDate() },
			});

			return cancelledSchedule;
		});

		const remainingHours = await this.getRemainingHours(schedule.classId);
		return ScheduleModel.fromSchedulePrisma(updatedSchedule, remainingHours);
	}

	async getRemainingHours(classId: string): Promise<number> {
		return getRemainingHoursForClass(this.prisma, classId);
	}

	async createRecurringSchedule(
		data: RecurringScheduleCreationData,
	): Promise<ScheduleModel> {
		const remainingHours = await this.getRemainingHours(data.classId);
		const scheduleData = this.generateScheduleData(
			data.classId,
			data.recurring.startDate,
			data.recurring.scheduleItems,
			data.type,
			remainingHours,
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
					durationMinutes: item.durationMinutes,
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
						durationMinutes: item.durationMinutes,
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
					durationMinutes: true,
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

			const remainingHours = await this.getRemainingHoursInTransaction(
				tx,
				existingRecurringSchedule.classId,
			);
			const recurringType = data.type ?? existingRecurringSchedule.type;
			const scheduleData = this.generateScheduleData(
				existingRecurringSchedule.classId,
				data.effectiveDate,
				data.scheduleItems,
				recurringType,
				remainingHours,
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
					durationMinutes: item.durationMinutes,
				})),
			});

			await tx.schedule.createMany({
				data: scheduleData.map((item) => ({
					classId: existingRecurringSchedule.classId,
					recurringScheduleId: newRecurringSchedule.id,
					date: DateTime.fromDateOnlyString(item.date).toDate(),
					time: item.time,
					durationMinutes: item.durationMinutes,
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
		remainingHours: number,
	): GeneratedScheduleData[] {
		const scheduleData: GeneratedScheduleData[] = [];
		let currentDate = DateTime.fromDateOnlyString(startDate);
		let remainingMinutes = Math.max(0, Math.round(remainingHours * 60));

		while (remainingMinutes > 0) {
			const nextOccurrence = items
				.map((item) => ({
					item,
					date: this.getNextDateForWeekday(currentDate, item.weekday),
				}))
				.sort((a, b) => {
					const dateDiff = a.date.compareAsc(b.date);
					if (dateDiff !== 0) {
						return dateDiff;
					}

					return a.item.time - b.item.time;
				})[0];

			if (!nextOccurrence) {
				break;
			}

			if (nextOccurrence.item.durationMinutes > remainingMinutes) {
				return scheduleData;
			}

			scheduleData.push({
				classId,
				date: nextOccurrence.date.toDateOnlyString(),
				type,
				time: nextOccurrence.item.time,
				durationMinutes: nextOccurrence.item.durationMinutes,
			});

			remainingMinutes -= nextOccurrence.item.durationMinutes;
			currentDate = nextOccurrence.date.addDays(1);
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
		scheduleData: Array<{
			date: string;
			time: number;
			durationMinutes: number;
		}>,
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
				durationMinutes: true,
			},
		});

		const groupedGeneratedSchedules = scheduleData.reduce<
			Record<string, Array<{ time: number; durationMinutes: number }>>
		>((groups, item) => {
			const group = groups[item.date] ?? [];
			group.push({
				time: item.time,
				durationMinutes: item.durationMinutes,
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
					durationMinutes: item.durationMinutes,
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

					if (next.time >= current.time + current.durationMinutes) {
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

	private async getRemainingHoursInTransaction(
		tx: Prisma.TransactionClient,
		classId: string,
	): Promise<number> {
		const classData = await tx.class.findUnique({
			where: { id: classId },
			select: {
				totalHours: true,
				schedules: {
					where: {
						status: {
							in: ACTIVE_SCHEDULE_STATUSES,
						},
					},
					select: {
						durationMinutes: true,
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

		const reservedHours =
			classData.schedules.reduce(
				(total, schedule) => total + schedule.durationMinutes,
				0,
			) / 60;

		return toHoursNumber(classData.totalHours) - reservedHours;
	}

	private matchesRecurringScheduleItem(
		schedule: {
			date: Date;
			time: number;
			durationMinutes: number;
			recurringScheduleId: string | null;
		},
		recurringSchedule: {
			id: string;
			startDate: Date;
			scheduleItems: Array<{
				weekday: Weekday;
				time: number;
				durationMinutes: number;
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
				item.durationMinutes === schedule.durationMinutes,
		);
	}
}

export const scheduleRepository = new ScheduleRepository();
