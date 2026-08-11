import type { ScheduleStatus, ScheduleType, Weekday } from "@prisma/client";
import { DateTime } from "../lib/date-time";
import type {
	RecurringScheduleDTO,
	RecurringScheduleUpdateResultDTO,
	ScheduleDTO,
} from "../types/schedule.types";

type ClassContext = {
	name: string;
};

type SchedulePrismaRecord = {
	id: string;
	classId: string;
	recurringScheduleId?: string | null;
	date: Date;
	time: number;
	durationMinutes: number;
	notes: string | null;
	status: ScheduleStatus;
	type: ScheduleType;
	createdAt: Date;
	updatedAt: Date;
	class: ClassContext;
};

type RecurringSchedulePrismaRecord = {
	id: string;
	classId: string;
	startDate: Date;
	notes: string | null;
	type: ScheduleType;
	createdAt: Date;
	updatedAt: Date;
	class: ClassContext;
	scheduleItems: Array<{
		id: string;
		weekday: Weekday;
		time: number;
		durationMinutes: number;
	}>;
};

function classContext(item: ClassContext) {
	return {
		className: item.name,
	};
}

export class ScheduleModel {
	readonly id!: string;
	readonly classId!: string;
	readonly className!: string;
	readonly recurringScheduleId?: string | null;
	readonly date!: Date;
	readonly time!: number;
	readonly durationMinutes!: number;
	readonly notes!: string | null;
	readonly status!: ScheduleStatus;
	readonly type!: ScheduleType;
	readonly createdAt!: Date;
	readonly updatedAt!: Date;
	readonly remainingHours?: number;

	constructor(props: Omit<ScheduleModel, "toScheduleDTO">) {
		Object.assign(this, props);
	}

	static fromSchedulePrisma(
		schedule: SchedulePrismaRecord,
		remainingHours?: number,
	): ScheduleModel {
		return new ScheduleModel({
			id: schedule.id,
			classId: schedule.classId,
			...classContext(schedule.class),
			recurringScheduleId: schedule.recurringScheduleId ?? null,
			date: schedule.date,
			time: schedule.time,
			durationMinutes: schedule.durationMinutes,
			notes: schedule.notes,
			status: schedule.status,
			type: schedule.type,
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
			type: this.type,
			createdAt: DateTime.from(this.createdAt).toISOString(),
			updatedAt: DateTime.from(this.updatedAt).toISOString(),
			remainingHours: this.remainingHours,
		};
	}
}

export class RecurringScheduleModel {
	readonly id!: string;
	readonly classId!: string;
	readonly className!: string;
	readonly startDate!: Date;
	readonly notes!: string | null;
	readonly type!: ScheduleType;
	readonly createdAt!: Date;
	readonly updatedAt!: Date;
	readonly scheduleItems!: RecurringSchedulePrismaRecord["scheduleItems"];

	constructor(props: Omit<RecurringScheduleModel, "toRecurringScheduleDTO">) {
		Object.assign(this, props);
	}

	static fromRecurringSchedulePrisma(
		item: RecurringSchedulePrismaRecord,
	): RecurringScheduleModel {
		return new RecurringScheduleModel({
			id: item.id,
			classId: item.classId,
			...classContext(item.class),
			startDate: item.startDate,
			notes: item.notes,
			type: item.type,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
			scheduleItems: item.scheduleItems,
		});
	}

	toRecurringScheduleDTO(): RecurringScheduleDTO {
		return {
			id: this.id,
			classId: this.classId,
			className: this.className,
			startDate: DateTime.from(this.startDate).toDateOnlyString(),
			notes: this.notes,
			type: this.type,
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

export class RecurringScheduleUpdateResultModel {
	constructor(
		private readonly props: {
			recurringSchedule: RecurringScheduleModel;
			effectiveDate: string;
			deletedSchedulesCount: number;
			createdSchedulesCount: number;
		},
	) {}
	get recurringSchedule() {
		return this.props.recurringSchedule;
	}
	get effectiveDate() {
		return this.props.effectiveDate;
	}
	get deletedSchedulesCount() {
		return this.props.deletedSchedulesCount;
	}
	get createdSchedulesCount() {
		return this.props.createdSchedulesCount;
	}
	toRecurringScheduleUpdateResultDTO(): RecurringScheduleUpdateResultDTO {
		return {
			recurringSchedule: this.props.recurringSchedule.toRecurringScheduleDTO(),
			effectiveDate: this.props.effectiveDate,
			deletedSchedulesCount: this.props.deletedSchedulesCount,
			createdSchedulesCount: this.props.createdSchedulesCount,
		};
	}
}
