import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
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

interface TouchSelectionGesture {
  key: string;
  pointerId: number;
  startX: number;
  startY: number;
  isSwipe: boolean;
  select: () => void;
}

interface TouchClickSuppression {
  key: string;
  armedAt: number;
  expiresAt: number;
}

type NativeClickEvent = globalThis.MouseEvent & {
  sourceCapabilities?: {
    firesTouchEvents?: boolean;
  } | null;
};

const EDGE_THRESHOLD = 128;
const SMOOTH_SCROLL_SETTLE_DELAY = 150;
const TOUCH_SWIPE_THRESHOLD = 8;
const TOUCH_CLICK_SUPPRESSION_DELAY = 500;
const WEEK_DAYS = 7;

function getWeekEnd(weekStart: Date): Date {
  return getDateInWeek(weekStart, WEEK_DAYS - 1);
}

function hasTouchGestureExceededTapThreshold(
  gesture: TouchSelectionGesture,
  point: { clientX: number; clientY: number },
): boolean {
  return (
    Math.hypot(point.clientX - gesture.startX, point.clientY - gesture.startY) >=
    TOUCH_SWIPE_THRESHOLD
  );
}

function isTouchGeneratedClick(
  event: ReactMouseEvent<HTMLButtonElement>,
  hasMousePointerInput: boolean,
): boolean {
  const sourceCapabilities = (
    event.nativeEvent as NativeClickEvent
  ).sourceCapabilities;

  return (
    sourceCapabilities?.firesTouchEvents ??
    (event.detail > 0 && !hasMousePointerInput)
  );
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
  const lastScrollLeftRef = useRef<number | null>(null);
  const trackItemWidthRef = useRef<number | null>(null);
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
  const lastMousePointerDownAtRef = useRef<number | null>(null);
  const touchGestureRef = useRef<TouchSelectionGesture | null>(null);
  const touchClickSuppressionRef = useRef<TouchClickSuppression | null>(
    null,
  );
  const touchClickSuppressionTimeoutRef = useRef<number | null>(null);
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
            start: DateTime.formatDate(selectedWeekStart, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
            end: DateTime.formatDate(getWeekEnd(selectedWeekStart), {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            }),
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

  const clearTouchClickSuppression = useCallback(() => {
    if (touchClickSuppressionTimeoutRef.current !== null) {
      window.clearTimeout(touchClickSuppressionTimeoutRef.current);
      touchClickSuppressionTimeoutRef.current = null;
    }

    touchClickSuppressionRef.current = null;
  }, []);

  const armTouchClickSuppression = useCallback(
    (key: string) => {
      clearTouchClickSuppression();

      const armedAt = Date.now();

      touchClickSuppressionRef.current = {
        key,
        armedAt,
        expiresAt: armedAt + TOUCH_CLICK_SUPPRESSION_DELAY,
      };
      touchClickSuppressionTimeoutRef.current = window.setTimeout(
        clearTouchClickSuppression,
        TOUCH_CLICK_SUPPRESSION_DELAY,
      );
    },
    [clearTouchClickSuppression],
  );

  const updateTrackItemWidth = useCallback(() => {
    const firstButton = containerRef.current?.querySelector<HTMLButtonElement>(
      "button[data-week-key]",
    );
    const track = firstButton?.parentElement;
    const gap = track
      ? Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
      : 0;

    trackItemWidthRef.current = firstButton
      ? firstButton.getBoundingClientRect().width + gap
      : null;
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
      lastScrollLeftRef.current = container.scrollLeft;
      container.scrollTo({ left: container.scrollLeft, behavior: "auto" });
    }
  }, [clearSmoothCentering]);

  useLayoutEffect(() => {
    return () => {
      clearSmoothCentering();
      clearTouchClickSuppression();
      touchGestureRef.current = null;
    };
  }, [clearSmoothCentering, clearTouchClickSuppression]);

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

      if (!shouldSmoothlyCenter) {
        lastScrollLeftRef.current = targetLeft;
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

    updateTrackItemWidth();

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
    lastScrollLeftRef.current = container.scrollLeft;

    const pendingFocusWeek = pendingFocusWeekRef.current;

    if (!pendingFocusWeek) return;

    const nextFocusedButton = container.querySelector<HTMLButtonElement>(
      `[data-week-key="${pendingFocusWeek}"]`,
    );

    if (nextFocusedButton) {
      nextFocusedButton.focus({ preventScroll: true });
      pendingFocusWeekRef.current = null;
    }
  }, [selectedWeekKey, updateTrackItemWidth, weekStarts]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    updateTrackItemWidth();

    if (typeof ResizeObserver === "undefined") return;

    const resizeObserver = new ResizeObserver(() => {
      updateTrackItemWidth();
      centerSelectedWeek();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [centerSelectedWeek, updateTrackItemWidth]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    if (smoothCenteringRef.current) {
      lastScrollLeftRef.current = container.scrollLeft;
      scheduleSmoothCenterFallback();
      return;
    }

    if (pendingExtensionRef.current) return;

    const scrollLeft = container.scrollLeft;
    const previousScrollLeft = lastScrollLeftRef.current;
    lastScrollLeftRef.current = scrollLeft;

    if (previousScrollLeft === null || scrollLeft === previousScrollLeft) {
      return;
    }

    const trackItemWidth = trackItemWidthRef.current;

    if (trackItemWidth === null) return;

    const maxScrollLeft = Math.max(
      container.scrollWidth - container.clientWidth,
      0,
    );
    const edgeThreshold = Math.min(
      EDGE_THRESHOLD,
      Math.max(maxScrollLeft - trackItemWidth, 0),
    );
    const isNearStart = scrollLeft <= edgeThreshold;
    const isNearEnd = scrollLeft >= maxScrollLeft - edgeThreshold;

    if (scrollLeft < previousScrollLeft && isNearStart) {
      pendingExtensionRef.current = "previous";
      pendingPrependTrackWidthRef.current = trackItemWidth;
      onExtendWeekBuffer("previous");
    } else if (scrollLeft > previousScrollLeft && isNearEnd) {
      pendingExtensionRef.current = "next";
      pendingAppendStartWeekRef.current = weekStarts[0]?.getTime() ?? null;
      pendingAppendTrackWidthRef.current = trackItemWidth;
      onExtendWeekBuffer("next");
    }
  }, [
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

  const handleRailPointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      cancelSmoothCentering();

      if (event.pointerType === "mouse") {
        lastMousePointerDownAtRef.current = Date.now();
      }
    },
    [cancelSmoothCentering],
  );

  const handleTouchPointerDown = useCallback(
    (
      event: ReactPointerEvent<HTMLButtonElement>,
      key: string,
      select: () => void,
    ) => {
      if (event.pointerType !== "touch" || !event.isPrimary) return;

      touchGestureRef.current = {
        key,
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        isSwipe: false,
        select,
      };
    },
    [],
  );

  const handleTouchPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const gesture = touchGestureRef.current;

      if (
        !gesture ||
        gesture.pointerId !== event.pointerId ||
        gesture.isSwipe
      ) {
        return;
      }

      gesture.isSwipe = hasTouchGestureExceededTapThreshold(gesture, event);
    },
    [],
  );

  const handleTouchPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const gesture = touchGestureRef.current;

      if (!gesture || gesture.pointerId !== event.pointerId) return;

      touchGestureRef.current = null;
      armTouchClickSuppression(gesture.key);

      if (!hasTouchGestureExceededTapThreshold(gesture, event) && !gesture.isSwipe) {
        gesture.select();
      }
    },
    [armTouchClickSuppression],
  );

  const handleTouchPointerCancel = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const gesture = touchGestureRef.current;

      if (!gesture || gesture.pointerId !== event.pointerId) return;

      touchGestureRef.current = null;
      armTouchClickSuppression(gesture.key);
    },
    [armTouchClickSuppression],
  );

  const handleWeekClick = useCallback(
    (
      event: ReactMouseEvent<HTMLButtonElement>,
      weekStart: Date,
      weekKey: string,
    ) => {
      const suppression = touchClickSuppressionRef.current;
      const now = Date.now();

      if (suppression && now > suppression.expiresAt) {
        clearTouchClickSuppression();
      }

      if (
        suppression &&
        suppression.key === weekKey &&
        now <= suppression.expiresAt &&
        isTouchGeneratedClick(
          event,
          lastMousePointerDownAtRef.current !== null &&
            lastMousePointerDownAtRef.current >= suppression.armedAt,
        )
      ) {
        clearTouchClickSuppression();
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      selectWeek(weekStart);
    },
    [clearTouchClickSuppression, selectWeek],
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
        onPointerDownCapture={handleRailPointerDownCapture}
        onPointerMove={handleTouchPointerMove}
        onPointerUp={handleTouchPointerUp}
        onPointerCancel={handleTouchPointerCancel}
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
        <div className="flex w-max min-w-[max(calc(100%+8rem),114.285714%)] gap-2 px-3 sm:px-4 lg:px-6">
          {weekStarts.map((weekStart) => {
            const weekEnd = getWeekEnd(weekStart);
            const weekKey = DateTime.from(weekStart).toDateOnlyString();
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
                start: DateTime.formatDate(weekStart, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }),
                end: DateTime.formatDate(weekEnd, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }),
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
                onPointerDown={(event) =>
                  handleTouchPointerDown(event, weekKey, () =>
                    selectWeek(weekStart),
                  )
                }
                onClick={(event) => handleWeekClick(event, weekStart, weekKey)}
                onKeyDown={(event) => handleKeyDown(event, weekStart)}
                data-week-key={weekKey}
                className={cn(
                  "relative flex h-14 min-w-32 flex-1 items-center justify-center overflow-hidden rounded-xl border px-3 py-1.5 text-center text-sm font-medium tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none cursor-pointer",
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
