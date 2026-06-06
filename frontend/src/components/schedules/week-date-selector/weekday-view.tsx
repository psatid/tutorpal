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
    <div className={cn("py-3", className)}>
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence
          mode="popLayout"
          initial={false}
          custom={slideDirection}
        >
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
                    "aspect-3/4 flex flex-col items-center justify-center gap-0.5 rounded-[16px] transition-all relative py-1",
                    isSelected
                      ? "bg-primary/90 text-primary-foreground shadow-md"
                      : "bg-card border border-input text-on-surface hover:bg-surface-variant/50",
                  )}
                  aria-label={`${dayName} ${dayNumber}${
                    isDateToday ? ` (${t("schedules:weekSelector.today")})` : ""
                  }${isSelected ? " (selected)" : ""}`}
                  tabIndex={0}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.1 }}
                >
                  <span className="text-[10px] font-medium leading-tight">
                    {monthName}
                  </span>
                  <span
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold leading-none",
                      isSelected ? "bg-white text-primary" : "text-on-surface",
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

                  {isDateToday && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
