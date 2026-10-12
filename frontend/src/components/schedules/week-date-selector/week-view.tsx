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

interface TouchEdgeRotation {
  direction: "previous" | "next";
  trackItemWidth: number;
  appendStartWeek: number | null;
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
  const prefersReducedMotion = useReducedMotion() === true;
  const instructionsId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollLeftRef = useRef<number | null>(null);
  const trackItemWidthRef = useRef<number | null>(null);
  const pendingPrependTrackWidthRef = useRef<number | null>(null);
  const pendingAppendStartWeekRef = useRef<number | null>(null);
  const pendingAppendTrackWidthRef = useRef<number | null>(null);
  const pendingExtensionRef = useRef<"previous" | "next" | null>(null);
  const pendingFocusWeekRef = useRef<string | null>(null);
  const forcedCenteredWeekRef = useRef<string | null>(null);
  const lastCenteredWeekRef = useRef<string | null>(null);
  const lastCenterRequestRef = useRef<number | null>(null);
  const smoothCenteringRef = useRef(false);
  const smoothCenterEdgeDirectionRef = useRef<
    "previous" | "next" | null
  >(null);
  const resizeDuringSmoothCenteringRef = useRef(false);
  const centerSelectedWeekRef = useRef<
    (behavior?: ScrollBehavior) => void
  >(() => undefined);
  const smoothCenterFallbackTimeoutRef = useRef<number | null>(null);
  const smoothCenterScrollEndCleanupRef = useRef<(() => void) | null>(null);
  const touchScrollSessionRef = useRef(false);
  const touchScrollPointerActiveRef = useRef(false);
  const activeTouchIdentifierRef = useRef<number | null>(null);
  const queuedTouchEdgeRotationRef = useRef<TouchEdgeRotation | null>(null);
  const touchScrollFallbackTimeoutRef = useRef<number | null>(null);
  const scrollSettlementTimeoutRef = useRef<number | null>(null);
  const scrollSessionActiveRef = useRef(false);
  const scrollSessionStartIndexRef = useRef<number | null>(null);
  const didExtendScrollSessionRef = useRef(false);
  const settleRailScrollRef = useRef<() => void>(() => undefined);
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
  const selectWeek = useCallback(
    (weekStart: Date) => {
      const weekdayOffset = getWeekdayOffset(selectedDate ?? weekStart);
      onDateSelect(getDateInWeek(weekStart, weekdayOffset));
    },
    [onDateSelect, selectedDate],
  );
  const clearSmoothCentering = useCallback(() => {
    smoothCenteringRef.current = false;
    smoothCenterEdgeDirectionRef.current = null;

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
      pendingPrependTrackWidthRef.current = queuedRotation.trackItemWidth;
    } else {
      pendingAppendStartWeekRef.current = queuedRotation.appendStartWeek;
      pendingAppendTrackWidthRef.current = queuedRotation.trackItemWidth;
    }

    onExtendWeekBuffer(queuedRotation.direction);
    settleRailScrollRef.current();
  }, [discardTouchScrollSession, onExtendWeekBuffer]);

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

  const extendClampedWeekBuffer = useCallback(
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
      const edgeThreshold = Math.min(
        EDGE_THRESHOLD,
        Math.max(maxScrollLeft - trackItemWidth, 0),
      );
      const isAtBufferedEdge =
        maxScrollLeft > 0 &&
        (direction === "previous"
          ? container.scrollLeft <= edgeThreshold
          : container.scrollLeft >= maxScrollLeft - edgeThreshold);

      if (!isAtBufferedEdge) return false;

      pendingExtensionRef.current = direction;

      if (direction === "previous") {
        pendingPrependTrackWidthRef.current = trackItemWidth;
      } else {
        pendingAppendStartWeekRef.current = weekStarts[0]?.getTime() ?? null;
        pendingAppendTrackWidthRef.current = trackItemWidth;
      }

      onExtendWeekBuffer(direction);

      return true;
    },
    [onExtendWeekBuffer, updateTrackItemWidth, weekStarts],
  );

  const settleSmoothCentering = useCallback(() => {
    if (!smoothCenteringRef.current) return;

    const requestedEdgeDirection = smoothCenterEdgeDirectionRef.current;
    const shouldRecenterAfterResize = resizeDuringSmoothCenteringRef.current;

    resizeDuringSmoothCenteringRef.current = false;

    clearSmoothCentering();

    const container = containerRef.current;
    const maxScrollLeft = container
      ? Math.max(container.scrollWidth - container.clientWidth, 0)
      : 0;
    const edgeThreshold = Math.min(
      EDGE_THRESHOLD,
      Math.max(maxScrollLeft - (trackItemWidthRef.current ?? 0), 0),
    );
    const edgeDirection =
      requestedEdgeDirection ??
      (maxScrollLeft > 0 && container && container.scrollLeft <= edgeThreshold
        ? "previous"
        : maxScrollLeft > 0 &&
            container &&
            container.scrollLeft >= maxScrollLeft - edgeThreshold
          ? "next"
          : null);
    const didRotateBuffer = edgeDirection
      ? extendClampedWeekBuffer(edgeDirection)
      : false;

    if (!didRotateBuffer && shouldRecenterAfterResize) {
      centerSelectedWeekRef.current();
    }
  }, [clearSmoothCentering, extendClampedWeekBuffer]);

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
      lastScrollLeftRef.current = container.scrollLeft;
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
      const centeredScrollLeft =
        selectedButton.offsetLeft +
        selectedButton.offsetWidth / 2 -
        container.clientWidth / 2;
      const targetLeft = Math.min(
        Math.max(centeredScrollLeft, 0),
        maxScrollLeft,
      );
      const firstWeekButton = container.querySelector<HTMLButtonElement>(
        "button[data-week-key]",
      );
      const weekButtons = container.querySelectorAll<HTMLButtonElement>(
        "button[data-week-key]",
      );
      const lastWeekButton = weekButtons[weekButtons.length - 1];
      const clampedEdgeDirection =
        maxScrollLeft > 0 &&
        selectedButton === firstWeekButton &&
        centeredScrollLeft < 0
          ? "previous"
          : maxScrollLeft > 0 &&
              selectedButton === lastWeekButton &&
              centeredScrollLeft > maxScrollLeft
            ? "next"
            : null;
      const shouldSmoothlyCenter =
        behavior === "smooth" &&
        !prefersReducedMotion &&
        Math.abs(container.scrollLeft - targetLeft) > 0.5;

      if (shouldSmoothlyCenter) {
        clearSmoothCentering();
        resizeDuringSmoothCenteringRef.current = false;
        smoothCenteringRef.current = true;
        smoothCenterEdgeDirectionRef.current = clampedEdgeDirection;

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

      if (!shouldSmoothlyCenter && clampedEdgeDirection) {
        extendClampedWeekBuffer(clampedEdgeDirection);
      }
    },
    [
      clearSmoothCentering,
      extendClampedWeekBuffer,
      prefersReducedMotion,
      scheduleSmoothCenterFallback,
      settleSmoothCentering,
    ],
  );

  useLayoutEffect(() => {
    centerSelectedWeekRef.current = centerSelectedWeek;
  }, [centerSelectedWeek]);

  useLayoutEffect(() => {
    if (!selectedWeekKey) return;

    if (pendingExtensionRef.current !== null) {
      lastCenteredWeekRef.current = selectedWeekKey;
      lastCenterRequestRef.current = centerRequest.id;
      return;
    }

    const shouldForceCenter = forcedCenteredWeekRef.current === selectedWeekKey;
    const shouldCenter =
      shouldForceCenter ||
      lastCenteredWeekRef.current !== selectedWeekKey ||
      lastCenterRequestRef.current !== centerRequest.id;

    if (!shouldCenter) return;

    const selectedButton = containerRef.current?.querySelector(
      'button[aria-checked="true"]',
    );

    if (!selectedButton) return;

    const isInitialCenter = lastCenteredWeekRef.current === null;
    const selectedWeekChanged = lastCenteredWeekRef.current !== selectedWeekKey;
    const centerRequestChanged =
      lastCenterRequestRef.current !== null &&
      lastCenterRequestRef.current !== centerRequest.id;
    const behavior = isInitialCenter
      ? "auto"
      : shouldForceCenter
        ? "smooth"
        : centerRequestChanged
        ? centerRequest.behavior
        : selectedWeekChanged
          ? "smooth"
          : "auto";

    centerSelectedWeek(behavior);
    forcedCenteredWeekRef.current = null;
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

      if (smoothCenteringRef.current) {
        resizeDuringSmoothCenteringRef.current = true;
        return;
      }

      centerSelectedWeekRef.current();
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateTrackItemWidth]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    if (smoothCenteringRef.current) {
      lastScrollLeftRef.current = container.scrollLeft;
      scheduleSmoothCenterFallback();
      return;
    }

    if (!scrollSessionActiveRef.current) {
      const selectedIndex = selectedWeekStart
        ? weekStarts.findIndex((weekStart) =>
            isSameWeek(weekStart, selectedWeekStart),
          )
        : -1;

      scrollSessionActiveRef.current = true;
      scrollSessionStartIndexRef.current = selectedIndex >= 0 ? selectedIndex : null;
      didExtendScrollSessionRef.current = false;
    }

    if (scrollSettlementTimeoutRef.current !== null) {
      window.clearTimeout(scrollSettlementTimeoutRef.current);
    }

    scrollSettlementTimeoutRef.current = window.setTimeout(
      () => settleRailScrollRef.current(),
      SCROLL_SETTLE_DELAY,
    );

    if (touchScrollSessionRef.current) {
      scheduleTouchScrollIdleFallback();
    }

    const scrollLeft = container.scrollLeft;
    const previousScrollLeft = lastScrollLeftRef.current;
    lastScrollLeftRef.current = scrollLeft;

    if (
      queuedTouchEdgeRotationRef.current !== null ||
      pendingExtensionRef.current
    ) {
      return;
    }

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
      if (touchScrollSessionRef.current) {
        queuedTouchEdgeRotationRef.current = {
          direction: "previous",
          trackItemWidth,
          appendStartWeek: null,
        };
        return;
      }
      return;
    } else if (scrollLeft > previousScrollLeft && isNearEnd) {
      if (touchScrollSessionRef.current) {
        queuedTouchEdgeRotationRef.current = {
          direction: "next",
          trackItemWidth,
          appendStartWeek: weekStarts[0]?.getTime() ?? null,
        };
        return;
      }
      return;
    }
  }, [
    scheduleSmoothCenterFallback,
    scheduleTouchScrollIdleFallback,
    selectedWeekStart,
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

    const container = containerRef.current;

    if (!container) return;

    const buttons = Array.from(
      container.querySelectorAll<HTMLButtonElement>("button[data-week-key]"),
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
    const selectedIndex = selectedWeekStart
      ? weekStarts.findIndex((weekStart) =>
          isSameWeek(weekStart, selectedWeekStart),
        )
      : -1;
    const startIndex =
      scrollSessionStartIndexRef.current ??
      (selectedIndex >= 0 ? selectedIndex : centeredIndex);
    const targetIndex = Math.min(
      Math.max(centeredIndex, startIndex - 1),
      startIndex + 1,
    );
    const targetWeekStart = weekStarts[targetIndex];
    const wasLimitedToOneStep = targetIndex !== centeredIndex;

    scrollSessionStartIndexRef.current = null;

    if (!targetWeekStart) return;

    if (!selectedWeekStart || !isSameWeek(targetWeekStart, selectedWeekStart)) {
      if (wasLimitedToOneStep) {
        forcedCenteredWeekRef.current = DateTime.from(
          targetWeekStart,
        ).toDateOnlyString();
      }
      selectWeek(targetWeekStart);
    }

    if (wasLimitedToOneStep) return;

    const maxScrollLeft = Math.max(
      container.scrollWidth - container.clientWidth,
      0,
    );
    const edgeThreshold = Math.min(
      EDGE_THRESHOLD,
      Math.max(maxScrollLeft - (trackItemWidthRef.current ?? 0), 0),
    );
    const edgeDirection =
      maxScrollLeft > 0 && container.scrollLeft <= edgeThreshold
        ? "previous"
        : maxScrollLeft > 0 &&
            container.scrollLeft >= maxScrollLeft - edgeThreshold
          ? "next"
          : null;

    if (
      edgeDirection &&
      !didExtendScrollSessionRef.current &&
      pendingExtensionRef.current === null &&
      queuedTouchEdgeRotationRef.current === null
    ) {
      didExtendScrollSessionRef.current = extendClampedWeekBuffer(edgeDirection);
    }
  }, [
    extendClampedWeekBuffer,
    selectWeek,
    selectedWeekStart,
    settleSmoothCentering,
    settleTouchScrollSession,
    weekStarts,
  ]);

  useLayoutEffect(() => {
    settleRailScrollRef.current = settleRailScroll;
  }, [settleRailScroll]);

  const handleRailPointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      cancelSmoothCentering();

      const selectedIndex = selectedWeekStart
        ? weekStarts.findIndex((weekStart) =>
            isSameWeek(weekStart, selectedWeekStart),
          )
        : -1;

      scrollSessionActiveRef.current = true;
      scrollSessionStartIndexRef.current = selectedIndex >= 0 ? selectedIndex : null;
      didExtendScrollSessionRef.current = false;

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
      selectedWeekStart,
      weekStarts,
    ],
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
      const selectedIndex = selectedWeekStart
        ? weekStarts.findIndex((weekStart) =>
            isSameWeek(weekStart, selectedWeekStart),
          )
        : -1;

      scrollSessionActiveRef.current = true;
      scrollSessionStartIndexRef.current = selectedIndex >= 0 ? selectedIndex : null;
      didExtendScrollSessionRef.current = false;
    }
  }, [cancelSmoothCentering, selectedWeekStart, weekStarts]);

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

      discardScrollSession();
      selectWeek(weekStart);
    },
    [clearTouchClickSuppression, discardScrollSession, selectWeek],
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
      discardScrollSession();
      discardTouchScrollSession();

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
      discardScrollSession,
      discardTouchScrollSession,
      onExtendWeekBuffer,
      selectWeek,
      weekStarts,
    ],
  );

  return (
    <div
      className={cn(
        "min-w-0 max-w-full pb-2 pt-1",
        className,
      )}
    >
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
                  "flex h-14 min-w-32 flex-1 snap-center snap-always items-center justify-center rounded-xl border px-3 py-1.5 text-center text-sm font-medium tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrentWeek
                      ? "border-primary bg-card text-foreground hover:bg-muted"
                      : "border-border bg-card text-foreground hover:border-primary hover:bg-muted",
                )}
                aria-label={ariaLabel}
                role="radio"
                aria-checked={isSelected}
                tabIndex={isSelected ? 0 : -1}
              >
                <span className="truncate">{rangeLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
