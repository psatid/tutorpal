import {
	addDays,
	addHours,
	compareAsc as compareDatesAsc,
	getDay,
	isBefore as isBeforeDate,
	parseISO,
} from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const SCHEDULE_TIME_ZONE = "Asia/Bangkok";

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

	static fromBangkokDateAndMinutes(
		date: string,
		minutesAfterMidnight: number,
	): DateTime {
		const hours = Math.floor(minutesAfterMidnight / 60);
		const minutes = minutesAfterMidnight % 60;
		return new DateTime(
			fromZonedTime(
				`${date}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`,
				SCHEDULE_TIME_ZONE,
			),
		);
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

	toBangkokDateAndMinutes(): { date: string; time: number } {
		const date = formatInTimeZone(
			this.dateTime,
			SCHEDULE_TIME_ZONE,
			"yyyy-MM-dd",
		);
		const time =
			Number(formatInTimeZone(this.dateTime, SCHEDULE_TIME_ZONE, "H")) * 60 +
			Number(formatInTimeZone(this.dateTime, SCHEDULE_TIME_ZONE, "m"));
		return { date, time };
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
