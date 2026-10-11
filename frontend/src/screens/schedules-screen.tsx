import { CalendarDays, Plus, Search } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  AnimatePresence,
  MotionConfig,
  motion,
  useIsPresent,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import {
  useDeleteSchedule,
  useCompleteSchedule,
  useRestoreHours,
  useUpdateSchedule,
} from "@/hooks/mutations/use-schedules";
import { useSchedules } from "@/hooks/queries/use-schedules";
import { useDebounce } from "@/hooks/use-debounce";
import { ScheduleCard } from "@/components/schedules/schedule-card";
import { WorkspaceFab } from "@/components/workspaces/workspace-fab";
import {
  ScheduleDrawer,
  type DrawerMode,
} from "@/components/schedules/schedule-drawer";
import {
  type ScheduleViewMode,
  WeekDateSelector,
} from "@/components/schedules/week-date-selector";
import { WeeklyScheduleTimeline } from "@/components/schedules/weekly-schedule-timeline";
import {
  Tabs,
  TabsPanel,
  TabsPanels,
} from "@/components/animate-ui/components/base/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceErrorState } from "@/components/workspaces/workspace-state";
import { DateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";

function isScheduleViewMode(value: string): value is ScheduleViewMode {
  return value === "day" || value === "week";
}

function AnimatedDateRail({
  children,
  transition,
}: {
  children: ReactNode;
  transition: Transition;
}) {
  const isPresent = useIsPresent();

  return (
    <motion.div
      animate={{ opacity: 1, filter: "blur(0px)" }}
      aria-hidden={isPresent ? undefined : true}
      className="mb-2 w-full shrink-0"
      exit={{ opacity: 0, filter: "blur(4px)" }}
      inert={!isPresent}
      initial={{ opacity: 0, filter: "blur(4px)" }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
}

export function SchedulesScreen() {
  const { t } = useTranslation(["schedules"]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const weekAddRef = useRef<HTMLButtonElement>(null);
  const activeTriggerRef = useRef<HTMLButtonElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedDate, setSelectedDate] = useState<Date>(
    DateTime.today().toDate(),
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("day");
  const prefersReducedMotion = useReducedMotion() === true;
  const tabTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.18, ease: [0.25, 1, 0.5, 1] };

  const formattedDate = DateTime.from(selectedDate).toDateOnlyString();
  const weekDates = useMemo(
    () => DateTime.getWeekDates(selectedDate),
    [selectedDate],
  );
  const weekStart = weekDates[0] ?? DateTime.from(selectedDate);
  const weekEnd = weekDates.at(-1) ?? weekStart;
  const scheduleQuery = useMemo(
    () =>
      viewMode === "week"
        ? {
            startDate: weekStart.toDateOnlyString(),
            endDate: weekEnd.toDateOnlyString(),
            search: debouncedSearchQuery || undefined,
          }
        : {
            date: formattedDate,
            search: debouncedSearchQuery || undefined,
          },
    [debouncedSearchQuery, formattedDate, viewMode, weekEnd, weekStart],
  );
  const {
    data: schedules,
    isLoading,
    isError,
    refetch,
  } = useSchedules(scheduleQuery);

  const deleteMutation = useDeleteSchedule();
  const completeMutation = useCompleteSchedule();
  const updateMutation = useUpdateSchedule();
  const restoreMutation = useRestoreHours();

  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];
    if (statusFilter === "ALL") return schedules;
    return schedules.filter((s) => s.status === statusFilter);
  }, [schedules, statusFilter]);

  const handleAddSchedule = (trigger: HTMLButtonElement | null) => {
    activeTriggerRef.current =
      trigger ?? fabRef.current ?? weekAddRef.current ?? triggerRef.current;
    setSelectedScheduleId(null);
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const focusTrigger = () => {
    const trigger = [
      activeTriggerRef.current,
      fabRef.current,
      weekAddRef.current,
      triggerRef.current,
    ].find(
      (candidate) =>
        candidate?.isConnected && candidate.getClientRects().length > 0,
    );
    trigger?.focus();
  };

  const handleViewSchedule = (schedule: GetV1Schedules200Item) => {
    setSelectedScheduleId(schedule.id);
    setDrawerMode("view");
    setIsDrawerOpen(true);
  };

  const handleDeleteSchedule = (schedule: GetV1Schedules200Item) => {
    toast(t("schedules:delete.confirm"), {
      action: {
        label: t("schedules:delete.confirmButton"),
        onClick: () => deleteMutation.mutate(schedule.id),
      },
      cancel: {
        label: t("schedules:delete.cancelButton"),
        onClick: () => {},
      },
    });
  };

  const handleCompleteSchedule = (schedule: GetV1Schedules200Item) => {
    const hoursToDeduct = (schedule.durationMinutes / 60).toFixed(1);
    toast(t("schedules:complete.confirm", { hours: hoursToDeduct }), {
      action: {
        label: t("schedules:complete.confirmButton"),
        onClick: () => completeMutation.mutate(schedule.id),
      },
      cancel: {
        label: t("schedules:complete.cancelButton"),
        onClick: () => {},
      },
    });
  };

  const handleRestoreHours = (schedule: GetV1Schedules200Item) => {
    const hoursToRestore = (schedule.durationMinutes / 60).toFixed(1);
    toast(t("schedules:restore.confirm", { hours: hoursToRestore }), {
      action: {
        label: t("schedules:restore.confirmButton"),
        onClick: () => restoreMutation.mutate(schedule.id),
      },
      cancel: {
        label: t("schedules:restore.cancelButton"),
        onClick: () => {},
      },
    });
  };

  const handleNoShowSchedule = (schedule: GetV1Schedules200Item) => {
    const reservedHours = (schedule.durationMinutes / 60).toFixed(1);
    toast(t("schedules:noShow.confirm", { hours: reservedHours }), {
      action: {
        label: t("schedules:noShow.confirmButton"),
        onClick: () =>
          updateMutation.mutate({
            id: schedule.id,
            data: { status: "NO_SHOW" },
          }),
      },
      cancel: {
        label: t("schedules:noShow.cancelButton"),
        onClick: () => {},
      },
    });
  };

  const handleModeChange = (mode: DrawerMode) => {
    setDrawerMode(mode);
  };

  const handleViewModeChange = (value: string) => {
    if (isScheduleViewMode(value)) {
      setViewMode(value);
    }
  };

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) {
      setDrawerMode("create");
      setSelectedScheduleId(null);
    }
  };

  const hasActiveFilters =
    statusFilter !== "ALL" || Boolean(searchQuery.trim());
  const isWeeklyTimelineVisible =
    viewMode === "week" &&
    !isLoading &&
    !isError &&
    filteredSchedules.length > 0;

  const renderScheduleContent = (mode: ScheduleViewMode) => {
    const isWeekMode = mode === "week";

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-4 py-16">
          <div className="h-16 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          <p className="text-sm text-muted-foreground">
            {t("schedules:loading")}
          </p>
        </div>
      );
    }

    if (isError) {
      return (
        <WorkspaceErrorState
          description={t("schedules:error.description")}
          onRetry={() => refetch()}
          retryLabel={t("schedules:error.retry")}
          title={t("schedules:error.title")}
        />
      );
    }

    if (!schedules || schedules.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-xl bg-primary-container">
            <CalendarDays className="size-10 text-primary" />
          </div>
          <h2 className="mb-2 font-headline text-xl font-normal tracking-[-0.01em] text-foreground">
            {hasActiveFilters
              ? isWeekMode
                ? t("schedules:weekNoResults")
                : t("schedules:noResults")
              : isWeekMode
                ? t("schedules:weekNoSchedules")
                : t("schedules:noSchedules")}
          </h2>
          {!hasActiveFilters ? (
            <>
              <p className="mb-6 max-w-xs font-body text-muted-foreground">
                {isWeekMode
                  ? t("schedules:weekNoSchedulesDescription")
                  : t("schedules:noSchedulesDescription")}
              </p>
              <Button
                leftIcon={Plus}
                onClick={(event) => handleAddSchedule(event.currentTarget)}
              >
                {t("schedules:addSchedule")}
              </Button>
            </>
          ) : null}
        </div>
      );
    }

    if (filteredSchedules.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">
            {isWeekMode
              ? t("schedules:weekNoResults")
              : t("schedules:noResults")}
          </p>
        </div>
      );
    }

    if (isWeekMode) {
      return (
        <WeeklyScheduleTimeline
          onViewSchedule={handleViewSchedule}
          schedules={filteredSchedules}
          selectedDate={selectedDate}
        />
      );
    }

    return (
      <div className="space-y-2">
        {filteredSchedules.map((schedule) => (
          <ScheduleCard
            key={schedule.id}
            schedule={schedule}
            onView={() => handleViewSchedule(schedule)}
            onDelete={() => handleDeleteSchedule(schedule)}
            onComplete={() => handleCompleteSchedule(schedule)}
            onNoShow={() => handleNoShowSchedule(schedule)}
            onRestore={() => handleRestoreHours(schedule)}
          />
        ))}
      </div>
    );
  };

  return (
    <div
      className={
        viewMode === "week"
          ? "flex h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden"
          : "flex min-h-[calc(100vh-200px)] flex-col"
      }
    >
      <MotionConfig reducedMotion="user">
        <Tabs
          className="flex min-h-0 flex-1 flex-col gap-0"
          value={viewMode}
          onValueChange={handleViewModeChange}
        >
          <WeekDateSelector
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            viewMode={viewMode}
          >
            {({ day, week }) => (
              <>
                <AnimatePresence initial={false} mode="wait">
                  <AnimatedDateRail key={viewMode} transition={tabTransition}>
                    {viewMode === "day" ? day : week}
                  </AnimatedDateRail>
                </AnimatePresence>

                <div className="mb-2 shrink-0 px-3 sm:px-4 lg:px-6">
                  <div
                    className={cn(
                      "flex flex-col gap-3 sm:flex-row sm:items-center",
                      viewMode === "week" && "flex-row items-center gap-2",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <Input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder={t("schedules:searchPlaceholder")}
                        leftIcon={Search}
                      />
                    </div>
                    {viewMode === "week" ? (
                      <Button
                        aria-haspopup="dialog"
                        aria-label={t("schedules:addSchedule")}
                        className="sm:hidden"
                        onClick={() => handleAddSchedule(weekAddRef.current)}
                        ref={weekAddRef}
                        size="icon"
                        type="button"
                      >
                        <Plus aria-hidden="true" className="size-5" />
                      </Button>
                    ) : null}
                    <Button
                      className="hidden sm:inline-flex"
                      leftIcon={Plus}
                      onClick={() => handleAddSchedule(triggerRef.current)}
                      ref={triggerRef}
                    >
                      {t("schedules:addSchedule")}
                    </Button>
                  </div>
                </div>

                {schedules && schedules.length > 0 ? (
                  <div className="mb-2 shrink-0 px-3 sm:px-4 lg:px-6">
                    <div className="flex gap-2 overflow-x-auto">
                      {(
                        [
                          "ALL",
                          "SCHEDULED",
                          "COMPLETED",
                          "NO_SHOW",
                          "CANCELLED",
                        ] as const
                      ).map((status) => (
                        <button
                          aria-pressed={statusFilter === status}
                          className="group inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-1 text-sm font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          type="button"
                        >
                          <span
                            className={cn(
                              "rounded-full px-3 py-1.5 leading-5 transition-colors",
                              statusFilter === status
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-foreground group-hover:bg-accent",
                            )}
                          >
                            {status === "ALL"
                              ? t("schedules:filter.all")
                              : t(`schedules:status.${status}`)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <TabsPanels
                  className="flex min-h-0 flex-1 flex-col"
                  mode="layout"
                  transition={tabTransition}
                >
                  <TabsPanel
                    className="flex min-h-0 flex-1 flex-col"
                    transition={tabTransition}
                    value="day"
                  >
                    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-4 sm:pb-0 lg:px-6">
                      {renderScheduleContent("day")}
                    </div>
                  </TabsPanel>
                  <TabsPanel
                    className="flex min-h-0 flex-1 flex-col"
                    transition={tabTransition}
                    value="week"
                  >
                    <div
                      className={cn(
                        "flex min-h-0 flex-1 flex-col px-3 pb-0 sm:px-4 lg:px-6",
                        isWeeklyTimelineVisible &&
                          "relative left-1/2 w-screen max-w-none -translate-x-1/2 px-0 sm:static sm:left-auto sm:w-auto sm:translate-x-0 sm:px-0 lg:px-0",
                      )}
                    >
                      {renderScheduleContent("week")}
                    </div>
                  </TabsPanel>
                </TabsPanels>
              </>
            )}
          </WeekDateSelector>
        </Tabs>
      </MotionConfig>

      {viewMode === "day" ? (
        <WorkspaceFab
          label={t("schedules:addSchedule")}
          onClick={() => handleAddSchedule(fabRef.current)}
          triggerRef={fabRef}
        />
      ) : null}

      {/* Schedule Drawer */}
      <ScheduleDrawer
        isOpen={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
        mode={drawerMode}
        scheduleId={selectedScheduleId}
        onModeChange={handleModeChange}
        onCloseAutoFocus={focusTrigger}
        selectedDate={selectedDate}
      />
    </div>
  );
}
