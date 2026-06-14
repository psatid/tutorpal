import { Check, X } from "lucide-react";

export function formatTime24Hour(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

type ScheduleStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

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
  CANCELLED: {
    className: "bg-destructive/10 text-destructive",
    icon: X,
  },
};
