import { Trash2, Clock, Calendar, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";

interface ScheduleCardProps {
  schedule: GetV1Schedules200Item;
  onView: () => void;
  onDelete: () => void;
}

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const statusColors: Record<string, string> = {
  SCHEDULED: "bg-primary-container text-on-primary-container",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-destructive/10 text-destructive",
};

export function ScheduleCard({
  schedule,
  onView,
  onDelete,
}: ScheduleCardProps) {
  const { t } = useTranslation(["schedules"]);

  return (
    <button
      type="button"
      onClick={onView}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-surface-container border border-outline-variant transition-colors text-left group"
    >
      <div className="w-11 h-11 rounded-xl bg-primary-container flex items-center justify-center shrink-0">
        <BookOpen className="w-5 h-5 text-primary" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-on-surface truncate">
            {schedule.className}
          </p>
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium",
              statusColors[schedule.status] ?? statusColors.SCHEDULED
            )}
          >
            {t(`schedules:status.${schedule.status}`)}
          </span>
        </div>
        <div className="mt-0.5 space-y-1">
          <span className="flex items-center gap-1 text-sm text-on-surface-variant">
            <Calendar className="w-3 h-3" />
            {formatDate(schedule.date)}
          </span>
          <span className="flex items-center gap-1 text-sm text-on-surface-variant">
            <Clock className="w-3 h-3" />
            {formatTime(schedule.time)} ·{" "}
            {t("schedules:duration", { minutes: schedule.durationMinutes })}
          </span>
        </div>
      </div>

      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.stopPropagation();
            onDelete();
          }
        }}
        className="p-2 rounded-full text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
        aria-label={t("schedules:delete.confirmButton")}
      >
        <Trash2 className="w-4 h-4" />
      </span>
    </button>
  );
}
