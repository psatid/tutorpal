import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import type { GetV1SchedulesAwaitingConfirmation200DataItem } from "@/api/generated/models/getV1SchedulesAwaitingConfirmation200DataItem";
import type { GetV1SchedulesById200 } from "@/api/generated/models/getV1SchedulesById200";
import { DateTime } from "@/lib/date-time";
import type {
	ScheduleFormData,
	ScheduleStatus,
	ScheduleType,
	Weekday,
} from "@/types/schedule";
import { RecurringSchedulePattern } from "./recurring-schedule";

const MINUTES_PER_DAY = 24 * 60;

type ScheduleResponse =
	| GetV1Schedules200Item
	| GetV1SchedulesById200
	| GetV1SchedulesAwaitingConfirmation200DataItem;

export type ScheduleDisplayInput = {
	id: string;
	classId?: string;
	className: string;
	recurringScheduleId?: string | null;
	date: string;
	time: number;
	durationMinutes: number;
	notes?: string | null;
	noShowNote?: string | null;
	status?: ScheduleStatus;
	type?: ScheduleType;
	createdAt?: string;
	updatedAt?: string;
	remainingHours?: number;
};

export type ScheduleInput = Schedule | ScheduleResponse | ScheduleDisplayInput;

type ScheduleDetails = {
	id: string;
	classId: string;
	className: string;
	recurringScheduleId: string | null;
	date: string;
	time: number;
	durationMinutes: number;
	notes: string | null;
	noShowNote: string | null;
	status: ScheduleStatus;
	type: ScheduleType;
	createdAt: string;
	updatedAt: string;
	remainingHours?: number;
};

export type ScheduleCreateCommand = {
	classId: string;
	date: string;
	type: ScheduleType;
	time: number;
	durationMinutes?: number;
	notes?: string;
	recurring?: {
		startDate: string;
		scheduleItems: Array<{
			weekday: Weekday;
			time: number;
			durationMinutes: number;
		}>;
	};
};

export type ScheduleUpdateCommand = {
	classId: string;
	date: string;
	type: ScheduleType;
	time: number;
	durationMinutes?: number;
	notes?: string;
};

export type AwaitingConfirmationSchedulePage = {
	schedules: Schedule[];
	pagination: {
		total: number;
		hasNext: boolean;
		nextCursor: string | null;
	};
};

export class Schedule {
	private constructor(private readonly data: ScheduleDetails) {}

	static fromListItem(response: GetV1Schedules200Item): Schedule {
		return new Schedule(Schedule.toDetails(response));
	}

	static fromGetScheduleByIdResponse(
		response: GetV1SchedulesById200,
	): Schedule {
		return new Schedule(Schedule.toDetails(response));
	}

	static fromAwaitingConfirmationListItem(
		response: GetV1SchedulesAwaitingConfirmation200DataItem,
	): Schedule {
		return new Schedule(Schedule.toDetails(response));
	}

	static fromInput(input: ScheduleInput): Schedule {
		if (input instanceof Schedule) return input;

		return new Schedule(Schedule.toDetails(input));
	}

	static getFormDefaults(
		date: string,
		initialTime?: number,
	): ScheduleFormData {
		return {
			classId: "",
			date,
			type: undefined,
			time:
				initialTime === undefined
					? ""
					: RecurringSchedulePattern.minutesToTimeString(initialTime),
			durationMinutes: undefined,
			notes: "",
			recurring: undefined,
		};
	}

	static formatTimeLabel(minutes: number): string {
		return RecurringSchedulePattern.minutesToTimeString(minutes);
	}

	static toCreateCommand(
		data: ScheduleFormData,
	): ScheduleCreateCommand | undefined {
		if (!data.type) return undefined;

		const recurring = data.recurring
			? {
					startDate: data.date,
					scheduleItems: RecurringSchedulePattern.fromFormItems(
						data.recurring.scheduleItems,
					).toCommandItems(),
				}
			: undefined;

		return {
			classId: data.classId,
			date: recurring ? recurring.startDate : data.date,
			type: data.type,
			time: recurring
				? 0
				: RecurringSchedulePattern.timeStringToMinutes(data.time ?? ""),
			durationMinutes: data.durationMinutes,
			notes: data.notes,
			recurring,
		};
	}

	static toUpdateCommand(
		data: ScheduleFormData,
	): ScheduleUpdateCommand | undefined {
		if (!data.type) return undefined;

		return {
			classId: data.classId,
			date: data.date,
			type: data.type,
			time: data.recurring
				? 0
				: RecurringSchedulePattern.timeStringToMinutes(data.time ?? ""),
			durationMinutes: data.durationMinutes,
			notes: data.notes,
		};
	}

	getId(): string {
		return this.data.id;
	}

	getClassId(): string {
		return this.data.classId;
	}

	getClassName(): string {
		return this.data.className;
	}

	getRecurringScheduleId(): string | null {
		return this.data.recurringScheduleId;
	}

	getDate(): string {
		return this.data.date;
	}

	getTimeMinutes(): number {
		return this.data.time;
	}

	getDurationMinutes(): number {
		return this.data.durationMinutes;
	}

	getDurationHours(): number {
		return this.getDurationMinutes() / 60;
	}

	getNotes(): string | null {
		return this.data.notes;
	}

	getNoShowNote(): string | null {
		return this.data.noShowNote;
	}

	getStatus(): ScheduleStatus {
		return this.data.status;
	}

	getType(): ScheduleType {
		return this.data.type;
	}

	getStartDateTime(): DateTime {
		return DateTime.from(
			`${this.getDate()}T${RecurringSchedulePattern.minutesToTimeString(
				this.getTimeMinutes(),
			)}:00`,
		);
	}

	getStartTimeLabel(): string {
		return RecurringSchedulePattern.minutesToTimeString(this.getTimeMinutes());
	}

	getEndTimeMinutes(): number {
		return this.getTimeMinutes() + this.getDurationMinutes();
	}

	getEndTimeLabel(): string {
		return RecurringSchedulePattern.minutesToTimeString(this.getEndTimeMinutes());
	}

	getEndClockTimeLabel(): string {
		const minutes = this.getEndTimeMinutes();
		const minutesInDay =
			((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
		return RecurringSchedulePattern.minutesToTimeString(minutesInDay);
	}

	getEndDateData(): { endDate: DateTime; endDayOffset: number } {
		const endDayOffset = Math.floor(this.getEndTimeMinutes() / MINUTES_PER_DAY);

		return {
			endDate: DateTime.fromDateOnlyString(this.getDate()).addDays(endDayOffset),
			endDayOffset,
		};
	}

	getFormValues(): ScheduleFormData {
		return {
			classId: this.getClassId(),
			date: this.getDate(),
			type: this.getType(),
			time: this.getStartTimeLabel(),
			durationMinutes: this.getDurationMinutes(),
			notes: this.getNotes() ?? "",
			recurring: undefined,
		};
	}

	isScheduled(): boolean {
		return this.getStatus() === "SCHEDULED";
	}

	canComplete(): boolean {
		return this.isScheduled();
	}

	canMarkNoShow(): boolean {
		return this.isScheduled();
	}

	canRestore(): boolean {
		return this.getStatus() === "COMPLETED" || this.getStatus() === "NO_SHOW";
	}

	isTimelineEligible(): boolean {
		return this.getStatus() !== "CANCELLED" && this.getStatus() !== "NO_SHOW";
	}

	isUpcoming(referenceTime: DateTime): boolean {
		return this.isScheduled() && !this.getStartDateTime().isBefore(referenceTime);
	}

	compareStart(other: Schedule): number {
		const dateComparison = this.getDate().localeCompare(other.getDate());
		return dateComparison || this.getTimeMinutes() - other.getTimeMinutes();
	}

	isRecurringPatternReplaceable(): boolean {
		return this.isScheduled() || this.getStatus() === "CANCELLED";
	}

	private static toDetails(response: ScheduleResponse | ScheduleDisplayInput): ScheduleDetails {
		return {
			id: response.id,
			classId: response.classId ?? "",
			className: response.className,
			recurringScheduleId: response.recurringScheduleId ?? null,
			date: response.date,
			time: response.time,
			durationMinutes: response.durationMinutes,
			notes: response.notes ?? null,
			noShowNote: response.noShowNote ?? null,
			status: response.status ?? "SCHEDULED",
			type: response.type ?? "ON_SITE",
			createdAt: response.createdAt ?? "",
			updatedAt: response.updatedAt ?? "",
			remainingHours: response.remainingHours,
		};
	}
}
