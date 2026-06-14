import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { format, isSameDay, isToday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { weekSlideVariants } from "./constants";

export interface WeekdayViewProps {
  dates: Date[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onWeekChange: (direction: "prev" | "next") => void;
  slideDirection: number;
  className?: string;
}

export function WeekdayView({
  dates,
  selectedDate,
  onDateSelect,
  onWeekChange,
  slideDirection,
  className,
}: WeekdayViewProps) {
  const { t } = useTranslation(["schedules"]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStartX, setTouchStartX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchStartX(e.touches[0]?.clientX || 0);
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touchEndX = e.changedTouches[0]?.clientX || 0;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        onWeekChange("next");
      } else {
        onWeekChange("prev");
      }
    }
  };

  return (
    <div className={cn("py-3 px-1", className)}>
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence mode="sync" initial={false} custom={slideDirection}>
          <motion.div
            key={dates[0]?.getTime()}
            variants={weekSlideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            custom={slideDirection}
            className="grid grid-cols-7 gap-1.5"
          >
            {dates.map((date) => {
              const isSelected = selectedDate
                ? isSameDay(date, selectedDate)
                : false;
              const isDateToday = isToday(date);
              const dayName = format(date, "EEE");
              const dayNumber = format(date, "d");
              const monthName = format(date, "MMM");

              return (
                <motion.button
                  key={date.getTime()}
                  layoutId={isSelected ? "selected-date" : undefined}
                  type="button"
                  onClick={() => onDateSelect(date)}
                  className={cn(
                    "aspect-square flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-150 py-1.5",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-1",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card border border-outline-variant text-on-surface hover:bg-surface-variant/50",
                  )}
                  aria-label={`${dayName} ${dayNumber}${
                    isDateToday ? ` (${t("schedules:weekSelector.today")})` : ""
                  }${isSelected ? " (selected)" : ""}`}
                  tabIndex={0}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.1 }}
                >
                  <span className="text-[10px] font-medium leading-tight opacity-70">
                    {monthName}
                  </span>
                  <span
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold leading-none",
                      isSelected
                        ? "bg-white text-primary"
                        : isDateToday
                          ? "text-on-surface ring-2 ring-primary/40 ring-offset-1"
                          : "text-on-surface",
                    )}
                  >
                    {dayNumber}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-tight",
                      isSelected
                        ? "text-on-primary"
                        : "text-on-surface-variant",
                    )}
                  >
                    {dayName}
                  </span>
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
