import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateTime } from "@/lib/date-time";
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
    return DateTime.getWeekDates(selectedDate).map((date) => date.toDate());
  }, [selectedDate]);

  const monthLabel = selectedDate
    ? DateTime.from(selectedDate).format("MMMM yyyy")
    : "";

  const handlePrevWeek = () => {
    if (selectedDate) {
      setSlideDirection(-1);
      onDateSelect(DateTime.from(selectedDate).subWeeks(1).toDate());
    }
  };

  const handleNextWeek = () => {
    if (selectedDate) {
      setSlideDirection(1);
      onDateSelect(DateTime.from(selectedDate).addWeeks(1).toDate());
    }
  };

  const handleToday = () => {
    if (!selectedDate) {
      setSlideDirection(0);
      onDateSelect(DateTime.today().toDate());
      return;
    }
    const today = DateTime.today();
    const currentWeekStart = DateTime.from(selectedDate).startOfWeek();
    const todayWeekStart = today.startOfWeek();
    setSlideDirection(todayWeekStart.isBefore(currentWeekStart) ? -1 : 1);
    onDateSelect(today.toDate());
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
    const currentWeekStart = DateTime.from(selectedDate).startOfWeek();
    const newWeekStart = DateTime.from(date).startOfWeek();
    setSlideDirection(newWeekStart.isBefore(currentWeekStart) ? -1 : 1);
    onDateSelect(date);
    setIsCalendarDrawerOpen(false);
  };

  return (
    <div className={cn("bg-surface rounded-2xl mb-4 overflow-hidden border border-outline-variant", className)}>
      <div className="border-b border-outline-variant px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex items-center rounded-full border border-outline-variant bg-card p-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handlePrevWeek}
                aria-label={t("schedules:weekSelector.previousWeek")}
                className="rounded-full"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={handleNextWeek}
                aria-label={t("schedules:weekSelector.nextWeek")}
                className="rounded-full"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <button
              type="button"
              onClick={handleMonthClick}
              aria-label={t("schedules:weekSelector.openCalendar", { month: monthLabel })}
              className="min-w-0 rounded-full px-3 py-1.5 font-headline text-base font-semibold text-on-surface transition-colors hover:bg-card"
            >
              {monthLabel}
            </button>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={handleToday}
            leftIcon={CalendarDays}
            className="shrink-0 bg-card"
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
