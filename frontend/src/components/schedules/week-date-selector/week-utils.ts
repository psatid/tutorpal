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
  const start = DateTime.from(startDate);
  const end = DateTime.from(endDate);
  const isSameYear = start.format("yyyy") === end.format("yyyy");
  const isSameMonth = isSameYear && start.format("MM") === end.format("MM");

  if (!isSameYear) {
    return `${start.format("MMM d, yyyy")} – ${end.format("MMM d, yyyy")}`;
  }

  const yearSuffix = includeYear ? `, ${start.format("yyyy")}` : "";

  if (isSameMonth) {
    return `${start.format("MMM d")}–${end.format("d")}${yearSuffix}`;
  }

  return `${start.format("MMM d")} – ${end.format("MMM d")}${yearSuffix}`;
}
