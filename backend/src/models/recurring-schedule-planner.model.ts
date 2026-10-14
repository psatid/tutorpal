import { DateTime } from "../lib/date-time";
import { minutesToSeconds } from "../lib/teaching-time";

type ScheduleStatus = "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";
type ScheduleType = "ON_SITE" | "ONLINE";
type Weekday =
	| "MONDAY"
	| "TUESDAY"
	| "WEDNESDAY"
	| "THURSDAY"
	| "FRIDAY"
	| "SATURDAY"
	| "SUNDAY";

const weekdayIndexes: Readonly<Record<Weekday, number>> = Object.freeze({
	MONDAY: 1,
	TUESDAY: 2,
	WEDNESDAY: 3,
	THURSDAY: 4,
	FRIDAY: 5,
	SATURDAY: 6,
	SUNDAY: 0,
});

const activeScheduleStatuses: readonly ScheduleStatus[] = [
	"SCHEDULED",
	"COMPLETED",
	"NO_SHOW",
];

const replaceableScheduleStatuses: readonly ScheduleStatus[] = [
	"SCHEDULED",
	"CANCELLED",
];

export type RecurringScheduleItemInput = Readonly<{
	weekday: Weekday;
	time: number;
	durationMinutes: number;
}>;

export type RecurringScheduleItemPlan = Readonly<{
	weekday: Weekday;
	time: number;
	durationSeconds: bigint;
}>;

export type RecurringScheduleSeriesSnapshot = Readonly<{
	id: string;
	classId: string;
	startDate: string;
	notes: string | null;
	type: ScheduleType;
	scheduleItems: readonly RecurringScheduleItemPlan[];
}>;

export type RecurringScheduleSeriesPlan = Readonly<{
	classId: string;
	startDate: string;
	notes: string | null;
	type: ScheduleType;
	scheduleItems: readonly RecurringScheduleItemPlan[];
}>;

export type RecurringScheduleOccurrencePlan = Readonly<{
	classId: string;
	date: string;
	time: number;
	durationSeconds: bigint;
	type: ScheduleType;
}>;

export type RecurringScheduleCandidate = Readonly<{
	id: string;
	date: string;
	time: number;
	durationSeconds: bigint;
	status: ScheduleStatus;
	recurringScheduleId: string | null;
}>;

export type RecurringScheduleExistingSchedule = Readonly<{
	id: string;
	date: string;
	time: number;
	durationSeconds: bigint;
	status: ScheduleStatus;
}>;

export type RecurringScheduleCreatePlan = Readonly<{
	series: RecurringScheduleSeriesPlan;
	generatedSchedules: readonly RecurringScheduleOccurrencePlan[];
}>;

export type RecurringScheduleUpdatePlan = Readonly<{
	series: RecurringScheduleSeriesPlan;
	effectiveDate: string;
	replacementScheduleIds: readonly string[];
	generatedSchedules: readonly RecurringScheduleOccurrencePlan[];
}>;

export type RecurringSchedulePlanningFailureReason =
	| "insufficient_hours"
	| "overlap";

export class RecurringSchedulePlanningError extends Error {
	readonly conflictDates: readonly string[];

	constructor(
		readonly reason: RecurringSchedulePlanningFailureReason,
		conflictDates: readonly string[] = [],
	) {
		super(
			reason === "overlap"
				? "Recurring schedule conflicts with existing schedules"
				: "The class does not have enough remaining hours",
		);
		this.name = "RecurringSchedulePlanningError";
		this.conflictDates = Object.freeze([...conflictDates]);
	}
}

// biome-ignore lint/complexity/noStaticOnlyClass: A stateless planner exposes one domain API.
export class RecurringSchedulePlanner {
	static planCreate(input: {
		classId: string;
		startDate: string;
		type: ScheduleType;
		notes?: string;
		scheduleItems: readonly RecurringScheduleItemInput[];
		remainingSeconds: bigint;
	}): RecurringScheduleCreatePlan {
		const series = freezeSeries({
			classId: input.classId,
			startDate: input.startDate,
			notes: input.notes || null,
			type: input.type,
			scheduleItems: toScheduleItemPlans(input.scheduleItems),
		});
		const generatedSchedules = RecurringSchedulePlanner.generateSchedules(
			series,
			input.remainingSeconds,
		);

		if (generatedSchedules.length === 0) {
			throw new RecurringSchedulePlanningError("insufficient_hours");
		}

		return Object.freeze({ series, generatedSchedules });
	}

	static planUpdate(input: {
		existingSeries: RecurringScheduleSeriesSnapshot;
		effectiveDate: string;
		type?: ScheduleType;
		notes?: string;
		scheduleItems: readonly RecurringScheduleItemInput[];
		remainingSeconds: bigint;
		replaceableSchedules: readonly RecurringScheduleCandidate[];
	}): RecurringScheduleUpdatePlan {
		const replacementSchedules = input.replaceableSchedules.filter((schedule) =>
			RecurringSchedulePlanner.matchesExistingSeries(
				schedule,
				input.existingSeries,
				input.effectiveDate,
			),
		);
		const replacementScheduleIds = Object.freeze(
			replacementSchedules.map((schedule) => schedule.id),
		);
		const releasedSeconds = replacementSchedules.reduce(
			(total, schedule) =>
				schedule.status === "SCHEDULED"
					? total + schedule.durationSeconds
					: total,
			0n,
		);
		const series = freezeSeries({
			classId: input.existingSeries.classId,
			startDate: input.effectiveDate,
			notes:
				input.notes === undefined ? input.existingSeries.notes : input.notes,
			type: input.type ?? input.existingSeries.type,
			scheduleItems: toScheduleItemPlans(input.scheduleItems),
		});
		const generatedSchedules = RecurringSchedulePlanner.generateSchedules(
			series,
			input.remainingSeconds + releasedSeconds,
		);

		if (generatedSchedules.length === 0) {
			throw new RecurringSchedulePlanningError("insufficient_hours");
		}

		return Object.freeze({
			series,
			effectiveDate: input.effectiveDate,
			replacementScheduleIds,
			generatedSchedules,
		});
	}

	static assertNoOverlap(
		generatedSchedules: readonly RecurringScheduleOccurrencePlan[],
		existingSchedules: readonly RecurringScheduleExistingSchedule[],
		excludedScheduleIds: readonly string[] = [],
	): void {
		const excludedIds = new Set(excludedScheduleIds);
		const activeExistingSchedules = existingSchedules.filter(
			(schedule) =>
				activeScheduleStatuses.includes(schedule.status) &&
				!excludedIds.has(schedule.id),
		);
		const conflictDates = new Set<string>();

		for (let index = 0; index < generatedSchedules.length; index += 1) {
			const generatedSchedule = generatedSchedules[index];
			if (!generatedSchedule) continue;

			for (
				let nextIndex = index + 1;
				nextIndex < generatedSchedules.length;
				nextIndex += 1
			) {
				const nextGeneratedSchedule = generatedSchedules[nextIndex];
				if (
					nextGeneratedSchedule &&
					generatedSchedule.date === nextGeneratedSchedule.date &&
					overlaps(generatedSchedule, nextGeneratedSchedule)
				) {
					conflictDates.add(generatedSchedule.date);
				}
			}

			for (const existingSchedule of activeExistingSchedules) {
				if (
					generatedSchedule.date === existingSchedule.date &&
					overlaps(generatedSchedule, existingSchedule)
				) {
					conflictDates.add(generatedSchedule.date);
				}
			}
		}

		if (conflictDates.size > 0) {
			throw new RecurringSchedulePlanningError(
				"overlap",
				[...conflictDates].sort(),
			);
		}
	}

	private static matchesExistingSeries(
		schedule: RecurringScheduleCandidate,
		series: RecurringScheduleSeriesSnapshot,
		effectiveDate: string,
	): boolean {
		if (!replaceableScheduleStatuses.includes(schedule.status)) {
			return false;
		}

		if (
			DateTime.fromDateOnlyString(schedule.date).isBefore(
				DateTime.fromDateOnlyString(effectiveDate),
			)
		) {
			return false;
		}

		if (schedule.recurringScheduleId === series.id) {
			return true;
		}

		if (schedule.recurringScheduleId) {
			return false;
		}

		if (
			DateTime.fromDateOnlyString(schedule.date).isBefore(
				DateTime.fromDateOnlyString(series.startDate),
			)
		) {
			return false;
		}

		const scheduleWeekday = DateTime.fromDateOnlyString(
			schedule.date,
		).getWeekdayIndex();
		return series.scheduleItems.some(
			(item) =>
				weekdayIndexes[item.weekday] === scheduleWeekday &&
				item.time === schedule.time &&
				item.durationSeconds === schedule.durationSeconds,
		);
	}

	private static generateSchedules(
		series: RecurringScheduleSeriesPlan,
		remainingSeconds: bigint,
	): readonly RecurringScheduleOccurrencePlan[] {
		const generatedSchedules: RecurringScheduleOccurrencePlan[] = [];
		let currentDate = DateTime.fromDateOnlyString(series.startDate);
		let availableSeconds = remainingSeconds > 0n ? remainingSeconds : 0n;
		if (series.scheduleItems.length === 0) {
			return Object.freeze(generatedSchedules);
		}

		while (availableSeconds > 0n) {
			const itemsForDate = series.scheduleItems
				.filter(
					(item) =>
						weekdayIndexes[item.weekday] === currentDate.getWeekdayIndex(),
				)
				.toSorted((left, right) => left.time - right.time);

			for (const item of itemsForDate) {
				if (item.durationSeconds > availableSeconds) {
					return Object.freeze(generatedSchedules);
				}

				generatedSchedules.push(
					Object.freeze({
						classId: series.classId,
						date: currentDate.toDateOnlyString(),
						time: item.time,
						durationSeconds: item.durationSeconds,
						type: series.type,
					}),
				);
				availableSeconds -= item.durationSeconds;
			}

			currentDate = currentDate.addDays(1);
		}

		return Object.freeze(generatedSchedules);
	}
}

function toScheduleItemPlans(
	items: readonly RecurringScheduleItemInput[],
): readonly RecurringScheduleItemPlan[] {
	return Object.freeze(
		items.map((item) =>
			Object.freeze({
				weekday: item.weekday,
				time: item.time,
				durationSeconds: minutesToSeconds(item.durationMinutes),
			}),
		),
	);
}

function freezeSeries(series: {
	classId: string;
	startDate: string;
	notes: string | null;
	type: ScheduleType;
	scheduleItems: readonly RecurringScheduleItemPlan[];
}): RecurringScheduleSeriesPlan {
	return Object.freeze({
		...series,
		scheduleItems: Object.freeze([...series.scheduleItems]),
	});
}

function overlaps(
	left: Pick<RecurringScheduleOccurrencePlan, "time" | "durationSeconds">,
	right: Pick<
		RecurringScheduleOccurrencePlan | RecurringScheduleExistingSchedule,
		"time" | "durationSeconds"
	>,
): boolean {
	const leftStart = BigInt(left.time) * 60n;
	const leftEnd = leftStart + left.durationSeconds;
	const rightStart = BigInt(right.time) * 60n;
	const rightEnd = rightStart + right.durationSeconds;
	return leftStart < rightEnd && rightStart < leftEnd;
}
