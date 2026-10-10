import {
  CalendarCheck2,
  CalendarDays,
  Check,
  Clock3,
  MapPin,
  Monitor,
  X,
} from "lucide-react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import { type ReactNode, type RefObject, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClassDrawer } from "@/components/classes/class-drawer";
import { ScheduleDrawer } from "@/components/schedules/schedule-drawer";
import { APP_ROUTES } from "@/constants/routes";
import { useAuth } from "@/contexts/auth-context";
import {
  useCompleteSchedule,
  useUpdateSchedule,
} from "@/hooks/mutations/use-schedules";
import { useSchedules } from "@/hooks/queries/use-schedules";
import { useClasses } from "@/hooks/queries/use-classes";
import { DateTime } from "@/lib/date-time";
import {
  formatDuration,
  formatTime24Hour,
  statusColors,
} from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";

type DashboardSchedule = NonNullable<
  ReturnType<typeof useSchedules>["data"]
>[number];

type ScheduledSummary = {
  count: number;
  plannedMinutes: number;
  nextSession: DashboardSchedule | null;
};

type ConfirmationAction = "complete" | "no-show";

type ConfirmationLock = {
  action: ConfirmationAction;
  id: number;
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
    nextSession: null,
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
    summary.nextSession ??= schedule;
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
  const completeMutation = useCompleteSchedule();
  const updateMutation = useUpdateSchedule();
  const confirmationLockIdRef = useRef(0);
  const confirmationLockRef = useRef<ConfirmationLock | null>(null);
  const resolvedScheduleIdsRef = useRef(new Set<string>());
  const [confirmationLock, setConfirmationLock] =
    useState<ConfirmationLock | null>(null);
  const [resolvedScheduleIds, setResolvedScheduleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const scheduledSummary = getScheduledSummary(schedules, resolvedScheduleIds);
  const isMutationPending =
    completeMutation.isPending || updateMutation.isPending;
  const isAwaitingConfirmation = confirmationLock !== null;
  const isTriageBusy = isMutationPending || isAwaitingConfirmation;

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

  const acquireConfirmationLock = (
    scheduleId: string,
    action: ConfirmationAction,
  ) => {
    if (
      confirmationLockRef.current ||
      isMutationPending ||
      resolvedScheduleIdsRef.current.has(scheduleId)
    ) {
      return null;
    }

    const lock = {
      action,
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

  const handleCompleteSchedule = (schedule: DashboardSchedule) => {
    const lock = acquireConfirmationLock(schedule.id, "complete");
    if (!lock) {
      return;
    }

    const hoursToDeduct = (schedule.durationMinutes / 60).toFixed(1);
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
          completeMutation.mutate(schedule.id, {
            onSuccess: () => markScheduleResolved(schedule.id),
            onSettled: () => releaseConfirmationLock(lock),
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

  const handleNoShowSchedule = (schedule: DashboardSchedule) => {
    const lock = acquireConfirmationLock(schedule.id, "no-show");
    if (!lock) {
      return;
    }

    const reservedHours = (schedule.durationMinutes / 60).toFixed(1);
    let wasConfirmed = false;
    let isConfirmationClosed = false;
    const releaseIfUnconfirmed = () => {
      if (!wasConfirmed) {
        isConfirmationClosed = true;
        releaseConfirmationLock(lock);
      }
    };

    toast(t("schedules:noShow.confirm", { hours: reservedHours }), {
      action: {
        label: t("schedules:noShow.confirmButton"),
        onClick: () => {
          if (wasConfirmed || isConfirmationClosed) {
            return;
          }

          wasConfirmed = true;
          updateMutation.mutate(
            {
              id: schedule.id,
              data: { status: "NO_SHOW" },
            },
            {
              onSuccess: () => markScheduleResolved(schedule.id),
              onSettled: () => releaseConfirmationLock(lock),
            },
          );
        },
      },
      cancel: {
        label: t("schedules:noShow.cancelButton"),
        onClick: releaseIfUnconfirmed,
      },
      onAutoClose: releaseIfUnconfirmed,
      onDismiss: releaseIfUnconfirmed,
    });
  };

  return (
    <section className="mx-auto w-full max-w-6xl">
      <header className="flex flex-col gap-5 border-b border-border pb-6 sm:pb-8 lg:flex-row lg:items-end lg:justify-between">
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

        <Link
          to={APP_ROUTES.SCHEDULES}
          className={buttonVariants({
            variant: "outline",
            className: "w-full sm:w-auto",
          })}
        >
          <CalendarDays className="size-4" aria-hidden="true" />
          {t("dashboard:today.openSchedule")}
        </Link>
      </header>

      <div className="mt-6">
        {isLoading ? (
          <TodayHubSkeleton loadingLabel={t("dashboard:today.loading")} />
        ) : isError ? (
          <TodayError
            description={t("dashboard:today.loadError")}
            onRetry={() => void refetch()}
            retryLabel={t("dashboard:today.retry")}
          />
        ) : schedules && schedules.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-6">
            <SessionToConfirmTriage
              isCompleting={completeMutation.isPending}
              isBusy={isTriageBusy}
              isUpdating={updateMutation.isPending}
              busyLabel={t(
                isAwaitingConfirmation
                  ? "dashboard:today.waitingForConfirmation"
                  : "dashboard:today.updating",
              )}
              noShowLabel={t("dashboard:today.noShowAction")}
              onComplete={handleCompleteSchedule}
              onNoShow={handleNoShowSchedule}
              schedule={scheduledSummary.nextSession}
            />
            <TodayAgenda schedules={schedules} />
          </div>
        ) : (
          <TodayEmpty />
        )}
      </div>

      <GettingStartedChecklist />
    </section>
  );
}

function GettingStartedChecklist() {
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
  const [announcement, setAnnouncement] = useState("");
  const [pendingSuccess, setPendingSuccess] =
    useState<ChecklistSuccessStep | null>(null);
  const [pendingHoursSuccess, setPendingHoursSuccess] = useState(false);
  const pendingSuccessRef = useRef<ChecklistSuccessStep | null>(null);
  const hoursSuccessHandledRef = useRef(false);
  const checklistHeadingRef = useRef<HTMLHeadingElement>(null);
  const reopenButtonRef = useRef<HTMLButtonElement>(null);
  const primaryActionRef = useRef<HTMLButtonElement>(null);
  const guideSummaryRef = useRef<HTMLElement>(null);
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
  const completedSteps = Number(hasClass) + Number(hasHours) + Number(hasSchedule);
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

  useEffect(() => {
    if (!dismissalStorageKey) {
      setIsDismissed(false);
      return;
    }

    setIsDismissed(
      window.localStorage.getItem(dismissalStorageKey) === "true",
    );
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
        setAnnouncement(t("gettingStarted.classSuccess"));
        pendingSuccessRef.current = null;
        setPendingSuccess(null);
        requestAnimationFrame(() => primaryActionRef.current?.focus());
        return;
      }

      if (classesQuery.isError) {
        setAnnouncement(t("gettingStarted.classRefreshRequired"));
        pendingSuccessRef.current = null;
        setPendingSuccess(null);
        requestAnimationFrame(() => classesRetryButtonRef.current?.focus());
      }
      return;
    }

    if (pendingSuccess === "schedule") {
      if (hasSchedule) {
        setAnnouncement(t("gettingStarted.scheduleSuccess"));
        pendingSuccessRef.current = null;
        setPendingSuccess(null);
        requestAnimationFrame(() => guideSummaryRef.current?.focus());
        return;
      }

      if (schedulesQuery.isError) {
        setAnnouncement(t("gettingStarted.scheduleRefreshRequired"));
        pendingSuccessRef.current = null;
        setPendingSuccess(null);
        requestAnimationFrame(() => schedulesRetryButtonRef.current?.focus());
      }
    }
  }, [
    classesQuery.isError,
    hasClass,
    hasSchedule,
    pendingSuccess,
    schedulesQuery.isError,
    t,
  ]);

  useEffect(() => {
    if (
      search.setup !== "hours-added" ||
      hoursSuccessHandledRef.current
    ) {
      return;
    }

    if (!hasHours && !classesQuery.isError) {
      return;
    }

    hoursSuccessHandledRef.current = true;
    void navigate({ to: "/", search: {}, replace: true });

    if (!hasHours) {
      setAnnouncement(t("gettingStarted.hoursClassesRefreshRequired"));
      requestAnimationFrame(() => classesRetryButtonRef.current?.focus());
      return;
    }

    setPendingHoursSuccess(true);
  }, [classesQuery.isError, hasHours, navigate, search.setup, t]);

  useEffect(() => {
    if (!pendingHoursSuccess) {
      return;
    }

    if (schedulesQuery.isError) {
      setAnnouncement(t("gettingStarted.hoursSchedulesRefreshRequired"));
      setPendingHoursSuccess(false);
      requestAnimationFrame(() => schedulesRetryButtonRef.current?.focus());
      return;
    }

    if (!hasScheduleData || (!isComplete && activeStep === null)) return;

    setAnnouncement(t("gettingStarted.hoursSuccess"));
    setPendingHoursSuccess(false);
    requestAnimationFrame(() => {
      if (isComplete) {
        guideSummaryRef.current?.focus();
        return;
      }
      primaryActionRef.current?.focus();
    });
  }, [
    activeStep,
    hasScheduleData,
    isComplete,
    pendingHoursSuccess,
    schedulesQuery.isError,
    t,
  ]);

  const handleSuccess = (step: ChecklistSuccessStep) => {
    pendingSuccessRef.current = step;
    setPendingSuccess(step);
  };

  if (isDismissed) {
    return (
      <>
        <div className="mt-6">
          <Button
            onClick={reopen}
            ref={reopenButtonRef}
            type="button"
            variant="link"
          >
            {t("gettingStarted.reopen")}
          </Button>
        </div>
        <ScheduleDrawer
          isOpen={isCreateScheduleOpen}
          mode="create"
          onCloseAutoFocus={() => reopenButtonRef.current?.focus()}
          onCreateSuccess={() => handleSuccess("schedule")}
          onModeChange={() => {}}
          onOpenChange={setIsCreateScheduleOpen}
          scheduleId={null}
          selectedDate={DateTime.today().toDate()}
        />
      </>
    );
  }

  if (isLoading) {
    return <GettingStartedSkeleton label={t("gettingStarted.loading")} />;
  }

  const openAddHours = () => {
    void navigate({
      to: "/classes",
      search: { setup: "getting-started" },
    });
  };

  return (
    <section
      aria-labelledby="getting-started-title"
      className="mt-6 rounded-lg border border-border bg-card"
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
            {isComplete
              ? t("gettingStarted.completeDescription")
              : t("gettingStarted.description")}
          </p>
          <p className="mt-2 text-sm font-medium tabular-nums text-muted-foreground">
            {t("gettingStarted.progress", { completed: completedSteps, total: 3 })}
          </p>
        </div>
        <Button
          aria-label={t("gettingStarted.dismiss")}
          onClick={dismiss}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X aria-hidden="true" />
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

      {isComplete ? (
        <details className="border-t border-border px-4 py-3 sm:px-5">
          <summary
            ref={guideSummaryRef}
            className="cursor-pointer text-sm font-medium text-foreground"
          >
            {t("gettingStarted.manageSchedule")}
          </summary>
          <div className="mt-3 space-y-2 text-sm leading-5 text-muted-foreground">
            <p>{t("gettingStarted.guide.quickActions")}</p>
            <p>{t("gettingStarted.guide.cancelled")}</p>
            <p>{t("gettingStarted.guide.reservations")}</p>
            <p>{t("gettingStarted.guide.delete")}</p>
          </div>
        </details>
      ) : (
        <>
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
        </>
      )}

      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <ClassDrawer
        classData={null}
        isOpen={isCreateClassOpen}
        mode="create"
        onCloseAutoFocus={() => {
          if (!pendingSuccessRef.current) primaryActionRef.current?.focus();
        }}
        onOpenChange={setIsCreateClassOpen}
        onSuccess={() => handleSuccess("class")}
      />
      <ScheduleDrawer
        isOpen={isCreateScheduleOpen}
        mode="create"
        onCloseAutoFocus={() => {
          if (!pendingSuccessRef.current) primaryActionRef.current?.focus();
        }}
        onCreateSuccess={() => handleSuccess("schedule")}
        onModeChange={() => {}}
        onOpenChange={setIsCreateScheduleOpen}
        scheduleId={null}
        selectedDate={DateTime.today().toDate()}
      />
    </section>
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
          {complete ? <Check className="size-3.5" /> : null}
        </span>
        <div>
          <p className={cn("font-medium", disabled && "text-muted-foreground")}>
            {title}
          </p>
          <span className="sr-only">
            {t(`gettingStarted.states.${state}`)}
          </span>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{description}</p>
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
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:px-5" role="status">
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

function SessionToConfirmTriage({
  schedule,
  isBusy,
  isCompleting,
  isUpdating,
  onComplete,
  onNoShow,
  noShowLabel,
  busyLabel,
}: {
  schedule: DashboardSchedule | null;
  isBusy: boolean;
  isCompleting: boolean;
  isUpdating: boolean;
  onComplete: (schedule: DashboardSchedule) => void;
  onNoShow: (schedule: DashboardSchedule) => void;
  noShowLabel: string;
  busyLabel: string;
}) {
  const { t } = useTranslation(["dashboard", "schedules"]);

  if (!schedule) {
    return (
      <aside
        aria-labelledby="session-to-confirm-title"
        className="order-first h-fit rounded-lg border border-border bg-card p-4 sm:p-5 lg:order-2"
      >
        <div className="flex size-9 items-center justify-center rounded-md bg-secondary text-muted-foreground">
          <CalendarCheck2 className="size-4" aria-hidden="true" />
        </div>
        <h2
          id="session-to-confirm-title"
          className="mt-4 text-base font-semibold text-foreground"
        >
          {t("dashboard:today.noSessionToConfirmTitle")}
        </h2>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {t("dashboard:today.noSessionToConfirmDescription")}
        </p>
      </aside>
    );
  }

  const ScheduleTypeIcon = schedule.type === "ONLINE" ? Monitor : MapPin;
  const startTime = formatTime24Hour(schedule.time);
  const endTime = formatTime24Hour(schedule.time + schedule.durationMinutes);

  return (
    <aside
      aria-busy={isBusy}
      aria-labelledby="session-to-confirm-title"
      className="order-first h-fit rounded-lg border border-border bg-card p-4 sm:p-5 lg:order-2"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-container text-primary">
          <CalendarCheck2 className="size-4" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h2
            id="session-to-confirm-title"
            className="font-semibold text-foreground"
          >
            {t("dashboard:today.sessionToConfirm")}
          </h2>
          <p className="mt-0.5 text-sm leading-5 text-muted-foreground">
            {t("dashboard:today.sessionToConfirmDescription")}
          </p>
        </div>
      </div>

      <div className="mt-5 border-y border-border py-4">
        <p className="font-medium tabular-nums text-foreground">
          {startTime} – {endTime}
        </p>
        <p className="mt-1 wrap-break-word font-semibold text-foreground">
          {schedule.className}
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <ScheduleTypeIcon className="size-4" aria-hidden="true" />
            {t(`schedules:type.${schedule.type}`)}
          </span>
          <span aria-hidden="true">•</span>
          <span className="tabular-nums">
            {formatDuration(schedule.durationMinutes, t)}
          </span>
        </p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
        <Button
          className="w-full"
          disabled={isBusy}
          loading={isCompleting}
          onClick={() => onComplete(schedule)}
          type="button"
        >
          {t("schedules:complete.action")}
        </Button>
        <Button
          className="w-full"
          disabled={isBusy}
          loading={isUpdating}
          onClick={() => onNoShow(schedule)}
          type="button"
          variant="outline"
        >
          {noShowLabel}
        </Button>
      </div>
      {isBusy ? (
        <p
          className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"
          role="status"
        >
          <Clock3 className="size-3" aria-hidden="true" />
          {busyLabel}
        </p>
      ) : null}
    </aside>
  );
}

function TodayAgenda({ schedules }: { schedules: DashboardSchedule[] }) {
  const { t } = useTranslation(["dashboard", "schedules"]);

  return (
    <section
      aria-labelledby="today-agenda-title"
      className="rounded-lg border border-border bg-card lg:order-1"
    >
      <div className="border-b border-border px-4 py-4 sm:px-5">
        <h2 id="today-agenda-title" className="font-semibold text-foreground">
          {t("dashboard:today.agenda")}
        </h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t("dashboard:today.timezone")}
        </p>
      </div>

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
          const status =
            statusColors[schedule.status] ?? statusColors.SCHEDULED;
          const statusClassName =
            schedule.status === "SCHEDULED"
              ? "bg-primary-container text-primary"
              : status.className;
          const StatusIcon = status.icon ?? Clock3;
          const ScheduleTypeIcon =
            schedule.type === "ONLINE" ? Monitor : MapPin;
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
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 wrap-break-word font-semibold leading-5 text-foreground">
                    {schedule.className}
                  </p>
                  <Badge
                    className={cn("gap-1 border-transparent", statusClassName)}
                    variant="outline"
                  >
                    <StatusIcon className="size-3" aria-hidden="true" />
                    {t(`schedules:status.${schedule.status}`)}
                  </Badge>
                </div>
                <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <ScheduleTypeIcon className="size-4" aria-hidden="true" />
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
    </section>
  );
}

function TodayHubSkeleton({ loadingLabel }: { loadingLabel: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-6">
      <aside
        aria-label={loadingLabel}
        className="order-first h-fit rounded-lg border border-border bg-card p-4 sm:p-5 lg:order-2"
        role="status"
      >
        <span className="sr-only">{loadingLabel}</span>
        <Skeleton className="size-9" />
        <Skeleton className="mt-4 h-5 w-28" />
        <Skeleton className="mt-2 h-4 w-full" />
        <Skeleton className="mt-5 h-20 w-full" />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
          <Skeleton className="h-11 w-full rounded-full" />
          <Skeleton className="h-11 w-full rounded-full" />
        </div>
      </aside>

      <section className="rounded-lg border border-border bg-card lg:order-1">
        <div className="border-b border-border px-4 py-4 sm:px-5">
          <Skeleton className="h-5 w-28" />
        </div>
        <div className="px-4 sm:px-5">
          {[0, 1, 2].map((index) => (
            <div
              className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[6.5rem_minmax(0,1fr)]"
              key={index}
            >
              <Skeleton className="mt-5 h-9 w-14" />
              <div
                className={cn(
                  "py-4 pl-5",
                  index < 2 && "border-b border-border",
                )}
              >
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-3 h-4 w-44 max-w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
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
    <section className="rounded-lg border border-border bg-card px-5 py-12 text-center">
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
    </section>
  );
}

function TodayEmpty() {
  const { t } = useTranslation(["dashboard"]);

  return (
    <section className="rounded-lg border border-border bg-card px-5 py-12 text-center">
      <CalendarDays
        className="mx-auto size-6 text-muted-foreground"
        aria-hidden="true"
      />
      <h2 className="mt-3 font-semibold text-foreground">
        {t("dashboard:today.emptyTitle")}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("dashboard:today.emptyDescription")}
      </p>
    </section>
  );
}
