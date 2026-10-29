import {
  Alert01Icon as TriangleAlertHugeIcon,
  Loading03Icon as Loader2HugeIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  type UIEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@tutorpal/ui/badge";
import { Button } from "@tutorpal/ui/button";
import { ResponsiveDrawer } from "@tutorpal/ui/responsive-drawer";
import { Skeleton } from "@tutorpal/ui/skeleton";
import { CompleteScheduleDialog } from "@/components/schedules/complete-schedule-dialog";
import { NoShowScheduleDialog } from "@/components/schedules/no-show-schedule-dialog";
import { useInfiniteAwaitingConfirmationSchedules } from "@/hooks/queries/use-infinite-awaiting-confirmation-schedules";
import { DateTime } from "@/lib/date-time";
import { formatDuration } from "@/lib/schedule-utils";
import type { Schedule } from "@/models/schedule";

const LOAD_MORE_THRESHOLD = 160;
const DRAWER_CONTENT_ID = "sessions-to-confirm-drawer";
const BANNER_TITLE_ID = "sessions-to-confirm-banner-title";
const BANNER_DESCRIPTION_ID = "sessions-to-confirm-banner-description";
const BANNER_ACTION_ID = "sessions-to-confirm-banner-action";
const COMPLETE_ACTION_ID_PREFIX = "sessions-to-confirm-complete-";

type ScheduleGroup = {
  date: string;
  schedules: Schedule[];
};

type SessionsToConfirmProps = {
  onCloseAutoFocus: () => void;
};

function groupSchedulesByDate(schedules: Schedule[]): ScheduleGroup[] {
  const groups: ScheduleGroup[] = [];

  for (const schedule of schedules) {
    const currentGroup = groups.at(-1);

    if (currentGroup?.date === schedule.getDate()) {
      currentGroup.schedules.push(schedule);
      continue;
    }

    groups.push({ date: schedule.getDate(), schedules: [schedule] });
  }

  return groups;
}

export function SessionsToConfirm({
  onCloseAutoFocus,
}: SessionsToConfirmProps) {
  const { t } = useTranslation("schedules");
  const awaitingConfirmationQuery = useInfiniteAwaitingConfirmationSchedules();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [completeSchedule, setCompleteSchedule] = useState<Schedule | null>(
    null,
  );
  const [noShowSchedule, setNoShowSchedule] = useState<Schedule | null>(null);
  const [resolvedScheduleIds, setResolvedScheduleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const drawerContentRef = useRef<HTMLDivElement>(null);
  const bannerTriggerRef = useRef<HTMLButtonElement>(null);
  const allCaughtUpHeadingRef = useRef<HTMLParagraphElement>(null);
  const actionTriggerRef = useRef<HTMLButtonElement | null>(null);
  const nextFocusScheduleIdRef = useRef<string | null>(null);
  const loadMoreRequestRef = useRef(false);

  const loadedSchedules = useMemo(
    () =>
      awaitingConfirmationQuery.data?.pages.flatMap((page) => page.schedules) ??
      [],
    [awaitingConfirmationQuery.data],
  );
  const total =
    awaitingConfirmationQuery.data?.pages[0]?.pagination.total ?? 0;
  const schedules = useMemo(
    () =>
      loadedSchedules.filter(
        (schedule) => !resolvedScheduleIds.has(schedule.getId()),
      ),
    [loadedSchedules, resolvedScheduleIds],
  );
  const scheduleGroups = useMemo(
    () => groupSchedulesByDate(schedules),
    [schedules],
  );
  const outstandingTotal = Math.max(total - resolvedScheduleIds.size, 0);
  const oldestPendingDate = schedules[0]
    ? DateTime.formatDate(
        DateTime.fromDateOnlyString(schedules[0].getDate()),
        {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        },
      )
    : null;
  const hasCachedData = awaitingConfirmationQuery.data !== undefined;
  const isInitialLoading = awaitingConfirmationQuery.isLoading && !hasCachedData;
  const isInitialError = awaitingConfirmationQuery.isError && !hasCachedData;
  const shouldShowBanner =
    hasCachedData && !isInitialError && outstandingTotal > 0;
  const isAllCaughtUp =
    isDrawerOpen &&
    hasCachedData &&
    !isInitialLoading &&
    !isInitialError &&
    outstandingTotal === 0;

  useEffect(() => {
    if (
      !awaitingConfirmationQuery.dataUpdatedAt ||
      resolvedScheduleIds.size === 0
    ) {
      return;
    }

    const loadedScheduleIds = new Set(
      awaitingConfirmationQuery.data?.pages.flatMap((page) =>
        page.schedules.map((schedule) => schedule.getId()),
      ),
    );

    setResolvedScheduleIds((current) => {
      let changed = false;
      const next = new Set<string>();

      for (const scheduleId of current) {
        if (loadedScheduleIds.has(scheduleId)) {
          next.add(scheduleId);
        } else {
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [
    awaitingConfirmationQuery.data,
    awaitingConfirmationQuery.dataUpdatedAt,
    resolvedScheduleIds.size,
  ]);

  const requestNextPage = useCallback(() => {
    if (
      !awaitingConfirmationQuery.hasNextPage ||
      awaitingConfirmationQuery.isFetchingNextPage ||
      loadMoreRequestRef.current
    ) {
      return;
    }

    loadMoreRequestRef.current = true;
    void awaitingConfirmationQuery
      .fetchNextPage()
      .catch(() => undefined)
      .finally(() => {
        loadMoreRequestRef.current = false;
      });
  }, [
    awaitingConfirmationQuery.fetchNextPage,
    awaitingConfirmationQuery.hasNextPage,
    awaitingConfirmationQuery.isFetchingNextPage,
  ]);

  useEffect(() => {
    if (
      !isDrawerOpen ||
      schedules.length > 0 ||
      outstandingTotal === 0 ||
      awaitingConfirmationQuery.isFetchNextPageError
    ) {
      return;
    }

    requestNextPage();
  }, [
    awaitingConfirmationQuery.isFetchNextPageError,
    isDrawerOpen,
    outstandingTotal,
    requestNextPage,
    schedules.length,
  ]);

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open);
  };

  const handleDrawerCloseAutoFocus = () => {
    if (bannerTriggerRef.current?.isConnected) {
      bannerTriggerRef.current.focus();
      return;
    }

    onCloseAutoFocus();
  };

  const handleResolvedSchedule = (schedule: Schedule) => {
    const scheduleIndex = schedules.findIndex(
      (candidate) => candidate.getId() === schedule.getId(),
    );
    const nextSchedule =
      scheduleIndex >= 0
        ? (schedules[scheduleIndex + 1] ?? schedules[scheduleIndex - 1])
        : undefined;

    nextFocusScheduleIdRef.current = nextSchedule?.getId() ?? null;
    setResolvedScheduleIds((current) => {
      if (current.has(schedule.getId())) {
        return current;
      }

      const next = new Set(current);
      next.add(schedule.getId());
      return next;
    });
  };

  const getConfirmationFinalFocus = () => {
    const nextScheduleId = nextFocusScheduleIdRef.current;
    const nextAction = nextScheduleId
      ? document.getElementById(
          `${COMPLETE_ACTION_ID_PREFIX}${encodeURIComponent(nextScheduleId)}`,
        )
      : null;

    return (
      nextAction ??
      allCaughtUpHeadingRef.current ??
      (actionTriggerRef.current?.isConnected
        ? actionTriggerRef.current
        : drawerContentRef.current)
    );
  };

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    if (awaitingConfirmationQuery.isFetchNextPageError) {
      return;
    }

    const scrollport = event.currentTarget;
    const remainingScrollDistance =
      scrollport.scrollHeight - scrollport.scrollTop - scrollport.clientHeight;

    if (remainingScrollDistance <= LOAD_MORE_THRESHOLD) {
      requestNextPage();
    }
  };

  return (
    <>
      {shouldShowBanner ? (
        <button
          aria-controls={DRAWER_CONTENT_ID}
          aria-describedby={BANNER_DESCRIPTION_ID}
          aria-expanded={isDrawerOpen}
          aria-labelledby={`${BANNER_TITLE_ID} ${BANNER_ACTION_ID}`}
          className="mx-3 mt-3 flex shrink-0 w-[calc(100%-1.5rem)] cursor-pointer flex-col gap-3 rounded-lg border border-warning/30 bg-warning-container px-3 py-3 text-left transition-colors hover:bg-warning-container/80 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-warning-container-foreground sm:mx-4 sm:w-[calc(100%-2rem)] sm:flex-row sm:items-center sm:justify-between sm:px-4 lg:mx-6 lg:w-[calc(100%-3rem)] motion-reduce:transition-none"
          onClick={() => setIsDrawerOpen(true)}
          ref={bannerTriggerRef}
          type="button"
        >
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning">
              <HugeiconsIcon
                aria-hidden="true"
                className="size-5"
                icon={TriangleAlertHugeIcon}
                strokeWidth={2}
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className="font-semibold text-warning-container-foreground"
                  id={BANNER_TITLE_ID}
                >
                  {t("awaitingConfirmation.banner.title", {
                    count: outstandingTotal,
                  })}
                </p>
                <Badge aria-hidden="true" variant="warning">
                  {outstandingTotal}
                </Badge>
              </div>
              <p
                className="mt-0.5 text-sm leading-6 text-warning-container-foreground"
                id={BANNER_DESCRIPTION_ID}
              >
                {oldestPendingDate
                  ? t("awaitingConfirmation.banner.description", {
                      date: oldestPendingDate,
                    })
                  : t("awaitingConfirmation.banner.descriptionFallback")}
              </p>
            </div>
          </div>
          <span
            className="shrink-0 text-sm font-medium text-warning-container-foreground"
            id={BANNER_ACTION_ID}
          >
            {t("awaitingConfirmation.banner.action")}
          </span>
        </button>
      ) : null}

      <ResponsiveDrawer
        description={t("awaitingConfirmation.drawer.description")}
        onCloseAutoFocus={handleDrawerCloseAutoFocus}
        onOpenChange={handleDrawerOpenChange}
        open={isDrawerOpen}
        title={t("awaitingConfirmation.drawer.title")}
      >
        <div
          className="h-full min-h-0"
          id={DRAWER_CONTENT_ID}
          ref={drawerContentRef}
          tabIndex={-1}
        >
          {isInitialLoading ? (
            <SessionsToConfirmSkeleton
              label={t("awaitingConfirmation.drawer.loading")}
            />
          ) : isInitialError ? (
            <SessionsToConfirmInitialError
              description={t("awaitingConfirmation.drawer.error")}
              onRetry={() => void awaitingConfirmationQuery.refetch()}
              retryLabel={t("awaitingConfirmation.drawer.retry")}
            />
          ) : isAllCaughtUp ? (
            <div
              className="flex min-h-48 flex-col items-center justify-center px-3 py-8 text-center"
              role="status"
            >
              <p
                className="font-semibold text-foreground"
                ref={allCaughtUpHeadingRef}
                tabIndex={-1}
              >
                {t("awaitingConfirmation.drawer.allCaughtUpTitle")}
              </p>
              <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                {t("awaitingConfirmation.drawer.allCaughtUpDescription")}
              </p>
            </div>
          ) : (
            <div
              aria-busy={awaitingConfirmationQuery.isFetchingNextPage}
              aria-label={t("awaitingConfirmation.drawer.listLabel")}
              className="h-full min-h-0 space-y-5 overflow-y-auto overscroll-contain pr-1"
              onScroll={handleScroll}
              role="region"
            >
              {scheduleGroups.map((group) => (
                <section key={group.date}>
                  <h3 className="text-sm font-semibold text-foreground">
                    <time dateTime={group.date}>
                      {DateTime.formatDate(
                        DateTime.fromDateOnlyString(group.date),
                        {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </time>
                  </h3>
                  <ol className="mt-2 space-y-2">
                    {group.schedules.map((schedule) => (
                      <SessionToConfirmRow
                        key={schedule.getId()}
                        onComplete={(trigger) => {
                          actionTriggerRef.current = trigger;
                          nextFocusScheduleIdRef.current = null;
                          setCompleteSchedule(schedule);
                        }}
                        onNoShow={(trigger) => {
                          actionTriggerRef.current = trigger;
                          nextFocusScheduleIdRef.current = null;
                          setNoShowSchedule(schedule);
                        }}
                        schedule={schedule}
                      />
                    ))}
                  </ol>
                </section>
              ))}

              {awaitingConfirmationQuery.isFetchingNextPage ? (
                <SessionsToConfirmLoadingMore
                  label={t("awaitingConfirmation.drawer.loadingMore")}
                />
              ) : null}
              {awaitingConfirmationQuery.isFetchNextPageError ? (
                <SessionsToConfirmLoadMoreError
                  description={t("awaitingConfirmation.drawer.loadMoreError")}
                  onRetry={requestNextPage}
                  retryLabel={t("awaitingConfirmation.drawer.retry")}
                />
              ) : null}
            </div>
          )}
        </div>
      </ResponsiveDrawer>

      <CompleteScheduleDialog
        finalFocus={getConfirmationFinalFocus}
        onOpenChange={(open) => {
          if (!open) {
            setCompleteSchedule(null);
          }
        }}
        onSuccess={handleResolvedSchedule}
        schedule={completeSchedule}
      />
      <NoShowScheduleDialog
        finalFocus={getConfirmationFinalFocus}
        onOpenChange={(open) => {
          if (!open) {
            setNoShowSchedule(null);
          }
        }}
        onSuccess={handleResolvedSchedule}
        open={noShowSchedule !== null}
        schedule={noShowSchedule}
      />
    </>
  );
}

function SessionToConfirmRow({
  onComplete,
  onNoShow,
  schedule,
}: {
  onComplete: (trigger: HTMLButtonElement) => void;
  onNoShow: (trigger: HTMLButtonElement) => void;
  schedule: Schedule;
}) {
  const { t } = useTranslation("schedules");
  const time = schedule.getStartTimeLabel();
  const duration = formatDuration(schedule.getDurationMinutes(), t);

  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p
            className="truncate font-medium text-foreground"
            title={schedule.getClassName()}
          >
            {schedule.getClassName()}
          </p>
          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
            <time dateTime={`${schedule.getDate()}T${time}:00`}>{time}</time>
            <span aria-hidden="true"> · </span>
            <span>{duration}</span>
          </p>
        </div>
        <div className="grid shrink-0 grid-cols-2 gap-2 sm:w-48">
          <Button
            aria-label={t("awaitingConfirmation.drawer.completeAction", {
              className: schedule.getClassName(),
              duration,
              time,
            })}
            id={`${COMPLETE_ACTION_ID_PREFIX}${encodeURIComponent(schedule.getId())}`}
            onClick={(event) => onComplete(event.currentTarget)}
            type="button"
          >
            {t("complete.action")}
          </Button>
          <Button
            aria-label={t("awaitingConfirmation.drawer.noShowAction", {
              className: schedule.getClassName(),
              duration,
              time,
            })}
            onClick={(event) => onNoShow(event.currentTarget)}
            type="button"
            variant="outline"
          >
            {t("noShow.action")}
          </Button>
        </div>
      </div>
    </li>
  );
}

function SessionsToConfirmSkeleton({ label }: { label: string }) {
  return (
    <div aria-label={label} className="space-y-5" role="status">
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((index) => (
        <div key={index}>
          <Skeleton className="h-4 w-36" />
          <div className="mt-2 rounded-lg border border-border bg-card p-3">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-2 h-4 w-28" />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:ml-auto sm:w-48">
              <Skeleton className="h-10 rounded-full" />
              <Skeleton className="h-10 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SessionsToConfirmInitialError({
  description,
  onRetry,
  retryLabel,
}: {
  description: string;
  onRetry: () => void;
  retryLabel: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-3 py-8 text-center">
      <p className="max-w-sm text-sm leading-6 text-muted-foreground" role="alert">
        {description}
      </p>
      <Button
        className="mt-4"
        onClick={onRetry}
        type="button"
        variant="outline"
      >
        {retryLabel}
      </Button>
    </div>
  );
}

function SessionsToConfirmLoadingMore({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3" role="status">
      <HugeiconsIcon
        aria-hidden="true"
        className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none"
        icon={Loader2HugeIcon}
        strokeWidth={2}
      />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function SessionsToConfirmLoadMoreError({
  description,
  onRetry,
  retryLabel,
}: {
  description: string;
  onRetry: () => void;
  retryLabel: string;
}) {
  return (
    <div className="rounded-lg border border-warning/30 bg-warning-container p-3">
      <p className="text-sm text-warning-container-foreground" role="alert">
        {description}
      </p>
      <Button
        className="mt-3"
        onClick={onRetry}
        type="button"
        variant="outline"
      >
        {retryLabel}
      </Button>
    </div>
  );
}
