import { type RefObject, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon as AlertCircleHugeIcon,
  Calendar03Icon as CalendarDaysHugeIcon,
  CheckmarkCircle02Icon as CheckCircle2HugeIcon,
  MapPinIcon as MapPinHugeIcon,
  ComputerIcon as MonitorHugeIcon,
  MoreVerticalIcon as MoreVerticalHugeIcon,
  RotateLeft01Icon as RotateCcwHugeIcon,
  Delete02Icon as Trash2HugeIcon,
} from "@hugeicons/core-free-icons";
import { DateTime } from "@/lib/date-time";
import { Badge } from "@tutorpal/ui/badge";
import { Button } from "@tutorpal/ui/button";
import { Skeleton } from "@tutorpal/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tutorpal/ui/dropdown-menu";
import {
  statusColors,
} from "@/lib/schedule-utils";
import type { Schedule } from "@/models/schedule";

type ScheduleLogSection = "upcoming" | "recent";

const UPCOMING_PREVIEW_COUNT = 3;

interface ScheduleLogProps {
  headingRef?: RefObject<HTMLHeadingElement | null>;
  section: ScheduleLogSection;
	schedules: Schedule[];
  hasData: boolean;
  isError: boolean;
  isLoading: boolean;
  errorOwner: boolean;
  onRetry: () => void;
  referenceTime: DateTime;
	onViewSchedule: (schedule: Schedule) => void;
  onAddSchedule: () => void;
	onCompleteSchedule?: (schedule: Schedule) => void;
	onNoShowSchedule?: (schedule: Schedule) => void;
	onRestoreSchedule?: (schedule: Schedule) => void;
	onDeleteSchedule?: (schedule: Schedule) => void;
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
        <HugeiconsIcon icon={CalendarDaysHugeIcon} strokeWidth={2} aria-hidden="true" className="size-5 text-on-surface-variant" />
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
	schedule: Schedule;
  showDate: boolean;
}) {
  const { t } = useTranslation(["schedules"]);
	const startTime = schedule.getStartTimeLabel();
	const endTime = schedule.getEndTimeLabel();
	const status = statusColors[schedule.getStatus()];
  const StatusIcon = status?.icon;
	const ScheduleTypeIcon =
		schedule.getType() === "ONLINE" ? MonitorHugeIcon : MapPinHugeIcon;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 py-2 transition-colors hover:bg-surface focus-within:bg-surface sm:flex">
      {showDate ? (
        <p className="col-span-2 mb-1 text-xs leading-5 text-on-surface-variant sm:mb-0 sm:w-28 sm:shrink-0">
			{formatScheduleDate(schedule.getDate())}
        </p>
      ) : null}
      <button
        className="min-h-11 min-w-0 flex-1 rounded-md px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={() => onViewSchedule(schedule)}
        type="button"
      >
        <span className="text-sm font-medium tabular-nums text-on-surface">
          {startTime} – {endTime}
        </span>
        <div className="mt-0.5 flex items-center gap-1 text-xs text-on-surface-variant">
          <HugeiconsIcon
            aria-hidden="true"
            className="size-3.5"
            icon={ScheduleTypeIcon}
            strokeWidth={2}
          />
			<span>{t(`type.${schedule.getType()}`)}</span>
			{schedule.getNotes() ? (
            <span className="max-w-48 truncate before:mr-1 before:content-['·']">
					{schedule.getNotes()}
            </span>
          ) : null}
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-1">
        <Badge
          className="shrink-0 gap-1 whitespace-nowrap"
          variant={status?.badgeVariant ?? "info"}
        >
          {StatusIcon ? (
            <HugeiconsIcon className="size-3" icon={StatusIcon} strokeWidth={2} aria-hidden="true" />
          ) : null}
			{t(`status.${schedule.getStatus()}`)}
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
              <HugeiconsIcon icon={MoreVerticalHugeIcon} strokeWidth={2} aria-hidden="true" className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
			{schedule.canComplete() && onCompleteSchedule ? (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onCompleteSchedule(schedule);
                  }}
                >
                  <HugeiconsIcon icon={CheckCircle2HugeIcon} strokeWidth={2} aria-hidden="true" className="size-4" />
                  {t("complete.action")}
                </DropdownMenuItem>
              ) : null}
			{schedule.canMarkNoShow() && onNoShowSchedule ? (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onNoShowSchedule(schedule);
                  }}
                >
                  <HugeiconsIcon icon={AlertCircleHugeIcon} strokeWidth={2} aria-hidden="true" className="size-4" />
                  {t("noShow.action")}
                </DropdownMenuItem>
              ) : null}
			{schedule.canRestore() && onRestoreSchedule ? (
                <DropdownMenuItem
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onRestoreSchedule(schedule);
                  }}
                >
                  <HugeiconsIcon icon={RotateCcwHugeIcon} strokeWidth={2} aria-hidden="true" className="size-4" />
                  {t("restore.action")}
                </DropdownMenuItem>
              ) : null}
			{schedule.isScheduled() &&
              (onCompleteSchedule || onNoShowSchedule) &&
              onDeleteSchedule ? (
                <DropdownMenuSeparator />
              ) : null}
			{!schedule.isScheduled() && onDeleteSchedule ? (
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
                  <HugeiconsIcon icon={Trash2HugeIcon} strokeWidth={2} aria-hidden="true" className="size-4" />
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
  headingRef,
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
		const isUpcomingSchedule = schedule.isUpcoming(now);

      return isUpcoming ? isUpcomingSchedule : !isUpcomingSchedule;
    });

    return matchingSchedules.sort((left, right) =>
      isUpcoming
		? left.compareStart(right)
		: right.compareStart(left),
    );
  }, [isUpcoming, referenceTime, schedules]);
  const recentScheduleGroups = useMemo(() => {
		const groups = new Map<string, Schedule[]>();

    for (const schedule of displayedSchedules) {
			const date = schedule.getDate();
			const group = groups.get(date) ?? [];
      group.push(schedule);
			groups.set(date, group);
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

  if (
    !isUpcoming &&
    displayedSchedules.length === 0 &&
    (!isLoading || hasData)
  ) {
    return null;
  }

  return (
    <section aria-labelledby={titleId} className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2
            className="rounded-sm text-lg font-medium tracking-[-0.01em] text-on-surface outline-none focus:ring-[3px] focus:ring-primary/35 focus:ring-offset-2"
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
          >
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
					key={schedule.getId()}
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
						key={schedule.getId()}
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
