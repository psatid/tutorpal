import { CalendarCheck2, MapPin, Monitor } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import { DateTime } from "@/lib/date-time";
import { formatTime24Hour, statusColors } from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";

const MINUTES_PER_DAY = 24 * 60;
const DEFAULT_START_MINUTES = 6 * 60;
const DEFAULT_END_MINUTES = 22 * 60;
const MINUTES_PER_HOUR = 60;
const HOUR_HEIGHT = 48;
const MIN_EVENT_HEIGHT = 44;
const DAY_COLUMN_MIN_WIDTH = 144;
const TIME_COLUMN_WIDTH = 56;

interface WeeklyScheduleTimelineProps {
  selectedDate: Date;
  schedules: GetV1Schedules200Item[];
  onViewSchedule: (schedule: GetV1Schedules200Item) => void;
}

interface TimelineBounds {
  startMinutes: number;
  endMinutes: number;
}

interface PositionedSchedule {
  lane: number;
  laneCount: number;
  schedule: GetV1Schedules200Item;
}

function getTimelineBounds(schedules: GetV1Schedules200Item[]): TimelineBounds {
  let startMinutes = DEFAULT_START_MINUTES;
  let endMinutes = DEFAULT_END_MINUTES;

  for (const schedule of schedules) {
    const scheduleEnd = schedule.time + schedule.durationMinutes;
    startMinutes = Math.min(
      startMinutes,
      Math.floor(schedule.time / MINUTES_PER_HOUR) * MINUTES_PER_HOUR,
    );
    endMinutes = Math.max(
      endMinutes,
      Math.ceil(scheduleEnd / MINUTES_PER_HOUR) * MINUTES_PER_HOUR,
    );
  }

  return {
    startMinutes: Math.max(0, startMinutes),
    endMinutes: Math.min(MINUTES_PER_DAY, endMinutes),
  };
}

function getDateKey(date: Date): string {
  return DateTime.from(date).toDateOnlyString();
}

function getScheduleEnd(schedule: GetV1Schedules200Item): number {
  return schedule.time + schedule.durationMinutes;
}

function getPositionedSchedules(
  schedules: GetV1Schedules200Item[],
): PositionedSchedule[] {
  const sortedSchedules = [...schedules].sort((first, second) => {
    if (first.time !== second.time) return first.time - second.time;
    return getScheduleEnd(second) - getScheduleEnd(first);
  });
  const laneEndTimes: number[] = [];
  const assignments = sortedSchedules.map((schedule) => {
    const lane = laneEndTimes.findIndex(
      (laneEndTime) => laneEndTime <= schedule.time,
    );

    if (lane === -1) {
      laneEndTimes.push(getScheduleEnd(schedule));
      return { lane: laneEndTimes.length - 1, schedule };
    }

    laneEndTimes[lane] = getScheduleEnd(schedule);
    return { lane, schedule };
  });

  return assignments.map(({ lane, schedule }) => {
    const overlappingLanes = new Set(
      assignments
        .filter(({ schedule: otherSchedule }) => {
          return (
            otherSchedule.time < getScheduleEnd(schedule) &&
            schedule.time < getScheduleEnd(otherSchedule)
          );
        })
        .map((assignment) => assignment.lane),
    );
    const orderedOverlappingLanes = [...overlappingLanes].sort(
      (first, second) => first - second,
    );

    return {
      lane: Math.max(0, orderedOverlappingLanes.indexOf(lane)),
      laneCount: Math.max(1, orderedOverlappingLanes.length),
      schedule,
    };
  });
}

function ScheduleBlock({
  bounds,
  item,
  onView,
}: {
  bounds: TimelineBounds;
  item: PositionedSchedule;
  onView: () => void;
}) {
  const { t } = useTranslation(["schedules"]);
  const { schedule } = item;
  const scheduleType = schedule.type ?? "ON_SITE";
  const ScheduleTypeIcon = scheduleType === "ONLINE" ? Monitor : MapPin;
  const eventStart = Math.max(schedule.time, bounds.startMinutes);
  const eventEnd = Math.min(
    Math.max(schedule.time + schedule.durationMinutes, eventStart),
    bounds.endMinutes,
  );
  const top =
    ((eventStart - bounds.startMinutes) / MINUTES_PER_HOUR) * HOUR_HEIGHT;
  const height = Math.max(
    MIN_EVENT_HEIGHT,
    ((eventEnd - eventStart) / MINUTES_PER_HOUR) * HOUR_HEIGHT,
  );
  const width = 100 / item.laneCount;
  const left = item.lane * width;
  const statusClassName =
    statusColors[schedule.status]?.className ??
    statusColors.SCHEDULED.className;
  const StatusIcon = statusColors[schedule.status]?.icon ?? CalendarCheck2;
  const dateLabel = DateTime.formatDate(schedule.date, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const startTime = formatTime24Hour(schedule.time);
  const endTime = formatTime24Hour(getScheduleEnd(schedule));

  return (
    <button
      aria-label={t("schedules:timeline.eventLabel", {
        className: schedule.className,
        date: dateLabel,
        startTime,
        endTime,
        status: t(`schedules:status.${schedule.status}`),
        type: t(`schedules:type.${scheduleType}`),
      })}
      className={cn(
        "absolute z-10 flex min-w-0 flex-col items-start overflow-hidden rounded-lg border border-current/20 px-2 py-1.5 text-left text-xs leading-tight transition-[filter,transform] hover:brightness-[0.97] focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 active:translate-y-px motion-reduce:transition-none",
        statusClassName,
      )}
      onClick={onView}
      style={{
        height: `${height}px`,
        left: `calc(${left}% + 2px)`,
        top: `${top}px`,
        width: `calc(${width}% - 4px)`,
      }}
      type="button"
    >
      <span className="flex w-full min-w-0 items-center gap-1 font-semibold">
        <span className="min-w-0 truncate">{schedule.className}</span>
        <StatusIcon aria-hidden="true" className="size-3 shrink-0" />
        <ScheduleTypeIcon aria-hidden="true" className="size-3 shrink-0" />
      </span>
      <span className="mt-0.5 truncate tabular-nums opacity-80">
        {startTime}–{endTime}
      </span>
    </button>
  );
}

export function WeeklyScheduleTimeline({
  selectedDate,
  schedules,
  onViewSchedule,
}: WeeklyScheduleTimelineProps) {
  const { t } = useTranslation(["schedules"]);
  const weekDates = useMemo(
    () => DateTime.getWeekDates(selectedDate).map((date) => date.toDate()),
    [selectedDate],
  );
  const bounds = useMemo(() => getTimelineBounds(schedules), [schedules]);
  const hourCount = Math.max(
    1,
    (bounds.endMinutes - bounds.startMinutes) / MINUTES_PER_HOUR,
  );
  const timelineHeight = hourCount * HOUR_HEIGHT;
  const hours = Array.from({ length: Math.ceil(hourCount) + 1 }, (_, index) => {
    return bounds.startMinutes + index * MINUTES_PER_HOUR;
  }).filter((minutes) => minutes <= bounds.endMinutes);
  const schedulesByDate = useMemo(() => {
    const grouped = new Map<string, GetV1Schedules200Item[]>();

    for (const schedule of schedules) {
      const current = grouped.get(schedule.date) ?? [];
      current.push(schedule);
      grouped.set(schedule.date, current);
    }

    return grouped;
  }, [schedules]);

  return (
    <section
      aria-label={t("schedules:timeline.label")}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain border-y border-border bg-card touch-pan-x touch-pan-y">
        <div
          className="min-w-266"
          style={{
            width: `max(100%, ${TIME_COLUMN_WIDTH + DAY_COLUMN_MIN_WIDTH * 7}px)`,
          }}
        >
          <div
            className="sticky top-0 z-30 grid border-b border-border bg-card"
            style={{
              gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(7, minmax(${DAY_COLUMN_MIN_WIDTH}px, 1fr))`,
            }}
          >
            <div className="sticky left-0 top-0 z-40 border-r border-border bg-card" />
            {weekDates.map((date) => {
              const dateTime = DateTime.from(date);
              const isToday = dateTime.isToday();
              const isSelected = dateTime.isSameDay(selectedDate);

              return (
                <div
                  aria-current={isSelected ? "date" : undefined}
                  className={cn(
                    "min-w-0 border-r border-border px-2 py-3 text-center last:border-r-0",
                    isToday && "bg-primary/5",
                  )}
                  key={getDateKey(date)}
                >
                  <div
                    className={cn(
                      "text-xs font-semibold uppercase tracking-[0.04em] text-muted-foreground",
                      isToday && "text-primary",
                    )}
                  >
                    {DateTime.formatDate(date, { weekday: "short" })}
                  </div>
                  <div
                    className={cn(
                      "mt-1 text-lg font-medium tabular-nums text-foreground",
                      isSelected && "text-primary",
                    )}
                  >
                    {DateTime.formatDate(date, { day: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(7, minmax(${DAY_COLUMN_MIN_WIDTH}px, 1fr))`,
            }}
          >
            <div
              aria-hidden="true"
              className="sticky left-0 z-20 border-r border-border bg-card"
              style={{ height: `${timelineHeight}px` }}
            >
              {hours.map((minutes) => {
                const top =
                  ((minutes - bounds.startMinutes) / MINUTES_PER_HOUR) *
                  HOUR_HEIGHT;

                return (
                  <span
                    className={cn(
                      "absolute right-2 text-[11px] tabular-nums text-muted-foreground",
                      minutes === bounds.startMinutes
                        ? "translate-y-1"
                        : "-translate-y-1/2",
                    )}
                    key={minutes}
                    style={{ top: `${top}px` }}
                  >
                    {formatTime24Hour(minutes)}
                  </span>
                );
              })}
            </div>

            {weekDates.map((date) => {
              const dateKey = getDateKey(date);
              const dateSchedules = schedulesByDate.get(dateKey) ?? [];
              const positionedSchedules = getPositionedSchedules(dateSchedules);

              return (
                <div
                  className={cn(
                    "relative border-r border-border last:border-r-0",
                    DateTime.from(date).isToday() && "bg-primary/2",
                  )}
                  key={dateKey}
                  style={{ height: `${timelineHeight}px` }}
                >
                  {hours.map((minutes) => {
                    const top =
                      ((minutes - bounds.startMinutes) / MINUTES_PER_HOUR) *
                      HOUR_HEIGHT;

                    return (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 border-t border-border/70"
                        key={minutes}
                        style={{ top: `${top}px` }}
                      />
                    );
                  })}
                  {positionedSchedules.map((item) => (
                    <ScheduleBlock
                      bounds={bounds}
                      item={item}
                      key={item.schedule.id}
                      onView={() => onViewSchedule(item.schedule)}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
