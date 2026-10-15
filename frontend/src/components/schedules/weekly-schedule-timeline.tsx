import {
  CalendarCheckIn01Icon as CalendarCheck2HugeIcon,
  MapPinIcon as MapPinHugeIcon,
  ComputerIcon as MonitorHugeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useTranslation } from "react-i18next";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import { DateTime } from "@/lib/date-time";
import { formatTime24Hour, statusColors } from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_SLOT = 30;
const HOUR_HEIGHT = 88;
const SLOT_HEIGHT = 44;
const MIN_EVENT_HEIGHT = SLOT_HEIGHT;
const TIME_COLUMN_WIDTH = 56;
const DEFAULT_CREATE_TIME = 9 * MINUTES_PER_HOUR;
const TOUCH_SCROLL_THRESHOLD = 8;
const MILLISECONDS_PER_MINUTE = 60 * 1000;
const FULL_DAY_BOUNDS = {
  startMinutes: 0,
  endMinutes: MINUTES_PER_DAY,
};
const HOUR_INTERVALS = Array.from(
  { length: MINUTES_PER_DAY / MINUTES_PER_HOUR },
  (_, index) => index * MINUTES_PER_HOUR,
);
const HOUR_DIVIDERS = Array.from(
  { length: HOUR_INTERVALS.length + 1 },
  (_, index) => index * MINUTES_PER_HOUR,
);
const HALF_HOUR_DIVIDERS = HOUR_INTERVALS.map(
  (minutes) => minutes + MINUTES_PER_SLOT,
);
const TIME_SLOTS = Array.from(
  { length: MINUTES_PER_DAY / MINUTES_PER_SLOT },
  (_, index) => index * MINUTES_PER_SLOT,
);
const statusBlockClasses: Record<GetV1Schedules200Item["status"], string> = {
  SCHEDULED:
    "border-info/25 bg-info-container text-info-container-foreground dark:border-info/40",
  COMPLETED:
    "border-success/25 bg-success-container text-success-container-foreground dark:border-success/40",
  NO_SHOW:
    "border-warning/25 bg-warning-container text-warning-container-foreground dark:border-warning/40",
  CANCELLED:
    "border-destructive/25 bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-destructive/20",
};

interface WeeklyScheduleTimelineProps {
  selectedDate: Date;
  schedules: GetV1Schedules200Item[];
  onCreateSchedule: (
    date: Date,
    time: number,
    trigger: HTMLButtonElement,
  ) => void;
  onViewSchedule: (
    schedule: GetV1Schedules200Item,
    trigger: HTMLButtonElement,
  ) => void;
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

interface TimelineCell {
  dateKey: string;
  time: number;
}

interface TouchCellGesture {
  key: string;
  pointerId: number;
  startX: number;
  startY: number;
  hasMoved: boolean;
}

function getDateKey(date: Date): string {
  return DateTime.from(date).toDateOnlyString();
}

function formatTimelineHour(minutes: number): string {
  return DateTime.formatDate(
    new Date(2000, 0, 1, Math.floor(minutes / MINUTES_PER_HOUR)),
    { hour: "numeric", hour12: true },
  );
}

function formatTimelineTime(minutes: number): string {
  return DateTime.formatDate(
    new Date(
      2000,
      0,
      1,
      Math.floor(minutes / MINUTES_PER_HOUR),
      minutes % MINUTES_PER_HOUR,
    ),
    { hour: "numeric", hour12: true, minute: "2-digit" },
  );
}

function getCellKey(dateKey: string, time: number): string {
  return `${dateKey}-${time}`;
}

function hasTouchGestureExceededTapThreshold(
  gesture: TouchCellGesture,
  point: { clientX: number; clientY: number },
): boolean {
  return (
    Math.hypot(
      point.clientX - gesture.startX,
      point.clientY - gesture.startY,
    ) >= TOUCH_SCROLL_THRESHOLD
  );
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
  onView: (trigger: HTMLButtonElement) => void;
}) {
  const { t } = useTranslation(["schedules"]);
  const { schedule } = item;
  const scheduleType = schedule.type ?? "ON_SITE";
  const ScheduleTypeIcon = scheduleType === "ONLINE" ? MonitorHugeIcon : MapPinHugeIcon;
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
  const StatusIcon = statusColors[schedule.status]?.icon ?? CalendarCheck2HugeIcon;
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
        "absolute z-10 flex min-w-0 flex-col items-start overflow-hidden rounded-lg border px-2 py-1.5 text-left text-xs leading-tight transition-[filter,transform] hover:brightness-[0.97] focus-visible:z-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transition-none",
        statusBlockClasses[schedule.status],
      )}
      onClick={(event) => onView(event.currentTarget)}
      style={{
        height: `${height}px`,
        left: `calc(${left}%)`,
        top: `${top}px`,
        width: `calc(${width}%)`,
      }}
      type="button"
    >
      <span className="w-full min-w-0 truncate font-semibold">
        {schedule.className}
      </span>
      <span className="mt-0.5 flex min-w-0 items-center gap-1">
        <span className="min-w-0 truncate tabular-nums">
          {startTime}–{endTime}
        </span>
      </span>
      <div className="mt-0.5 flex min-w-0 items-center gap-1">
        <HugeiconsIcon
          aria-hidden="true"
          className="size-3 shrink-0"
          icon={StatusIcon}
          strokeWidth={2}
        />
        <HugeiconsIcon
          aria-hidden="true"
          className="size-3 shrink-0"
          icon={ScheduleTypeIcon}
          strokeWidth={2}
        />
      </div>
    </button>
  );
}

export function WeeklyScheduleTimeline({
  selectedDate,
  schedules,
  onCreateSchedule,
  onViewSchedule,
}: WeeklyScheduleTimelineProps) {
  const { t } = useTranslation(["schedules"]);
  const instructionsId = useId();
  const cellRefs = useRef(new Map<string, HTMLButtonElement>());
  const touchGestureRef = useRef<TouchCellGesture | null>(null);
  const suppressedTouchClickRef = useRef<string | null>(null);
  const weekDates = useMemo(
    () => DateTime.getWeekDates(selectedDate).map((date) => date.toDate()),
    [selectedDate],
  );
  const bounds = FULL_DAY_BOUNDS;
  const timelineHeight = HOUR_INTERVALS.length * HOUR_HEIGHT;
  const selectedDateKey = getDateKey(selectedDate);
  const [activeCell, setActiveCell] = useState<TimelineCell>(() => ({
    dateKey: selectedDateKey,
    time: DEFAULT_CREATE_TIME,
  }));
  const [currentTime, setCurrentTime] = useState(() => DateTime.now().toDate());
  const timelineSchedules = useMemo(
    () =>
      schedules.filter(
        (schedule) =>
          schedule.status !== "CANCELLED" && schedule.status !== "NO_SHOW",
      ),
    [schedules],
  );
  const schedulesByDate = useMemo(() => {
    const grouped = new Map<string, GetV1Schedules200Item[]>();

    for (const schedule of timelineSchedules) {
      const current = grouped.get(schedule.date) ?? [];
      current.push(schedule);
      grouped.set(schedule.date, current);
    }

    return grouped;
  }, [timelineSchedules]);

  useEffect(() => {
    setActiveCell({
      dateKey: selectedDateKey,
      time: DEFAULT_CREATE_TIME,
    });
  }, [selectedDateKey]);

  useEffect(() => {
    let intervalId: ReturnType<typeof window.setInterval> | undefined;
    const updateCurrentTime = () => setCurrentTime(DateTime.now().toDate());
    const now = DateTime.now().toDate();
    const delay =
      MILLISECONDS_PER_MINUTE -
      (now.getSeconds() * 1000 + now.getMilliseconds());
    const timeoutId = window.setTimeout(() => {
      updateCurrentTime();
      intervalId = window.setInterval(
        updateCurrentTime,
        MILLISECONDS_PER_MINUTE,
      );
    }, delay);

    return () => {
      window.clearTimeout(timeoutId);

      if (intervalId !== undefined) {
        window.clearInterval(intervalId);
      }
    };
  }, []);

  const currentDateKey = getDateKey(currentTime);
  const currentMinutes =
    currentTime.getHours() * MINUTES_PER_HOUR + currentTime.getMinutes();

  const focusCell = (dateIndex: number, slotIndex: number) => {
    const date = weekDates[dateIndex];
    const time = TIME_SLOTS[slotIndex];

    if (!date || time === undefined) return;

    const cell = cellRefs.current.get(getCellKey(getDateKey(date), time));
    cell?.focus({ preventScroll: true });
    cell?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const handleCellKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    cell: TimelineCell,
  ) => {
    const dateIndex = weekDates.findIndex(
      (date) => getDateKey(date) === cell.dateKey,
    );
    const slotIndex = TIME_SLOTS.indexOf(cell.time);

    if (dateIndex === -1 || slotIndex === -1) return;

    let nextDateIndex = dateIndex;
    let nextSlotIndex = slotIndex;

    switch (event.key) {
      case "ArrowLeft":
        nextDateIndex = Math.max(0, dateIndex - 1);
        break;
      case "ArrowRight":
        nextDateIndex = Math.min(weekDates.length - 1, dateIndex + 1);
        break;
      case "ArrowUp":
        nextSlotIndex = Math.max(0, slotIndex - 1);
        break;
      case "ArrowDown":
        nextSlotIndex = Math.min(TIME_SLOTS.length - 1, slotIndex + 1);
        break;
      default:
        return;
    }

    event.preventDefault();

    if (nextDateIndex === dateIndex && nextSlotIndex === slotIndex) return;

    const nextDate = weekDates[nextDateIndex];
    const nextTime = TIME_SLOTS[nextSlotIndex];

    if (!nextDate || nextTime === undefined) return;

    setActiveCell({ dateKey: getDateKey(nextDate), time: nextTime });
    focusCell(nextDateIndex, nextSlotIndex);
  };

  const handleCellPointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
    cellKey: string,
  ) => {
    if (event.pointerType !== "touch" || !event.isPrimary) {
      suppressedTouchClickRef.current = null;
      return;
    }

    suppressedTouchClickRef.current = null;
    touchGestureRef.current = {
      key: cellKey,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      hasMoved: false,
    };
  };

  const handleCellPointerMove = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const gesture = touchGestureRef.current;

    if (!gesture || gesture.pointerId !== event.pointerId || gesture.hasMoved) {
      return;
    }

    gesture.hasMoved = hasTouchGestureExceededTapThreshold(gesture, event);
  };

  const handleCellPointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const gesture = touchGestureRef.current;

    if (!gesture || gesture.pointerId !== event.pointerId) return;

    touchGestureRef.current = null;

    if (
      gesture.hasMoved ||
      hasTouchGestureExceededTapThreshold(gesture, event)
    ) {
      suppressedTouchClickRef.current = gesture.key;
    }
  };

  const handleCellPointerCancel = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    const gesture = touchGestureRef.current;

    if (!gesture || gesture.pointerId !== event.pointerId) return;

    touchGestureRef.current = null;
    suppressedTouchClickRef.current = gesture.key;
  };

  return (
    <section
      aria-describedby={instructionsId}
      aria-label={t("schedules:timeline.label")}
      className="flex min-h-0 min-w-0 flex-1 flex-col"
    >
      <p className="sr-only" id={instructionsId}>
        {t("schedules:timeline.instruction")}
      </p>
      <div className="min-h-0 min-w-0 flex-1 overflow-auto overscroll-contain border-y border-border bg-card">
        <div
          className="min-w-196 [--day-column-min-width:104px] [--timeline-min-width:784px] sm:min-w-266 sm:[--day-column-min-width:144px] sm:[--timeline-min-width:1064px]"
          style={{
            width: "max(100%, var(--timeline-min-width))",
          }}
        >
          <div
            className="sticky top-0 z-30 grid border-b border-border bg-card"
            style={{
              gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(7, minmax(var(--day-column-min-width), 1fr))`,
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
                  <div className="mt-1 text-lg font-medium tabular-nums text-foreground">
                    {DateTime.formatDate(date, { day: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="grid"
            style={{
              gridTemplateColumns: `${TIME_COLUMN_WIDTH}px repeat(7, minmax(var(--day-column-min-width), 1fr))`,
            }}
          >
            <div
              aria-hidden="true"
              className="sticky left-0 z-20 border-r border-border bg-card"
              style={{ height: `${timelineHeight}px` }}
            >
              {HOUR_INTERVALS.map((minutes) => {
                const top = (minutes / MINUTES_PER_HOUR) * HOUR_HEIGHT;

                return (
                  <span
                    className={cn(
                      "absolute right-2 text-[11px] tabular-nums text-muted-foreground",
                      minutes === 0 ? "translate-y-1" : "-translate-y-1/2",
                    )}
                    key={minutes}
                    style={{ top: `${top}px` }}
                  >
                    {formatTimelineHour(minutes)}
                  </span>
                );
              })}
            </div>

            {weekDates.map((date) => {
              const dateKey = getDateKey(date);
              const dateSchedules = schedulesByDate.get(dateKey) ?? [];
              const positionedSchedules = getPositionedSchedules(dateSchedules);
              const isTodayColumn = dateKey === currentDateKey;
              const dateLabel = DateTime.formatDate(date, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  className={cn(
                    "relative border-r border-border last:border-r-0",
                    isTodayColumn && "bg-primary/2",
                  )}
                  key={dateKey}
                  style={{ height: `${timelineHeight}px` }}
                >
                  {TIME_SLOTS.map((minutes) => {
                    const cellKey = getCellKey(dateKey, minutes);
                    const isActiveCell =
                      activeCell.dateKey === dateKey &&
                      activeCell.time === minutes;
                    const cell = { dateKey, time: minutes };

                    return (
                      <div
                        className="absolute inset-x-0"
                        key={cellKey}
                        style={{
                          height: `${SLOT_HEIGHT}px`,
                          top: `${
                            (minutes / MINUTES_PER_HOUR) * HOUR_HEIGHT
                          }px`,
                        }}
                      >
                        <button
                          aria-label={t("schedules:timeline.createCellLabel", {
                            date: dateLabel,
                            time: formatTime24Hour(minutes),
                          })}
                          className="peer size-full cursor-pointer scroll-mt-16 transition-colors hover:bg-primary/5 focus-visible:outline-none active:bg-primary/10 motion-reduce:transition-none"
                          onClick={(event) => {
                            if (suppressedTouchClickRef.current === cellKey) {
                              suppressedTouchClickRef.current = null;
                              return;
                            }

                            onCreateSchedule(
                              date,
                              minutes,
                              event.currentTarget,
                            );
                          }}
                          onFocus={() => setActiveCell(cell)}
                          onKeyDown={(event) => handleCellKeyDown(event, cell)}
                          onPointerCancel={handleCellPointerCancel}
                          onPointerDown={(event) =>
                            handleCellPointerDown(event, cellKey)
                          }
                          onPointerMove={handleCellPointerMove}
                          onPointerUp={handleCellPointerUp}
                          data-timeline-active-cell={
                            isActiveCell ? "true" : undefined
                          }
                          ref={(element) => {
                            if (element) {
                              cellRefs.current.set(cellKey, element);
                            } else {
                              cellRefs.current.delete(cellKey);
                            }
                          }}
                          tabIndex={isActiveCell ? 0 : -1}
                          type="button"
                        />
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 z-20 hidden ring-[3px] ring-primary/35 ring-inset peer-focus-visible:block"
                        />
                      </div>
                    );
                  })}
                  {HOUR_DIVIDERS.map((minutes) => {
                    return (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-x-0 border-t border-border/70"
                        key={minutes}
                        style={{
                          top: `${
                            (minutes / MINUTES_PER_HOUR) * HOUR_HEIGHT
                          }px`,
                        }}
                      />
                    );
                  })}
                  {HALF_HOUR_DIVIDERS.map((minutes) => (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/45"
                      key={minutes}
                      style={{
                        top: `${(minutes / MINUTES_PER_HOUR) * HOUR_HEIGHT}px`,
                      }}
                    />
                  ))}
                  {positionedSchedules.map((item) => (
                    <ScheduleBlock
                      bounds={bounds}
                      item={item}
                      key={item.schedule.id}
                      onView={(trigger) =>
                        onViewSchedule(item.schedule, trigger)
                      }
                    />
                  ))}
                  {isTodayColumn ? (
                    <div
                      aria-label={t("schedules:timeline.currentTimeLabel", {
                        time: formatTimelineTime(currentMinutes),
                      })}
                      className="pointer-events-none absolute inset-x-0 z-20 h-0.5 bg-primary"
                      role="note"
                      style={{
                        top: `${
                          (currentMinutes / MINUTES_PER_HOUR) * HOUR_HEIGHT
                        }px`,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute right-0 top-1/2 size-2 translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
