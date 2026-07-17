import {
	addDays,
	addHours,
	compareAsc as compareDatesAsc,
	getDay,
	isBefore as isBeforeDate,
	parseISO,
} from "date-fns";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export type DateTimeInput = string | Date | DateTime;

export class DateTime {
	private readonly dateTime: Date;

	private constructor(input: DateTimeInput) {
		this.dateTime = DateTime.toInternalDate(input);
	}

	static from(input: DateTimeInput): DateTime {
		return new DateTime(input);
	}

	static fromDateOnlyString(value: string): DateTime {
		return new DateTime(DateTime.parseDateOnlyString(value));
	}

	static today(): DateTime {
		return DateTime.now();
	}

	static todayDateOnlyString(): string {
		return DateTime.today().toDateOnlyString();
	}

	static now(): DateTime {
		return new DateTime(new Date());
	}

	toDate(): Date {
		return new Date(this.dateTime);
	}

	toDateOnlyString(): string {
		const year = this.dateTime.getUTCFullYear();
		const month = String(this.dateTime.getUTCMonth() + 1).padStart(2, "0");
		const day = String(this.dateTime.getUTCDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	}

	toISOString(): string {
		return this.dateTime.toISOString();
	}

	addDays(days: number): DateTime {
		return new DateTime(addDays(this.dateTime, days));
	}

	addHours(hours: number): DateTime {
		return new DateTime(addHours(this.dateTime, hours));
	}

	isBefore(other: DateTimeInput): boolean {
		return isBeforeDate(this.dateTime, DateTime.from(other).dateTime);
	}

	compareAsc(other: DateTimeInput): number {
		return compareDatesAsc(this.dateTime, DateTime.from(other).dateTime);
	}

	getWeekdayIndex(): number {
		return getDay(this.dateTime);
	}

	private static toInternalDate(input: DateTimeInput): Date {
		if (input instanceof DateTime) {
			return input.toDate();
		}

		if (input instanceof Date) {
			return new Date(input);
		}

		if (DATE_ONLY_REGEX.test(input)) {
			return DateTime.parseDateOnlyString(input);
		}

		return parseISO(input);
	}

	private static parseDateOnlyString(value: string): Date {
		return parseISO(`${value}T00:00:00.000Z`);
	}
}
