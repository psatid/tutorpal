import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Monitor,
  MoreVertical,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DateTime } from "@/lib/date-time";
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
  formatDuration,
  formatTime24Hour,
  statusColors,
} from "@/lib/schedule-utils";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";

type ScheduleLogSection = "upcoming" | "recent";

const UPCOMING_PREVIEW_COUNT = 3;

interface ScheduleLogProps {
  section: ScheduleLogSection;
  schedules: GetV1Schedules200Item[];
  hasData: boolean;
  isError: boolean;
  isLoading: boolean;
  errorOwner: boolean;
  onRetry: () => void;
  referenceTime: DateTime;
  onViewSchedule: (schedule: GetV1Schedules200Item) => void;
  onAddSchedule: () => void;
  onCompleteSchedule?: (schedule: GetV1Schedules200Item) => void;
  onNoShowSchedule?: (schedule: GetV1Schedules200Item) => void;
  onRestoreSchedule?: (schedule: GetV1Schedules200Item) => void;
  onDeleteSchedule?: (schedule: GetV1Schedules200Item) => void;
}

function getScheduleStart(schedule: GetV1Schedules200Item): DateTime {
  const hours = Math.floor(schedule.time / 60).toString().padStart(2, "0");
  const minutes = (schedule.time % 60).toString().padStart(2, "0");

  return DateTime.from(`${schedule.date}T${hours}:${minutes}:00`);
}

function compareScheduleStart(
  left: GetV1Schedules200Item,
  right: GetV1Schedules200Item,
): number {
  const dateComparison = left.date.localeCompare(right.date);
  return dateComparison || left.time - right.time;
}

function formatDateHeader(dateStr: string, t: (key: string) => string): string {
  const date = DateTime.fromDateOnlyString(dateStr);
  if (date.isToday()) return t("classDetail.dateHeaders.today");
  if (date.isYesterday()) return t("classDetail.dateHeaders.yesterday");
  return DateTime.formatDate(date, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatScheduleDate(date: string): string {
  return DateTime.formatDate(DateTime.fromDateOnlyString(date), {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function ScheduleLogSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2" role="status">
      <Skeleton className="h-18 w-full rounded-lg" />
      <Skeleton className="h-18 w-full rounded-lg" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

function EmptyScheduleLog({ onAddSchedule }: { onAddSchedule: () => void }) {
  const { t } = useTranslation(["classes"]);

  return (
    <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-container-low">
        <CalendarDays aria-hidden="true" className="size-5 text-on-surface-variant" />
      </div>
      <p className="text-base font-medium text-on-surface">
        {t("classDetail.noSchedules")}
      </p>
      <p className="mt-1 max-w-xs text-sm text-on-surface-variant">
        {t("classDetail.noSchedulesDescription")}
      </p>
      <Button className="mt-4" onClick={onAddSchedule} type="button">
        {t("classDetail.addFirstSchedule")}
      </Button>
    </div>
  );
}

function ScheduleRow({
  schedule,
  showDate,
  onViewSchedule,
  onCompleteSchedule,
  onNoShowSchedule,
  onRestoreSchedule,
  onDeleteSchedule,
}: Omit<
  ScheduleLogProps,
  | "section"
  | "schedules"
  | "hasData"
  | "isError"
  | "isLoading"
  | "errorOwner"
  | "onAddSchedule"
  | "onRetry"
  | "referenceTime"
> & {
  schedule: GetV1Schedules200Item;
  showDate: boolean;
}) {
  const { t } = useTranslation(["schedules"]);
  const startTime = formatTime24Hour(schedule.time);
  const endTime = formatTime24Hour(schedule.time + schedule.durationMinutes);
  const status = statusColors[schedule.status];
  const StatusIcon = status?.icon;
  const ScheduleTypeIcon = schedule.type === "ONLINE" ? Monitor : MapPin;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 py-2 transition-colors hover:bg-surface focus-within:bg-surface sm:flex">
      {showDate ? (
        <p className="col-span-2 mb-1 text-xs leading-5 text-on-surface-variant sm:mb-0 sm:w-28 sm:shrink-0">
          {formatScheduleDate(schedule.date)}
        </p>
      ) : null}
      <button
        className="min-h-11 min-w-0 flex-1 rounded-md px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={() => onViewSchedule(schedule)}
        type="button"
      >
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium tabular-nums text-on-surface">
            {startTime} – {endTime}
          </span>
          <span className="text-xs tabular-nums text-on-surface-variant">
            {formatDuration(schedule.durationMinutes, t)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-on-surface-variant">
          <ScheduleTypeIcon aria-hidden="true" className="size-3.5" />
          <span>{t(`type.${schedule.type}`)}</span>
          {schedule.notes ? (
            <span className="max-w-48 truncate before:mr-1 before:content-['·']">
              {schedule.notes}
            </span>
          ) : null}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <Badge
          variant="outline"
          className={cn(
            "shrink-0 gap-1 whitespace-nowrap",
            status?.className ?? "bg-primary-container text-on-primary-container",
          )}
        >
          {StatusIcon ? <StatusIcon className="size-3" /> : null}
          {t(`status.${schedule.status}`)}
        </Badge>
        {onCompleteSchedule ||
        onNoShowSchedule ||
        onRestoreSchedule ||
        onDeleteSchedule ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={t("actionsFor", { name: `${startTime} – ${endTime}` })}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35"
              onClick={(event) => {
                event.stopPropagation();
                event.preventDefault();
              }}
            >
              <MoreVertical aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {schedule.status === "SCHEDULED" && onCompleteSchedule ? (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onCompleteSchedule(schedule);
                  }}
                >
                  <CheckCircle2 className="size-4" />
                  {t("complete.action")}
                </DropdownMenuItem>
              ) : null}
              {schedule.status === "SCHEDULED" && onNoShowSchedule ? (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onNoShowSchedule(schedule);
                  }}
                >
                  <AlertCircle className="size-4" />
                  {t("noShow.action")}
                </DropdownMenuItem>
              ) : null}
              {(schedule.status === "COMPLETED" || schedule.status === "NO_SHOW") &&
              onRestoreSchedule ? (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onRestoreSchedule(schedule);
                  }}
                >
                  <RotateCcw className="size-4" />
                  {t("restore.action")}
                </DropdownMenuItem>
              ) : null}
              {schedule.status === "SCHEDULED" &&
              (onCompleteSchedule || onNoShowSchedule) &&
              onDeleteSchedule ? (
                <DropdownMenuSeparator />
              ) : null}
              {schedule.status !== "SCHEDULED" && onDeleteSchedule ? (
                <DropdownMenuSeparator />
              ) : null}
              {onDeleteSchedule ? (
                <DropdownMenuItem
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onDeleteSchedule(schedule);
                  }}
                >
                  <Trash2 className="size-4" />
                  {t("delete.confirmButton")}
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </li>
  );
}

export function ScheduleLog({
  section,
  schedules,
  hasData,
  isError,
  isLoading,
  errorOwner,
  onRetry,
  referenceTime,
  onViewSchedule,
  onAddSchedule,
  onCompleteSchedule,
  onNoShowSchedule,
  onRestoreSchedule,
  onDeleteSchedule,
}: ScheduleLogProps) {
  const { t } = useTranslation(["classes", "common"]);
  const isUpcoming = section === "upcoming";
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const titleId = `class-${section}-sessions-title`;
  const displayedSchedules = useMemo(() => {
    const now = referenceTime;
    const matchingSchedules = schedules.filter((schedule) => {
      const isUpcomingSchedule =
        schedule.status === "SCHEDULED" && !getScheduleStart(schedule).isBefore(now);

      return isUpcoming ? isUpcomingSchedule : !isUpcomingSchedule;
    });

    return matchingSchedules.sort((left, right) =>
      isUpcoming
        ? compareScheduleStart(left, right)
        : compareScheduleStart(right, left),
    );
  }, [isUpcoming, referenceTime, schedules]);
  const recentScheduleGroups = useMemo(() => {
    const groups = new Map<string, GetV1Schedules200Item[]>();

    for (const schedule of displayedSchedules) {
      const group = groups.get(schedule.date) ?? [];
      group.push(schedule);
      groups.set(schedule.date, group);
    }

    return [...groups.entries()].map(([date, groupSchedules]) => ({
      date,
      schedules: groupSchedules,
    }));
  }, [displayedSchedules]);
  const visibleUpcomingSchedules =
    isUpcoming && !showAllUpcoming
      ? displayedSchedules.slice(0, UPCOMING_PREVIEW_COUNT)
      : displayedSchedules;
  const hasAdditionalUpcomingSchedules =
    isUpcoming && displayedSchedules.length > UPCOMING_PREVIEW_COUNT;

  return (
    <section aria-labelledby={titleId} className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-medium tracking-[-0.01em] text-on-surface" id={titleId}>
            {t(`classDetail.${isUpcoming ? "upcomingTitle" : "recentTitle"}`)}
          </h2>
          {isUpcoming ? (
            <p className="mt-1 text-sm text-on-surface-variant">
              {t("classDetail.upcomingDescription")}
            </p>
          ) : null}
        </div>
        {isUpcoming ? (
          <Button
            className="w-full sm:w-auto"
            onClick={onAddSchedule}
            size="md"
            type="button"
            variant="outline"
          >
            {t("classDetail.addSchedule")}
          </Button>
        ) : null}
      </div>

      <div className="mt-4">
        {isError && hasData && errorOwner ? (
          <div
            className="mb-4 flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning-container px-3 py-4 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p className="text-sm text-warning-container-foreground">
              {t("classDetail.schedulesRefreshError")}
            </p>
            <Button
              className="w-full sm:w-auto"
              onClick={onRetry}
              type="button"
              variant="outline"
            >
              {t("common:retry")}
            </Button>
          </div>
        ) : null}
        {isError && !hasData && errorOwner ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-4" role="alert">
            <p className="text-sm text-destructive">
              {t("classDetail.schedulesError")}
            </p>
            <Button
              className="mt-3"
              onClick={onRetry}
              size="md"
              type="button"
              variant="outline"
            >
              {t("common:retry")}
            </Button>
          </div>
        ) : isError && !hasData ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-on-surface-variant">
            {t("classDetail.schedulesUnavailable")}
          </p>
        ) : isLoading && !hasData ? (
          <ScheduleLogSkeleton label={t("common:loading")} />
        ) : displayedSchedules.length === 0 && schedules.length === 0 && isUpcoming ? (
          <EmptyScheduleLog onAddSchedule={onAddSchedule} />
        ) : displayedSchedules.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-on-surface-variant">
            {t(`classDetail.${isUpcoming ? "noUpcoming" : "noRecent"}`)}
          </p>
        ) : isUpcoming ? (
          <>
            <ul className="divide-y divide-border border-y border-border" role="list">
              {visibleUpcomingSchedules.map((schedule) => (
                <ScheduleRow
                  key={schedule.id}
                  schedule={schedule}
                  showDate
                  onViewSchedule={onViewSchedule}
                  onCompleteSchedule={onCompleteSchedule}
                  onNoShowSchedule={onNoShowSchedule}
                  onRestoreSchedule={onRestoreSchedule}
                  onDeleteSchedule={onDeleteSchedule}
                />
              ))}
            </ul>
            {hasAdditionalUpcomingSchedules ? (
              <Button
                className="mt-3 w-full"
                onClick={() => setShowAllUpcoming((current) => !current)}
                size="md"
                type="button"
                variant="ghost"
              >
                {t(
                  `classDetail.${
                    showAllUpcoming
                      ? "showFewerUpcoming"
                      : "showAllUpcoming"
                  }`,
                )}
              </Button>
            ) : null}
          </>
        ) : (
          <div className="space-y-5">
            {recentScheduleGroups.map((group) => (
              <section aria-label={formatDateHeader(group.date, t)} key={group.date}>
                <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {formatDateHeader(group.date, t)}
                </h3>
                <ul className="divide-y divide-border border-y border-border" role="list">
                  {group.schedules.map((schedule) => (
                    <ScheduleRow
                      key={schedule.id}
                      schedule={schedule}
                      showDate={false}
                      onViewSchedule={onViewSchedule}
                      onCompleteSchedule={onCompleteSchedule}
                      onNoShowSchedule={onNoShowSchedule}
                      onRestoreSchedule={onRestoreSchedule}
                      onDeleteSchedule={onDeleteSchedule}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
