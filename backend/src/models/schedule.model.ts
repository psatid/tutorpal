import type { ScheduleStatus, ScheduleType, Weekday } from "@prisma/client";
import { DateTime } from "../lib/date-time";
import { secondsToMinutes } from "../lib/teaching-time";
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
	durationSeconds: bigint;
	notes: string | null;
	noShowNote: string | null;
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
		durationSeconds: bigint;
	}>;
};

export const CAPACITY_RESERVING_SCHEDULE_STATUSES: ScheduleStatus[] = [
	"SCHEDULED",
	"COMPLETED",
	"NO_SHOW",
];

export type ScheduleTransitionPlan = {
	expected: {
		id: string;
		classId: string;
		status: ScheduleStatus;
		durationSeconds: bigint;
	};
	patch: {
		status: ScheduleStatus;
		noShowNote?: string | null;
	};
	deduction:
		| { kind: "upsert"; classId: string; seconds: bigint }
		| { kind: "restore"; classId: string }
		| { kind: "none" };
};

export class ScheduleTransitionViolation extends Error {
	constructor(message: string) {
		super(message);
		this.name = "ScheduleTransitionViolation";
	}
}

type ScheduleModelProps = {
	id: string;
	classId: string;
	className: string;
	recurringScheduleId?: string | null;
	date: Date;
	time: number;
	durationMinutes: number;
	durationSeconds: bigint;
	notes: string | null;
	noShowNote: string | null;
	status: ScheduleStatus;
	type: ScheduleType;
	createdAt: Date;
	updatedAt: Date;
	remainingHours?: number;
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
	readonly durationSeconds!: bigint;
	readonly notes!: string | null;
	readonly noShowNote!: string | null;
	readonly status!: ScheduleStatus;
	readonly type!: ScheduleType;
	readonly createdAt!: Date;
	readonly updatedAt!: Date;
	readonly remainingHours?: number;

	constructor(props: ScheduleModelProps) {
		Object.assign(this, props);
	}

	static isCapacityReservingStatus(status: ScheduleStatus): boolean {
		return CAPACITY_RESERVING_SCHEDULE_STATUSES.includes(status);
	}

	static isRestorableStatus(status: ScheduleStatus): boolean {
		return status === "COMPLETED" || status === "NO_SHOW";
	}

	reservesCapacity(): boolean {
		return ScheduleModel.isCapacityReservingStatus(this.status);
	}

	planCompletion(): ScheduleTransitionPlan {
		if (this.status !== "SCHEDULED") {
			throw new ScheduleTransitionViolation(
				"Only scheduled schedules can be completed",
			);
		}

		return this.planTransition(
			{ status: "COMPLETED" },
			{ kind: "upsert", classId: this.classId, seconds: this.durationSeconds },
		);
	}

	planNoShow(input: {
		deductHours: boolean;
		note?: string;
	}): ScheduleTransitionPlan {
		if (this.status !== "SCHEDULED") {
			throw new ScheduleTransitionViolation(
				"Only scheduled schedules can be marked as no-show",
			);
		}

		const noShowNote = input.note?.trim() || null;
		return this.planTransition(
			{
				status: input.deductHours ? "NO_SHOW" : "CANCELLED",
				noShowNote,
			},
			input.deductHours
				? {
						kind: "upsert",
						classId: this.classId,
						seconds: this.durationSeconds,
					}
				: { kind: "none" },
		);
	}

	planRestoration(): ScheduleTransitionPlan {
		if (!ScheduleModel.isRestorableStatus(this.status)) {
			throw new ScheduleTransitionViolation(
				"Only completed or no-show schedules can have hours restored",
			);
		}

		return this.planTransition(
			{ status: "CANCELLED" },
			{ kind: "restore", classId: this.classId },
		);
	}

	private planTransition(
		patch: ScheduleTransitionPlan["patch"],
		deduction: ScheduleTransitionPlan["deduction"],
	): ScheduleTransitionPlan {
		return {
			expected: {
				id: this.id,
				classId: this.classId,
				status: this.status,
				durationSeconds: this.durationSeconds,
			},
			patch,
			deduction,
		};
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
			durationMinutes: secondsToMinutes(schedule.durationSeconds),
			durationSeconds: schedule.durationSeconds,
			notes: schedule.notes,
			noShowNote: schedule.noShowNote,
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
			noShowNote: this.noShowNote,
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
				durationMinutes: secondsToMinutes(item.durationSeconds),
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
