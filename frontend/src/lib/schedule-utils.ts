import { AlertCircle, Check, X } from "lucide-react";
import type { TFunction } from "i18next";

export function formatTime24Hour(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function formatDuration(totalMinutes: number, t: TFunction): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return t("schedules:duration", { minutes: mins });
  if (mins === 0) return t("schedules:durationHours", { hours });
  return t("schedules:durationHoursMinutes", { hours, minutes: mins });
}

type ScheduleStatus = "SCHEDULED" | "COMPLETED" | "NO_SHOW" | "CANCELLED";

export const statusColors: Record<
  ScheduleStatus,
  { className: string; icon?: React.ComponentType<{ className?: string }> }
> = {
  SCHEDULED: {
    className: "bg-primary-container text-on-primary-container",
  },
  COMPLETED: {
    className: "bg-green-100 text-green-800",
    icon: Check,
  },
  NO_SHOW: {
    className: "bg-amber-100 text-amber-800",
    icon: AlertCircle,
  },
  CANCELLED: {
    className: "bg-destructive/10 text-destructive",
    icon: X,
  },
};
