import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
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
  onExtendDateBuffer: (
    direction: "previous" | "next",
    count?: number,
  ) => void;
  centerRequest: {
    id: number;
    behavior: ScrollBehavior;
  };
  isActive?: boolean;
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

interface TouchEdgeRotation {
  direction: "previous" | "next";
  trackItemWidth: number;
  appendStartDate: number | null;
}

type NativeClickEvent = globalThis.MouseEvent & {
  sourceCapabilities?: {
    firesTouchEvents?: boolean;
  } | null;
};

const EDGE_THRESHOLD = 128;
const SMOOTH_SCROLL_SETTLE_DELAY = 150;
const TOUCH_SCROLL_SETTLE_DELAY = 150;
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

function getEdgeThreshold(maxScrollLeft: number, trackItemWidth: number) {
  return Math.min(
    Math.max(EDGE_THRESHOLD, trackItemWidth),
    maxScrollLeft / 2,
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
  centerRequest,
  isActive = true,
  className,
}: WeekdayViewProps) {
  const { t } = useTranslation(["schedules"]);
  const prefersReducedMotion = useReducedMotion() === true;
  const instructionsId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollLeftRef = useRef<number | null>(null);
  const lastBufferStartDateRef = useRef<number | null>(
    dates[0]?.getTime() ?? null,
  );
  const trackItemWidthRef = useRef<number | null>(null);
  const pendingPrependTrackWidthRef = useRef<number | null>(null);
  const pendingAppendStartDateRef = useRef<number | null>(null);
  const pendingAppendTrackWidthRef = useRef<number | null>(null);
  const pendingExtensionRef = useRef<"previous" | "next" | null>(null);
  const pendingSelectionEdgeCenterBehaviorRef =
    useRef<ScrollBehavior | null>(null);
  const pendingSelectionBufferStartDateRef = useRef<number | null>(null);
  const ignoredCompensationScrollLeftRef = useRef<number | null>(null);
  const pendingFocusDateRef = useRef<string | null>(null);
  const lastCenteredDateRef = useRef<string | null>(null);
  const lastCenterRequestRef = useRef<number | null>(null);
  const smoothCenteringRef = useRef(false);
  const resizeDuringSmoothCenteringRef = useRef(false);
  const hasObservedInitialLayoutRef = useRef(false);
  const selectionCenterPendingRef = useRef(true);
  const centerSelectedDateRef = useRef<
    (behavior?: ScrollBehavior) => boolean
  >(() => false);
  const smoothCenterFallbackTimeoutRef = useRef<number | null>(null);
  const smoothCenterScrollEndCleanupRef = useRef<(() => void) | null>(null);
  const touchScrollSessionRef = useRef(false);
  const scrollSettlementTimeoutRef = useRef<number | null>(null);
  const scrollSessionActiveRef = useRef(false);
  const didScrollSessionMoveRef = useRef(false);
  const didExtendScrollSessionRef = useRef(false);
  const touchScrollPointerActiveRef = useRef(false);
  const activeTouchIdentifierRef = useRef<number | null>(null);
  const queuedTouchEdgeRotationRef = useRef<TouchEdgeRotation | null>(null);
  const touchScrollFallbackTimeoutRef = useRef<number | null>(null);
  const settleRailScrollRef = useRef<() => void>(() => undefined);
  const lastMousePointerDownAtRef = useRef<number | null>(null);
  const touchGestureRef = useRef<TouchSelectionGesture | null>(null);
  const touchClickSuppressionRef = useRef<TouchClickSuppression | null>(
    null,
  );
  const touchClickSuppressionTimeoutRef = useRef<number | null>(null);
  const [rovingFocusDateKey, setRovingFocusDateKey] = useState<string | null>(
    null,
  );
  const selectedDateKey = selectedDate
    ? DateTime.from(selectedDate).toDateOnlyString()
    : null;
  const lastSelectedDateKeyRef = useRef<string | null>(selectedDateKey);
  const pendingSelectedFocusDateRef = useRef<string | null>(null);
  const isSelectedDateInBuffer = selectedDate
    ? dates.some((date) => DateTime.from(date).isSameDay(selectedDate))
    : false;
  const isRovingFocusDateInBuffer =
    rovingFocusDateKey !== null &&
    dates.some(
      (date) => DateTime.from(date).toDateOnlyString() === rovingFocusDateKey,
    );
  const tabbableDateKey = isRovingFocusDateInBuffer
    ? rovingFocusDateKey
    : isSelectedDateInBuffer
      ? selectedDateKey
      : dates[0]
        ? DateTime.from(dates[0]).toDateOnlyString()
        : null;

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
    didScrollSessionMoveRef.current = false;
    didExtendScrollSessionRef.current = false;

    if (scrollSettlementTimeoutRef.current !== null) {
      window.clearTimeout(scrollSettlementTimeoutRef.current);
      scrollSettlementTimeoutRef.current = null;
    }
  }, []);

  const discardTouchScrollSession = useCallback(() => {
    touchScrollSessionRef.current = false;
    touchScrollPointerActiveRef.current = false;
    activeTouchIdentifierRef.current = null;
    queuedTouchEdgeRotationRef.current = null;

    if (touchScrollFallbackTimeoutRef.current !== null) {
      window.clearTimeout(touchScrollFallbackTimeoutRef.current);
      touchScrollFallbackTimeoutRef.current = null;
    }
  }, []);

  const discardPendingBrowseSession = useCallback(() => {
    discardScrollSession();
    discardTouchScrollSession();
  }, [discardScrollSession, discardTouchScrollSession]);

  useLayoutEffect(() => {
    if (!isActive) {
      discardPendingBrowseSession();
    }
  }, [discardPendingBrowseSession, isActive]);

  const handleRailScrollEnd = useCallback(() => {
    if (touchScrollPointerActiveRef.current) return;

    settleRailScrollRef.current();
  }, []);

  const settleTouchScrollSession = useCallback(() => {
    if (
      !touchScrollSessionRef.current ||
      touchScrollPointerActiveRef.current
    ) {
      return;
    }

    const queuedRotation = queuedTouchEdgeRotationRef.current;

    discardTouchScrollSession();

    if (!queuedRotation) {
      settleRailScrollRef.current();
      return;
    }

    pendingExtensionRef.current = queuedRotation.direction;

    if (queuedRotation.direction === "previous") {
      pendingPrependTrackWidthRef.current =
        queuedRotation.trackItemWidth * WEEK_DAYS;
    } else {
      pendingAppendStartDateRef.current = queuedRotation.appendStartDate;
      pendingAppendTrackWidthRef.current =
        queuedRotation.trackItemWidth * WEEK_DAYS;
    }

    onExtendDateBuffer(queuedRotation.direction);
    settleRailScrollRef.current();
  }, [discardTouchScrollSession, onExtendDateBuffer]);

  const scheduleTouchScrollIdleFallback = useCallback(() => {
    if (
      !touchScrollSessionRef.current ||
      touchScrollPointerActiveRef.current
    ) {
      return;
    }

    if (touchScrollFallbackTimeoutRef.current !== null) {
      window.clearTimeout(touchScrollFallbackTimeoutRef.current);
    }

    touchScrollFallbackTimeoutRef.current = window.setTimeout(
      settleTouchScrollSession,
      TOUCH_SCROLL_SETTLE_DELAY,
    );
  }, [settleTouchScrollSession]);

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
    scheduleTouchScrollIdleFallback();
  }, [scheduleTouchScrollIdleFallback]);

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
        discardTouchScrollSession();
        discardScrollSession();
      }
    };
    const discardInterruptedTouch = () => {
      touchGestureRef.current = null;
      clearTouchClickSuppression();
      discardTouchScrollSession();
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
  }, [
    clearTouchClickSuppression,
    discardScrollSession,
    discardTouchScrollSession,
    finishTouchScroll,
  ]);

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

    if (shouldRecenterAfterResize) {
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
      discardTouchScrollSession();
      discardScrollSession();
      touchGestureRef.current = null;
    };
  }, [
    clearSmoothCentering,
    clearTouchClickSuppression,
    discardScrollSession,
    discardTouchScrollSession,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    container.addEventListener("scrollend", handleRailScrollEnd);

    return () => {
      container.removeEventListener("scrollend", handleRailScrollEnd);
    };
  }, [handleRailScrollEnd]);

  const centerSelectedDate = useCallback(
    (behavior: ScrollBehavior = "auto"): boolean => {
      const container = containerRef.current;
      const selectedButton = container?.querySelector<HTMLButtonElement>(
        'button[data-selected="true"]',
      );

      if (
        !isActive ||
        !container ||
        !selectedButton ||
        container.clientWidth === 0 ||
        container.scrollWidth === 0 ||
        selectedButton.offsetWidth === 0
      ) {
        return false;
      }

      const maxScrollLeft = Math.max(
        container.scrollWidth - container.clientWidth,
        0,
      );
      const centeredScrollLeft =
        selectedButton.offsetLeft +
        selectedButton.offsetWidth / 2 -
        container.clientWidth / 2;
      const targetLeft = Math.min(
        Math.max(centeredScrollLeft, 0),
        maxScrollLeft,
      );
      const edgeDirection =
        maxScrollLeft > 0 && centeredScrollLeft < 0
          ? "previous"
          : maxScrollLeft > 0 && centeredScrollLeft > maxScrollLeft
            ? "next"
            : null;

      if (edgeDirection) {
        if (pendingExtensionRef.current === null) {
          const firstDateButton = container.querySelector<HTMLButtonElement>(
            "button[data-date-key]",
          );
          const track = firstDateButton?.parentElement;
          const gap = track
            ? Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
            : 0;
          const itemWidth = firstDateButton
            ? firstDateButton.getBoundingClientRect().width + gap
            : selectedButton.offsetWidth;
          const distanceToCenter =
            edgeDirection === "previous"
              ? -centeredScrollLeft
              : centeredScrollLeft - maxScrollLeft;
          const maxRangesToExtend = Math.floor(
            (dates.length - 1) / WEEK_DAYS,
          );

          if (itemWidth > 0 && maxRangesToExtend > 0) {
            clearSmoothCentering();
            resizeDuringSmoothCenteringRef.current = false;
            pendingExtensionRef.current = edgeDirection;
            pendingSelectionEdgeCenterBehaviorRef.current = behavior;
            pendingSelectionBufferStartDateRef.current =
              dates[0]?.getTime() ?? null;
            onExtendDateBuffer(
              edgeDirection,
              Math.min(
                Math.max(
                  Math.ceil(distanceToCenter / itemWidth / WEEK_DAYS),
                  1,
                ),
                maxRangesToExtend,
              ),
            );
            return false;
          }
        }

        return false;
      }

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

      if (!shouldSmoothlyCenter) {
        lastScrollLeftRef.current = targetLeft;
      }

      container.scrollTo({
        left: targetLeft,
        behavior: shouldSmoothlyCenter ? "smooth" : "auto",
      });

      return true;
    },
    [
      clearSmoothCentering,
      dates.length,
      isActive,
      onExtendDateBuffer,
      prefersReducedMotion,
      scheduleSmoothCenterFallback,
      settleSmoothCentering,
    ],
  );

  useLayoutEffect(() => {
    centerSelectedDateRef.current = centerSelectedDate;
  }, [centerSelectedDate]);

  const focusDateButton = useCallback((dateKey: string): boolean => {
    const container = containerRef.current;
    const button = container?.querySelector<HTMLButtonElement>(
      `[data-date-key="${dateKey}"]`,
    );

    if (!container || !button) return false;

    const maxScrollLeft = Math.max(
      container.scrollWidth - container.clientWidth,
      0,
    );
    const targetLeft = Math.min(
      Math.max(
        button.offsetLeft + button.offsetWidth / 2 - container.clientWidth / 2,
        0,
      ),
      maxScrollLeft,
    );

    lastScrollLeftRef.current = targetLeft;
    container.scrollTo({ left: targetLeft, behavior: "auto" });
    button.focus({ preventScroll: true });
    return true;
  }, []);

  useLayoutEffect(() => {
    if (lastSelectedDateKeyRef.current !== selectedDateKey) {
      lastSelectedDateKeyRef.current = selectedDateKey;
      pendingSelectedFocusDateRef.current = selectedDateKey;
    }

    const pendingSelectedFocusDate = pendingSelectedFocusDateRef.current;

    if (
      pendingSelectedFocusDate &&
      dates.some(
        (date) =>
          DateTime.from(date).toDateOnlyString() === pendingSelectedFocusDate,
      )
    ) {
      setRovingFocusDateKey(pendingSelectedFocusDate);
      pendingSelectedFocusDateRef.current = null;
    }
  }, [dates, selectedDateKey]);

  useLayoutEffect(() => {
    if (!selectedDate || !selectedDateKey) {
      selectionCenterPendingRef.current = false;
      pendingSelectionEdgeCenterBehaviorRef.current = null;
      pendingSelectionBufferStartDateRef.current = null;
      return;
    }

    const selectedDateChanged =
      lastCenteredDateRef.current !== selectedDateKey;
    const centerRequestChanged =
      lastCenterRequestRef.current !== centerRequest.id;

    if (selectedDateChanged || centerRequestChanged) {
      discardPendingBrowseSession();
    }

    const pendingSelectionEdgeCenterBehavior =
      pendingSelectionEdgeCenterBehaviorRef.current;

    if (
      pendingExtensionRef.current !== null &&
      pendingSelectionEdgeCenterBehavior === null
    ) {
      lastCenteredDateRef.current = selectedDateKey;
      lastCenterRequestRef.current = centerRequest.id;
      selectionCenterPendingRef.current = false;
      return;
    }

    const shouldCenter =
      lastCenteredDateRef.current !== selectedDateKey ||
      lastCenterRequestRef.current !== centerRequest.id;

    selectionCenterPendingRef.current = shouldCenter;

    if (!shouldCenter) return;

    const selectedButton = containerRef.current?.querySelector(
      'button[data-selected="true"]',
    );

    if (!selectedButton) return;

    const isInitialCenter = lastCenteredDateRef.current === null;
    const didCenterRequestChange =
      lastCenterRequestRef.current !== null && centerRequestChanged;
    const behavior =
      pendingSelectionEdgeCenterBehavior ??
      (isInitialCenter
        ? "auto"
        : didCenterRequestChange
          ? centerRequest.behavior
          : selectedDateChanged
            ? "smooth"
            : "auto");

    if (!centerSelectedDate(behavior)) return;

    lastCenteredDateRef.current = selectedDateKey;
    lastCenterRequestRef.current = centerRequest.id;
    selectionCenterPendingRef.current = false;
    pendingSelectionEdgeCenterBehaviorRef.current = null;
    pendingSelectionBufferStartDateRef.current = null;
    hasObservedInitialLayoutRef.current = true;
  }, [
    centerRequest,
    centerSelectedDate,
    dates,
    discardPendingBrowseSession,
    isActive,
    selectedDate,
    selectedDateKey,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    if (
      pendingExtensionRef.current !== null &&
      pendingSelectionEdgeCenterBehaviorRef.current !== null &&
      pendingSelectionBufferStartDateRef.current === dates[0]?.getTime()
    ) {
      return;
    }

    const bufferStartDate = dates[0]?.getTime() ?? null;
    const didAdvanceBuffer =
      lastBufferStartDateRef.current !== bufferStartDate;

    lastBufferStartDateRef.current = bufferStartDate;
    let adjustedForBufferExtension = false;

    if (pendingPrependTrackWidthRef.current !== null) {
      container.scrollLeft += pendingPrependTrackWidthRef.current;
      pendingPrependTrackWidthRef.current = null;
      adjustedForBufferExtension = true;
    }

    if (
      pendingAppendStartDateRef.current !== null &&
      pendingAppendTrackWidthRef.current !== null &&
      dates[0]?.getTime() !== pendingAppendStartDateRef.current
    ) {
      container.scrollLeft -= pendingAppendTrackWidthRef.current;
      adjustedForBufferExtension = true;
    }

    pendingAppendStartDateRef.current = null;
    pendingAppendTrackWidthRef.current = null;

    pendingExtensionRef.current = null;
    pendingSelectionBufferStartDateRef.current = null;
    lastScrollLeftRef.current = container.scrollLeft;

    if (adjustedForBufferExtension) {
      ignoredCompensationScrollLeftRef.current = container.scrollLeft;
    }

    if (didAdvanceBuffer) {
      didExtendScrollSessionRef.current = false;
    }

    const pendingFocusDate = pendingFocusDateRef.current;

    if (!pendingFocusDate) return;

    if (focusDateButton(pendingFocusDate)) {
      pendingFocusDateRef.current = null;
    }
  }, [dates, focusDateButton, selectedDate]);

  useLayoutEffect(() => {
    if (pendingFocusDateRef.current !== null || isRovingFocusDateInBuffer) {
      return;
    }

    if (isSelectedDateInBuffer && selectedDateKey) {
      setRovingFocusDateKey(selectedDateKey);
      return;
    }

    const container = containerRef.current;
    const buttons = container
      ? Array.from(
          container.querySelectorAll<HTMLButtonElement>("button[data-date-key]"),
        )
      : [];

    const browseTarget = buttons.reduce<HTMLButtonElement | null>(
      (closestButton, button) => {
        if (!closestButton || !container) return button;

        const viewportCenter = container.scrollLeft + container.clientWidth / 2;
        const buttonCenter = button.offsetLeft + button.offsetWidth / 2;
        const closestButtonCenter =
          closestButton.offsetLeft + closestButton.offsetWidth / 2;

        return Math.abs(buttonCenter - viewportCenter) <
          Math.abs(closestButtonCenter - viewportCenter)
          ? button
          : closestButton;
      },
      null,
    );

    setRovingFocusDateKey(
      browseTarget?.dataset.dateKey ??
        (dates[0] ? DateTime.from(dates[0]).toDateOnlyString() : null),
    );
  }, [
    dates,
    isRovingFocusDateInBuffer,
    isSelectedDateInBuffer,
    selectedDateKey,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (
      !isActive ||
      !container ||
      typeof ResizeObserver === "undefined"
    ) {
      return;
    }

    const resizeObserver = new ResizeObserver(() => {
      const selectedButton = container.querySelector<HTMLButtonElement>(
        'button[data-selected="true"]',
      );

      if (
        container.clientWidth === 0 ||
        container.scrollWidth === 0 ||
        !selectedButton ||
        selectedButton.offsetWidth === 0
      ) {
        return;
      }

      const shouldCenterInitialLayout = !hasObservedInitialLayoutRef.current;

      hasObservedInitialLayoutRef.current = true;

      if (smoothCenteringRef.current) {
        resizeDuringSmoothCenteringRef.current = true;
        return;
      }

      if (shouldCenterInitialLayout || selectionCenterPendingRef.current) {
        if (!centerSelectedDateRef.current() || !selectedDateKey) return;

        lastCenteredDateRef.current = selectedDateKey;
        lastCenterRequestRef.current = centerRequest.id;
        selectionCenterPendingRef.current = false;
        pendingSelectionEdgeCenterBehaviorRef.current = null;
        pendingSelectionBufferStartDateRef.current = null;
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [centerRequest.id, isActive, selectedDateKey]);

  const updateTrackItemWidth = useCallback(() => {
    const firstDateButton = containerRef.current?.querySelector<HTMLButtonElement>(
      "button[data-date-key]",
    );
    const track = firstDateButton?.parentElement;
    const gap = track
      ? Number.parseFloat(window.getComputedStyle(track).columnGap) || 0
      : 0;

    trackItemWidthRef.current = firstDateButton
      ? firstDateButton.getBoundingClientRect().width + gap
      : null;
  }, []);

  const extendAtEdgeThreshold = useCallback(
    (direction: "previous" | "next"): boolean => {
      const container = containerRef.current;

      if (
        !container ||
        pendingExtensionRef.current !== null ||
        queuedTouchEdgeRotationRef.current !== null
      ) {
        return false;
      }

      updateTrackItemWidth();

      const trackItemWidth = trackItemWidthRef.current;

      if (trackItemWidth === null) return false;

      const maxScrollLeft = Math.max(
        container.scrollWidth - container.clientWidth,
        0,
      );
      const edgeThreshold = getEdgeThreshold(maxScrollLeft, trackItemWidth);
      const isAtBufferedEdge =
        maxScrollLeft > 0 &&
        (direction === "previous"
          ? container.scrollLeft <= edgeThreshold
          : container.scrollLeft >= maxScrollLeft - edgeThreshold);

      if (!isAtBufferedEdge) return false;

      pendingExtensionRef.current = direction;

      if (direction === "previous") {
        pendingPrependTrackWidthRef.current = trackItemWidth * WEEK_DAYS;
      } else {
        pendingAppendStartDateRef.current = dates[0]?.getTime() ?? null;
        pendingAppendTrackWidthRef.current = trackItemWidth * WEEK_DAYS;
      }

      onExtendDateBuffer(direction);
      return true;
    },
    [dates, onExtendDateBuffer, updateTrackItemWidth],
  );

  const settleRailScroll = useCallback(() => {
    if (smoothCenteringRef.current) {
      settleSmoothCentering();
      return;
    }

    if (touchScrollSessionRef.current) {
      if (!touchScrollPointerActiveRef.current) {
        settleTouchScrollSession();
      }
      return;
    }

    if (!scrollSessionActiveRef.current) return;

    scrollSessionActiveRef.current = false;

    if (scrollSettlementTimeoutRef.current !== null) {
      window.clearTimeout(scrollSettlementTimeoutRef.current);
      scrollSettlementTimeoutRef.current = null;
    }

  }, [
    settleSmoothCentering,
    settleTouchScrollSession,
  ]);

  useLayoutEffect(() => {
    settleRailScrollRef.current = settleRailScroll;
  }, [settleRailScroll]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    const scrollLeft = container.scrollLeft;

    const ignoredCompensationScrollLeft =
      ignoredCompensationScrollLeftRef.current;

    if (ignoredCompensationScrollLeft !== null) {
      ignoredCompensationScrollLeftRef.current = null;

      if (
        Math.abs(scrollLeft - ignoredCompensationScrollLeft) < 0.5
      ) {
        lastScrollLeftRef.current = scrollLeft;
        return;
      }
    }

    if (smoothCenteringRef.current) {
      lastScrollLeftRef.current = scrollLeft;
      scheduleSmoothCenterFallback();
      return;
    }

    if (pendingExtensionRef.current !== null) {
      lastScrollLeftRef.current = scrollLeft;
      return;
    }

    const previousScrollLeft = lastScrollLeftRef.current;

    if (!scrollSessionActiveRef.current && !touchScrollSessionRef.current) {
      if (
        previousScrollLeft === null ||
        Math.abs(scrollLeft - previousScrollLeft) < 0.5
      ) {
        lastScrollLeftRef.current = scrollLeft;
        return;
      }

      scrollSessionActiveRef.current = true;
      didScrollSessionMoveRef.current = false;
      didExtendScrollSessionRef.current = false;
      updateTrackItemWidth();
    }

    if (previousScrollLeft === null) {
      lastScrollLeftRef.current = scrollLeft;
      return;
    }

    lastScrollLeftRef.current = scrollLeft;

    if (
      previousScrollLeft === null ||
      Math.abs(scrollLeft - previousScrollLeft) < 0.5
    ) {
      return;
    }

    didScrollSessionMoveRef.current = true;
    scheduleRailScrollSettlement();

    if (touchScrollSessionRef.current) {
      scheduleTouchScrollIdleFallback();
    }

    if (
      didExtendScrollSessionRef.current ||
      queuedTouchEdgeRotationRef.current !== null
    ) {
      return;
    }

    const trackItemWidth = trackItemWidthRef.current;

    if (trackItemWidth === null) return;

    const maxScrollLeft = Math.max(
      container.scrollWidth - container.clientWidth,
      0,
    );
    const edgeThreshold = getEdgeThreshold(maxScrollLeft, trackItemWidth);
    const edgeDirection =
      maxScrollLeft > 0 &&
      scrollLeft < previousScrollLeft &&
      scrollLeft <= edgeThreshold
        ? "previous"
        : maxScrollLeft > 0 &&
            scrollLeft > previousScrollLeft &&
            scrollLeft >= maxScrollLeft - edgeThreshold
          ? "next"
          : null;

    if (!edgeDirection) return;

    if (touchScrollSessionRef.current) {
      queuedTouchEdgeRotationRef.current = {
        direction: edgeDirection,
        trackItemWidth,
        appendStartDate:
          edgeDirection === "next" ? dates[0]?.getTime() ?? null : null,
      };
      didExtendScrollSessionRef.current = true;
      return;
    }

    didExtendScrollSessionRef.current =
      extendAtEdgeThreshold(edgeDirection);
  }, [
    dates,
    extendAtEdgeThreshold,
    scheduleRailScrollSettlement,
    scheduleSmoothCenterFallback,
    scheduleTouchScrollIdleFallback,
    updateTrackItemWidth,
  ]);

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
      const nextDateKey = DateTime.from(nextDate).toDateOnlyString();
      const firstDate = dates[0];
      const lastDate = dates.at(-1);

      if (firstDate && nextDate < firstDate) {
        pendingFocusDateRef.current = nextDateKey;
        setRovingFocusDateKey(nextDateKey);
        onExtendDateBuffer("previous");
      } else if (lastDate && nextDate > lastDate) {
        pendingFocusDateRef.current = nextDateKey;
        setRovingFocusDateKey(nextDateKey);
        onExtendDateBuffer("next");
      } else {
        setRovingFocusDateKey(nextDateKey);
        focusDateButton(nextDateKey);
      }
    },
    [
      cancelSmoothCentering,
      dates,
      discardScrollSession,
      onExtendDateBuffer,
      focusDateButton,
    ],
  );

  const handleRailPointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      cancelSmoothCentering();

      scrollSessionActiveRef.current = true;
      didScrollSessionMoveRef.current = false;
      didExtendScrollSessionRef.current = false;
      lastScrollLeftRef.current = containerRef.current?.scrollLeft ?? null;
      updateTrackItemWidth();

      if (event.pointerType === "touch" && event.isPrimary) {
        discardTouchScrollSession();
        touchScrollSessionRef.current = true;
        touchScrollPointerActiveRef.current = true;
      } else if (event.pointerType === "mouse") {
        lastMousePointerDownAtRef.current = Date.now();
      }
    },
    [
      cancelSmoothCentering,
      discardTouchScrollSession,
      updateTrackItemWidth,
    ],
  );

  const handleRailTouchStart = useCallback(
    (event: ReactTouchEvent<HTMLDivElement>) => {
      if (activeTouchIdentifierRef.current !== null) {
        return;
      }

      const touch = event.changedTouches[0];

      if (!touch) return;

      if (!touchScrollSessionRef.current) {
        scrollSessionActiveRef.current = true;
        didScrollSessionMoveRef.current = false;
        didExtendScrollSessionRef.current = false;
        touchScrollSessionRef.current = true;
        updateTrackItemWidth();
      }

      touchScrollPointerActiveRef.current = true;
      activeTouchIdentifierRef.current = touch.identifier;
      lastScrollLeftRef.current = containerRef.current?.scrollLeft ?? null;
    },
    [updateTrackItemWidth],
  );

  const handleRailWheel = useCallback(() => {
    const previousScrollLeft = lastScrollLeftRef.current;
    const wasSmoothCentering = smoothCenteringRef.current;

    cancelSmoothCentering();

    if (!scrollSessionActiveRef.current) {
      scrollSessionActiveRef.current = true;
      didScrollSessionMoveRef.current = false;
      didExtendScrollSessionRef.current = false;
      updateTrackItemWidth();
    }

    const container = containerRef.current;
    const trackItemWidth = trackItemWidthRef.current;
    const maxScrollLeft = container
      ? Math.max(container.scrollWidth - container.clientWidth, 0)
      : 0;
    const edgeThreshold =
      trackItemWidth === null
        ? 0
        : getEdgeThreshold(maxScrollLeft, trackItemWidth);
    const didScrollIntoEdgeZone =
      !wasSmoothCentering &&
      container !== null &&
      previousScrollLeft !== null &&
      trackItemWidth !== null &&
      Math.abs(container.scrollLeft - previousScrollLeft) >= 0.5 &&
      maxScrollLeft > 0 &&
      (container.scrollLeft <= edgeThreshold ||
        container.scrollLeft >= maxScrollLeft - edgeThreshold);

    if (!didScrollIntoEdgeZone) {
      lastScrollLeftRef.current = container?.scrollLeft ?? null;
    }
  }, [cancelSmoothCentering, updateTrackItemWidth]);

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
        discardTouchScrollSession();
        discardScrollSession();
        gesture.select();
      }
    },
    [
      armTouchClickSuppression,
      discardScrollSession,
      discardTouchScrollSession,
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
      setRovingFocusDateKey(dateKey);
      onDateSelect(date);
    },
    [
      clearTouchClickSuppression,
      discardScrollSession,
      onDateSelect,
      setRovingFocusDateKey,
    ],
  );

  return (
    <div className={cn("min-w-0 max-w-full pb-2 pt-1", className)}>
      <p id={instructionsId} className="sr-only">
        {t("schedules:weekSelector.dateRailInstruction")}
      </p>
      <div
        ref={containerRef}
        role="group"
        aria-label={t("schedules:weekSelector.dateRailLabel")}
        aria-describedby={instructionsId}
        onScroll={handleScroll}
        onWheel={handleRailWheel}
        onPointerDownCapture={handleRailPointerDownCapture}
        onTouchStart={handleRailTouchStart}
        onPointerMove={handleTouchPointerMove}
        onPointerUp={handleTouchPointerUp}
        onPointerCancel={handleTouchPointerCancel}
        className="relative min-w-0 max-w-full snap-x snap-mandatory overflow-x-auto py-1 scroll-px-3 scroll-py-1 overscroll-x-contain touch-pan-x focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:scroll-px-4 lg:scroll-px-6"
      >
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
                  handleTouchPointerDown(event, dateKey, () => {
                    setRovingFocusDateKey(dateKey);
                    onDateSelect(date);
                  })
                }
                onClick={(event) => handleDateClick(event, date, dateKey)}
                onKeyDown={(event) => handleKeyDown(event, date)}
                data-date-key={dateKey}
                data-selected={isSelected ? "true" : undefined}
                className={cn(
                  "relative flex h-14 w-14 shrink-0 snap-center snap-always flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5 text-center transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary-hover"
                    : isDateToday
                      ? "border-primary bg-card text-foreground hover:bg-muted"
                      : "border-border bg-card text-foreground hover:border-primary hover:bg-muted",
                )}
                aria-label={ariaLabel}
                aria-current={isSelected ? "date" : undefined}
                tabIndex={tabbableDateKey === dateKey ? 0 : -1}
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
