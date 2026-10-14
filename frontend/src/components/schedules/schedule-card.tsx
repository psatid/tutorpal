import {
  Trash2,
  Eye,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  MapPin,
  Monitor,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/common/dropdown-menu";
import {
  formatDuration,
  formatTime24Hour,
  statusColors,
} from "@/lib/schedule-utils";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";

interface ScheduleCardProps {
  schedule: GetV1Schedules200Item;
  onView: () => void;
  onDelete: () => void;
  onComplete?: () => void;
  onNoShow?: () => void;
  onRestore?: () => void;
}

export function ScheduleCard({
  schedule,
  onView,
  onDelete,
  onComplete,
  onNoShow,
  onRestore,
}: ScheduleCardProps) {
  const { t } = useTranslation(["schedules"]);
  const startTime = formatTime24Hour(schedule.time);
  const scheduleEndTime = schedule.time + schedule.durationMinutes;
  const endTime = formatTime24Hour(scheduleEndTime);
  const ScheduleTypeIcon = schedule.type === "ONLINE" ? Monitor : MapPin;
  const notes = schedule.notes?.trim();
  const scheduleStatus =
    statusColors[schedule.status] ?? statusColors.SCHEDULED;
  const StatusIcon = scheduleStatus.icon;

  return (
    <article className="flex min-w-0 items-stretch gap-1 rounded-xl border border-border bg-card p-2 transition-colors motion-reduce:transition-none hover:bg-surface focus-within:bg-surface sm:gap-2 sm:p-3">
      <button
        className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary sm:gap-3"
        onClick={onView}
        type="button"
      >
        <span className="flex w-12 shrink-0 flex-col justify-center text-right tabular-nums sm:w-16">
          <span className="text-sm font-semibold leading-5 text-on-surface">
            {startTime}
          </span>
          <span className="text-xs leading-4 text-on-surface-variant">
            {endTime}
          </span>
        </span>

        <span className="min-w-0 flex-1 py-0.5">
          <span className="flex min-w-0 items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-on-surface">
              {schedule.className}
            </span>
            <Badge variant={scheduleStatus.badgeVariant}>
              {StatusIcon ? <StatusIcon aria-hidden="true" /> : null}
              {t(`schedules:status.${schedule.status}`)}
            </Badge>
          </span>

          <span className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-xs leading-4 text-on-surface-variant">
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <ScheduleTypeIcon
                aria-hidden="true"
                className="size-3.5 shrink-0"
              />
              {t(`schedules:type.${schedule.type}`)}
            </span>
            <span className="inline-flex items-center gap-1 whitespace-nowrap">
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {formatDuration(schedule.durationMinutes, t)}
              </span>
            </span>
          </span>

          {notes ? (
            <span className="mt-1 block truncate text-xs leading-4 text-on-surface-variant">
              {notes}
            </span>
          ) : null}
        </span>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={t("schedules:actionsFor", {
                name: schedule.className,
              })}
              className="self-center focus-visible:ring-primary!"
              size="icon"
              type="button"
              variant="ghost"
            />
          }
        >
          <MoreVertical aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onView}>
            <Eye className="w-4 h-4" />
            {t("schedules:view")}
          </DropdownMenuItem>
          {schedule.status === "SCHEDULED" && onComplete && (
            <>
              <DropdownMenuItem onClick={onComplete}>
                <CheckCircle2 className="w-4 h-4" />
                {t("schedules:complete.action")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {schedule.status === "SCHEDULED" && onNoShow && (
            <>
              <DropdownMenuItem onClick={onNoShow}>
                <AlertCircle className="w-4 h-4" />
                {t("schedules:noShow.action")}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {(schedule.status === "COMPLETED" || schedule.status === "NO_SHOW") &&
            onRestore && (
              <>
                <DropdownMenuItem onClick={onRestore}>
                  <RotateCcw className="w-4 h-4" />
                  {t("schedules:restore.action")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2 className="w-4 h-4" />
            {t("schedules:delete.confirmButton")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </article>
  );
}
