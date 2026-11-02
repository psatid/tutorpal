import { type RefObject, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon as AlertCircleHugeIcon,
  Calendar03Icon as CalendarHugeIcon,
  CheckmarkCircle02Icon as CheckCircleHugeIcon,
  ComputerIcon as MonitorHugeIcon,
  Delete02Icon as TrashHugeIcon,
  MapPinIcon as MapPinHugeIcon,
  MoreVerticalIcon as MoreVerticalHugeIcon,
  RotateLeft01Icon as RestoreHugeIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@tutorpal/ui/button";
import { Badge } from "@tutorpal/ui/badge";
import { Skeleton } from "@tutorpal/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@tutorpal/ui/dropdown-menu";
import {
  Tabs,
  TabsList,
  TabsPanel,
  TabsPanels,
  TabsTab,
} from "@tutorpal/ui/animate-ui/components/base/tabs";
import { DateTime } from "@/lib/date-time";
import { formatDuration, statusColors } from "@/lib/schedule-utils";
import type { Schedule } from "@/models/schedule";

interface ClassSessionsProps {
  headingRef?: RefObject<HTMLHeadingElement | null>;
  schedules: Schedule[];
  studentCount: number;
  hasData: boolean;
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
  referenceTime: DateTime;
  onViewSchedule: (schedule: Schedule) => void;
  onAddSchedule: () => void;
  onCompleteSchedule?: (schedule: Schedule) => void;
  onNoShowSchedule?: (schedule: Schedule) => void;
  onRestoreSchedule?: (schedule: Schedule) => void;
  onDeleteSchedule?: (schedule: Schedule) => void;
}

function ScheduleListSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-2" role="status">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Skeleton className="h-20 w-full rounded-lg" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

type ScheduleActionProps = Pick<
  ClassSessionsProps,
  | "onCompleteSchedule"
  | "onNoShowSchedule"
  | "onRestoreSchedule"
  | "onDeleteSchedule"
>;

function ScheduleActions({
  schedule,
  onCompleteSchedule,
  onNoShowSchedule,
  onRestoreSchedule,
  onDeleteSchedule,
}: { schedule: Schedule } & ScheduleActionProps) {
  const { t } = useTranslation(["schedules"]);
  const timeLabel = `${schedule.getStartTimeLabel()} – ${schedule.getEndTimeLabel()}`;
  if (
    !onCompleteSchedule &&
    !onNoShowSchedule &&
    !onRestoreSchedule &&
    !onDeleteSchedule
  )
    return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={t("actionsFor", { name: timeLabel })}
        className="flex size-11 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/35"
      >
        <HugeiconsIcon
          aria-hidden="true"
          icon={MoreVerticalHugeIcon}
          strokeWidth={2}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {schedule.canComplete() && onCompleteSchedule ? (
          <DropdownMenuItem onClick={() => onCompleteSchedule(schedule)}>
            <HugeiconsIcon
              aria-hidden="true"
              icon={CheckCircleHugeIcon}
              strokeWidth={2}
            />
            {t("complete.action")}
          </DropdownMenuItem>
        ) : null}
        {schedule.canMarkNoShow() && onNoShowSchedule ? (
          <DropdownMenuItem onClick={() => onNoShowSchedule(schedule)}>
            <HugeiconsIcon
              aria-hidden="true"
              icon={AlertCircleHugeIcon}
              strokeWidth={2}
            />
            {t("noShow.action")}
          </DropdownMenuItem>
        ) : null}
        {schedule.canRestore() && onRestoreSchedule ? (
          <DropdownMenuItem onClick={() => onRestoreSchedule(schedule)}>
            <HugeiconsIcon
              aria-hidden="true"
              icon={RestoreHugeIcon}
              strokeWidth={2}
            />
            {t("restore.action")}
          </DropdownMenuItem>
        ) : null}
        {onDeleteSchedule ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDeleteSchedule(schedule)}
              variant="destructive"
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={TrashHugeIcon}
                strokeWidth={2}
              />
              {t("delete.confirmButton")}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SessionRow({
  schedule,
  showDate,
  onViewSchedule,
  onCompleteSchedule,
  onNoShowSchedule,
  onRestoreSchedule,
  onDeleteSchedule,
}: Omit<
  ClassSessionsProps,
  | "headingRef"
  | "schedules"
  | "studentCount"
  | "hasData"
  | "isError"
  | "isLoading"
  | "onRetry"
  | "referenceTime"
  | "onAddSchedule"
> & { schedule: Schedule; showDate: boolean }) {
  const { t } = useTranslation(["schedules"]);
  const status = statusColors[schedule.getStatus()];
  const StatusIcon = status?.icon;
  const TypeIcon =
    schedule.getType() === "ONLINE" ? MonitorHugeIcon : MapPinHugeIcon;
  const timeLabel = `${schedule.getStartTimeLabel()} – ${schedule.getEndTimeLabel()}`;
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 py-2 hover:bg-surface focus-within:bg-surface sm:flex">
      {showDate ? (
        <p className="col-span-2 mb-1 text-xs leading-5 text-on-surface-variant sm:mb-0 sm:w-28 sm:shrink-0">
          {DateTime.formatDate(
            DateTime.fromDateOnlyString(schedule.getDate()),
            { weekday: "short", month: "short", day: "numeric" },
          )}
        </p>
      ) : null}
      <button
        className="min-h-11 min-w-0 flex-1 rounded-md px-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        onClick={() => onViewSchedule(schedule)}
        type="button"
      >
        <span className="text-sm font-medium tabular-nums text-on-surface">
          {timeLabel}
        </span>
        <span className="mt-0.5 flex items-center gap-1 text-xs text-on-surface-variant">
          <HugeiconsIcon
            aria-hidden="true"
            className="size-3.5"
            icon={TypeIcon}
            strokeWidth={2}
          />
          {t(`type.${schedule.getType()}`)}
        </span>
      </button>
      <div className="flex shrink-0 items-center gap-1">
        <Badge
          className="shrink-0 gap-1 whitespace-nowrap"
          variant={status?.badgeVariant ?? "info"}
        >
          {StatusIcon ? (
            <HugeiconsIcon
              aria-hidden="true"
              className="size-3"
              icon={StatusIcon}
              strokeWidth={2}
            />
          ) : null}
          {t(`status.${schedule.getStatus()}`)}
        </Badge>
        <ScheduleActions
          schedule={schedule}
          onCompleteSchedule={onCompleteSchedule}
          onDeleteSchedule={onDeleteSchedule}
          onNoShowSchedule={onNoShowSchedule}
          onRestoreSchedule={onRestoreSchedule}
        />
      </div>
    </li>
  );
}

function NextSessionFeature({
  schedule,
  studentCount,
  onViewSchedule,
  onCompleteSchedule,
  onNoShowSchedule,
  onRestoreSchedule,
  onDeleteSchedule,
}: {
  schedule: Schedule;
  studentCount: number;
  onViewSchedule: (schedule: Schedule) => void;
} & ScheduleActionProps) {
  const { t } = useTranslation(["classes", "schedules"]);
  const date = DateTime.fromDateOnlyString(schedule.getDate());
  const TypeIcon =
    schedule.getType() === "ONLINE" ? MonitorHugeIcon : MapPinHugeIcon;
  return (
    <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg bg-primary/10 p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center">
      <div className="flex min-h-16 w-16 flex-col items-center justify-center rounded-md bg-card text-center">
        <span className="text-xs font-medium text-primary">
          {date.format("MMM")}
        </span>
        <span className="text-xl font-semibold tabular-nums text-on-surface">
          {date.format("d")}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-primary">
          {date.isToday()
            ? t("classDetail.today")
            : t("classDetail.upcomingDate")}
        </p>
        <p className="mt-0.5 truncate text-sm font-semibold tabular-nums text-on-surface">
          {schedule.getStartTimeLabel()} – {schedule.getEndTimeLabel()}
        </p>
        <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-on-surface-variant">
          <span>{formatDuration(schedule.getDurationMinutes(), t)}</span>
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon
              aria-hidden="true"
              className="size-3.5"
              icon={TypeIcon}
              strokeWidth={2}
            />
            {t(`schedules:type.${schedule.getType()}`)}
          </span>
          <span>
            {t("classDetail.sessionStudentCount", { count: studentCount })}
          </span>
        </div>
      </div>
      <div className="col-span-2 flex items-center justify-end gap-1 sm:col-span-1">
        <Button
          onClick={() => onViewSchedule(schedule)}
          type="button"
          variant="outline"
        >
          {t("schedules:view")}
        </Button>
        <ScheduleActions
          schedule={schedule}
          onCompleteSchedule={onCompleteSchedule}
          onDeleteSchedule={onDeleteSchedule}
          onNoShowSchedule={onNoShowSchedule}
          onRestoreSchedule={onRestoreSchedule}
        />
      </div>
    </div>
  );
}

export function ClassSessions({
  headingRef,
  schedules,
  studentCount,
  hasData,
  isError,
  isLoading,
  onRetry,
  referenceTime,
  onViewSchedule,
  onAddSchedule,
  onCompleteSchedule,
  onNoShowSchedule,
  onRestoreSchedule,
  onDeleteSchedule,
}: ClassSessionsProps) {
  const { t } = useTranslation(["classes", "common"]);
  const [tab, setTab] = useState("upcoming");
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const { upcoming, recent } = useMemo(() => {
    const sorted = [...schedules].sort((left, right) =>
      left.compareStart(right),
    );
    return {
      upcoming: sorted.filter((schedule) => schedule.isUpcoming(referenceTime)),
      recent: sorted
        .filter((schedule) => !schedule.isUpcoming(referenceTime))
        .reverse(),
    };
  }, [referenceTime, schedules]);
  const renderUpcoming = () => {
    if (isLoading && !hasData)
      return <ScheduleListSkeleton label={t("common:loading")} />;
    if (isError && !hasData)
      return (
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/10 p-3"
          role="alert"
        >
          <p className="text-sm text-destructive">
            {t("classDetail.schedulesError")}
          </p>
          <Button
            className="mt-3"
            onClick={onRetry}
            type="button"
            variant="outline"
          >
            {t("common:retry")}
          </Button>
        </div>
      );
    if (schedules.length === 0)
      return (
        <div className="flex flex-col items-center px-4 py-10 text-center">
          <HugeiconsIcon
            aria-hidden="true"
            className="size-6 text-on-surface-variant"
            icon={CalendarHugeIcon}
            strokeWidth={2}
          />
          <p className="mt-3 text-sm font-medium text-on-surface">
            {t("classDetail.noSchedules")}
          </p>
          <Button className="mt-3" onClick={onAddSchedule} type="button">
            {t("classDetail.addFirstSchedule")}
          </Button>
        </div>
      );
    if (!upcoming.length)
      return (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-on-surface-variant">
          {t("classDetail.noUpcoming")}
        </p>
      );
    const visibleUpcoming = showAllUpcoming ? upcoming : upcoming.slice(0, 3);
    return (
      <>
        <ul
          className="divide-y divide-border border-y border-border"
          role="list"
        >
          {visibleUpcoming.map((schedule, index) =>
            index === 0 ? (
              <li className="hidden py-3 lg:block" key={schedule.getId()}>
                <NextSessionFeature
                  onCompleteSchedule={onCompleteSchedule}
                  onDeleteSchedule={onDeleteSchedule}
                  onNoShowSchedule={onNoShowSchedule}
                  onRestoreSchedule={onRestoreSchedule}
                  onViewSchedule={onViewSchedule}
                  schedule={schedule}
                  studentCount={studentCount}
                />
              </li>
            ) : (
              <SessionRow
                key={schedule.getId()}
                onCompleteSchedule={onCompleteSchedule}
                onDeleteSchedule={onDeleteSchedule}
                onNoShowSchedule={onNoShowSchedule}
                onRestoreSchedule={onRestoreSchedule}
                onViewSchedule={onViewSchedule}
                schedule={schedule}
                showDate
              />
            ),
          )}
        </ul>
        {upcoming.length > 3 ? (
          <Button
            className="mt-3 w-full"
            onClick={() => setShowAllUpcoming((current) => !current)}
            type="button"
            variant="ghost"
          >
            {t(
              `classDetail.${showAllUpcoming ? "showFewerUpcoming" : "showAllUpcoming"}`,
            )}
          </Button>
        ) : null}
      </>
    );
  };
  return (
    <section
      aria-labelledby="class-sessions-title"
      className="rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <Tabs onValueChange={setTab} value={tab}>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
          <h2
            className="min-w-0 text-lg font-semibold text-on-surface"
            id="class-sessions-title"
            ref={headingRef}
            tabIndex={-1}
          >
            {t("classDetail.sessionsTitle")}
          </h2>
          <TabsList
            aria-label={t("classDetail.sessionsTitle")}
            className="max-w-full"
            variant="subtle"
          >
            <TabsTab value="upcoming">
              {t("classDetail.upcomingTab", { count: upcoming.length })}
            </TabsTab>
            <TabsTab value="recent">
              {t("classDetail.recentTab", { count: recent.length })}
            </TabsTab>
          </TabsList>
        </div>
        {isError && hasData ? (
          <div
            className="mt-4 flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning-container p-3 sm:flex-row sm:items-center sm:justify-between"
            role="alert"
          >
            <p className="text-sm text-warning-container-foreground">
              {t("classDetail.schedulesRefreshError")}
            </p>
            <Button onClick={onRetry} type="button" variant="outline">
              {t("common:retry")}
            </Button>
          </div>
        ) : null}
        <TabsPanels className="mt-4">
          <TabsPanel value="upcoming">{renderUpcoming()}</TabsPanel>
          <TabsPanel value="recent">
            {recent.length ? (
              <ul
                className="divide-y divide-border border-y border-border"
                role="list"
              >
                {recent.map((schedule) => (
                  <SessionRow
                    key={schedule.getId()}
                    onCompleteSchedule={onCompleteSchedule}
                    onDeleteSchedule={onDeleteSchedule}
                    onNoShowSchedule={onNoShowSchedule}
                    onRestoreSchedule={onRestoreSchedule}
                    onViewSchedule={onViewSchedule}
                    schedule={schedule}
                    showDate
                  />
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-on-surface-variant">
                {t("classDetail.noRecent")}
              </p>
            )}
          </TabsPanel>
        </TabsPanels>
      </Tabs>
    </section>
  );
}

export function ClassNextSession({
  schedules,
  studentCount,
  hasData,
  isError,
  isLoading,
  onRetry,
  referenceTime,
  onViewSchedule,
  onCompleteSchedule,
  onNoShowSchedule,
  onRestoreSchedule,
  onDeleteSchedule,
}: Pick<
  ClassSessionsProps,
  | "schedules"
  | "studentCount"
  | "hasData"
  | "isError"
  | "isLoading"
  | "onRetry"
  | "referenceTime"
  | "onViewSchedule"
  | "onCompleteSchedule"
  | "onNoShowSchedule"
  | "onRestoreSchedule"
  | "onDeleteSchedule"
>) {
  const { t } = useTranslation(["classes", "common"]);
  const nextSchedule = useMemo(
    () =>
      [...schedules]
        .sort((left, right) => left.compareStart(right))
        .find((schedule) => schedule.isUpcoming(referenceTime)),
    [referenceTime, schedules],
  );
  if (isLoading && !hasData)
    return (
      <section
        aria-labelledby="class-next-session-title"
        className="rounded-xl border border-border bg-card p-4 lg:hidden"
      >
        <h2
          className="mb-3 text-base font-semibold text-on-surface"
          id="class-next-session-title"
        >
          {t("classDetail.nextSession")}
        </h2>
        <ScheduleListSkeleton label={t("common:loading")} />
      </section>
    );
  if (isError && !hasData)
    return (
      <section
        aria-labelledby="class-next-session-title"
        className="rounded-xl border border-border bg-card p-4 lg:hidden"
      >
        <h2
          className="text-base font-semibold text-on-surface"
          id="class-next-session-title"
        >
          {t("classDetail.nextSession")}
        </h2>
        <p className="mt-3 text-sm text-destructive" role="alert">
          {t("classDetail.schedulesError")}
        </p>
        <Button
          className="mt-3"
          onClick={onRetry}
          type="button"
          variant="outline"
        >
          {t("common:retry")}
        </Button>
      </section>
    );
  return nextSchedule ? (
    <section
      aria-labelledby="class-next-session-title"
      className="rounded-xl border border-border bg-card p-4 lg:hidden"
    >
      <h2
        className="mb-3 text-base font-semibold text-on-surface"
        id="class-next-session-title"
      >
        {t("classDetail.nextSession")}
      </h2>
      <NextSessionFeature
        onCompleteSchedule={onCompleteSchedule}
        onDeleteSchedule={onDeleteSchedule}
        onNoShowSchedule={onNoShowSchedule}
        onRestoreSchedule={onRestoreSchedule}
        onViewSchedule={onViewSchedule}
        schedule={nextSchedule}
        studentCount={studentCount}
      />
    </section>
  ) : null;
}
