import {
	addWeeks,
	compareAsc as compareDatesAsc,
	eachDayOfInterval,
	endOfWeek,
	format,
	getDay,
	isBefore as isBeforeDate,
	isSameDay,
	isToday,
	isValid,
	isYesterday,
	parseISO,
	startOfWeek,
	subWeeks,
} from "date-fns";
import type { Day, Locale } from "date-fns";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type DateTimeInput = string | Date | DateTime;
export type DateTimeFormatOptions = { locale?: Partial<Locale> };

export class DateTime {
	private readonly dateTime: Date;

	private constructor(input: DateTimeInput) {
		this.dateTime = DateTime.toInternalDate(input);
	}

	static from(input: DateTimeInput): DateTime {
		return new DateTime(input);
	}

	static fromDateOnlyString(value: string): DateTime {
		if (!DATE_ONLY_REGEX.test(value)) {
			throw new Error(`Expected a YYYY-MM-DD date-only value, received: ${value}`);
		}
		return new DateTime(parseISO(value));
	}

	static tryFromDateOnlyString(value: string | undefined): DateTime | undefined {
		if (!value || !DATE_ONLY_REGEX.test(value)) return undefined;
		const date = parseISO(value);
		return isValid(date) ? new DateTime(date) : undefined;
	}

	static now(): DateTime {
		return new DateTime(new Date());
	}

	static today(): DateTime {
		return DateTime.now();
	}

	static getWeekDates(date: DateTimeInput, weekStartsOn: Day = 1): DateTime[] {
		const start = startOfWeek(DateTime.from(date).dateTime, { weekStartsOn });
		const end = endOfWeek(start, { weekStartsOn });
		return eachDayOfInterval({ start, end }).map((day) => new DateTime(day));
	}

	static formatDurationHours(hours: number): string {
		return new Intl.NumberFormat(undefined, {
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		}).format(hours);
	}

	toDate(): Date {
		return new Date(this.dateTime);
	}

	toDateOnlyString(): string {
		return format(this.dateTime, "yyyy-MM-dd");
	}

	format(pattern: string, options?: DateTimeFormatOptions): string {
		return format(this.dateTime, pattern, {
			locale: options?.locale as Locale | undefined,
		});
	}

	addWeeks(weeks: number): DateTime {
		return new DateTime(addWeeks(this.dateTime, weeks));
	}

	subWeeks(weeks: number): DateTime {
		return new DateTime(subWeeks(this.dateTime, weeks));
	}

	startOfWeek(weekStartsOn: Day = 1): DateTime {
		return new DateTime(startOfWeek(this.dateTime, { weekStartsOn }));
	}

	isBefore(other: DateTimeInput): boolean {
		return isBeforeDate(this.dateTime, DateTime.from(other).dateTime);
	}

	isSameDay(other: DateTimeInput): boolean {
		return isSameDay(this.dateTime, DateTime.from(other).dateTime);
	}

	isToday(): boolean {
		return isToday(this.dateTime);
	}

	isYesterday(): boolean {
		return isYesterday(this.dateTime);
	}

	compareAsc(other: DateTimeInput): number {
		return compareDatesAsc(this.dateTime, DateTime.from(other).dateTime);
	}

	getWeekdayIndex(): number {
		return getDay(this.dateTime);
	}

	private static toInternalDate(input: DateTimeInput): Date {
		if (input instanceof DateTime) return input.toDate();
		if (input instanceof Date) return new Date(input);
		return DATE_ONLY_REGEX.test(input)
			? DateTime.fromDateOnlyString(input).toDate()
			: parseISO(input);
	}
}
