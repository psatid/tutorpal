import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  startOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isBefore,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekdayView } from "./weekday-view";
import { CalendarDrawer } from "./calendar-drawer";

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
  const [isCalendarDrawerOpen, setIsCalendarDrawerOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState(0);

  const weekDates = useMemo(() => {
    if (!selectedDate) return [];
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end: endOfWeek(start, { weekStartsOn: 1 }) });
  }, [selectedDate]);

  const monthLabel = selectedDate
    ? format(selectedDate, "MMMM yyyy")
    : "";

  const handlePrevWeek = () => {
    if (selectedDate) {
      setSlideDirection(-1);
      onDateSelect(subWeeks(selectedDate, 1));
    }
  };

  const handleNextWeek = () => {
    if (selectedDate) {
      setSlideDirection(1);
      onDateSelect(addWeeks(selectedDate, 1));
    }
  };

  const handleToday = () => {
    if (!selectedDate) {
      setSlideDirection(0);
      onDateSelect(new Date());
      return;
    }
    const today = new Date();
    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const todayWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const direction = isBefore(todayWeekStart, currentWeekStart) ? -1 : 1;
    setSlideDirection(direction);
    onDateSelect(today);
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    if (direction === "prev") {
      handlePrevWeek();
    } else {
      handleNextWeek();
    }
  };

  const handleMonthClick = () => {
    setIsCalendarDrawerOpen(true);
  };

  const handleDrawerOpenChange = (open: boolean) => {
    setIsCalendarDrawerOpen(open);
  };

  const handleCalendarDateSelect = (date: Date) => {
    if (!selectedDate) {
      setSlideDirection(0);
      onDateSelect(date);
      setIsCalendarDrawerOpen(false);
      return;
    }
    const currentWeekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const newWeekStart = startOfWeek(date, { weekStartsOn: 1 });
    const direction = isBefore(newWeekStart, currentWeekStart) ? -1 : 1;
    setSlideDirection(direction);
    onDateSelect(date);
    setIsCalendarDrawerOpen(false);
  };

  return (
    <div className={cn("bg-surface rounded-2xl mb-4 overflow-hidden", className)}>
      <div className="px-4 py-3 border-b border-outline-variant">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevWeek}
              aria-label="Previous week"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextWeek}
              aria-label="Next week"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
            <button
              type="button"
              onClick={handleMonthClick}
              className="px-3 py-1.5 rounded-lg hover:bg-surface-variant/50 transition-colors font-headline font-semibold text-lg text-on-surface"
            >
              {monthLabel}
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToday}
            leftIcon={CalendarDays}
          >
            Today
          </Button>
        </div>
      </div>

      <WeekdayView
        dates={weekDates}
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
        onWeekChange={handleWeekChange}
        slideDirection={slideDirection}
      />

      <CalendarDrawer
        isOpen={isCalendarDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
        selectedDate={selectedDate}
        onSelectDate={handleCalendarDateSelect}
      />
    </div>
  );
}