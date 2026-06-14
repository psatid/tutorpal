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
import {
  formatTime24Hour,
  statusColors,
} from "@/lib/schedule-utils";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";

interface ScheduleCardProps {
  schedule: GetV1Schedules200Item;
  onView: () => void;
  onDelete: () => void;
  onComplete?: () => void;
  onRestore?: () => void;
}

export function ScheduleCard({
  schedule,
  onView,
  onDelete,
  onComplete,
  onRestore,
}: ScheduleCardProps) {
  const { t } = useTranslation(["schedules"]);
  const startTime = formatTime24Hour(schedule.time);
  const scheduleEndTime = schedule.time + schedule.durationMinutes;
  const endTime = formatTime24Hour(scheduleEndTime);

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
      className="w-full flex items-center gap-3 p-4 rounded-xl bg-card hover:bg-surface-container transition-colors text-left group border border-outline-variant cursor-pointer"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-on-surface truncate">
            {schedule.className}
          </p>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 gap-1",
              statusColors[schedule.status]?.className ?? statusColors.SCHEDULED.className,
            )}
          >
            {(() => {
              const Icon = statusColors[schedule.status]?.icon;
              return Icon ? <Icon className="w-3 h-3" /> : null;
            })()}
            {t(`schedules:status.${schedule.status}`)}
          </Badge>
        </div>
      </div>

      <div className="shrink-0 text-right">
        <span className="text-sm font-semibold text-on-surface tabular-nums">
          {startTime}
        </span>
        <span className="text-xs text-on-surface-variant"> – </span>
        <span className="text-sm font-medium text-on-surface-variant tabular-nums">
          {endTime}
        </span>
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
