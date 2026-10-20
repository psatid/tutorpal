import {
  AlertCircleIcon as AlertCircleHugeIcon,
  Calendar03Icon as CalendarHugeIcon,
  Tick02Icon as CheckHugeIcon,
  Cancel01Icon as XHugeIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import type { TFunction } from "i18next";

export const SCHEDULE_DURATION_OPTIONS: readonly number[] = [
  30, 60, 90, 120, 150, 180,
];

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
  icon?: IconSvgElement;
};

export const statusColors: Record<ScheduleStatus, ScheduleStatusPresentation> =
  {
    SCHEDULED: {
      badgeVariant: "info",
      icon: CalendarHugeIcon,
    },
    COMPLETED: {
      badgeVariant: "success",
      icon: CheckHugeIcon,
    },
    NO_SHOW: {
      badgeVariant: "warning",
      icon: AlertCircleHugeIcon,
    },
    CANCELLED: {
      badgeVariant: "destructive",
      icon: XHugeIcon,
    },
  };
