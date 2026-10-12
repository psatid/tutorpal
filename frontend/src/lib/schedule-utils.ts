import { AlertCircle, Check, X } from "lucide-react";
import type { TFunction } from "i18next";

export const SCHEDULE_DURATION_OPTIONS: readonly number[] = [
  30, 60, 90, 120, 150, 180,
];

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

type ScheduleStatusPresentation = {
  badgeVariant: "info" | "success" | "warning" | "destructive";
  icon?: React.ComponentType<{ className?: string }>;
};

export const statusColors: Record<
  ScheduleStatus,
  ScheduleStatusPresentation
> = {
  SCHEDULED: {
    badgeVariant: "info",
  },
  COMPLETED: {
    badgeVariant: "success",
    icon: Check,
  },
  NO_SHOW: {
    badgeVariant: "warning",
    icon: AlertCircle,
  },
  CANCELLED: {
    badgeVariant: "destructive",
    icon: X,
  },
};
