import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  formatTime24Hour,
  formatDuration,
  statusColors,
} from "@/lib/schedule-utils";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";

interface ScheduleLogProps {
  schedules: GetV1Schedules200Item[];
  isLoading: boolean;
  onViewSchedule: (schedule: GetV1Schedules200Item) => void;
  onAddSchedule: () => void;
  onCompleteSchedule?: (schedule: GetV1Schedules200Item) => void;
  onNoShowSchedule?: (schedule: GetV1Schedules200Item) => void;
  onRestoreSchedule?: (schedule: GetV1Schedules200Item) => void;
  onDeleteSchedule?: (schedule: GetV1Schedules200Item) => void;
}

function formatDateHeader(dateStr: string, t: (key: string) => string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return t("classDetail.dateHeaders.today");
  if (isYesterday(date)) return t("classDetail.dateHeaders.yesterday");
  return format(date, "EEEE, MMMM d");
}

function ScheduleLogSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, groupIdx) => (
        <div key={groupIdx} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 2 }).map((_, cardIdx) => (
            <div
              key={cardIdx}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-outline-variant"
            >
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function EmptyScheduleLog({ onAddSchedule }: { onAddSchedule: () => void }) {
  const { t } = useTranslation(["classes"]);
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-20 h-20 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
        <CalendarDays className="w-10 h-10 text-on-surface-variant" />
      </div>
      <h3 className="font-headline font-bold text-lg text-on-surface mb-1">
        {t("classDetail.noSchedules")}
      </h3>
      <p className="font-body text-on-surface-variant text-sm max-w-xs mb-4">
        {t("classDetail.noSchedulesDescription")}
      </p>
      <Button size="sm" onClick={onAddSchedule}>
        {t("classDetail.addFirstSchedule")}
      </Button>
    </div>
  );
}

export function ScheduleLog({
  schedules,
  isLoading,
  onViewSchedule,
  onAddSchedule,
  onCompleteSchedule,
  onNoShowSchedule,
  onRestoreSchedule,
  onDeleteSchedule,
}: ScheduleLogProps) {
  const { t } = useTranslation(["classes", "schedules"]);

  const groupedSchedules = useMemo(() => {
    const groups: Record<string, GetV1Schedules200Item[]> = {};
    for (const schedule of schedules) {
      const dateKey = schedule.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(schedule);
    }

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, items]) => ({
        date,
        label: formatDateHeader(date, (key) => t(key, { ns: "classes" })),
        schedules: items.sort((a, b) => b.time - a.time),
      }));
  }, [schedules, t]);

  if (isLoading) {
    return <ScheduleLogSkeleton />;
  }

  if (schedules.length === 0) {
    return <EmptyScheduleLog onAddSchedule={onAddSchedule} />;
  }

  return (
    <div className="space-y-4">
      {groupedSchedules.map((group) => (
        <div key={group.date} className="space-y-2">
          <h3 className="font-label font-semibold text-xs uppercase tracking-wide text-on-surface-variant px-1">
            {group.label}
          </h3>
          <div className="space-y-1">
            {group.schedules.map((schedule, index) => {
              const startTime = formatTime24Hour(schedule.time);
              const endTime = formatTime24Hour(
                schedule.time + schedule.durationMinutes,
              );
              const status = statusColors[schedule.status];
              const StatusIcon = status?.icon;

              return (
                <motion.div
                  key={schedule.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.04,
                    ease: [0.25, 0.1, 0.25, 1],
                  }}
                  className="flex items-center gap-2 p-3 rounded-xl bg-card border border-outline-variant hover:bg-surface-container transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onViewSchedule(schedule)}
                    className="flex-1 min-w-0 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-on-surface tabular-nums">
                        {startTime} – {endTime}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        {formatDuration(schedule.durationMinutes)}
                      </span>
                    </div>
                    {schedule.notes && (
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {schedule.notes}
                      </p>
                    )}
                  </button>

                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 gap-1",
                      status?.className ?? "bg-primary-container text-on-primary-container",
                    )}
                  >
                    {StatusIcon && <StatusIcon className="w-3 h-3" />}
                    {t(`schedules:status.${schedule.status}`, { ns: "schedules" })}
                  </Badge>

                  {(onCompleteSchedule ||
                    onNoShowSchedule ||
                    onRestoreSchedule ||
                    onDeleteSchedule) && (
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
                        {schedule.status === "SCHEDULED" && onCompleteSchedule && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onCompleteSchedule(schedule);
                            }}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            {t("schedules:complete.action", { ns: "schedules" })}
                          </DropdownMenuItem>
                        )}
                        {schedule.status === "SCHEDULED" && onNoShowSchedule && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onNoShowSchedule(schedule);
                            }}
                          >
                            <AlertCircle className="w-4 h-4" />
                            {t("schedules:noShow.action", { ns: "schedules" })}
                          </DropdownMenuItem>
                        )}
                        {(schedule.status === "COMPLETED" ||
                          schedule.status === "NO_SHOW") &&
                          onRestoreSchedule && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onRestoreSchedule(schedule);
                            }}
                          >
                            <RotateCcw className="w-4 h-4" />
                            {t("schedules:restore.action", { ns: "schedules" })}
                          </DropdownMenuItem>
                        )}
                        {schedule.status === "SCHEDULED" &&
                          (onCompleteSchedule || onNoShowSchedule) &&
                          onDeleteSchedule && (
                          <DropdownMenuSeparator />
                        )}
                        {schedule.status !== "SCHEDULED" && onDeleteSchedule && (
                          <DropdownMenuSeparator />
                        )}
                        {onDeleteSchedule && (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              onDeleteSchedule(schedule);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                            {t("schedules:delete.confirmButton", { ns: "schedules" })}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
