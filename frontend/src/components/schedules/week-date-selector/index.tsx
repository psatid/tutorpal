import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(["schedules"]);
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
    <div className={cn("bg-surface rounded-2xl mb-4 overflow-hidden border border-outline-variant", className)}>
      <div className="px-3 py-2.5 border-b border-outline-variant">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handlePrevWeek}
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={handleNextWeek}
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <button
              type="button"
              onClick={handleMonthClick}
              aria-label={t("schedules:weekSelector.openCalendar", { month: monthLabel })}
              className="px-2 py-1 rounded-lg hover:bg-surface-variant/50 transition-colors font-headline font-semibold text-base text-on-surface cursor-pointer"
            >
              {monthLabel}
            </button>
          </div>
          <Button
            variant="ghost"
            size="xs"
            onClick={handleToday}
            leftIcon={CalendarDays}
          >
            {t("schedules:weekSelector.today")}
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
