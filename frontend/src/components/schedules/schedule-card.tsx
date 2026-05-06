import {
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";

interface ScheduleCardProps {
  schedule: GetV1Schedules200Item;
  onView: () => void;
  onDelete: () => void;
  onComplete?: () => void;
  onRestore?: () => void;
}

function formatTime24Hour(minutes: number): { hours: string; minutes: string } {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return {
    hours: hours.toString().padStart(2, "0"),
    minutes: mins.toString().padStart(2, "0"),
  };
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
  onComplete,
  onRestore,
}: ScheduleCardProps) {
  const { t } = useTranslation(["schedules"]);
  const { hours, minutes } = formatTime24Hour(schedule.time);
  const scheduleEndTime = schedule.time + schedule.durationMinutes;
  const { hours: scheduleEndHours, minutes: scheduleEndMinutes } =
    formatTime24Hour(scheduleEndTime);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onView();
        }
      }}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card hover:bg-surface-container transition-colors text-left group border border-outline-variant cursor-pointer"
    >
      <div className="w-11 h-11 rounded-xl bg-surface-container flex flex-col items-center justify-center shrink-0 text-center">
        <span className="text-md font-semibold text-on-surface leading-none">
          {hours}:{minutes}
        </span>

        <span className="text-xs font-medium text-on-surface-variant leading-none">
          - <br />
          {scheduleEndHours}:{scheduleEndMinutes}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-on-surface truncate">
            {schedule.className}
          </p>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0",
              statusColors[schedule.status] ?? statusColors.SCHEDULED
            )}
          >
            {t(`schedules:status.${schedule.status}`)}
          </Badge>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
        >
          <MoreVertical className="w-4 h-4 text-on-surface-variant" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault();
              onView();
            }}
          >
            <Eye className="w-4 h-4" />
            {t("schedules:view")}
          </DropdownMenuItem>
          {schedule.status === "SCHEDULED" && onComplete && (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onComplete();
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {t("schedules:complete.action")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {schedule.status === "COMPLETED" && onRestore && (
            <>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onRestore();
                }}
              >
                <RotateCcw className="w-4 h-4" />
                {t("schedules:restore.action")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuItem
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onDelete();
            }}
          >
            <Trash2 className="w-4 h-4" />
            {t("schedules:delete.confirmButton")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
