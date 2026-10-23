import type { GetV1Classes200DataItemRecurringSchedule } from "@/api/generated/models/getV1Classes200DataItemRecurringSchedule";
import type { GetV1ClassesById200RecurringSchedule } from "@/api/generated/models/getV1ClassesById200RecurringSchedule";
import { DateTime } from "@/lib/date-time";
import type {
	RecurringScheduleFormData,
	RecurringScheduleItemInput,
	ScheduleType,
	Weekday,
} from "@/types/schedule";
import type { Schedule, ScheduleCreateCommand } from "./schedule";

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = 7 * MINUTES_PER_DAY;
const DEFAULT_TIME = "09:00";
const DEFAULT_DURATION_MINUTES = 60;

export const recurringScheduleWeekdays: readonly Weekday[] = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
];

const weekdayOrder: Record<Weekday, number> = {
	MONDAY: 0,
	TUESDAY: 1,
	WEDNESDAY: 2,
	THURSDAY: 3,
	FRIDAY: 4,
	SATURDAY: 5,
	SUNDAY: 6,
};

export type RecurringSchedulePatternItem = {
	id?: string;
	weekday: Weekday;
	time: number;
	durationMinutes: number;
};

type RecurringScheduleResponse = NonNullable<
	| GetV1Classes200DataItemRecurringSchedule
	| GetV1ClassesById200RecurringSchedule
>;

export type RecurringScheduleDisplayInput = {
	id: string;
	startDate: string;
	notes?: string | null;
	type: ScheduleType;
	scheduleItems: RecurringSchedulePatternItem[];
};

export type RecurringScheduleInput =
	| RecurringSchedule
	| RecurringScheduleResponse
	| RecurringScheduleDisplayInput;

export type UpdateRecurringScheduleCommand = {
	id: string;
	data: {
		effectiveDate: string;
		type?: ScheduleType;
		scheduleItems: Array<{
			weekday: Weekday;
			time: number;
			durationMinutes: number;
		}>;
	};
};

export class RecurringSchedulePattern {
	private constructor(
		private readonly items: readonly RecurringSchedulePatternItem[],
		private readonly formItems: readonly RecurringScheduleItemInput[],
	) {}

	static fromFormItems(
		items: readonly RecurringScheduleItemInput[],
	): RecurringSchedulePattern {
		return new RecurringSchedulePattern(
			items.map((item) => ({
				weekday: item.weekday,
				time: RecurringSchedulePattern.timeStringToMinutes(item.time),
				durationMinutes: item.durationMinutes,
			})),
			items.map((item) => ({ ...item })),
		);
	}

	static fromStoredItems(
		items: readonly RecurringSchedulePatternItem[],
	): RecurringSchedulePattern {
		return new RecurringSchedulePattern(
			items.map((item) => ({ ...item })),
			items.map((item) => ({
				weekday: item.weekday,
				time: RecurringSchedulePattern.minutesToTimeString(item.time),
				durationMinutes: item.durationMinutes,
			})),
		);
	}

	static minutesToTimeString(minutes: number): string {
		const hours = Math.floor(minutes / 60);
		const remainingMinutes = minutes % 60;
		return `${hours.toString().padStart(2, "0")}:${remainingMinutes
			.toString()
			.padStart(2, "0")}`;
	}

	static timeStringToMinutes(time: string): number {
		const parts = time.split(":").map(Number);
		const hours = parts[0] ?? 0;
		const minutes = parts[1] ?? 0;
		return hours * 60 + minutes;
	}

	getItems(): readonly RecurringSchedulePatternItem[] {
		return this.items.map((item) => ({ ...item }));
	}

	getFormItems(): RecurringScheduleItemInput[] {
		return this.formItems.map((item) => ({ ...item }));
	}

	getSortedItems(): RecurringSchedulePatternItem[] {
		return this.items.map((item) => ({ ...item })).sort((left, right) => {
			const weekdayDifference =
				weekdayOrder[left.weekday] - weekdayOrder[right.weekday];
			return weekdayDifference || left.time - right.time;
		});
	}

	getOrderedWeekdayGroups(): Array<{
		weekday: Weekday;
		items: RecurringSchedulePatternItem[];
	}> {
		const itemsByWeekday = new Map<Weekday, RecurringSchedulePatternItem[]>();

		for (const item of this.getSortedItems()) {
			const items = itemsByWeekday.get(item.weekday) ?? [];
			items.push(item);
			itemsByWeekday.set(item.weekday, items);
		}

		return recurringScheduleWeekdays
			.map((weekday) => ({
				weekday,
				items: itemsByWeekday.get(weekday) ?? [],
			}))
			.filter((group) => group.items.length > 0);
	}

	getSortedFormItems(): RecurringScheduleItemInput[] {
		return this.getSortedItems().map((item) => ({
			weekday: item.weekday,
			time: RecurringSchedulePattern.minutesToTimeString(item.time),
			durationMinutes: item.durationMinutes,
		}));
	}

	toCommandItems(): Array<{
		weekday: Weekday;
		time: number;
		durationMinutes: number;
	}> {
		return this.getSortedItems().map((item) => ({
			weekday: item.weekday,
			time: item.time,
			durationMinutes: item.durationMinutes,
		}));
	}

	getOverlappingItemIndexes(): Set<number> {
		const overlappingIndexes = new Set<number>();

		this.items.forEach((item, index) => {
			if (
				Number.isFinite(item.durationMinutes) &&
				item.durationMinutes > MINUTES_PER_WEEK
			) {
				overlappingIndexes.add(index);
			}

			this.items.forEach((otherItem, otherIndex) => {
				if (
					index === otherIndex ||
					!Number.isFinite(item.durationMinutes) ||
					!Number.isFinite(otherItem.durationMinutes)
				) {
					return;
				}

				if (
					item.durationMinutes > MINUTES_PER_WEEK ||
					otherItem.durationMinutes > MINUTES_PER_WEEK
				) {
					overlappingIndexes.add(index);
					overlappingIndexes.add(otherIndex);
					return;
				}

				if (this.overlapsOnRepeatingWeek(item, otherItem)) {
					overlappingIndexes.add(index);
				}
			});
		});

		return overlappingIndexes;
	}

	hasOverlaps(): boolean {
		return this.getOverlappingItemIndexes().size > 0;
	}

	getFirstOverlappingItemIndexByTime(): number | undefined {
		return [...this.getOverlappingItemIndexes()].sort((left, right) => {
			return (
				(this.items[left]?.time ?? 0) - (this.items[right]?.time ?? 0)
			);
		})[0];
	}

	getWeekdayItemIndexes(weekday: Weekday): number[] {
		return this.items
			.map((item, index) => ({ item, index }))
			.filter(({ item }) => item.weekday === weekday)
			.sort((left, right) => left.item.time - right.item.time)
			.map(({ index }) => index);
	}

	getLatestEndMinute(weekday: Weekday): number {
		return this.items
			.filter((item) => item.weekday === weekday)
			.reduce(
				(latest, item) => Math.max(latest, item.time + item.durationMinutes),
				0,
			);
	}

	canAddInterval(weekday: Weekday): boolean {
		return this.getLatestEndMinute(weekday) < MINUTES_PER_DAY;
	}

	getAddIntervalItem(weekday: Weekday): RecurringScheduleItemInput | null {
		const latestEnd = this.getLatestEndMinute(weekday);

		if (latestEnd >= MINUTES_PER_DAY) return null;

		return {
			weekday,
			time: RecurringSchedulePattern.minutesToTimeString(latestEnd),
			durationMinutes: DEFAULT_DURATION_MINUTES,
		};
	}

	getToggleWeekdayDecision(
		weekday: Weekday,
	):
		| { kind: "remove"; indexes: number[] }
		| { kind: "append"; item: RecurringScheduleItemInput } {
		const indexes = this.getWeekdayItemIndexes(weekday);

		if (indexes.length > 0) {
			return { kind: "remove", indexes };
		}

		return {
			kind: "append",
			item: {
				weekday,
				time: DEFAULT_TIME,
				durationMinutes: DEFAULT_DURATION_MINUTES,
			},
		};
	}

	getSelectAllWeekdaysDecision():
		| { kind: "clear" }
		| { kind: "append"; items: RecurringScheduleItemInput[] } {
		const selectedWeekdays = new Set(this.items.map((item) => item.weekday));

		if (selectedWeekdays.size === recurringScheduleWeekdays.length) {
			return { kind: "clear" };
		}

		return {
			kind: "append",
			items: recurringScheduleWeekdays
				.filter((weekday) => !selectedWeekdays.has(weekday))
				.map((weekday) => ({
					weekday,
					time: DEFAULT_TIME,
					durationMinutes: DEFAULT_DURATION_MINUTES,
				})),
		};
	}

	private overlapsOnRepeatingWeek(
		item: RecurringSchedulePatternItem,
		otherItem: RecurringSchedulePatternItem,
	): boolean {
		const start = this.getWeeklyStart(item);
		const end = start + item.durationMinutes;
		const otherStart = this.getWeeklyStart(otherItem);
		const otherEnd = otherStart + otherItem.durationMinutes;
		const firstRelevantWeek = Math.floor(
			(start - otherEnd) / MINUTES_PER_WEEK,
		);
		const lastRelevantWeek = Math.ceil(
			(end - otherStart) / MINUTES_PER_WEEK,
		);

		for (
			let weekOffset = firstRelevantWeek;
			weekOffset <= lastRelevantWeek;
			weekOffset += 1
		) {
			const shiftedOtherStart = otherStart + weekOffset * MINUTES_PER_WEEK;
			const shiftedOtherEnd = otherEnd + weekOffset * MINUTES_PER_WEEK;

			if (start < shiftedOtherEnd && shiftedOtherStart < end) {
				return true;
			}
		}

		return false;
	}

	private getWeeklyStart(item: RecurringSchedulePatternItem): number {
		return weekdayOrder[item.weekday] * MINUTES_PER_DAY + item.time;
	}
}

type RecurringScheduleDetails = {
	id: string;
	startDate: string;
	notes: string | null;
	type: ScheduleType;
	pattern: RecurringSchedulePattern;
};

export class RecurringSchedule {
	private constructor(private readonly data: RecurringScheduleDetails) {}

	static fromResponse(response: RecurringScheduleResponse): RecurringSchedule {
		return new RecurringSchedule({
			id: response.id,
			startDate: response.startDate,
			notes: response.notes,
			type: response.type,
			pattern: RecurringSchedulePattern.fromStoredItems(response.scheduleItems),
		});
	}

	static fromInput(input: RecurringScheduleInput): RecurringSchedule {
		if (input instanceof RecurringSchedule) return input;

		return new RecurringSchedule({
			id: input.id,
			startDate: input.startDate,
			notes: input.notes ?? null,
			type: input.type,
			pattern: RecurringSchedulePattern.fromStoredItems(input.scheduleItems),
		});
	}

	static getFormDefaults(
		recurringSchedule: RecurringSchedule | null | undefined,
		currentDate: string,
	): RecurringScheduleFormData {
		return {
			effectiveDate: recurringSchedule?.getStartDate() ?? currentDate,
			type: recurringSchedule?.getType(),
			scheduleItems: recurringSchedule?.getPattern().getFormItems() ?? [],
		};
	}

	static toCreateCommand(
		classId: string,
		values: RecurringScheduleFormData,
	): ScheduleCreateCommand | undefined {
		if (!values.type) return undefined;

		return {
			classId,
			date: values.effectiveDate,
			type: values.type,
			time: 0,
			recurring: {
				startDate: values.effectiveDate,
				scheduleItems: RecurringSchedulePattern.fromFormItems(
					values.scheduleItems,
				).toCommandItems(),
			},
		};
	}

	getId(): string {
		return this.data.id;
	}

	getStartDate(): string {
		return this.data.startDate;
	}

	getNotes(): string | null {
		return this.data.notes;
	}

	getType(): ScheduleType {
		return this.data.type;
	}

	getPattern(): RecurringSchedulePattern {
		return this.data.pattern;
	}

	getAffectedOccurrenceCount(
		schedules: readonly Schedule[],
		effectiveDate: string,
	): number {
		return schedules.filter(
			(schedule) =>
				this.matchesOccurrence(schedule) &&
				schedule.getDate() >= effectiveDate &&
				schedule.isRecurringPatternReplaceable(),
		).length;
	}

	toUpdateCommand(
		values: RecurringScheduleFormData,
	): UpdateRecurringScheduleCommand | undefined {
		if (!values.type) return undefined;

		return {
			id: this.getId(),
			data: {
				effectiveDate: values.effectiveDate,
				type: values.type,
				scheduleItems: RecurringSchedulePattern.fromFormItems(
					values.scheduleItems,
				).toCommandItems(),
			},
		};
	}

	private matchesOccurrence(schedule: Schedule): boolean {
		if (schedule.getRecurringScheduleId() === this.getId()) {
			return true;
		}

		if (schedule.getRecurringScheduleId()) {
			return false;
		}

		if (schedule.getDate() < this.getStartDate()) {
			return false;
		}

		const scheduleWeekday = DateTime.fromDateOnlyString(
			schedule.getDate(),
		).getWeekdayIndex();
		const weekdayMap: Record<Weekday, number> = {
			MONDAY: 1,
			TUESDAY: 2,
			WEDNESDAY: 3,
			THURSDAY: 4,
			FRIDAY: 5,
			SATURDAY: 6,
			SUNDAY: 0,
		};

		return this.getPattern()
			.getItems()
			.some(
				(item) =>
					weekdayMap[item.weekday] === scheduleWeekday &&
					item.time === schedule.getTimeMinutes() &&
					item.durationMinutes === schedule.getDurationMinutes(),
			);
	}
}
