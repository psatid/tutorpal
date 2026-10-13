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
  centerRequest,
  isActive = true,
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
  const pendingSelectionEdgeCenterBehaviorRef =
    useRef<ScrollBehavior | null>(null);
  const pendingSelectionBufferStartWeekRef = useRef<number | null>(null);
  const ignoredCompensationScrollLeftRef = useRef<number | null>(null);
  const pendingFocusWeekRef = useRef<string | null>(null);
  const lastCenteredWeekRef = useRef<string | null>(null);
  const lastCenterRequestRef = useRef<number | null>(null);
  const smoothCenteringRef = useRef(false);
  const resizeDuringSmoothCenteringRef = useRef(false);
  const hasObservedInitialLayoutRef = useRef(false);
  const selectionCenterPendingRef = useRef(true);
  const centerSelectedWeekRef = useRef<
    (behavior?: ScrollBehavior) => boolean
  >(() => false);
  const smoothCenterFallbackTimeoutRef = useRef<number | null>(null);
  const smoothCenterScrollEndCleanupRef = useRef<(() => void) | null>(null);
  const touchScrollSessionRef = useRef(false);
  const touchScrollPointerActiveRef = useRef(false);
  const activeTouchIdentifierRef = useRef<number | null>(null);
  const queuedTouchEdgeRotationRef = useRef<TouchEdgeRotation | null>(null);
  const touchScrollFallbackTimeoutRef = useRef<number | null>(null);
  const scrollSettlementTimeoutRef = useRef<number | null>(null);
  const scrollSessionActiveRef = useRef(false);
  const didScrollSessionMoveRef = useRef(false);
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
  const [rovingFocusWeekKey, setRovingFocusWeekKey] = useState<string | null>(
    null,
  );
  const lastSelectedWeekKeyRef = useRef<string | null>(
    selectedWeekKey ?? null,
  );
  const pendingSelectedFocusWeekRef = useRef<string | null>(null);
  const isSelectedWeekInBuffer = selectedWeekStart
    ? weekStarts.some((weekStart) => isSameWeek(weekStart, selectedWeekStart))
    : false;
  const isRovingFocusWeekInBuffer =
    rovingFocusWeekKey !== null &&
    weekStarts.some(
      (weekStart) =>
        DateTime.from(weekStart).toDateOnlyString() === rovingFocusWeekKey,
    );
  const tabbableWeekKey = isRovingFocusWeekInBuffer
    ? rovingFocusWeekKey
    : isSelectedWeekInBuffer
      ? selectedWeekKey
      : weekStarts[0]
        ? DateTime.from(weekStarts[0]).toDateOnlyString()
        : null;
  const selectWeek = useCallback(
    (weekStart: Date) => {
      const weekdayOffset = getWeekdayOffset(selectedDate ?? weekStart);
      onDateSelect(getDateInWeek(weekStart, weekdayOffset));
    },
    [onDateSelect, selectedDate],
  );
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
    didScrollSessionMoveRef.current = false;
    didExtendScrollSessionRef.current = false;

    if (scrollSettlementTimeoutRef.current !== null) {
      window.clearTimeout(scrollSettlementTimeoutRef.current);
      scrollSettlementTimeoutRef.current = null;
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

    const shouldRecenterAfterResize = resizeDuringSmoothCenteringRef.current;

    resizeDuringSmoothCenteringRef.current = false;

    clearSmoothCentering();

    if (shouldRecenterAfterResize) {
      centerSelectedWeekRef.current();
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
          : maxScrollLeft > 0 &&
              centeredScrollLeft > maxScrollLeft
            ? "next"
            : null;

      if (edgeDirection) {
        if (pendingExtensionRef.current !== null) {
          return false;
        }

        updateTrackItemWidth();

        const trackItemWidth = trackItemWidthRef.current;
        const distanceToCenter =
          edgeDirection === "previous"
            ? -centeredScrollLeft
            : centeredScrollLeft - maxScrollLeft;
        const maxWeeksToExtend = weekStarts.length - 1;

        if (trackItemWidth && maxWeeksToExtend > 0) {
          clearSmoothCentering();
          resizeDuringSmoothCenteringRef.current = false;
          pendingExtensionRef.current = edgeDirection;
          pendingSelectionEdgeCenterBehaviorRef.current = behavior;
          pendingSelectionBufferStartWeekRef.current =
            weekStarts[0]?.getTime() ?? null;
          onExtendWeekBuffer(
            edgeDirection,
            Math.min(
              Math.max(Math.ceil(distanceToCenter / trackItemWidth), 1),
              maxWeeksToExtend,
            ),
          );
          return false;
        }
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
      isActive,
      onExtendWeekBuffer,
      prefersReducedMotion,
      scheduleSmoothCenterFallback,
      settleSmoothCentering,
      updateTrackItemWidth,
      weekStarts.length,
    ],
  );

  useLayoutEffect(() => {
    centerSelectedWeekRef.current = centerSelectedWeek;
  }, [centerSelectedWeek]);

  const focusWeekButton = useCallback((weekKey: string): boolean => {
    const container = containerRef.current;
    const button = container?.querySelector<HTMLButtonElement>(
      `[data-week-key="${weekKey}"]`,
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

    container.scrollTo({ left: targetLeft, behavior: "auto" });
    button.focus({ preventScroll: true });
    return true;
  }, []);

  useLayoutEffect(() => {
    const nextSelectedWeekKey = selectedWeekKey ?? null;

    if (lastSelectedWeekKeyRef.current !== nextSelectedWeekKey) {
      lastSelectedWeekKeyRef.current = nextSelectedWeekKey;
      pendingSelectedFocusWeekRef.current = nextSelectedWeekKey;
    }

    const pendingSelectedFocusWeek = pendingSelectedFocusWeekRef.current;

    if (
      pendingSelectedFocusWeek &&
      weekStarts.some(
        (weekStart) =>
          DateTime.from(weekStart).toDateOnlyString() ===
          pendingSelectedFocusWeek,
      )
    ) {
      setRovingFocusWeekKey(pendingSelectedFocusWeek);
      pendingSelectedFocusWeekRef.current = null;
    }
  }, [selectedWeekKey, weekStarts]);

  useLayoutEffect(() => {
    if (!selectedWeekKey) {
      selectionCenterPendingRef.current = false;
      pendingSelectionEdgeCenterBehaviorRef.current = null;
      pendingSelectionBufferStartWeekRef.current = null;
      return;
    }

    const selectedWeekChanged =
      lastCenteredWeekRef.current !== selectedWeekKey;
    const centerRequestChanged =
      lastCenterRequestRef.current !== centerRequest.id;

    if (selectedWeekChanged || centerRequestChanged) {
      discardPendingBrowseSession();
    }

    const pendingSelectionEdgeCenterBehavior =
      pendingSelectionEdgeCenterBehaviorRef.current;

    if (
      pendingExtensionRef.current !== null &&
      pendingSelectionEdgeCenterBehavior === null
    ) {
      lastCenteredWeekRef.current = selectedWeekKey;
      lastCenterRequestRef.current = centerRequest.id;
      selectionCenterPendingRef.current = false;
      return;
    }

    const shouldCenter =
      lastCenteredWeekRef.current !== selectedWeekKey ||
      lastCenterRequestRef.current !== centerRequest.id;

    selectionCenterPendingRef.current = shouldCenter;

    if (!shouldCenter) return;

    const selectedButton = containerRef.current?.querySelector(
      'button[data-selected="true"]',
    );

    if (!selectedButton) return;

    const isInitialCenter = lastCenteredWeekRef.current === null;
    const didCenterRequestChange =
      lastCenterRequestRef.current !== null && centerRequestChanged;
    const behavior =
      pendingSelectionEdgeCenterBehavior ??
      (isInitialCenter
        ? "auto"
        : didCenterRequestChange
          ? centerRequest.behavior
          : selectedWeekChanged
            ? "smooth"
            : "auto");

    if (!centerSelectedWeek(behavior)) return;

    lastCenteredWeekRef.current = selectedWeekKey;
    lastCenterRequestRef.current = centerRequest.id;
    selectionCenterPendingRef.current = false;
    pendingSelectionEdgeCenterBehaviorRef.current = null;
    pendingSelectionBufferStartWeekRef.current = null;
    hasObservedInitialLayoutRef.current = true;
  }, [
    centerRequest,
    centerSelectedWeek,
    discardPendingBrowseSession,
    isActive,
    selectedWeekKey,
    weekStarts,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    if (
      pendingExtensionRef.current !== null &&
      pendingSelectionEdgeCenterBehaviorRef.current !== null &&
      pendingSelectionBufferStartWeekRef.current === weekStarts[0]?.getTime()
    ) {
      return;
    }

    updateTrackItemWidth();

    let adjustedForBufferExtension = false;

    if (pendingPrependTrackWidthRef.current !== null) {
      container.scrollLeft += pendingPrependTrackWidthRef.current;
      pendingPrependTrackWidthRef.current = null;
      adjustedForBufferExtension = true;
    }

    if (
      pendingAppendStartWeekRef.current !== null &&
      pendingAppendTrackWidthRef.current !== null &&
      weekStarts[0]?.getTime() !== pendingAppendStartWeekRef.current
    ) {
      container.scrollLeft -= pendingAppendTrackWidthRef.current;
      adjustedForBufferExtension = true;
    }

    pendingAppendStartWeekRef.current = null;
    pendingAppendTrackWidthRef.current = null;
    pendingExtensionRef.current = null;
    pendingSelectionBufferStartWeekRef.current = null;
    lastScrollLeftRef.current = container.scrollLeft;

    if (adjustedForBufferExtension) {
      ignoredCompensationScrollLeftRef.current = container.scrollLeft;
    }

    const pendingFocusWeek = pendingFocusWeekRef.current;

    if (!pendingFocusWeek) return;

    if (focusWeekButton(pendingFocusWeek)) {
      pendingFocusWeekRef.current = null;
    }
  }, [focusWeekButton, selectedWeekKey, updateTrackItemWidth, weekStarts]);

  useLayoutEffect(() => {
    if (pendingFocusWeekRef.current !== null || isRovingFocusWeekInBuffer) {
      return;
    }

    if (isSelectedWeekInBuffer && selectedWeekKey) {
      setRovingFocusWeekKey(selectedWeekKey);
      return;
    }

    const container = containerRef.current;
    const buttons = container
      ? Array.from(
          container.querySelectorAll<HTMLButtonElement>("button[data-week-key]"),
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

    setRovingFocusWeekKey(
      browseTarget?.dataset.weekKey ??
        (weekStarts[0]
          ? DateTime.from(weekStarts[0]).toDateOnlyString()
          : null),
    );
  }, [
    isRovingFocusWeekInBuffer,
    isSelectedWeekInBuffer,
    selectedWeekKey,
    weekStarts,
  ]);

  useLayoutEffect(() => {
    const container = containerRef.current;

    if (!isActive || !container) return;

    updateTrackItemWidth();

    if (typeof ResizeObserver === "undefined") return;

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

      updateTrackItemWidth();

      const shouldCenterInitialLayout = !hasObservedInitialLayoutRef.current;

      hasObservedInitialLayoutRef.current = true;

      if (smoothCenteringRef.current) {
        resizeDuringSmoothCenteringRef.current = true;
        return;
      }

      if (shouldCenterInitialLayout || selectionCenterPendingRef.current) {
        if (!centerSelectedWeekRef.current() || !selectedWeekKey) return;

        lastCenteredWeekRef.current = selectedWeekKey;
        lastCenterRequestRef.current = centerRequest.id;
        selectionCenterPendingRef.current = false;
        pendingSelectionEdgeCenterBehaviorRef.current = null;
        pendingSelectionBufferStartWeekRef.current = null;
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [centerRequest.id, isActive, selectedWeekKey, updateTrackItemWidth]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    const ignoredCompensationScrollLeft =
      ignoredCompensationScrollLeftRef.current;

    if (ignoredCompensationScrollLeft !== null) {
      ignoredCompensationScrollLeftRef.current = null;

      if (
        Math.abs(container.scrollLeft - ignoredCompensationScrollLeft) < 0.5
      ) {
        lastScrollLeftRef.current = container.scrollLeft;
        return;
      }
    }

    if (smoothCenteringRef.current) {
      lastScrollLeftRef.current = container.scrollLeft;
      scheduleSmoothCenterFallback();
      return;
    }

    if (pendingExtensionRef.current !== null) {
      lastScrollLeftRef.current = container.scrollLeft;
      return;
    }

    if (!scrollSessionActiveRef.current && !touchScrollSessionRef.current) {
      return;
    }

    didScrollSessionMoveRef.current = true;

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

    if (queuedTouchEdgeRotationRef.current !== null) {
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
    weekStarts,
  ]);

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

    if (!didScrollSessionMoveRef.current) return;

    const container = containerRef.current;

    if (!container) return;

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
    settleSmoothCentering,
    settleTouchScrollSession,
  ]);

  useLayoutEffect(() => {
    settleRailScrollRef.current = settleRailScroll;
  }, [settleRailScroll]);

  const handleRailPointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      cancelSmoothCentering();

      scrollSessionActiveRef.current = true;
      didScrollSessionMoveRef.current = false;
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
      scrollSessionActiveRef.current = true;
      didScrollSessionMoveRef.current = false;
      didExtendScrollSessionRef.current = false;
    }
  }, [cancelSmoothCentering]);

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
      setRovingFocusWeekKey(weekKey);
      selectWeek(weekStart);
    },
    [
      clearTouchClickSuppression,
      discardScrollSession,
      selectWeek,
      setRovingFocusWeekKey,
    ],
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
      const nextWeekKey = DateTime.from(nextWeekStart).toDateOnlyString();
      const firstWeekStart = weekStarts[0];
      const lastWeekStart = weekStarts.at(-1);

      if (firstWeekStart && nextWeekStart < firstWeekStart) {
        pendingFocusWeekRef.current = nextWeekKey;
        setRovingFocusWeekKey(nextWeekKey);
        onExtendWeekBuffer("previous", Math.abs(weekOffset));
      } else if (lastWeekStart && nextWeekStart > lastWeekStart) {
        pendingFocusWeekRef.current = nextWeekKey;
        setRovingFocusWeekKey(nextWeekKey);
        onExtendWeekBuffer("next", Math.abs(weekOffset));
      } else {
        setRovingFocusWeekKey(nextWeekKey);
        focusWeekButton(nextWeekKey);
      }
    },
    [
      cancelSmoothCentering,
      discardScrollSession,
      discardTouchScrollSession,
      focusWeekButton,
      onExtendWeekBuffer,
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
        role="group"
        aria-label={t("schedules:weekSelector.weekRailLabel")}
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
                  handleTouchPointerDown(event, weekKey, () => {
                    setRovingFocusWeekKey(weekKey);
                    selectWeek(weekStart);
                  })
                }
                onClick={(event) => handleWeekClick(event, weekStart, weekKey)}
                onKeyDown={(event) => handleKeyDown(event, weekStart)}
                data-week-key={weekKey}
                data-selected={isSelected ? "true" : undefined}
                className={cn(
                  "flex h-14 min-w-32 flex-1 snap-center snap-always items-center justify-center rounded-xl border px-3 py-1.5 text-center text-sm font-medium tabular-nums transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : isCurrentWeek
                      ? "border-primary bg-card text-foreground hover:bg-muted"
                      : "border-border bg-card text-foreground hover:border-primary hover:bg-muted",
                )}
                aria-label={ariaLabel}
                aria-current={isSelected ? "true" : undefined}
                tabIndex={tabbableWeekKey === weekKey ? 0 : -1}
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
