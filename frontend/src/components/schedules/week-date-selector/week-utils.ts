import { DateTime } from "@/lib/date-time";

const WEEK_DAYS = 7;

export function getWeekStart(date: Date): Date {
  return DateTime.from(date).startOfWeek().toDate();
}

export function getWeekdayOffset(date: Date): number {
  return (DateTime.from(date).getWeekdayIndex() + 6) % WEEK_DAYS;
}

export function getDateInWeek(weekStart: Date, weekdayOffset: number): Date {
  return DateTime.getWeekDates(weekStart)[weekdayOffset]!.toDate();
}

export function isSameWeek(first: Date, second: Date): boolean {
  return DateTime.from(getWeekStart(first)).isSameDay(getWeekStart(second));
}

export function formatWeekRange(
  startDate: Date,
  endDate: Date,
  includeYear = false,
): string {
  const shouldIncludeYear =
    includeYear || startDate.getFullYear() !== endDate.getFullYear();

  return DateTime.formatDateRange(startDate, endDate, {
    month: "short",
    day: "numeric",
    ...(shouldIncludeYear ? { year: "numeric" } : {}),
  });
}
