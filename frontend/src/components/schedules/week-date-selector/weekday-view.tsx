import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent as ReactTouchEvent,
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
const SCROLL_SETTLE_DELAY = 150;
const TOUCH_SWIPE_THRESHOLD = 8;
const TOUCH_CLICK_SUPPRESSION_DELAY = 500;
const WEEK_DAYS = 7;

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
  const prefersReducedMotion = useReducedMotion() === true;
  const instructionsId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingPrependTrackWidthRef = useRef<number | null>(null);
  const pendingAppendStartDateRef = useRef<number | null>(null);
  const pendingAppendTrackWidthRef = useRef<number | null>(null);
  const pendingExtensionRef = useRef<"previous" | "next" | null>(null);
  const pendingFocusDateRef = useRef<string | null>(null);
  const forcedCenteredDateRef = useRef<string | null>(null);
  const lastCenteredDateRef = useRef<string | null>(null);
  const lastCenterRequestRef = useRef<number | null>(null);
  const smoothCenteringRef = useRef(false);
  const resizeDuringSmoothCenteringRef = useRef(false);
  const centerSelectedDateRef = useRef<
    (behavior?: ScrollBehavior) => void
  >(() => undefined);
  const extendAtSettledEdgeRef = useRef<() => boolean>(() => false);
  const smoothCenterFallbackTimeoutRef = useRef<number | null>(null);
  const smoothCenterScrollEndCleanupRef = useRef<(() => void) | null>(null);
  const scrollSettlementTimeoutRef = useRef<number | null>(null);
  const scrollSessionActiveRef = useRef(false);
  const scrollSessionStartIndexRef = useRef<number | null>(null);
  const didExtendScrollSessionRef = useRef(false);
  const touchScrollPointerActiveRef = useRef(false);
  const activeTouchIdentifierRef = useRef<number | null>(null);
  const settleRailScrollRef = useRef<() => void>(() => undefined);
  const lastMousePointerDownAtRef = useRef<number | null>(null);
  const touchGestureRef = useRef<TouchSelectionGesture | null>(null);
  const touchClickSuppressionRef = useRef<TouchClickSuppression | null>(
    null,
  );
  const touchClickSuppressionTimeoutRef = useRef<number | null>(null);
  const isSelectedDateInBuffer = selectedDate
    ? dates.some((date) => DateTime.from(date).isSameDay(selectedDate))
    : false;
  const offscreenSelectedAriaLabel =
    selectedDate && !isSelectedDateInBuffer
      ? [
          DateTime.formatDate(selectedDate, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          }),
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

  const clearTouchClickSuppression = useCallback(() => {
    if (touchClickSuppressionTimeoutRef.current !== null) {
      window.clearTimeout(touchClickSuppressionTimeoutRef.current);
      touchClickSuppressionTimeoutRef.current = null;
    }

    touchClickSuppressionRef.current = null;
  }, []);

  const discardScrollSession = useCallback(() => {
    scrollSessionActiveRef.current = false;
    scrollSessionStartIndexRef.current = null;
    didExtendScrollSessionRef.current = false;

    if (scrollSettlementTimeoutRef.current !== null) {
      window.clearTimeout(scrollSettlementTimeoutRef.current);
      scrollSettlementTimeoutRef.current = null;
    }
  }, []);

  const handleRailScrollEnd = useCallback(() => {
    if (touchScrollPointerActiveRef.current) return;

    settleRailScrollRef.current();
  }, []);

  const scheduleRailScrollSettlement = useCallback(() => {
    if (
      !scrollSessionActiveRef.current ||
      touchScrollPointerActiveRef.current
    ) {
      return;
    }

    if (scrollSettlementTimeoutRef.current !== null) {
      window.clearTimeout(scrollSettlementTimeoutRef.current);
    }

    scrollSettlementTimeoutRef.current = window.setTimeout(
      () => settleRailScrollRef.current(),
      SCROLL_SETTLE_DELAY,
    );
  }, []);

  const finishTouchScroll = useCallback(() => {
    if (!touchScrollPointerActiveRef.current) return;

    touchScrollPointerActiveRef.current = false;
    activeTouchIdentifierRef.current = null;
    scheduleRailScrollSettlement();
  }, [scheduleRailScrollSettlement]);

  useLayoutEffect(() => {
    const didTrackedTouchEnd = (event: TouchEvent) => {
      const activeTouchIdentifier = activeTouchIdentifierRef.current;

      return activeTouchIdentifier === null
        ? event.touches.length === 0
        : Array.from(event.changedTouches).some(
            (touch) => touch.identifier === activeTouchIdentifier,
          );
    };
    const handleTouchEnd = (event: TouchEvent) => {
      if (didTrackedTouchEnd(event)) {
        finishTouchScroll();
      }
    };
    const handleTouchCancel = (event: TouchEvent) => {
      if (didTrackedTouchEnd(event)) {
        touchGestureRef.current = null;
        touchScrollPointerActiveRef.current = false;
        activeTouchIdentifierRef.current = null;
        discardScrollSession();
      }
    };
    const discardInterruptedTouch = () => {
      touchGestureRef.current = null;
      clearTouchClickSuppression();
      touchScrollPointerActiveRef.current = false;
      activeTouchIdentifierRef.current = null;
      discardScrollSession();
    };

    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchCancel, { passive: true });
    window.addEventListener("pagehide", discardInterruptedTouch);
    window.addEventListener("blur", discardInterruptedTouch);

    return () => {
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchCancel);
      window.removeEventListener("pagehide", discardInterruptedTouch);
      window.removeEventListener("blur", discardInterruptedTouch);
    };
  }, [clearTouchClickSuppression, discardScrollSession, finishTouchScroll]);

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

  const settleSmoothCentering = useCallback(() => {
    if (!smoothCenteringRef.current) return;

    const shouldRecenterAfterResize = resizeDuringSmoothCenteringRef.current;

    resizeDuringSmoothCenteringRef.current = false;
    clearSmoothCentering();

    const didRotateBuffer = extendAtSettledEdgeRef.current();

    if (!didRotateBuffer && shouldRecenterAfterResize) {
      centerSelectedDateRef.current();
    }
  }, [clearSmoothCentering]);

  const scheduleSmoothCenterFallback = useCallback(() => {
    if (!smoothCenteringRef.current) return;

    if (smoothCenterFallbackTimeoutRef.current !== null) {
      window.clearTimeout(smoothCenterFallbackTimeoutRef.current);
    }

    smoothCenterFallbackTimeoutRef.current = window.setTimeout(
      settleSmoothCentering,
      SMOOTH_SCROLL_SETTLE_DELAY,
    );
  }, [settleSmoothCentering]);

  const cancelSmoothCentering = useCallback(() => {
    resizeDuringSmoothCenteringRef.current = false;

    if (!smoothCenteringRef.current) return;

    clearSmoothCentering();

    const container = containerRef.current;

    if (container) {
      container.scrollTo({ left: container.scrollLeft, behavior: "auto" });
    }
  }, [clearSmoothCentering]);

  useLayoutEffect(() => {
    return () => {
      clearSmoothCentering();
      resizeDuringSmoothCenteringRef.current = false;
      clearTouchClickSuppression();
      discardScrollSession();
      touchScrollPointerActiveRef.current = false;
      activeTouchIdentifierRef.current = null;
      touchGestureRef.current = null;
    };
  }, [clearSmoothCentering, clearTouchClickSuppression, discardScrollSession]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    container.addEventListener("scrollend", handleRailScrollEnd);

    return () => {
      container.removeEventListener("scrollend", handleRailScrollEnd);
    };
  }, [handleRailScrollEnd]);

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
        resizeDuringSmoothCenteringRef.current = false;
        smoothCenteringRef.current = true;

        const handleScrollEnd = () => {
          settleSmoothCentering();
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
    [
      clearSmoothCentering,
      prefersReducedMotion,
      scheduleSmoothCenterFallback,
      settleSmoothCentering,
    ],
  );

  useLayoutEffect(() => {
    centerSelectedDateRef.current = centerSelectedDate;
  }, [centerSelectedDate]);

  useLayoutEffect(() => {
    if (!selectedDate) return;

    const selectedDateKey = DateTime.from(selectedDate).toDateOnlyString();

    if (pendingExtensionRef.current !== null) {
      lastCenteredDateRef.current = selectedDateKey;
      lastCenterRequestRef.current = centerRequest.id;
      return;
    }

    const shouldForceCenter = forcedCenteredDateRef.current === selectedDateKey;
    const shouldCenter =
      shouldForceCenter ||
      lastCenteredDateRef.current !== selectedDateKey ||
      lastCenterRequestRef.current !== centerRequest.id;

    if (!shouldCenter) return;

    const selectedButton = containerRef.current?.querySelector(
      'button[aria-checked="true"]',
    );

    if (!selectedButton) return;

    const isInitialCenter = lastCenteredDateRef.current === null;
    const selectedDateChanged =
      lastCenteredDateRef.current !== selectedDateKey;
    const centerRequestChanged =
      lastCenterRequestRef.current !== null &&
      lastCenterRequestRef.current !== centerRequest.id;
    const behavior = isInitialCenter
      ? "auto"
      : shouldForceCenter
        ? "smooth"
        : centerRequestChanged
        ? centerRequest.behavior
        : selectedDateChanged
          ? "smooth"
          : "auto";

    centerSelectedDate(behavior);
    forcedCenteredDateRef.current = null;
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
      if (smoothCenteringRef.current) {
        resizeDuringSmoothCenteringRef.current = true;
        return;
      }

      centerSelectedDateRef.current();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const extendAtSettledEdge = useCallback(() => {
    const container = containerRef.current;

    if (!container || pendingExtensionRef.current !== null) return false;

    const firstDateButton = container.querySelector<HTMLButtonElement>(
      "button[data-date-key]",
    );
    const track = firstDateButton?.parentElement;
    const gap = track
      ? Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
      : 0;
    const itemWidth = firstDateButton
      ? firstDateButton.getBoundingClientRect().width + gap
      : null;

    if (itemWidth === null) return false;

    const maxScrollLeft = Math.max(
      container.scrollWidth - container.clientWidth,
      0,
    );
    const edgeThreshold = Math.min(
      EDGE_THRESHOLD,
      Math.max(maxScrollLeft - itemWidth, 0),
    );
    const direction =
      maxScrollLeft > 0 && container.scrollLeft <= edgeThreshold
        ? "previous"
        : maxScrollLeft > 0 &&
            container.scrollLeft >= maxScrollLeft - edgeThreshold
          ? "next"
          : null;

    if (!direction) return false;

    pendingExtensionRef.current = direction;

    if (direction === "previous") {
      pendingPrependTrackWidthRef.current = itemWidth * WEEK_DAYS;
    } else {
      pendingAppendStartDateRef.current = dates[0]?.getTime() ?? null;
      pendingAppendTrackWidthRef.current = itemWidth * WEEK_DAYS;
    }

    onExtendDateBuffer(direction);
    return true;
  }, [dates, onExtendDateBuffer]);

  useLayoutEffect(() => {
    extendAtSettledEdgeRef.current = extendAtSettledEdge;
  }, [extendAtSettledEdge]);

  const settleRailScroll = useCallback(() => {
    if (smoothCenteringRef.current) {
      settleSmoothCentering();
      return;
    }

    if (touchScrollPointerActiveRef.current) return;

    if (!scrollSessionActiveRef.current) return;

    scrollSessionActiveRef.current = false;

    if (scrollSettlementTimeoutRef.current !== null) {
      window.clearTimeout(scrollSettlementTimeoutRef.current);
      scrollSettlementTimeoutRef.current = null;
    }

    const container = containerRef.current;

    if (!container) return;

    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button[data-date-key]"),
    );

    if (buttons.length === 0) return;

    const centers = buttons.map(
      (button) => button.offsetLeft + button.offsetWidth / 2,
    );

    if (new Set(centers).size < 2) return;

    const viewportCenter = container.scrollLeft + container.clientWidth / 2;
    const centeredIndex = centers.reduce(
      (closestIndex, center, index) =>
        Math.abs(center - viewportCenter) <
        Math.abs(centers[closestIndex]! - viewportCenter)
          ? index
          : closestIndex,
      0,
    );
    const selectedIndex = selectedDate
      ? dates.findIndex((date) => DateTime.from(date).isSameDay(selectedDate))
      : -1;
    const startIndex =
      scrollSessionStartIndexRef.current ??
      (selectedIndex >= 0 ? selectedIndex : centeredIndex);
    const targetIndex = Math.min(
      Math.max(centeredIndex, startIndex - 1),
      startIndex + 1,
    );
    const targetDate = dates[targetIndex];
    const wasLimitedToOneStep = targetIndex !== centeredIndex;

    scrollSessionStartIndexRef.current = null;

    if (!targetDate) return;

    if (!selectedDate || !DateTime.from(targetDate).isSameDay(selectedDate)) {
      if (wasLimitedToOneStep) {
        forcedCenteredDateRef.current = DateTime.from(
          targetDate,
        ).toDateOnlyString();
      }
      onDateSelect(targetDate);
    }

    if (wasLimitedToOneStep) return;

    if (!didExtendScrollSessionRef.current) {
      didExtendScrollSessionRef.current = extendAtSettledEdge();
    }
  }, [
    dates,
    extendAtSettledEdge,
    onDateSelect,
    selectedDate,
    settleSmoothCentering,
  ]);

  useLayoutEffect(() => {
    settleRailScrollRef.current = settleRailScroll;
  }, [settleRailScroll]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    if (smoothCenteringRef.current) {
      scheduleSmoothCenterFallback();
      return;
    }

    if (!scrollSessionActiveRef.current) {
      const selectedIndex = selectedDate
        ? dates.findIndex((date) => DateTime.from(date).isSameDay(selectedDate))
        : -1;

      scrollSessionActiveRef.current = true;
      scrollSessionStartIndexRef.current = selectedIndex >= 0 ? selectedIndex : null;
      didExtendScrollSessionRef.current = false;
    }

    scheduleRailScrollSettlement();

    if (pendingExtensionRef.current) return;
  }, [
    dates,
    scheduleRailScrollSettlement,
    scheduleSmoothCenterFallback,
    selectedDate,
  ]);

  const handleRailFocus = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget || !selectedDate) return;

      pendingFocusDateRef.current =
        DateTime.from(selectedDate).toDateOnlyString();
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
      discardScrollSession();

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
    [
      cancelSmoothCentering,
      dates,
      discardScrollSession,
      onDateSelect,
      onExtendDateBuffer,
    ],
  );

  const handleRailPointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      cancelSmoothCentering();

      const selectedIndex = selectedDate
        ? dates.findIndex((date) => DateTime.from(date).isSameDay(selectedDate))
        : -1;

      scrollSessionActiveRef.current = true;
      scrollSessionStartIndexRef.current = selectedIndex >= 0 ? selectedIndex : null;
      didExtendScrollSessionRef.current = false;

      if (event.pointerType === "touch" && event.isPrimary) {
        touchScrollPointerActiveRef.current = true;
      } else if (event.pointerType === "mouse") {
        lastMousePointerDownAtRef.current = Date.now();
      }
    },
    [cancelSmoothCentering, dates, selectedDate],
  );

  const handleRailTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (activeTouchIdentifierRef.current !== null) {
        return;
      }

      const touch = event.changedTouches[0];

      if (!touch) return;

      touchScrollPointerActiveRef.current = true;
      activeTouchIdentifierRef.current = touch.identifier;
    },
    [],
  );

  const handleRailWheel = useCallback(() => {
    cancelSmoothCentering();

    if (!scrollSessionActiveRef.current) {
      const selectedIndex = selectedDate
        ? dates.findIndex((date) => DateTime.from(date).isSameDay(selectedDate))
        : -1;

      scrollSessionActiveRef.current = true;
      scrollSessionStartIndexRef.current = selectedIndex >= 0 ? selectedIndex : null;
      didExtendScrollSessionRef.current = false;
    }
  }, [cancelSmoothCentering, dates, selectedDate]);

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
      if (event.pointerType === "touch" && event.isPrimary) {
        finishTouchScroll();
      }

      const gesture = touchGestureRef.current;

      if (!gesture || gesture.pointerId !== event.pointerId) return;

      touchGestureRef.current = null;
      armTouchClickSuppression(gesture.key);

      if (!hasTouchGestureExceededTapThreshold(gesture, event) && !gesture.isSwipe) {
        discardScrollSession();
        gesture.select();
      }
    },
    [
      armTouchClickSuppression,
      discardScrollSession,
      finishTouchScroll,
    ],
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

  const handleDateClick = useCallback(
    (
      event: ReactMouseEvent<HTMLButtonElement>,
      date: Date,
      dateKey: string,
    ) => {
      const suppression = touchClickSuppressionRef.current;
      const now = Date.now();

      if (suppression && now > suppression.expiresAt) {
        clearTouchClickSuppression();
      }

      if (
        suppression &&
        suppression.key === dateKey &&
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

      discardScrollSession();
      onDateSelect(date);
    },
    [clearTouchClickSuppression, discardScrollSession, onDateSelect],
  );

  return (
    <div className={cn("min-w-0 max-w-full pb-2 pt-1", className)}>
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
        onWheel={handleRailWheel}
        onPointerDownCapture={handleRailPointerDownCapture}
        onTouchStart={handleRailTouchStart}
        onPointerMove={handleTouchPointerMove}
        onPointerUp={handleTouchPointerUp}
        onPointerCancel={handleTouchPointerCancel}
        className="relative min-w-0 max-w-full snap-x snap-mandatory overflow-x-auto py-1 scroll-px-3 scroll-py-1 overscroll-x-contain touch-pan-x focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:scroll-px-4 lg:scroll-px-6"
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
            const dateKey = dateTime.toDateOnlyString();
            const isSelected = selectedDate
              ? dateTime.isSameDay(selectedDate)
              : false;
            const isDateToday = dateTime.isToday();
            const dayName = DateTime.formatDate(date, { weekday: "short" });
            const dayNumber = DateTime.formatDate(date, { day: "numeric" });
            const monthName = DateTime.formatDate(date, { month: "short" });
            const previousDate = dates[index - 1];
            const showsMonthMarker =
              !previousDate ||
              date.getMonth() !== previousDate.getMonth();
            const ariaLabel = [
              DateTime.formatDate(date, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              }),
              isDateToday ? t("schedules:weekSelector.today") : undefined,
              isSelected ? t("schedules:weekSelector.selected") : undefined,
            ]
              .filter(Boolean)
              .join(", ");

            return (
              <button
                key={date.getTime()}
                type="button"
                onPointerDown={(event) =>
                  handleTouchPointerDown(event, dateKey, () =>
                    onDateSelect(date),
                  )
                }
                onClick={(event) => handleDateClick(event, date, dateKey)}
                onKeyDown={(event) => handleKeyDown(event, date)}
                data-date-key={dateKey}
                className={cn(
                  "relative flex h-14 w-14 shrink-0 snap-center snap-always flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary-hover"
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
                    "text-lg font-medium tracking-[-0.01em] leading-none",
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
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
