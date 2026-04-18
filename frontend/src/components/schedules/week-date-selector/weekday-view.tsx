import React from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { format, isSameDay, isToday } from "date-fns";
import { motion } from "framer-motion";
import { weekdayItemVariants } from "./constants";

export interface WeekdayViewProps {
  dates: Date[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  onKeyDown: (e: React.KeyboardEvent, action: () => void) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  startSentinelRef: React.RefObject<HTMLDivElement | null>;
  endSentinelRef: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

export function WeekdayView({
  dates,
  selectedDate,
  onDateSelect,
  onKeyDown,
  scrollRef,
  startSentinelRef,
  endSentinelRef,
  className,
}: WeekdayViewProps) {
  const { t } = useTranslation(["schedules"]);

  return (
    <motion.div
      key="weekday"
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn("py-3", className)}
    >
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar snap-x pb-1"
        ref={scrollRef}
      >
        <div
          ref={startSentinelRef}
          className="shrink-0 w-2"
          aria-hidden="true"
        />

        {dates.map((date, index) => {
          const isSelected = selectedDate
            ? isSameDay(date, selectedDate)
            : false;
          const isDateToday = isToday(date);
          const dayName = format(date, "EEE");
          const dayNumber = format(date, "d");
          const monthName = format(date, "MMM");

          return (
            <motion.button
              key={index}
              variants={weekdayItemVariants}
              layoutId={isSelected ? "selected-date" : undefined}
              type="button"
              onClick={() => onDateSelect(date)}
              onKeyDown={(e) => onKeyDown(e, () => onDateSelect(date))}
              className={cn(
                "min-w-[56px] py-2 flex flex-col items-center justify-center gap-1 rounded-[20px] transition-all snap-center shrink-0 relative",
                isSelected
                  ? "bg-primary/90 text-primary-foreground shadow-md"
                  : "bg-card border border-input text-on-surface hover:bg-surface-variant/50"
              )}
              aria-label={`${dayName} ${dayNumber}${
                isDateToday ? ` (${t("schedules:weekSelector.today")})` : ""
              }${isSelected ? " (selected)" : ""}`}
              tabIndex={0}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.1 }}
            >
              <span className="text-xs font-medium">{monthName}</span>
              <span
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full text-base font-bold",
                  isSelected ? "bg-white text-primary" : "text-on-surface"
                )}
              >
                {dayNumber}
              </span>
              <span
                className={cn(
                  "text-xs font-medium",
                  isSelected ? "text-on-primary" : "text-on-surface-variant"
                )}
              >
                {dayName}
              </span>

              {isDateToday && !isSelected && (
                <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
              )}
            </motion.button>
          );
        })}

        <div ref={endSentinelRef} className="shrink-0 w-2" aria-hidden="true" />
      </div>
    </motion.div>
  );
}
