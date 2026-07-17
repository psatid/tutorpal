import type { ScheduleStatus, Weekday } from "@prisma/client";
import { DateTime } from "../lib/date-time";
import type {
	RecurringScheduleDTO,
	RecurringScheduleUpdateResultDTO,
	ScheduleDTO,
} from "../types/schedule.types";

type SchedulePrismaRecord = {
	id: string;
	classId: string;
	recurringScheduleId?: string | null;
	date: Date;
	time: number;
	durationMinutes: number;
	notes: string | null;
	status: ScheduleStatus;
	createdAt: Date;
	updatedAt: Date;
	class: {
		name: string;
	};
};

type RecurringSchedulePrismaRecord = {
	id: string;
	classId: string;
	startDate: Date;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
	class: {
		name: string;
	};
	scheduleItems: RecurringScheduleItemPrismaRecord[];
};

type RecurringScheduleItemPrismaRecord = {
	id: string;
	weekday: Weekday;
	time: number;
	durationMinutes: number;
};

type ScheduleModelProps = {
	id: string;
	classId: string;
	className: string;
	recurringScheduleId?: string | null;
	date: Date;
	time: number;
	durationMinutes: number;
	notes: string | null;
	status: ScheduleStatus;
	createdAt: Date;
	updatedAt: Date;
	remainingHours?: number;
};

export class ScheduleModel {
	readonly id: string;
	readonly classId: string;
	readonly className: string;
	readonly recurringScheduleId?: string | null;
	readonly date: Date;
	readonly time: number;
	readonly durationMinutes: number;
	readonly notes: string | null;
	readonly status: ScheduleStatus;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly remainingHours?: number;

	constructor(props: ScheduleModelProps) {
		this.id = props.id;
		this.classId = props.classId;
		this.className = props.className;
		this.recurringScheduleId = props.recurringScheduleId;
		this.date = props.date;
		this.time = props.time;
		this.durationMinutes = props.durationMinutes;
		this.notes = props.notes;
		this.status = props.status;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.remainingHours = props.remainingHours;
	}

	static fromSchedulePrisma(
		schedule: SchedulePrismaRecord,
		remainingHours?: number,
	): ScheduleModel {
		return new ScheduleModel({
			id: schedule.id,
			classId: schedule.classId,
			className: schedule.class.name,
			recurringScheduleId: schedule.recurringScheduleId ?? null,
			date: schedule.date,
			time: schedule.time,
			durationMinutes: schedule.durationMinutes,
			notes: schedule.notes,
			status: schedule.status,
			createdAt: schedule.createdAt,
			updatedAt: schedule.updatedAt,
			remainingHours,
		});
	}

	toScheduleDTO(): ScheduleDTO {
		return {
			id: this.id,
			classId: this.classId,
			className: this.className,
			recurringScheduleId: this.recurringScheduleId ?? null,
			date: DateTime.from(this.date).toDateOnlyString(),
			time: this.time,
			durationMinutes: this.durationMinutes,
			notes: this.notes,
			status: this.status,
			createdAt: DateTime.from(this.createdAt).toISOString(),
			updatedAt: DateTime.from(this.updatedAt).toISOString(),
			remainingHours: this.remainingHours,
		};
	}
}

type RecurringScheduleModelProps = {
	id: string;
	classId: string;
	className: string;
	startDate: Date;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
	scheduleItems: RecurringScheduleItemPrismaRecord[];
};

export class RecurringScheduleModel {
	readonly id: string;
	readonly classId: string;
	readonly className: string;
	readonly startDate: Date;
	readonly notes: string | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly scheduleItems: RecurringScheduleItemPrismaRecord[];

	constructor(props: RecurringScheduleModelProps) {
		this.id = props.id;
		this.classId = props.classId;
		this.className = props.className;
		this.startDate = props.startDate;
		this.notes = props.notes;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.scheduleItems = props.scheduleItems;
	}

	static fromRecurringSchedulePrisma(
		recurringSchedule: RecurringSchedulePrismaRecord,
	): RecurringScheduleModel {
		return new RecurringScheduleModel({
			id: recurringSchedule.id,
			classId: recurringSchedule.classId,
			className: recurringSchedule.class.name,
			startDate: recurringSchedule.startDate,
			notes: recurringSchedule.notes,
			createdAt: recurringSchedule.createdAt,
			updatedAt: recurringSchedule.updatedAt,
			scheduleItems: recurringSchedule.scheduleItems,
		});
	}

	toRecurringScheduleDTO(): RecurringScheduleDTO {
		return {
			id: this.id,
			classId: this.classId,
			className: this.className,
			startDate: DateTime.from(this.startDate).toDateOnlyString(),
			notes: this.notes,
			createdAt: DateTime.from(this.createdAt).toISOString(),
			updatedAt: DateTime.from(this.updatedAt).toISOString(),
			scheduleItems: this.scheduleItems.map((item) => ({
				id: item.id,
				weekday: item.weekday,
				time: item.time,
				durationMinutes: item.durationMinutes,
			})),
		};
	}
}

type RecurringScheduleUpdateResultModelProps = {
	recurringSchedule: RecurringScheduleModel;
	effectiveDate: string;
	deletedSchedulesCount: number;
	createdSchedulesCount: number;
};

export class RecurringScheduleUpdateResultModel {
	readonly recurringSchedule: RecurringScheduleModel;
	readonly effectiveDate: string;
	readonly deletedSchedulesCount: number;
	readonly createdSchedulesCount: number;

	constructor(props: RecurringScheduleUpdateResultModelProps) {
		this.recurringSchedule = props.recurringSchedule;
		this.effectiveDate = props.effectiveDate;
		this.deletedSchedulesCount = props.deletedSchedulesCount;
		this.createdSchedulesCount = props.createdSchedulesCount;
	}

	toRecurringScheduleUpdateResultDTO(): RecurringScheduleUpdateResultDTO {
		return {
			recurringSchedule: this.recurringSchedule.toRecurringScheduleDTO(),
			effectiveDate: this.effectiveDate,
			deletedSchedulesCount: this.deletedSchedulesCount,
			createdSchedulesCount: this.createdSchedulesCount,
		};
	}
}
