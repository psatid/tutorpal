import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/form/date-field";
import { DateTime } from "@/lib/date-time";
import { WeekView } from "./week-view";
import { WeekdayView } from "./weekday-view";
import {
  formatWeekRange,
  getDateInWeek,
  getWeekStart,
  getWeekdayOffset,
  isSameWeek,
} from "./week-utils";

export interface WeekDateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  viewMode?: "day" | "week";
  className?: string;
}

const MAX_BUFFER_DAYS = 56;
const BUFFER_DAYS_BEFORE_SELECTED = 28;
const MAX_BUFFER_WEEKS = 8;
const BUFFER_WEEKS_BEFORE_SELECTED = 4;
const WEEK_DAYS = 7;
const INSTANT_CENTER: ScrollBehavior = "auto";
const SMOOTH_CENTER: ScrollBehavior = "smooth";

function getDateByDayOffset(date: Date, dayOffset: number): Date {
  const dateTime = DateTime.from(date);
  const weekdayIndex = (dateTime.getWeekdayIndex() + 6) % WEEK_DAYS;
  const targetDayIndex = weekdayIndex + dayOffset;
  const weekOffset = Math.floor(targetDayIndex / WEEK_DAYS);
  const targetWeekdayIndex =
    ((targetDayIndex % WEEK_DAYS) + WEEK_DAYS) % WEEK_DAYS;

  return DateTime.getWeekDates(dateTime.startOfWeek().addWeeks(weekOffset))[
    targetWeekdayIndex
  ]!.toDate();
}

function createDateBuffer(selectedDate: Date): Date[] {
  const startDate = getDateByDayOffset(
    selectedDate,
    -BUFFER_DAYS_BEFORE_SELECTED,
  );

  return Array.from({ length: MAX_BUFFER_DAYS }, (_, index) =>
    getDateByDayOffset(startDate, index),
  );
}

function createWeekBuffer(selectedDate: Date): Date[] {
  const selectedWeekStart = DateTime.from(selectedDate).startOfWeek();

  return Array.from({ length: MAX_BUFFER_WEEKS }, (_, index) =>
    selectedWeekStart
      .addWeeks(index - BUFFER_WEEKS_BEFORE_SELECTED)
      .toDate(),
  );
}

export function WeekDateSelector({
  selectedDate,
  onDateSelect,
  viewMode = "day",
  className,
}: WeekDateSelectorProps) {
  const { t } = useTranslation(["schedules"]);
  const prefersReducedMotion = useReducedMotion();
  const railSelectedDate = selectedDate ?? DateTime.today().toDate();
  const railSelectedDateKey =
    DateTime.from(railSelectedDate).toDateOnlyString();
  const railSelectedWeekStart = useMemo(
    () => getWeekStart(railSelectedDate),
    [railSelectedDateKey],
  );
  const railSelectedWeekKey = DateTime.from(
    railSelectedWeekStart,
  ).toDateOnlyString();
  const [dates, setDates] = useState<Date[]>(() =>
    createDateBuffer(railSelectedDate),
  );
  const [weekStarts, setWeekStarts] = useState<Date[]>(() =>
    createWeekBuffer(railSelectedDate),
  );
  const [centerRequest, setCenterRequest] = useState({
    id: 0,
    behavior: INSTANT_CENTER,
  });

  useLayoutEffect(() => {
    setDates((currentDates) => {
      const includesSelectedDate = currentDates.some((date) =>
        DateTime.from(date).isSameDay(railSelectedDate),
      );

      return includesSelectedDate
        ? currentDates
        : createDateBuffer(railSelectedDate);
    });
  }, [railSelectedDateKey]);

  useLayoutEffect(() => {
    setWeekStarts((currentWeekStarts) => {
      const includesSelectedWeek = currentWeekStarts.some((weekStart) =>
        isSameWeek(weekStart, railSelectedWeekStart),
      );

      return includesSelectedWeek
        ? currentWeekStarts
        : createWeekBuffer(railSelectedWeekStart);
    });
  }, [railSelectedWeekKey, railSelectedWeekStart]);

  const handleExtendDateBuffer = useCallback(
    (direction: "previous" | "next") => {
      setDates((currentDates) => {
        if (currentDates.length === 0) return currentDates;

        const edgeDate =
          direction === "previous" ? currentDates[0] : currentDates.at(-1);

        if (!edgeDate) return currentDates;

        const nextWeek = Array.from({ length: WEEK_DAYS }, (_, index) =>
          getDateByDayOffset(
            edgeDate,
            direction === "previous" ? index - WEEK_DAYS : index + 1,
          ),
        );
        const extendedDates =
          direction === "previous"
            ? [...nextWeek, ...currentDates]
            : [...currentDates, ...nextWeek];

        if (extendedDates.length <= MAX_BUFFER_DAYS) {
          return extendedDates;
        }

        return direction === "previous"
          ? extendedDates.slice(0, -WEEK_DAYS)
          : extendedDates.slice(WEEK_DAYS);
      });
    },
    [],
  );

  const handleExtendWeekBuffer = useCallback(
    (direction: "previous" | "next", count = 1) => {
      setWeekStarts((currentWeekStarts) => {
        if (currentWeekStarts.length === 0) return currentWeekStarts;

        let nextWeekStarts = currentWeekStarts;

        for (let index = 0; index < count; index += 1) {
          const edgeWeekStart =
            direction === "previous"
              ? nextWeekStarts[0]
              : nextWeekStarts.at(-1);

          if (!edgeWeekStart) return nextWeekStarts;

          const adjacentWeekStart = DateTime.from(edgeWeekStart)
            .addWeeks(direction === "previous" ? -1 : 1)
            .toDate();
          const extendedWeekStarts =
            direction === "previous"
              ? [adjacentWeekStart, ...nextWeekStarts]
              : [...nextWeekStarts, adjacentWeekStart];

          nextWeekStarts =
            direction === "previous"
              ? extendedWeekStarts.slice(0, -1)
              : extendedWeekStarts.slice(1);
        }

        return nextWeekStarts;
      });
    },
    [],
  );

  const requestCenter = useCallback((behavior: ScrollBehavior) => {
    setCenterRequest((request) => ({
      id: request.id + 1,
      behavior,
    }));
  }, []);

  const handleRestoreSelectedDate = useCallback(() => {
    setDates(createDateBuffer(railSelectedDate));
    requestCenter(INSTANT_CENTER);
  }, [railSelectedDateKey, requestCenter]);

  const handleRestoreSelectedWeek = useCallback(() => {
    setWeekStarts(createWeekBuffer(railSelectedWeekStart));
    requestCenter(INSTANT_CENTER);
  }, [railSelectedWeekKey, railSelectedWeekStart, requestCenter]);

  const monthLabel = DateTime.from(railSelectedDate).format("MMMM yyyy");
  const weekEnd = getDateInWeek(railSelectedWeekStart, WEEK_DAYS - 1);
  const weekLabel = formatWeekRange(railSelectedWeekStart, weekEnd, true);
  const periodLabel = viewMode === "week" ? weekLabel : monthLabel;
  const motionTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.25, 1, 0.5, 1] };

  const handleToday = () => {
    requestCenter(SMOOTH_CENTER);
    onDateSelect(DateTime.today().toDate());
  };

  const handleCalendarDateSelect = (date: Date) => {
    requestCenter(SMOOTH_CENTER);
    onDateSelect(date);
  };

  const handleDateFieldChange = (value: string) => {
    const date = DateTime.tryFromDateOnlyString(value)?.toDate();

    if (date) {
      const nextDate =
        viewMode === "week"
          ? getDateInWeek(getWeekStart(date), getWeekdayOffset(railSelectedDate))
          : date;

      handleCalendarDateSelect(nextDate);
    }
  };

  return (
    <div className={cn("mb-4", className)}>
      <div className="px-3 pt-3 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <DateField
              value={DateTime.from(railSelectedDate).toDateOnlyString()}
              onChange={handleDateFieldChange}
              selectionMode={viewMode === "week" ? "week" : "single"}
              ariaLabel={
                viewMode === "week"
                  ? t("schedules:weekSelector.openWeekCalendar", {
                      week: weekLabel,
                    })
                  : t("schedules:weekSelector.openCalendar", {
                      month: monthLabel,
                    })
              }
              trigger={
                <button
                  type="button"
                  className="group flex min-h-11 min-w-0 max-w-full items-center gap-1.5 rounded-full px-2 py-1.5 font-headline text-base font-semibold text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:bg-card sm:px-3"
                >
                  <motion.span
                    className="relative block min-w-0"
                    layout
                    transition={motionTransition}
                  >
                    <AnimatePresence initial={false} mode="popLayout">
                      <motion.span
                        key={viewMode}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{
                          opacity: prefersReducedMotion ? 1 : 0,
                          y: 0,
                        }}
                        initial={
                          prefersReducedMotion ? false : { opacity: 0, y: 2 }
                        }
                        transition={motionTransition}
                        className="block truncate"
                      >
                        {periodLabel}
                      </motion.span>
                    </AnimatePresence>
                  </motion.span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 transition-transform duration-150 group-data-[state=open]:rotate-180 group-aria-expanded:rotate-180 motion-reduce:transition-none"
                  />
                </button>
              }
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            leftIcon={CalendarDays}
            className="min-h-11 shrink-0 bg-card px-2 sm:px-3"
          >
            {t("schedules:weekSelector.today")}
          </Button>
        </div>
      </div>

      <div className="relative">
        <AnimatePresence initial={false} mode="popLayout">
          {viewMode === "day" ? (
            <motion.div
              key="day-rail"
              animate={{ opacity: 1 }}
              exit={{ opacity: prefersReducedMotion ? 1 : 0 }}
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              transition={motionTransition}
            >
              <WeekdayView
                dates={dates}
                selectedDate={railSelectedDate}
                onDateSelect={handleCalendarDateSelect}
                onExtendDateBuffer={handleExtendDateBuffer}
                onRestoreSelectedDate={handleRestoreSelectedDate}
                centerRequest={centerRequest}
              />
            </motion.div>
          ) : (
            <motion.div
              key="week-rail"
              animate={{ opacity: 1 }}
              exit={{ opacity: prefersReducedMotion ? 1 : 0 }}
              initial={prefersReducedMotion ? false : { opacity: 0 }}
              transition={motionTransition}
            >
              <WeekView
                weekStarts={weekStarts}
                selectedDate={railSelectedDate}
                onDateSelect={handleCalendarDateSelect}
                onExtendWeekBuffer={handleExtendWeekBuffer}
                onRestoreSelectedWeek={handleRestoreSelectedWeek}
                centerRequest={centerRequest}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
