import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowRight,
  Calendar03Icon as CalendarDaysHugeIcon,
  Tick02Icon as CheckHugeIcon,
  Clock03Icon as Clock3HugeIcon,
  MapPinIcon as MapPinHugeIcon,
  ComputerIcon as MonitorHugeIcon,
  Cancel01Icon as XHugeIcon,
} from "@hugeicons/core-free-icons";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  type FocusEvent as ReactFocusEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/common/badge";
import { Button, buttonVariants } from "@/components/common/button";
import { Skeleton } from "@/components/common/skeleton";
import { ClassDrawer } from "@/components/classes/class-drawer";
import {
  AwaitingConfirmationCarousel,
  getAwaitingConfirmationCompleteActionId,
} from "@/components/dashboard/awaiting-confirmation-carousel";
import { NoShowScheduleDialog } from "@/components/schedules/no-show-schedule-dialog";
import { ScheduleDrawer } from "@/components/schedules/schedule-drawer";
import { APP_ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/auth-context";
import { useCompleteSchedule } from "@/hooks/mutations/use-schedules";
import { useInfiniteAwaitingConfirmationSchedules } from "@/hooks/queries/use-infinite-awaiting-confirmation-schedules";
import { useSchedules } from "@/hooks/queries/use-schedules";
import { useClasses } from "@/hooks/queries/use-classes";
import { DateTime } from "@/lib/date-time";
import {
  formatDuration,
  formatTime24Hour,
  statusColors,
} from "@/lib/schedule-utils";
import type { AwaitingConfirmationSchedule } from "@/types/awaiting-confirmation-schedule";
import { cn } from "@/lib/utils";

type DashboardSchedule = NonNullable<
  ReturnType<typeof useSchedules>["data"]
>[number];

type ScheduledSummary = {
  count: number;
  plannedMinutes: number;
};

type ConfirmationLock = {
  id: number;
};

type ConfirmationFocusTarget = {
  completeActionScheduleId: string | null;
};

type ChecklistSuccessStep = "class" | "schedule";

const SETUP_DISMISSAL_STORAGE_PREFIX = "tutorpal-getting-started-dismissed";

function getScheduledSummary(
  schedules: DashboardSchedule[] | undefined,
  resolvedScheduleIds: ReadonlySet<string>,
): ScheduledSummary {
  const summary: ScheduledSummary = {
    count: 0,
    plannedMinutes: 0,
  };

  if (!schedules) {
    return summary;
  }

  for (const schedule of schedules) {
    if (
      schedule.status !== "SCHEDULED" ||
      resolvedScheduleIds.has(schedule.id)
    ) {
      continue;
    }

    summary.count += 1;
    summary.plannedMinutes += schedule.durationMinutes;
  }

  return summary;
}

export function DashboardScreen() {
  const { t } = useTranslation(["dashboard", "schedules"]);
  const todayDate = DateTime.today();
  const today = todayDate.toDateOnlyString();
  const {
    data: schedules,
    isError,
    isLoading,
    refetch,
  } = useSchedules({
    date: today,
  });
  const awaitingConfirmationQuery = useInfiniteAwaitingConfirmationSchedules();
  const completeMutation = useCompleteSchedule();
  const confirmationLockIdRef = useRef(0);
  const confirmationLockRef = useRef<ConfirmationLock | null>(null);
  const noShowLockRef = useRef<ConfirmationLock | null>(null);
  const resolvedScheduleIdsRef = useRef(new Set<string>());
  const schedulesLinkRef = useRef<HTMLAnchorElement>(null);
  const noShowTriggerRef = useRef<HTMLButtonElement>(null);
  const confirmationHeadingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusConfirmationHeadingAfterNoShowSuccessRef = useRef(false);
  const [confirmationLock, setConfirmationLock] =
    useState<ConfirmationLock | null>(null);
  const [completingScheduleId, setCompletingScheduleId] = useState<
    string | null
  >(null);
  const [confirmationFocusTarget, setConfirmationFocusTarget] =
    useState<ConfirmationFocusTarget | null>(null);
  const [resolvedScheduleIds, setResolvedScheduleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [noShowSchedule, setNoShowSchedule] =
    useState<AwaitingConfirmationSchedule | null>(null);
  const [homeAnnouncement, setHomeAnnouncement] = useState("");
  const scheduledSummary = getScheduledSummary(schedules, resolvedScheduleIds);
  const awaitingConfirmationSchedules =
    awaitingConfirmationQuery.data?.pages
      .flatMap((page) => page.schedules)
      .filter((schedule) => !resolvedScheduleIds.has(schedule.id)) ?? [];
  const isMutationPending = completeMutation.isPending;
  const isAwaitingConfirmation = confirmationLock !== null;
  const isConfirmationBusy = isMutationPending || isAwaitingConfirmation;

  useEffect(() => {
    if (!confirmationFocusTarget || isConfirmationBusy) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const completeAction = confirmationFocusTarget.completeActionScheduleId
        ? document.getElementById(
            getAwaitingConfirmationCompleteActionId(
              confirmationFocusTarget.completeActionScheduleId,
            ),
          )
        : null;

      (completeAction ?? confirmationHeadingRef.current)?.focus();
      setConfirmationFocusTarget(null);
    });

    return () => cancelAnimationFrame(frame);
  }, [confirmationFocusTarget, isConfirmationBusy]);

  useEffect(() => {
    if (!schedules || resolvedScheduleIdsRef.current.size === 0) {
      return;
    }

    const nextResolvedIds = new Set(resolvedScheduleIdsRef.current);

    for (const schedule of schedules) {
      if (schedule.status !== "SCHEDULED") {
        nextResolvedIds.delete(schedule.id);
      }
    }

    if (nextResolvedIds.size === resolvedScheduleIdsRef.current.size) {
      return;
    }

    resolvedScheduleIdsRef.current = nextResolvedIds;
    setResolvedScheduleIds(nextResolvedIds);
  }, [schedules]);

  const markScheduleResolved = (scheduleId: string) => {
    if (resolvedScheduleIdsRef.current.has(scheduleId)) {
      return;
    }

    const nextResolvedIds = new Set(resolvedScheduleIdsRef.current);
    nextResolvedIds.add(scheduleId);
    resolvedScheduleIdsRef.current = nextResolvedIds;
    setResolvedScheduleIds(nextResolvedIds);
  };

  const acquireConfirmationLock = (scheduleId: string) => {
    if (
      confirmationLockRef.current ||
      isMutationPending ||
      resolvedScheduleIdsRef.current.has(scheduleId)
    ) {
      return null;
    }

    const lock = {
      id: confirmationLockIdRef.current + 1,
    };

    confirmationLockIdRef.current = lock.id;
    confirmationLockRef.current = lock;
    setConfirmationLock(lock);
    return lock;
  };

  const releaseConfirmationLock = (lock: ConfirmationLock) => {
    if (confirmationLockRef.current?.id !== lock.id) {
      return;
    }

    confirmationLockRef.current = null;
    setConfirmationLock((currentLock) =>
      currentLock?.id === lock.id ? null : currentLock,
    );
  };

  const queueConfirmationSuccessFocus = (scheduleId: string) => {
    const scheduleIndex = awaitingConfirmationSchedules.findIndex(
      (schedule) => schedule.id === scheduleId,
    );
    const neighboringSchedule =
      scheduleIndex >= 0
        ? (awaitingConfirmationSchedules[scheduleIndex + 1] ??
          awaitingConfirmationSchedules[scheduleIndex - 1])
        : awaitingConfirmationSchedules.find(
            (schedule) => schedule.id !== scheduleId,
          );

    setConfirmationFocusTarget({
      completeActionScheduleId: neighboringSchedule?.id ?? null,
    });
  };

  const handleCompleteSchedule = (schedule: AwaitingConfirmationSchedule) => {
    const lock = acquireConfirmationLock(schedule.id);
    if (!lock) {
      return;
    }

    const hoursToDeduct = DateTime.formatDurationHours(
      schedule.durationMinutes / 60,
    );
    let wasConfirmed = false;
    let isConfirmationClosed = false;
    const releaseIfUnconfirmed = () => {
      if (!wasConfirmed) {
        isConfirmationClosed = true;
        releaseConfirmationLock(lock);
      }
    };

    toast(t("schedules:complete.confirm", { hours: hoursToDeduct }), {
      action: {
        label: t("schedules:complete.confirmButton"),
        onClick: () => {
          if (wasConfirmed || isConfirmationClosed) {
            return;
          }

          wasConfirmed = true;
          setCompletingScheduleId(schedule.id);
          completeMutation.mutate(schedule.id, {
            onSuccess: () => {
              markScheduleResolved(schedule.id);
              queueConfirmationSuccessFocus(schedule.id);
            },
            onSettled: () => {
              setCompletingScheduleId(null);
              releaseConfirmationLock(lock);
            },
          });
        },
      },
      cancel: {
        label: t("schedules:complete.cancelButton"),
        onClick: releaseIfUnconfirmed,
      },
      onAutoClose: releaseIfUnconfirmed,
      onDismiss: releaseIfUnconfirmed,
    });
  };

  const handleNoShowSchedule = (
    schedule: AwaitingConfirmationSchedule,
    trigger: HTMLButtonElement,
  ) => {
    const lock = acquireConfirmationLock(schedule.id);
    if (!lock) {
      return;
    }

    shouldFocusConfirmationHeadingAfterNoShowSuccessRef.current = false;
    noShowLockRef.current = lock;
    noShowTriggerRef.current = trigger;
    setNoShowSchedule(schedule);
  };

  const closeNoShowDialog = () => {
    const lock = noShowLockRef.current;
    noShowLockRef.current = null;
    setNoShowSchedule(null);

    if (lock) {
      releaseConfirmationLock(lock);
    }
  };

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="border-b border-border pb-6 sm:pb-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {DateTime.formatDate(todayDate, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="mt-1 text-4xl font-normal tracking-[-0.025em] text-foreground sm:text-[2.5rem]">
            {t("dashboard:today.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            {t("dashboard:today.description")}
          </p>
          {isLoading ? (
            <Skeleton className="mt-4 h-5 w-48" />
          ) : !isError ? (
            <p
              aria-live="polite"
              className="mt-4 text-sm font-medium tabular-nums text-muted-foreground"
            >
              {t("dashboard:today.summary", {
                count: scheduledSummary.count,
                duration: formatDuration(scheduledSummary.plannedMinutes, t),
              })}
            </p>
          ) : null}
        </div>
      </header>

      <AwaitingConfirmationCarousel
        completingScheduleId={completingScheduleId}
        headingRef={confirmationHeadingRef}
        hasNextPage={awaitingConfirmationQuery.hasNextPage}
        isBusy={isConfirmationBusy}
        isError={awaitingConfirmationQuery.isError}
        isFetchingNextPage={awaitingConfirmationQuery.isFetchingNextPage}
        isFetchNextPageError={awaitingConfirmationQuery.isFetchNextPageError}
        isLoading={awaitingConfirmationQuery.isLoading}
        onComplete={handleCompleteSchedule}
        onLoadMore={() => awaitingConfirmationQuery.fetchNextPage()}
        onNoShow={handleNoShowSchedule}
        onRetry={() => void awaitingConfirmationQuery.refetch()}
        schedules={awaitingConfirmationSchedules}
      />

      <section
        aria-labelledby="today-agenda-title"
        className="mt-6 rounded-lg border border-border bg-card"
      >
        <header className="flex gap-4 border-b border-border p-4 flex-row justify-between">
          <div>
            <h2
              id="today-agenda-title"
              className="font-semibold text-foreground"
            >
              {t("dashboard:today.agenda")}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("dashboard:today.timezone")}
            </p>
          </div>
          <Link
            ref={schedulesLinkRef}
            to={APP_ROUTES.SCHEDULES}
            className={buttonVariants({
              variant: "link",
              size: "sm",
            })}
          >
            {t("dashboard:today.openSchedule")}
            <HugeiconsIcon
              aria-hidden="true"
              className="size-4"
              icon={ArrowRight}
              strokeWidth={2}
            />
          </Link>
        </header>
        {isLoading ? (
          <TodayHubSkeleton loadingLabel={t("dashboard:today.loading")} />
        ) : isError ? (
          <TodayError
            description={t("dashboard:today.loadError")}
            onRetry={() => void refetch()}
            retryLabel={t("dashboard:today.retry")}
          />
        ) : schedules && schedules.length > 0 ? (
          <TodayAgenda schedules={schedules} />
        ) : (
          <TodayEmpty />
        )}
      </section>

      <GettingStartedChecklist
        onAnnouncement={setHomeAnnouncement}
        openScheduleLinkRef={schedulesLinkRef}
      />
      <p aria-atomic="true" aria-live="polite" className="sr-only">
        {homeAnnouncement}
      </p>
      <NoShowScheduleDialog
        finalFocus={() => {
          if (shouldFocusConfirmationHeadingAfterNoShowSuccessRef.current) {
            shouldFocusConfirmationHeadingAfterNoShowSuccessRef.current = false;
            return confirmationHeadingRef.current ?? schedulesLinkRef.current;
          }

          return (
            noShowTriggerRef.current ??
            confirmationHeadingRef.current ??
            schedulesLinkRef.current
          );
        }}
        onOpenChange={(open) => {
          if (!open) closeNoShowDialog();
        }}
        onSuccess={(schedule) => {
          markScheduleResolved(schedule.id);
          queueConfirmationSuccessFocus(schedule.id);
          shouldFocusConfirmationHeadingAfterNoShowSuccessRef.current = true;
        }}
        open={noShowSchedule !== null}
        schedule={noShowSchedule}
      />
    </section>
  );
}

function GettingStartedChecklist({
  onAnnouncement,
  openScheduleLinkRef,
}: {
  onAnnouncement: (message: string) => void;
  openScheduleLinkRef: RefObject<HTMLAnchorElement | null>;
}) {
  const { t } = useTranslation("dashboard");
  const { user } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { setup?: "hours-added" };
  const classesQuery = useClasses({
    limit: 100,
    sortBy: "totalHours",
    sortOrder: "desc",
  });
  const schedulesQuery = useSchedules();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
  const [isCreateScheduleOpen, setIsCreateScheduleOpen] = useState(false);
  const [pendingSuccess, setPendingSuccess] =
    useState<ChecklistSuccessStep | null>(null);
  const [pendingHoursSuccess, setPendingHoursSuccess] = useState(false);
  const pendingSuccessRef = useRef<ChecklistSuccessStep | null>(null);
  const hoursSuccessHandledRef = useRef(false);
  const completionFocusRequestedRef = useRef(false);
  const checklistHadFocusRef = useRef(false);
  const wasCompleteRef = useRef(false);
  const checklistHeadingRef = useRef<HTMLHeadingElement>(null);
  const reopenButtonRef = useRef<HTMLButtonElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const classesRetryButtonRef = useRef<HTMLButtonElement>(null);
  const schedulesRetryButtonRef = useRef<HTMLButtonElement>(null);

  const dismissalStorageKey = user
    ? `${SETUP_DISMISSAL_STORAGE_PREFIX}:${user.id}`
    : null;
  const classes = classesQuery.data?.classes ?? [];
  const hasClassData = classesQuery.data !== undefined;
  const hasScheduleData = schedulesQuery.data !== undefined;
  const classTotal = classesQuery.data?.pagination.total ?? 0;
  const hasClass = hasClassData && classTotal > 0;
  const hasHours = classes.some(
    (classData) => classData.getHoursData().totalHours > 0,
  );
  const hasSchedule = hasScheduleData && schedulesQuery.data.length > 0;
  const completedSteps =
    Number(hasClass) + Number(hasHours) + Number(hasSchedule);
  const isLoading =
    !hasClassData &&
    !hasScheduleData &&
    !classesQuery.isError &&
    !schedulesQuery.isError &&
    (classesQuery.isLoading || schedulesQuery.isLoading);
  const isComplete = completedSteps === 3;
  const activeStep = !hasClassData
    ? null
    : !hasClass
      ? "class"
      : !hasHours
        ? "hours"
        : !hasScheduleData
          ? null
          : !hasSchedule
            ? "schedule"
            : null;

  const requestOpenScheduleFocus = () => {
    completionFocusRequestedRef.current = true;
  };

  const handleChecklistFocus = () => {
    checklistHadFocusRef.current = true;
  };

  const handleChecklistBlur = (event: ReactFocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      checklistHadFocusRef.current = false;
    }
  };

  useEffect(() => {
    if (!dismissalStorageKey) {
      setIsDismissed(false);
      return;
    }

    setIsDismissed(window.localStorage.getItem(dismissalStorageKey) === "true");
  }, [dismissalStorageKey]);

  const dismiss = () => {
    if (dismissalStorageKey) {
      window.localStorage.setItem(dismissalStorageKey, "true");
    }
    setIsDismissed(true);
    requestAnimationFrame(() => reopenButtonRef.current?.focus());
  };

  const reopen = () => {
    if (dismissalStorageKey) {
      window.localStorage.removeItem(dismissalStorageKey);
    }
    setIsDismissed(false);
    requestAnimationFrame(() => checklistHeadingRef.current?.focus());
  };

  useEffect(() => {
    if (pendingSuccess === "class") {
      if (hasClass) {
        onAnnouncement(t("gettingStarted.classSuccess"));
        pendingSuccessRef.current = null;
        setPendingSuccess(null);
        if (isComplete) {
          requestOpenScheduleFocus();
        } else {
          requestAnimationFrame(() => primaryActionRef.current?.focus());
        }
        return;
      }

      if (classesQuery.isError) {
        onAnnouncement(t("gettingStarted.classRefreshRequired"));
        pendingSuccessRef.current = null;
        setPendingSuccess(null);
        requestAnimationFrame(() => classesRetryButtonRef.current?.focus());
      }
      return;
    }

    if (pendingSuccess === "schedule") {
      if (hasSchedule) {
        onAnnouncement(t("gettingStarted.scheduleSuccess"));
        pendingSuccessRef.current = null;
        setPendingSuccess(null);
        if (isComplete) {
          requestOpenScheduleFocus();
        } else {
          requestAnimationFrame(() => primaryActionRef.current?.focus());
        }
        return;
      }

      if (schedulesQuery.isError) {
        onAnnouncement(t("gettingStarted.scheduleRefreshRequired"));
        pendingSuccessRef.current = null;
        setPendingSuccess(null);
        requestAnimationFrame(() => schedulesRetryButtonRef.current?.focus());
      }
    }
  }, [
    classesQuery.isError,
    hasClass,
    hasSchedule,
    isComplete,
    onAnnouncement,
    pendingSuccess,
    schedulesQuery.isError,
    t,
  ]);

  useEffect(() => {
    if (search.setup !== "hours-added" || hoursSuccessHandledRef.current) {
      return;
    }

    if (!hasHours && !classesQuery.isError) {
      return;
    }

    hoursSuccessHandledRef.current = true;
    void navigate({ to: "/", search: {}, replace: true });

    if (!hasHours) {
      onAnnouncement(t("gettingStarted.hoursClassesRefreshRequired"));
      requestAnimationFrame(() => classesRetryButtonRef.current?.focus());
      return;
    }

    setPendingHoursSuccess(true);
  }, [
    classesQuery.isError,
    hasHours,
    navigate,
    onAnnouncement,
    search.setup,
    t,
  ]);

  useEffect(() => {
    if (!pendingHoursSuccess) {
      return;
    }

    if (schedulesQuery.isError) {
      onAnnouncement(t("gettingStarted.hoursSchedulesRefreshRequired"));
      setPendingHoursSuccess(false);
      requestAnimationFrame(() => schedulesRetryButtonRef.current?.focus());
      return;
    }

    if (!hasScheduleData || (!isComplete && activeStep === null)) return;

    onAnnouncement(t("gettingStarted.hoursSuccess"));
    setPendingHoursSuccess(false);
    if (isComplete) {
      requestOpenScheduleFocus();
      return;
    }
    requestAnimationFrame(() => primaryActionRef.current?.focus());
  }, [
    activeStep,
    hasScheduleData,
    isComplete,
    onAnnouncement,
    pendingHoursSuccess,
    schedulesQuery.isError,
    t,
  ]);

  useEffect(() => {
    if (!isComplete) {
      wasCompleteRef.current = false;
      completionFocusRequestedRef.current = false;
      return;
    }

    if (!wasCompleteRef.current && checklistHadFocusRef.current) {
      requestOpenScheduleFocus();
    }
    wasCompleteRef.current = true;

    if (
      !completionFocusRequestedRef.current ||
      isCreateClassOpen ||
      isCreateScheduleOpen
    ) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      const openScheduleLink = openScheduleLinkRef.current;
      if (!openScheduleLink) {
        return;
      }

      openScheduleLink.focus();
      checklistHadFocusRef.current = false;
      completionFocusRequestedRef.current = false;
    });

    return () => cancelAnimationFrame(frame);
  }, [
    isComplete,
    isCreateClassOpen,
    isCreateScheduleOpen,
    openScheduleLinkRef,
  ]);

  const handleSuccess = (step: ChecklistSuccessStep) => {
    pendingSuccessRef.current = step;
    setPendingSuccess(step);
  };

  const openAddHours = () => {
    void navigate({
      to: "/classes",
      search: { setup: "getting-started" },
    });
  };

  const handleDrawerCloseAutoFocus = () => {
    if (isComplete) {
      requestOpenScheduleFocus();
      requestAnimationFrame(() => {
        if (!completionFocusRequestedRef.current) {
          return;
        }

        openScheduleLinkRef.current?.focus();
        checklistHadFocusRef.current = false;
        completionFocusRequestedRef.current = false;
      });
      return;
    }

    if (!pendingSuccessRef.current) {
      primaryActionRef.current?.focus();
    }
  };

  return (
    <>
      {isComplete ? null : isDismissed ? (
        <div
          className="mt-6"
          onBlurCapture={handleChecklistBlur}
          onFocusCapture={handleChecklistFocus}
        >
          <Button
            onClick={reopen}
            ref={reopenButtonRef}
            type="button"
            variant="link"
          >
            {t("gettingStarted.reopen")}
          </Button>
        </div>
      ) : isLoading ? (
        <div
          onBlurCapture={handleChecklistBlur}
          onFocusCapture={handleChecklistFocus}
        >
          <GettingStartedSkeleton label={t("gettingStarted.loading")} />
        </div>
      ) : (
        <section
          aria-labelledby="getting-started-title"
          className="mt-6 rounded-lg border border-border bg-card"
          onBlurCapture={handleChecklistBlur}
          onFocusCapture={handleChecklistFocus}
        >
          <div className="flex items-start justify-between gap-4 px-4 py-4 sm:px-5">
            <div>
              <h2
                id="getting-started-title"
                ref={checklistHeadingRef}
                tabIndex={-1}
                className="font-semibold text-foreground outline-none"
              >
                {t("gettingStarted.title")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("gettingStarted.description")}
              </p>
              <p className="mt-2 text-sm font-medium tabular-nums text-muted-foreground">
                {t("gettingStarted.progress", {
                  completed: completedSteps,
                  total: 3,
                })}
              </p>
            </div>
            <Button
              aria-label={t("gettingStarted.dismiss")}
              onClick={dismiss}
              size="icon"
              type="button"
              variant="ghost"
            >
              <HugeiconsIcon
                aria-hidden="true"
                icon={XHugeIcon}
                strokeWidth={2}
              />
            </Button>
          </div>

          <ChecklistSourceStatus
            isError={classesQuery.isError}
            isRetrying={classesQuery.isFetching}
            onRetry={() => void classesQuery.refetch()}
            retryButtonRef={classesRetryButtonRef}
            text={t("gettingStarted.classesLoadError")}
          />
          <ChecklistSourceStatus
            isError={schedulesQuery.isError}
            isRetrying={schedulesQuery.isFetching}
            onRetry={() => void schedulesQuery.refetch()}
            retryButtonRef={schedulesRetryButtonRef}
            text={t("gettingStarted.schedulesLoadError")}
          />

          <ol className="border-t border-border">
            <GettingStartedStep
              action={
                activeStep === "class" ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => setIsCreateClassOpen(true)}
                    ref={primaryActionRef}
                    type="button"
                  >
                    {t("gettingStarted.createClass")}
                  </Button>
                ) : undefined
              }
              complete={hasClass}
              description={
                !hasClassData
                  ? t("gettingStarted.classLoading")
                  : hasClass
                    ? t("gettingStarted.classDone")
                    : t("gettingStarted.classDescription")
              }
              disabled={activeStep !== "class"}
              state={
                hasClass
                  ? "complete"
                  : activeStep === "class"
                    ? "current"
                    : "notStarted"
              }
              title={t("gettingStarted.classTitle")}
            />
            <GettingStartedStep
              action={
                activeStep === "hours" ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={openAddHours}
                    ref={primaryActionRef}
                    type="button"
                  >
                    {t("gettingStarted.addHours")}
                  </Button>
                ) : undefined
              }
              complete={hasHours}
              description={
                !hasClassData
                  ? t("gettingStarted.classLoading")
                  : !hasClass
                    ? t("gettingStarted.hoursNeedsClass")
                    : hasHours
                      ? t("gettingStarted.hoursDone")
                      : t("gettingStarted.hoursDescription")
              }
              disabled={activeStep !== "hours"}
              state={
                hasHours
                  ? "complete"
                  : activeStep === "hours"
                    ? "current"
                    : "notStarted"
              }
              title={t("gettingStarted.hoursTitle")}
            />
            <GettingStartedStep
              action={
                activeStep === "schedule" ? (
                  <Button
                    className="w-full sm:w-auto"
                    onClick={() => setIsCreateScheduleOpen(true)}
                    ref={primaryActionRef}
                    type="button"
                  >
                    {t("gettingStarted.createSchedule")}
                  </Button>
                ) : undefined
              }
              complete={hasSchedule}
              description={
                !hasScheduleData
                  ? t("gettingStarted.scheduleLoading")
                  : !hasHours
                    ? t("gettingStarted.scheduleNeedsHours")
                    : hasSchedule
                      ? t("gettingStarted.scheduleDone")
                      : t("gettingStarted.scheduleDescription")
              }
              disabled={activeStep !== "schedule"}
              state={
                hasSchedule
                  ? "complete"
                  : activeStep === "schedule"
                    ? "current"
                    : "notStarted"
              }
              title={t("gettingStarted.scheduleTitle")}
            />
          </ol>
        </section>
      )}

      <ClassDrawer
        classData={null}
        isOpen={isCreateClassOpen}
        mode="create"
        onCloseAutoFocus={handleDrawerCloseAutoFocus}
        onOpenChange={setIsCreateClassOpen}
        onSuccess={() => handleSuccess("class")}
      />
      <ScheduleDrawer
        isOpen={isCreateScheduleOpen}
        mode="create"
        onCloseAutoFocus={handleDrawerCloseAutoFocus}
        onCreateSuccess={() => handleSuccess("schedule")}
        onModeChange={() => {}}
        onOpenChange={setIsCreateScheduleOpen}
        scheduleId={null}
        selectedDate={DateTime.today().toDate()}
      />
    </>
  );
}

function GettingStartedStep({
  action,
  complete,
  description,
  disabled,
  state,
  title,
}: {
  action?: ReactNode;
  complete: boolean;
  description: string;
  disabled: boolean;
  state: "complete" | "current" | "notStarted";
  title: string;
}) {
  const { t } = useTranslation("dashboard");

  return (
    <li
      aria-current={state === "current" ? "step" : undefined}
      className="flex flex-col gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:px-5"
    >
      <div className="flex min-w-0 gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
            complete
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground",
          )}
        >
          {complete ? (
            <HugeiconsIcon
              icon={CheckHugeIcon}
              strokeWidth={2}
              aria-hidden="true"
              className="size-3.5"
            />
          ) : null}
        </span>
        <div>
          <p className={cn("font-medium", disabled && "text-muted-foreground")}>
            {title}
          </p>
          <span className="sr-only">{t(`gettingStarted.states.${state}`)}</span>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {action ? <div className="shrink-0 sm:pl-4">{action}</div> : null}
    </li>
  );
}

function ChecklistSourceStatus({
  isError,
  isRetrying,
  onRetry,
  retryButtonRef,
  text,
}: {
  isError: boolean;
  isRetrying: boolean;
  onRetry: () => void;
  retryButtonRef: RefObject<HTMLButtonElement | null>;
  text: string;
}) {
  const { t } = useTranslation("dashboard");

  if (!isError) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:px-5"
      role="status"
    >
      <p>{text}</p>
      <Button
        className="min-h-11"
        loading={isRetrying}
        onClick={onRetry}
        ref={retryButtonRef}
        size="sm"
        type="button"
        variant="outline"
      >
        {t("gettingStarted.retry")}
      </Button>
    </div>
  );
}

function GettingStartedSkeleton({ label }: { label: string }) {
  return (
    <section
      aria-label={label}
      className="mt-6 rounded-lg border border-border bg-card p-4 sm:p-5"
    >
      <Skeleton className="h-5 w-44" />
      <Skeleton className="mt-3 h-4 w-64 max-w-full" />
      <div className="mt-5 space-y-4 border-t border-border pt-4">
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </section>
  );
}

function TodayAgenda({ schedules }: { schedules: DashboardSchedule[] }) {
  const { t } = useTranslation(["dashboard", "schedules"]);

  return (
    <ol aria-label={t("dashboard:today.agenda")} className="overflow-hidden">
      {schedules.map((schedule, index) => {
        const isFirst = index === 0;
        const isLast = index === schedules.length - 1;
        const railSegmentClass =
          isFirst && isLast
            ? "hidden"
            : isFirst
              ? "top-[1.875rem] bottom-0"
              : isLast
                ? "top-0 bottom-[calc(100%_-_1.875rem)]"
                : "inset-y-0";
        const status = statusColors[schedule.status] ?? statusColors.SCHEDULED;
        const StatusIcon = status.icon ?? Clock3HugeIcon;
        const ScheduleTypeIcon =
          schedule.type === "ONLINE" ? MonitorHugeIcon : MapPinHugeIcon;
        const startTime = formatTime24Hour(schedule.time);
        const endTime = formatTime24Hour(
          schedule.time + schedule.durationMinutes,
        );

        return (
          <li
            className="relative grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 px-4 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:px-5"
            key={schedule.id}
          >
            <span
              aria-hidden="true"
              className={cn(
                "absolute left-21 w-px bg-border sm:left-29",
                railSegmentClass,
              )}
            />
            <span
              aria-hidden="true"
              className="absolute top-6 left-19.5 size-3 rounded-full border border-border bg-card sm:left-27.5"
            />

            <div className="pt-5 text-sm tabular-nums text-foreground">
              <time className="block font-semibold" dateTime={startTime}>
                {startTime}
              </time>
              <time
                className="mt-0.5 block text-muted-foreground"
                dateTime={endTime}
              >
                {endTime}
              </time>
            </div>

            <div
              className={cn(
                "min-w-0 py-4 pl-5",
                !isLast && "border-b border-border",
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-semibold leading-5 text-foreground">
                  {schedule.className}
                </p>
                <Badge className="shrink-0 gap-1" variant={status.badgeVariant}>
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-3"
                    icon={StatusIcon}
                    strokeWidth={2}
                  />
                  {t(`schedules:status.${schedule.status}`)}
                </Badge>
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <HugeiconsIcon
                    aria-hidden="true"
                    className="size-4"
                    icon={ScheduleTypeIcon}
                    strokeWidth={2}
                  />
                  {t(`schedules:type.${schedule.type}`)}
                </span>
                <span aria-hidden="true">•</span>
                <span className="tabular-nums">
                  {formatDuration(schedule.durationMinutes, t)}
                </span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function TodayHubSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div aria-label={loadingLabel} role="status">
      <span className="sr-only">{loadingLabel}</span>
      <div className="px-4 sm:px-5">
        {[0, 1, 2].map((index) => (
          <div
            className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[6.5rem_minmax(0,1fr)]"
            key={index}
          >
            <Skeleton className="mt-5 h-9 w-14" />
            <div
              className={cn("py-4 pl-5", index < 2 && "border-b border-border")}
            >
              <Skeleton className="h-5 w-32" />
              <Skeleton className="mt-3 h-4 w-44 max-w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TodayError({
  description,
  retryLabel,
  onRetry,
}: {
  description: string;
  retryLabel: string;
  onRetry: () => void;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="text-sm text-muted-foreground" role="alert">
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

function TodayEmpty() {
  const { t } = useTranslation(["dashboard"]);

  return (
    <div className="px-5 py-12 text-center">
      <HugeiconsIcon
        aria-hidden="true"
        className="mx-auto size-6 text-muted-foreground"
        icon={CalendarDaysHugeIcon}
        strokeWidth={2}
      />
      <h3 className="mt-3 font-semibold text-foreground">
        {t("dashboard:today.emptyTitle")}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("dashboard:today.emptyDescription")}
      </p>
    </div>
  );
}
