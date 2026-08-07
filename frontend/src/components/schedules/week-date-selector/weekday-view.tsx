import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { DateTime } from "@/lib/date-time";

export interface WeekdayViewProps {
  dates: Date[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onExtendDateBuffer: (direction: "previous" | "next") => void;
  onRestoreSelectedDate: () => void;
  centerRequest: {
    id: number;
    behavior: ScrollBehavior;
  };
  className?: string;
}

const EDGE_THRESHOLD = 128;
const SMOOTH_SCROLL_SETTLE_DELAY = 150;
const WEEK_DAYS = 7;

function getDateByDayOffset(date: Date, dayOffset: number): Date {
  const dateTime = DateTime.from(date);
  const weekdayIndex = (dateTime.getWeekdayIndex() + 6) % WEEK_DAYS;
  const targetDayIndex = weekdayIndex + dayOffset;
  const weekOffset = Math.floor(targetDayIndex / WEEK_DAYS);
  const targetWeekdayIndex =
    ((targetDayIndex % WEEK_DAYS) + WEEK_DAYS) % WEEK_DAYS;

  return DateTime.getWeekDates(
    dateTime.startOfWeek().addWeeks(weekOffset),
  )[targetWeekdayIndex]!.toDate();
}

export function WeekdayView({
  dates,
  selectedDate,
  onDateSelect,
  onExtendDateBuffer,
  onRestoreSelectedDate,
  centerRequest,
  className,
}: WeekdayViewProps) {
  const { t } = useTranslation(["schedules"]);
  const prefersReducedMotion = useReducedMotion();
  const instructionsId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingPrependTrackWidthRef = useRef<number | null>(null);
  const pendingAppendStartDateRef = useRef<number | null>(null);
  const pendingAppendTrackWidthRef = useRef<number | null>(null);
  const pendingExtensionRef = useRef<"previous" | "next" | null>(null);
  const pendingFocusDateRef = useRef<string | null>(null);
  const lastCenteredDateRef = useRef<string | null>(null);
  const lastCenterRequestRef = useRef<number | null>(null);
  const smoothCenteringRef = useRef(false);
  const smoothCenterFallbackTimeoutRef = useRef<number | null>(null);
  const smoothCenterScrollEndCleanupRef = useRef<(() => void) | null>(null);
  const isSelectedDateInBuffer = selectedDate
    ? dates.some((date) => DateTime.from(date).isSameDay(selectedDate))
    : false;
  const offscreenSelectedAriaLabel =
    selectedDate && !isSelectedDateInBuffer
      ? [
          DateTime.from(selectedDate).format("EEEE, MMMM d, yyyy"),
          DateTime.from(selectedDate).isToday()
            ? t("schedules:weekSelector.today")
            : undefined,
          t("schedules:weekSelector.selected"),
        ]
          .filter(Boolean)
          .join(", ")
      : undefined;

  const clearSmoothCentering = useCallback(() => {
    smoothCenteringRef.current = false;

    if (smoothCenterFallbackTimeoutRef.current !== null) {
      window.clearTimeout(smoothCenterFallbackTimeoutRef.current);
      smoothCenterFallbackTimeoutRef.current = null;
    }

    smoothCenterScrollEndCleanupRef.current?.();
    smoothCenterScrollEndCleanupRef.current = null;
  }, []);

  const scheduleSmoothCenterFallback = useCallback(() => {
    if (!smoothCenteringRef.current) return;

    if (smoothCenterFallbackTimeoutRef.current !== null) {
      window.clearTimeout(smoothCenterFallbackTimeoutRef.current);
    }

    smoothCenterFallbackTimeoutRef.current = window.setTimeout(
      clearSmoothCentering,
      SMOOTH_SCROLL_SETTLE_DELAY,
    );
  }, [clearSmoothCentering]);

  const cancelSmoothCentering = useCallback(() => {
    if (!smoothCenteringRef.current) return;

    clearSmoothCentering();

    const container = containerRef.current;

    if (container) {
      container.scrollTo({ left: container.scrollLeft, behavior: "auto" });
    }
  }, [clearSmoothCentering]);

  useLayoutEffect(() => clearSmoothCentering, [clearSmoothCentering]);

  const centerSelectedDate = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      const container = containerRef.current;
      const selectedButton = container?.querySelector<HTMLButtonElement>(
        'button[aria-checked="true"]',
      );

      if (!container || !selectedButton) return;

      const maxScrollLeft = Math.max(
        container.scrollWidth - container.clientWidth,
        0,
      );
      const targetLeft = Math.min(
        Math.max(
          selectedButton.offsetLeft +
            selectedButton.offsetWidth / 2 -
            container.clientWidth / 2,
          0,
        ),
        maxScrollLeft,
      );
      const shouldSmoothlyCenter =
        behavior === "smooth" &&
        !prefersReducedMotion &&
        Math.abs(container.scrollLeft - targetLeft) > 0.5;

      if (shouldSmoothlyCenter) {
        clearSmoothCentering();
        smoothCenteringRef.current = true;

        const handleScrollEnd = () => {
          clearSmoothCentering();
        };

        container.addEventListener("scrollend", handleScrollEnd, { once: true });
        smoothCenterScrollEndCleanupRef.current = () => {
          container.removeEventListener("scrollend", handleScrollEnd);
        };
        scheduleSmoothCenterFallback();
      }

      container.scrollTo({
        left: targetLeft,
        behavior: shouldSmoothlyCenter ? "smooth" : "auto",
      });
    },
    [
      clearSmoothCentering,
      prefersReducedMotion,
      scheduleSmoothCenterFallback,
    ],
  );

  useLayoutEffect(() => {
    if (!selectedDate) return;

    const selectedDateKey = DateTime.from(selectedDate).toDateOnlyString();
    const shouldCenter =
      lastCenteredDateRef.current !== selectedDateKey ||
      lastCenterRequestRef.current !== centerRequest.id;

    if (!shouldCenter) return;

    const selectedButton = containerRef.current?.querySelector(
      'button[aria-checked="true"]',
    );

    if (!selectedButton) return;

    const behavior =
      lastCenterRequestRef.current !== null &&
      lastCenterRequestRef.current !== centerRequest.id
        ? centerRequest.behavior
        : "auto";

    centerSelectedDate(behavior);
    lastCenteredDateRef.current = selectedDateKey;
    lastCenterRequestRef.current = centerRequest.id;
  }, [centerRequest, centerSelectedDate, dates, selectedDate]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    if (pendingPrependTrackWidthRef.current !== null) {
      container.scrollLeft += pendingPrependTrackWidthRef.current;
      pendingPrependTrackWidthRef.current = null;
    }

    if (
      pendingAppendStartDateRef.current !== null &&
      pendingAppendTrackWidthRef.current !== null &&
      dates[0]?.getTime() !== pendingAppendStartDateRef.current
    ) {
      container.scrollLeft -= pendingAppendTrackWidthRef.current;
    }

    pendingAppendStartDateRef.current = null;
    pendingAppendTrackWidthRef.current = null;

    pendingExtensionRef.current = null;

    const pendingFocusDate = pendingFocusDateRef.current;

    if (!pendingFocusDate) return;

    const nextFocusedButton = container.querySelector<HTMLButtonElement>(
      `[data-date-key="${pendingFocusDate}"]`,
    );

    if (nextFocusedButton) {
      nextFocusedButton.focus({ preventScroll: true });
      pendingFocusDateRef.current = null;
    }
  }, [dates, selectedDate]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(() => {
      centerSelectedDate();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [centerSelectedDate]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    if (smoothCenteringRef.current) {
      scheduleSmoothCenterFallback();
      return;
    }

    if (pendingExtensionRef.current) return;

    const isNearStart = container.scrollLeft <= EDGE_THRESHOLD;
    const isNearEnd =
      container.scrollLeft + container.clientWidth >=
      container.scrollWidth - EDGE_THRESHOLD;

    if (isNearStart) {
      const firstDateButton = container.querySelector<HTMLButtonElement>(
        "button[data-date-key]",
      );
      const track = firstDateButton?.parentElement;
      const gap = track
        ? Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
        : 0;

      pendingExtensionRef.current = "previous";
      pendingPrependTrackWidthRef.current = firstDateButton
        ? (firstDateButton.getBoundingClientRect().width + gap) * 7
        : null;
      onExtendDateBuffer("previous");
    } else if (isNearEnd) {
      const firstDateButton = container.querySelector<HTMLButtonElement>(
        "button[data-date-key]",
      );
      const track = firstDateButton?.parentElement;
      const gap = track
        ? Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
        : 0;

      pendingExtensionRef.current = "next";
      pendingAppendStartDateRef.current = dates[0]?.getTime() ?? null;
      pendingAppendTrackWidthRef.current = firstDateButton
        ? (firstDateButton.getBoundingClientRect().width + gap) * 7
        : null;
      onExtendDateBuffer("next");
    }
  }, [dates, onExtendDateBuffer, scheduleSmoothCenterFallback]);

  const handleRailFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget || !selectedDate) return;

      pendingFocusDateRef.current = DateTime.from(selectedDate).toDateOnlyString();
      onRestoreSelectedDate();
    },
    [onRestoreSelectedDate, selectedDate],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, date: Date) => {
      const dayOffset =
        event.key === "ArrowLeft"
          ? -1
          : event.key === "ArrowRight"
            ? 1
            : event.key === "PageUp"
              ? -7
              : event.key === "PageDown"
                ? 7
                : 0;

      if (dayOffset === 0) return;

      event.preventDefault();
      cancelSmoothCentering();

      const nextDate = getDateByDayOffset(date, dayOffset);
      const firstDate = dates[0];
      const lastDate = dates.at(-1);

      if (firstDate && nextDate < firstDate) {
        onExtendDateBuffer("previous");
      } else if (lastDate && nextDate > lastDate) {
        onExtendDateBuffer("next");
      }

      pendingFocusDateRef.current = DateTime.from(nextDate).toDateOnlyString();
      onDateSelect(nextDate);
    },
    [cancelSmoothCentering, dates, onDateSelect, onExtendDateBuffer],
  );

  return (
    <div className={cn("min-w-0 max-w-full pb-3 pt-2 md:pb-4", className)}>
      <p id={instructionsId} className="sr-only">
        {t("schedules:weekSelector.dateRailInstruction")}
      </p>
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label={t("schedules:weekSelector.dateRailLabel")}
        aria-describedby={instructionsId}
        tabIndex={isSelectedDateInBuffer ? -1 : 0}
        onFocus={handleRailFocus}
        onScroll={handleScroll}
        onWheel={cancelSmoothCentering}
        onPointerDown={cancelSmoothCentering}
        onTouchStart={cancelSmoothCentering}
        className="relative min-w-0 max-w-full overflow-x-auto py-1 scroll-py-1 overscroll-x-contain touch-pan-x focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {offscreenSelectedAriaLabel && (
          <span
            role="radio"
            aria-checked="true"
            aria-label={offscreenSelectedAriaLabel}
            className="sr-only"
          />
        )}
        <div className="flex w-max min-w-[calc(100%+4rem)] gap-2 px-3 sm:px-4 lg:px-6">
          {dates.map((date, index) => {
            const dateTime = DateTime.from(date);
            const isSelected = selectedDate
              ? dateTime.isSameDay(selectedDate)
              : false;
            const isDateToday = dateTime.isToday();
            const dayName = dateTime.format("EEE");
            const dayNumber = dateTime.format("d");
            const monthName = dateTime.format("MMM");
            const previousDate = dates[index - 1];
            const showsMonthMarker =
              !previousDate ||
              dateTime.format("M") !== DateTime.from(previousDate).format("M");
            const ariaLabel = [
              dateTime.format("EEEE, MMMM d, yyyy"),
              isDateToday ? t("schedules:weekSelector.today") : undefined,
              isSelected ? t("schedules:weekSelector.selected") : undefined,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <button
                key={date.getTime()}
                type="button"
                onClick={() => onDateSelect(date)}
                onKeyDown={(event) => handleKeyDown(event, date)}
                data-date-key={dateTime.toDateOnlyString()}
                className={cn(
                  "relative flex h-14 w-14 shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : isDateToday
                      ? "border-primary bg-card text-foreground hover:bg-muted"
                      : "border-border bg-card text-foreground hover:border-primary hover:bg-muted",
                )}
                aria-label={ariaLabel}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
              >
                <span
                  className={cn(
                    "text-[9px] font-bold leading-none uppercase tracking-[0.08em]",
                    isSelected
                      ? "text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                >
                  {dayName}
                </span>
                <span
                  className={cn(
                    "text-lg font-extrabold leading-none",
                    isSelected ? "text-primary-foreground" : "text-foreground",
                  )}
                >
                  {dayNumber}
                </span>
                {showsMonthMarker && (
                  <span
                    className={cn(
                      "absolute bottom-1 right-1 text-[8px] font-bold uppercase tracking-[0.08em]",
                      isSelected
                        ? "text-primary-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {monthName}
                  </span>
                )}
                {!isSelected && isDateToday && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 left-1 size-1 rounded-full bg-primary"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
