import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { DateTime } from "@/lib/date-time";
import {
  formatWeekRange,
  getDateInWeek,
  getWeekStart,
  getWeekdayOffset,
  isSameWeek,
} from "./week-utils";

export interface WeekViewProps {
  weekStarts: Date[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onExtendWeekBuffer: (
    direction: "previous" | "next",
    count?: number,
  ) => void;
  onRestoreSelectedWeek: () => void;
  centerRequest: {
    id: number;
    behavior: ScrollBehavior;
  };
  className?: string;
}

const EDGE_THRESHOLD = 128;
const SMOOTH_SCROLL_SETTLE_DELAY = 150;
const WEEK_DAYS = 7;

function getWeekEnd(weekStart: Date): Date {
  return getDateInWeek(weekStart, WEEK_DAYS - 1);
}

export function WeekView({
  weekStarts,
  selectedDate,
  onDateSelect,
  onExtendWeekBuffer,
  onRestoreSelectedWeek,
  centerRequest,
  className,
}: WeekViewProps) {
  const { t } = useTranslation(["schedules"]);
  const prefersReducedMotion = useReducedMotion();
  const instructionsId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingPrependTrackWidthRef = useRef<number | null>(null);
  const pendingAppendStartWeekRef = useRef<number | null>(null);
  const pendingAppendTrackWidthRef = useRef<number | null>(null);
  const pendingExtensionRef = useRef<"previous" | "next" | null>(null);
  const pendingFocusWeekRef = useRef<string | null>(null);
  const lastCenteredWeekRef = useRef<string | null>(null);
  const lastCenterRequestRef = useRef<number | null>(null);
  const smoothCenteringRef = useRef(false);
  const smoothCenterFallbackTimeoutRef = useRef<number | null>(null);
  const smoothCenterScrollEndCleanupRef = useRef<(() => void) | null>(null);
  const selectedWeekStart = selectedDate ? getWeekStart(selectedDate) : undefined;
  const selectedWeekKey = selectedWeekStart
    ? DateTime.from(selectedWeekStart).toDateOnlyString()
    : undefined;
  const isSelectedWeekInBuffer = selectedWeekStart
    ? weekStarts.some((weekStart) => isSameWeek(weekStart, selectedWeekStart))
    : false;
  const offscreenSelectedAriaLabel =
    selectedWeekStart && !isSelectedWeekInBuffer
      ? [
          t("schedules:weekSelector.weekLabel", {
            start: DateTime.from(selectedWeekStart).format(
              "EEEE, MMMM d, yyyy",
            ),
            end: DateTime.from(getWeekEnd(selectedWeekStart)).format(
              "EEEE, MMMM d, yyyy",
            ),
          }),
          t("schedules:weekSelector.selectedWeek"),
        ].join(", ")
      : undefined;
  const motionTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: [0.25, 1, 0.5, 1] };

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

  const centerSelectedWeek = useCallback(
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

        container.addEventListener("scrollend", handleScrollEnd, {
          once: true,
        });
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
    [clearSmoothCentering, prefersReducedMotion, scheduleSmoothCenterFallback],
  );

  useLayoutEffect(() => {
    if (!selectedWeekKey) return;

    const shouldCenter =
      lastCenteredWeekRef.current !== selectedWeekKey ||
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

    centerSelectedWeek(behavior);
    lastCenteredWeekRef.current = selectedWeekKey;
    lastCenterRequestRef.current = centerRequest.id;
  }, [centerRequest, centerSelectedWeek, selectedWeekKey, weekStarts]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    if (pendingPrependTrackWidthRef.current !== null) {
      container.scrollLeft += pendingPrependTrackWidthRef.current;
      pendingPrependTrackWidthRef.current = null;
    }

    if (
      pendingAppendStartWeekRef.current !== null &&
      pendingAppendTrackWidthRef.current !== null &&
      weekStarts[0]?.getTime() !== pendingAppendStartWeekRef.current
    ) {
      container.scrollLeft -= pendingAppendTrackWidthRef.current;
    }

    pendingAppendStartWeekRef.current = null;
    pendingAppendTrackWidthRef.current = null;
    pendingExtensionRef.current = null;

    const pendingFocusWeek = pendingFocusWeekRef.current;

    if (!pendingFocusWeek) return;

    const nextFocusedButton = container.querySelector<HTMLButtonElement>(
      `[data-week-key="${pendingFocusWeek}"]`,
    );

    if (nextFocusedButton) {
      nextFocusedButton.focus({ preventScroll: true });
      pendingFocusWeekRef.current = null;
    }
  }, [selectedWeekKey, weekStarts]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container || typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(() => {
      centerSelectedWeek();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [centerSelectedWeek]);

  const getTrackItemWidth = useCallback(() => {
    const firstButton = containerRef.current?.querySelector<HTMLButtonElement>(
      "button[data-week-key]",
    );
    const track = firstButton?.parentElement;
    const gap = track
      ? Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
      : 0;

    return firstButton ? firstButton.getBoundingClientRect().width + gap : null;
  }, []);

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
      pendingExtensionRef.current = "previous";
      pendingPrependTrackWidthRef.current = getTrackItemWidth();
      onExtendWeekBuffer("previous");
    } else if (isNearEnd) {
      pendingExtensionRef.current = "next";
      pendingAppendStartWeekRef.current = weekStarts[0]?.getTime() ?? null;
      pendingAppendTrackWidthRef.current = getTrackItemWidth();
      onExtendWeekBuffer("next");
    }
  }, [
    getTrackItemWidth,
    onExtendWeekBuffer,
    scheduleSmoothCenterFallback,
    weekStarts,
  ]);

  const handleRailFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget || !selectedWeekStart) return;

      pendingFocusWeekRef.current = DateTime.from(
        selectedWeekStart,
      ).toDateOnlyString();
      onRestoreSelectedWeek();
    },
    [onRestoreSelectedWeek, selectedWeekStart],
  );

  const selectWeek = useCallback(
    (weekStart: Date) => {
      const weekdayOffset = getWeekdayOffset(selectedDate ?? weekStart);
      onDateSelect(getDateInWeek(weekStart, weekdayOffset));
    },
    [onDateSelect, selectedDate],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, weekStart: Date) => {
      const weekOffset =
        event.key === "ArrowLeft"
          ? -1
          : event.key === "ArrowRight"
            ? 1
            : event.key === "PageUp"
              ? -4
              : event.key === "PageDown"
                ? 4
                : 0;

      if (weekOffset === 0) return;

      event.preventDefault();
      cancelSmoothCentering();

      const nextWeekStart = DateTime.from(weekStart)
        .addWeeks(weekOffset)
        .toDate();
      const firstWeekStart = weekStarts[0];
      const lastWeekStart = weekStarts.at(-1);

      if (firstWeekStart && nextWeekStart < firstWeekStart) {
        onExtendWeekBuffer("previous", Math.abs(weekOffset));
      } else if (lastWeekStart && nextWeekStart > lastWeekStart) {
        onExtendWeekBuffer("next", Math.abs(weekOffset));
      }

      pendingFocusWeekRef.current = DateTime.from(
        nextWeekStart,
      ).toDateOnlyString();
      selectWeek(nextWeekStart);
    },
    [
      cancelSmoothCentering,
      onExtendWeekBuffer,
      selectWeek,
      weekStarts,
    ],
  );

  return (
    <div className={cn("min-w-0 max-w-full pb-3 pt-2 md:pb-4", className)}>
      <p id={instructionsId} className="sr-only">
        {t("schedules:weekSelector.weekRailInstruction")}
      </p>
      <div
        ref={containerRef}
        role="radiogroup"
        aria-label={t("schedules:weekSelector.weekRailLabel")}
        aria-describedby={instructionsId}
        tabIndex={isSelectedWeekInBuffer ? -1 : 0}
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
        <div className="flex w-max min-w-[calc(100%+8rem)] gap-2 px-3 sm:px-4 lg:px-6">
          {weekStarts.map((weekStart) => {
            const weekEnd = getWeekEnd(weekStart);
            const isSelected = selectedWeekStart
              ? isSameWeek(weekStart, selectedWeekStart)
              : false;
            const isCurrentWeek = isSameWeek(
              weekStart,
              DateTime.today().toDate(),
            );
            const rangeLabel = formatWeekRange(weekStart, weekEnd);
            const ariaLabel = [
              t("schedules:weekSelector.weekLabel", {
                start: DateTime.from(weekStart).format(
                  "EEEE, MMMM d, yyyy",
                ),
                end: DateTime.from(weekEnd).format("EEEE, MMMM d, yyyy"),
              }),
              isCurrentWeek
                ? t("schedules:weekSelector.containsToday")
                : undefined,
              isSelected ? t("schedules:weekSelector.selectedWeek") : undefined,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <button
                key={weekStart.getTime()}
                type="button"
                onClick={() => selectWeek(weekStart)}
                onKeyDown={(event) => handleKeyDown(event, weekStart)}
                data-week-key={DateTime.from(weekStart).toDateOnlyString()}
                className={cn(
                  "relative flex h-14 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border px-3 py-1.5 text-center text-sm font-medium tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none cursor-pointer",
                  isSelected
                    ? "border-primary text-primary-foreground"
                    : isCurrentWeek
                      ? "border-primary bg-card text-foreground hover:bg-muted"
                      : "border-border bg-card text-foreground hover:border-primary hover:bg-muted",
                )}
                aria-label={ariaLabel}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
              >
                {isSelected && (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-xl bg-primary"
                    layoutId="schedule-selected-period"
                    transition={motionTransition}
                  />
                )}
                <span className="relative z-10 truncate">{rangeLabel}</span>
                {isCurrentWeek && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute bottom-1 left-1 size-1 rounded-full",
                      isSelected ? "bg-primary-foreground" : "bg-primary",
                    )}
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
