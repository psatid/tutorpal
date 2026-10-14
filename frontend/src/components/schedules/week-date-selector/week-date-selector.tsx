import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MotionConfig, useReducedMotion, type Transition } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CalendarDays, ChevronDown } from "lucide-react";
import { Button } from "@/components/common/button";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsPanels,
  TabsTab,
} from "@/components/ui/animate-ui/components/base/tabs";
import { DateField } from "@/components/common/form/date-field";
import { DateTime } from "@/lib/date-time";
import { WeekView } from "./week-view";
import { WeekdayView } from "./weekday-view";
import {
  formatWeekRange,
  getDateInWeek,
  getWeekStart,
  getWeekdayOffset,
} from "./week-utils";

export type ScheduleViewMode = "day" | "week";

export type RailCenterRequest = {
  id: number;
  targetDateKey: string;
  behavior: ScrollBehavior;
};

type WeekDateSelectorRails = {
  day: ReactNode;
  week: ReactNode;
};

type WeekDateSelectorCommonProps = {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  className?: string;
};

type WeekDateSelectorStandaloneProps = WeekDateSelectorCommonProps & {
  viewMode: ScheduleViewMode;
  onViewModeChange: (viewMode: ScheduleViewMode) => void;
  children?: never;
};

type WeekDateSelectorExternalRootProps = WeekDateSelectorCommonProps & {
  viewMode: ScheduleViewMode;
  children: (rails: WeekDateSelectorRails) => ReactNode;
  onViewModeChange?: never;
};

export type WeekDateSelectorProps =
  | WeekDateSelectorStandaloneProps
  | WeekDateSelectorExternalRootProps;

const INITIAL_BUFFER_DAYS = 56;
const BUFFER_DAYS_BEFORE_SELECTED = 28;
const INITIAL_BUFFER_WEEKS = 8;
const BUFFER_WEEKS_BEFORE_SELECTED = 4;
const WEEK_DAYS = 7;
const INSTANT_CENTER: ScrollBehavior = "auto";
const SMOOTH_CENTER: ScrollBehavior = "smooth";

function isScheduleViewMode(value: string): value is ScheduleViewMode {
  return value === "day" || value === "week";
}

function isExternalRootMode(
  props: WeekDateSelectorProps,
): props is WeekDateSelectorExternalRootProps {
  return props.children !== undefined;
}

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

  return Array.from({ length: INITIAL_BUFFER_DAYS }, (_, index) =>
    getDateByDayOffset(startDate, index),
  );
}

function createWeekBuffer(selectedDate: Date): Date[] {
  const selectedWeekStart = DateTime.from(selectedDate).startOfWeek();

  return Array.from({ length: INITIAL_BUFFER_WEEKS }, (_, index) =>
    selectedWeekStart.addWeeks(index - BUFFER_WEEKS_BEFORE_SELECTED).toDate(),
  );
}

function growDateRangeToInclude(dates: Date[], targetDate: Date): Date[] {
  if (dates.length === 0) return createDateBuffer(targetDate);

  let nextDates = dates;

  while (targetDate < nextDates[0]!) {
    const firstDate = nextDates[0]!;
    const previousWeek = Array.from({ length: WEEK_DAYS }, (_, index) =>
      getDateByDayOffset(firstDate, index - WEEK_DAYS),
    );

    nextDates = [...previousWeek, ...nextDates];
  }

  while (targetDate > nextDates.at(-1)!) {
    const lastDate = nextDates.at(-1)!;
    const nextWeek = Array.from({ length: WEEK_DAYS }, (_, index) =>
      getDateByDayOffset(lastDate, index + 1),
    );

    nextDates = [...nextDates, ...nextWeek];
  }

  return nextDates;
}

function growWeekRangeToInclude(weekStarts: Date[], targetDate: Date): Date[] {
  const targetWeekStart = getWeekStart(targetDate);

  if (weekStarts.length === 0) return createWeekBuffer(targetWeekStart);

  let nextWeekStarts = weekStarts;

  while (targetWeekStart < nextWeekStarts[0]!) {
    const previousWeekStart = DateTime.from(nextWeekStarts[0]!)
      .subWeeks(1)
      .toDate();

    nextWeekStarts = [previousWeekStart, ...nextWeekStarts];
  }

  while (targetWeekStart > nextWeekStarts.at(-1)!) {
    const nextWeekStart = DateTime.from(nextWeekStarts.at(-1)!)
      .addWeeks(1)
      .toDate();

    nextWeekStarts = [...nextWeekStarts, nextWeekStart];
  }

  return nextWeekStarts;
}

export function WeekDateSelector(props: WeekDateSelectorProps) {
  const { selectedDate, onDateSelect, viewMode, className } = props;
  const { t } = useTranslation(["schedules"]);
  const prefersReducedMotion = useReducedMotion() === true;
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
  const [centerRequest, setCenterRequest] = useState<RailCenterRequest>({
    id: 0,
    targetDateKey: railSelectedDateKey,
    behavior: INSTANT_CENTER,
  });
  const centerTargetDate = useMemo(
    () => DateTime.fromDateOnlyString(centerRequest.targetDateKey).toDate(),
    [centerRequest.targetDateKey],
  );

  useLayoutEffect(() => {
    setDates((currentDates) => {
      const withSelectedDate = growDateRangeToInclude(
        currentDates,
        railSelectedDate,
      );

      return growDateRangeToInclude(withSelectedDate, centerTargetDate);
    });
  }, [centerTargetDate, railSelectedDate, railSelectedDateKey]);

  useLayoutEffect(() => {
    setWeekStarts((currentWeekStarts) => {
      const withSelectedWeek = growWeekRangeToInclude(
        currentWeekStarts,
        railSelectedWeekStart,
      );

      return growWeekRangeToInclude(withSelectedWeek, centerTargetDate);
    });
  }, [centerTargetDate, railSelectedWeekKey, railSelectedWeekStart]);

  const handleExtendDateBuffer = useCallback(
    (direction: "previous" | "next", count = 1) => {
      setDates((currentDates) => {
        if (currentDates.length === 0) return currentDates;

        let nextDates = currentDates;

        for (let index = 0; index < count; index += 1) {
          const edgeDate =
            direction === "previous" ? nextDates[0] : nextDates.at(-1);

          if (!edgeDate) return nextDates;

          const nextWeek = Array.from({ length: WEEK_DAYS }, (_, dayIndex) =>
            getDateByDayOffset(
              edgeDate,
              direction === "previous" ? dayIndex - WEEK_DAYS : dayIndex + 1,
            ),
          );
          nextDates =
            direction === "previous"
              ? [...nextWeek, ...nextDates]
              : [...nextDates, ...nextWeek];
        }

        return nextDates;
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
          nextWeekStarts =
            direction === "previous"
              ? [adjacentWeekStart, ...nextWeekStarts]
              : [...nextWeekStarts, adjacentWeekStart];
        }

        return nextWeekStarts;
      });
    },
    [],
  );

  const requestCenter = useCallback((date: Date, behavior: ScrollBehavior) => {
    setCenterRequest((request) => ({
      id: request.id + 1,
      targetDateKey: DateTime.from(date).toDateOnlyString(),
      behavior,
    }));
  }, []);

  const monthLabel = DateTime.formatDate(railSelectedDate, {
    month: "long",
    year: "numeric",
  });
  const shortMonthLabel = DateTime.formatDate(railSelectedDate, {
    month: "short",
    year: "numeric",
  });
  const weekEnd = getDateInWeek(railSelectedWeekStart, WEEK_DAYS - 1);
  const weekLabel = formatWeekRange(railSelectedWeekStart, weekEnd, true);
  const shortWeekLabel = formatWeekRange(
    railSelectedWeekStart,
    weekEnd,
  ).replace(/\s*–\s*/g, "–");
  const periodLabel = viewMode === "week" ? weekLabel : monthLabel;
  const shortPeriodLabel =
    viewMode === "week" ? shortWeekLabel : shortMonthLabel;
  const tabTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: [0.25, 1, 0.5, 1] };

  const handleToday = () => {
    const today = DateTime.today().toDate();

    requestCenter(today, SMOOTH_CENTER);
    onDateSelect(today);
  };

  const handleCalendarDateSelect = (date: Date) => {
    requestCenter(date, SMOOTH_CENTER);
    onDateSelect(date);
  };

  const handleDateFieldChange = (value: string) => {
    const date = DateTime.tryFromDateOnlyString(value)?.toDate();

    if (date) {
      const nextDate =
        viewMode === "week"
          ? getDateInWeek(
              getWeekStart(date),
              getWeekdayOffset(railSelectedDate),
            )
          : date;

      handleCalendarDateSelect(nextDate);
    }
  };

  const rails = {
    day: (
      <WeekdayView
        className="pb-2 pt-1"
        dates={dates}
        selectedDate={railSelectedDate}
        onDateSelect={handleCalendarDateSelect}
        onExtendDateBuffer={handleExtendDateBuffer}
        centerRequest={centerRequest}
        isActive={viewMode === "day"}
      />
    ),
    week: (
      <WeekView
        weekStarts={weekStarts}
        selectedDate={railSelectedDate}
        onDateSelect={handleCalendarDateSelect}
        onExtendWeekBuffer={handleExtendWeekBuffer}
        centerRequest={centerRequest}
        isActive={viewMode === "week"}
      />
    ),
  };

  const selector = (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <div className="shrink-0 px-3 pt-2 sm:px-4 lg:px-6">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 min-[360px]:flex-nowrap">
          <div className="min-w-0 basis-full min-[360px]:basis-auto min-[360px]:flex-1">
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
                  className="group flex min-h-11 items-center gap-1.5 rounded-full py-1.5 font-headline text-base font-semibold text-foreground transition-colors focus-visible:outline-none hover:cursor-pointer"
                >
                  <span className="block min-w-0 truncate">
                    <span className="min-[480px]:hidden">
                      {shortPeriodLabel}
                    </span>
                    <span className="hidden min-[480px]:inline">
                      {periodLabel}
                    </span>
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 transition-transform duration-150 group-data-[state=open]:rotate-180 group-aria-expanded:rotate-180 motion-reduce:transition-none"
                  />
                </button>
              }
            />
          </div>
          <div className="ml-auto flex shrink-0 items-center justify-end gap-2 whitespace-nowrap">
            <Button
              className="relative isolate h-11 border-transparent bg-transparent hover:bg-transparent aria-expanded:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:aria-expanded:bg-transparent before:pointer-events-none before:absolute before:inset-x-0 before:inset-y-1.5 before:z-[-1] before:rounded-full before:border before:border-input before:bg-white hover:before:bg-muted aria-expanded:before:bg-muted dark:before:bg-card"
              variant="outline"
              size="sm"
              onClick={handleToday}
            >
              <CalendarDays aria-hidden="true" className="size-4" />
              {t("schedules:weekSelector.today")}
            </Button>
            <TabsList
              aria-label={t("schedules:viewMode.label")}
              activateOnFocus={false}
              transition={tabTransition}
            >
              <TabsTab value="day">{t("schedules:viewMode.day")}</TabsTab>
              <TabsTab value="week">{t("schedules:viewMode.week")}</TabsTab>
            </TabsList>
          </div>
        </div>
      </div>

      {isExternalRootMode(props) ? (
        props.children(rails)
      ) : (
        <TabsPanels className="mb-2 w-full shrink-0" transition={tabTransition}>
          <TabsPanel transition={tabTransition} value="day">
            {rails.day}
          </TabsPanel>
          <TabsPanel transition={tabTransition} value="week">
            {rails.week}
          </TabsPanel>
        </TabsPanels>
      )}
    </div>
  );

  if (isExternalRootMode(props)) {
    return selector;
  }

  return (
    <MotionConfig reducedMotion="user">
      <Tabs
        className="gap-0"
        value={viewMode}
        onValueChange={(value) => {
          if (isScheduleViewMode(value)) {
            props.onViewModeChange(value);
          }
        }}
      >
        {selector}
      </Tabs>
    </MotionConfig>
  );
}
