import { useCallback, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/form/date-field";
import { DateTime } from "@/lib/date-time";
import { WeekdayView } from "./weekday-view";

export interface WeekDateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  className?: string;
}

const MAX_BUFFER_DAYS = 56;
const BUFFER_DAYS_BEFORE_SELECTED = 28;
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

export function WeekDateSelector({
  selectedDate,
  onDateSelect,
  className,
}: WeekDateSelectorProps) {
  const { t } = useTranslation(["schedules"]);
  const railSelectedDate = selectedDate ?? DateTime.today().toDate();
  const railSelectedDateKey =
    DateTime.from(railSelectedDate).toDateOnlyString();
  const [dates, setDates] = useState<Date[]>(() =>
    createDateBuffer(railSelectedDate),
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

  const monthLabel = DateTime.from(railSelectedDate).format("MMMM yyyy");

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
      handleCalendarDateSelect(date);
    }
  };

  return (
    <div className={cn("mb-4", className)}>
      <div className="px-3 pt-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <DateField
              value={DateTime.from(railSelectedDate).toDateOnlyString()}
              onChange={handleDateFieldChange}
              ariaLabel={t("schedules:weekSelector.openCalendar", {
                month: monthLabel,
              })}
              trigger={
                <button
                  type="button"
                  className="group flex min-h-11 items-center gap-1.5 rounded-full px-2 py-1.5 font-headline text-base font-semibold text-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:bg-card sm:px-3"
                >
                  <span className="truncate">{monthLabel}</span>
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
            className="shrink-0 bg-card px-2 sm:px-3"
          >
            {t("schedules:weekSelector.today")}
          </Button>
        </div>
      </div>

      <WeekdayView
        dates={dates}
        selectedDate={railSelectedDate}
        onDateSelect={handleCalendarDateSelect}
        onExtendDateBuffer={handleExtendDateBuffer}
        onRestoreSelectedDate={handleRestoreSelectedDate}
        centerRequest={centerRequest}
      />
    </div>
  );
}
