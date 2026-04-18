import React, {
  useState,
  useMemo,
  useRef,
  useEffect,
  useCallback,
} from "react";
import { cn } from "@/lib/utils";
import { addDays, isSameDay } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { WeekdayView } from "./weekday-view";
import { CalendarView } from "./calendar-view";
import { INITIAL_BUFFER_DAYS, LOAD_MORE_DAYS, easeOut } from "./constants";

export interface WeekDateSelectorProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  className?: string;
}

export function WeekDateSelector({
  selectedDate,
  onDateSelect,
  className,
}: WeekDateSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const startSentinelRef = useRef<HTMLDivElement>(null);
  const endSentinelRef = useRef<HTMLDivElement>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const [startDate, setStartDate] = useState(() =>
    addDays(new Date(), -INITIAL_BUFFER_DAYS)
  );
  const [dayCount, setDayCount] = useState(INITIAL_BUFFER_DAYS * 2 + 1);
  const [isLoadingPast, setIsLoadingPast] = useState(false);
  const [isLoadingFuture, setIsLoadingFuture] = useState(false);

  const dates = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < dayCount; i++) {
      days.push(addDays(startDate, i));
    }
    return days;
  }, [startDate, dayCount]);

  const loadMorePast = useCallback(() => {
    if (isLoadingPast) return;
    setIsLoadingPast(true);
    const newStartDate = addDays(startDate, -LOAD_MORE_DAYS);
    const scrollContainer = scrollRef.current;
    const oldScrollWidth = scrollContainer?.scrollWidth ?? 0;

    setStartDate(newStartDate);
    setDayCount((prev) => prev + LOAD_MORE_DAYS);

    requestAnimationFrame(() => {
      if (scrollContainer) {
        const newScrollWidth = scrollContainer.scrollWidth;
        const scrollDelta = newScrollWidth - oldScrollWidth;
        scrollContainer.scrollLeft += scrollDelta;
      }
      setIsLoadingPast(false);
    });
  }, [startDate, isLoadingPast]);

  const loadMoreFuture = useCallback(() => {
    if (isLoadingFuture) return;
    setIsLoadingFuture(true);
    setDayCount((prev) => prev + LOAD_MORE_DAYS);
    setIsLoadingFuture(false);
  }, [isLoadingFuture]);

  useEffect(() => {
    if (isCalendarOpen) return;

    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const options = {
      root: scrollContainer,
      rootMargin: "100px",
      threshold: 0,
    };

    const startObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) loadMorePast();
      });
    }, options);

    const endObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) loadMoreFuture();
      });
    }, options);

    const observerTimeout = setTimeout(() => {
      if (startSentinelRef.current)
        startObserver.observe(startSentinelRef.current);
      if (endSentinelRef.current) endObserver.observe(endSentinelRef.current);
    }, 0);

    return () => {
      clearTimeout(observerTimeout);
      startObserver.disconnect();
      endObserver.disconnect();
    };
  }, [loadMorePast, loadMoreFuture, isCalendarOpen]);

  useEffect(() => {
    if (isCalendarOpen || !selectedDate) return;

    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const targetIndex = dates.findIndex((date) =>
      isSameDay(date, selectedDate)
    );

    if (targetIndex !== -1) {
      const button = scrollContainer.children[targetIndex + 1] as HTMLElement;
      if (button) {
        button.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    } else {
      const newStartDate = addDays(selectedDate, -INITIAL_BUFFER_DAYS);
      setStartDate(newStartDate);
      setDayCount(INITIAL_BUFFER_DAYS * 2 + 1);
    }
  }, [selectedDate, isCalendarOpen, dates]);

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      action();
    }
  };

  const toggleCalendar = () => {
    setIsCalendarOpen(!isCalendarOpen);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
      setIsCalendarOpen(false);
    }
  };

  return (
    <motion.div
      layout
      transition={{ duration: 0.3, ease: easeOut }}
      className={cn("bg-surface rounded-2xl mb-4 overflow-hidden", className)}
    >
      <AnimatePresence mode="wait">
        {!isCalendarOpen ? (
          <WeekdayView
            dates={dates}
            selectedDate={selectedDate}
            onDateSelect={onDateSelect}
            onKeyDown={handleKeyDown}
            scrollRef={scrollRef}
            startSentinelRef={startSentinelRef}
            endSentinelRef={endSentinelRef}
          />
        ) : (
          <CalendarView selected={selectedDate} onSelect={handleDateSelect} />
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={toggleCalendar}
        onKeyDown={(e) => handleKeyDown(e, toggleCalendar)}
        className="w-full flex justify-center items-center hover:bg-surface-variant/30 transition-colors"
        aria-label={isCalendarOpen ? "Hide calendar" : "Show calendar"}
        aria-expanded={isCalendarOpen}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          animate={{ rotate: isCalendarOpen ? 180 : 0 }}
          transition={{ duration: 0.25, ease: easeOut }}
        >
          <HugeiconsIcon
            icon={ChevronDown}
            strokeWidth={2}
            className="w-6 h-6 text-muted-foreground"
          />
        </motion.div>
      </motion.button>
    </motion.div>
  );
}
