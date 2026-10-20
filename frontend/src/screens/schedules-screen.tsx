import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon as CalendarDaysHugeIcon,
  Add01Icon as PlusHugeIcon,
  Search01Icon as SearchHugeIcon,
} from "@hugeicons/core-free-icons";
import { useMemo, useRef, useState } from "react";
import { MotionConfig } from "framer-motion";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  useCompleteSchedule,
  useDeleteSchedule,
  useRestoreHours,
} from "@/hooks/mutations/use-schedules";
import { useSchedules } from "@/hooks/queries/use-schedules";
import { useDebounce } from "@/hooks/use-debounce";
import { ScheduleCard } from "@/components/schedules/schedule-card";
import { NoShowScheduleDialog } from "@/components/schedules/no-show-schedule-dialog";
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
  TabsList,
  TabsPanel,
  TabsPanels,
  TabsTab,
} from "@/components/common/animate-ui/components/base/tabs";
import { Button } from "@/components/common/button";
import { Input } from "@/components/common/input";
import { WorkspaceErrorState } from "@/components/workspaces/workspace-state";
import { DateTime } from "@/lib/date-time";
import type { Schedule } from "@/models/schedule";
import { cn } from "@/lib/utils";

function isScheduleViewMode(value: string): value is ScheduleViewMode {
  return value === "day" || value === "week";
}

const SCHEDULE_STATUS_FILTERS = [
  "ALL",
  "SCHEDULED",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
] as const;

export function SchedulesScreen() {
  const { t } = useTranslation(["schedules"]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const weekAddRef = useRef<HTMLButtonElement>(null);
  const activeTriggerRef = useRef<HTMLButtonElement>(null);
  const scheduleSearchRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedDate, setSelectedDate] = useState<Date>(
    DateTime.today().toDate(),
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [initialCreateTime, setInitialCreateTime] = useState<number>();
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [noShowSchedule, setNoShowSchedule] =
		useState<Schedule | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("day");

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
  const restoreMutation = useRestoreHours();

  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];
    if (viewMode === "week" || statusFilter === "ALL") return schedules;
	return schedules.filter((schedule) => schedule.getStatus() === statusFilter);
  }, [schedules, statusFilter, viewMode]);

  const handleAddSchedule = (trigger: HTMLButtonElement | null) => {
    activeTriggerRef.current =
      trigger ?? fabRef.current ?? weekAddRef.current ?? triggerRef.current;
    setInitialCreateTime(undefined);
    setSelectedScheduleId(null);
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const handleCreateSchedule = (
    date: Date,
    time: number,
    trigger: HTMLButtonElement,
  ) => {
    activeTriggerRef.current = trigger;
    setSelectedDate(date);
    setInitialCreateTime(time);
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

    if (trigger) {
      trigger.focus();
      return;
    }

    document
      .querySelector<HTMLButtonElement>("[data-timeline-active-cell]")
      ?.focus();
  };

  const handleViewSchedule = (
		schedule: Schedule,
    trigger?: HTMLButtonElement,
  ) => {
    if (trigger) {
      activeTriggerRef.current = trigger;
    }

		setSelectedScheduleId(schedule.getId());
    setDrawerMode("view");
    setIsDrawerOpen(true);
  };

	const handleDeleteSchedule = (schedule: Schedule) => {
    toast(t("schedules:delete.confirm"), {
      action: {
        label: t("schedules:delete.confirmButton"),
			onClick: () => deleteMutation.mutate(schedule.getId()),
      },
      cancel: {
        label: t("schedules:delete.cancelButton"),
        onClick: () => {},
      },
    });
  };

	const handleCompleteSchedule = (schedule: Schedule) => {
    const hoursToDeduct = DateTime.formatDurationHours(
		schedule.getDurationHours(),
    );
    toast(t("schedules:complete.confirm", { hours: hoursToDeduct }), {
      action: {
        label: t("schedules:complete.confirmButton"),
			onClick: () => completeMutation.mutate(schedule.getId()),
      },
      cancel: {
        label: t("schedules:complete.cancelButton"),
        onClick: () => {},
      },
    });
  };

	const handleRestoreHours = (schedule: Schedule) => {
    const hoursToRestore = DateTime.formatDurationHours(
		schedule.getDurationHours(),
    );
    toast(t("schedules:restore.confirm", { hours: hoursToRestore }), {
      action: {
        label: t("schedules:restore.confirmButton"),
			onClick: () => restoreMutation.mutate(schedule.getId()),
      },
      cancel: {
        label: t("schedules:restore.cancelButton"),
        onClick: () => {},
      },
    });
  };

	const handleNoShowSchedule = (schedule: Schedule) => {
    setNoShowSchedule(schedule);
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
      setInitialCreateTime(undefined);
      setDrawerMode("create");
      setSelectedScheduleId(null);
    }
  };

  const hasActiveFilters = (mode: ScheduleViewMode) =>
    mode === "day" && (Boolean(searchQuery.trim()) || statusFilter !== "ALL");
  const isWeeklyTimelineVisible = viewMode === "week" && !isLoading && !isError;
  const hasStatusTabs = !isLoading && !isError && Boolean(schedules?.length);

  const renderScheduleContent = (mode: ScheduleViewMode) => {
    const isWeekMode = mode === "week";
    const hasFilters = hasActiveFilters(mode);

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
      if (isWeekMode) {
        return (
          <WeeklyScheduleTimeline
            onCreateSchedule={handleCreateSchedule}
            onViewSchedule={handleViewSchedule}
            schedules={[]}
            selectedDate={selectedDate}
          />
        );
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-6 flex size-20 items-center justify-center rounded-xl bg-primary-container">
            <HugeiconsIcon icon={CalendarDaysHugeIcon} strokeWidth={2} aria-hidden="true" className="size-10 text-primary" />
          </div>
          <h2 className="mb-2 font-headline text-xl font-normal tracking-[-0.01em] text-foreground">
            {hasFilters ? t("schedules:noResults") : t("schedules:noSchedules")}
          </h2>
          {!hasFilters ? (
            <>
              <p className="mb-6 max-w-xs font-body text-muted-foreground">
                {t("schedules:noSchedulesDescription")}
              </p>
              <Button
                leftIcon={PlusHugeIcon}
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
      if (isWeekMode) {
        return (
          <WeeklyScheduleTimeline
            onCreateSchedule={handleCreateSchedule}
            onViewSchedule={handleViewSchedule}
            schedules={[]}
            selectedDate={selectedDate}
          />
        );
      }

      return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground">{t("schedules:noResults")}</p>
        </div>
      );
    }

    if (isWeekMode) {
      return (
        <WeeklyScheduleTimeline
          onCreateSchedule={handleCreateSchedule}
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
			key={schedule.getId()}
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

  const renderDayScheduleResults = () => (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-4 sm:pb-0 lg:px-6">
      {renderScheduleContent("day")}
    </div>
  );

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
              <TabsPanels
                className="flex min-h-0 flex-1 flex-col"
                mode="layout"
              >
                <TabsPanel className="flex min-h-0 flex-1 flex-col" value="day">
                  <div className="mb-2 w-full shrink-0">{day}</div>

                  <div className="mb-2 shrink-0 px-3 sm:px-4 lg:px-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <Input
                          ref={scheduleSearchRef}
                          value={searchQuery}
                          onChange={(event) =>
                            setSearchQuery(event.target.value)
                          }
                          placeholder={t("schedules:searchPlaceholder")}
                          leftIcon={SearchHugeIcon}
                        />
                      </div>
                      <Button
                        className="hidden sm:inline-flex"
                        leftIcon={PlusHugeIcon}
                        onClick={(event) =>
                          handleAddSchedule(event.currentTarget)
                        }
                        ref={triggerRef}
                      >
                        {t("schedules:addSchedule")}
                      </Button>
                    </div>
                  </div>

                  {hasStatusTabs ? (
                    <Tabs
                      className="flex min-h-0 flex-1 flex-col gap-0"
                      onValueChange={setStatusFilter}
                      value={statusFilter}
                    >
                      <div className="mb-2 shrink-0 overflow-x-auto px-3 sm:px-4 lg:px-6">
                        <TabsList
                          activateOnFocus={false}
                          aria-label={t("schedules:drawer.status.label")}
                          variant="subtle"
                        >
                          {SCHEDULE_STATUS_FILTERS.map((status) => (
                            <TabsTab key={status} value={status}>
                              {status === "ALL"
                                ? t("schedules:filter.all")
                                : t(`schedules:status.${status}`)}
                            </TabsTab>
                          ))}
                        </TabsList>
                      </div>

                      <TabsPanels
                        className="flex min-h-0 flex-1 flex-col"
                        mode="layout"
                      >
                        {SCHEDULE_STATUS_FILTERS.map((status) => (
                          <TabsPanel
                            className="flex min-h-0 flex-1 flex-col"
                            keepMounted
                            key={status}
                            value={status}
                          >
                            {status === statusFilter
                              ? renderDayScheduleResults()
                              : null}
                          </TabsPanel>
                        ))}
                      </TabsPanels>
                    </Tabs>
                  ) : (
                    renderDayScheduleResults()
                  )}
                </TabsPanel>

                <TabsPanel
                  className="flex min-h-0 flex-1 flex-col"
                  value="week"
                >
                  <div className="mb-2 w-full shrink-0">{week}</div>

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
        initialTime={initialCreateTime}
        selectedDate={selectedDate}
      />
      <NoShowScheduleDialog
        finalFocus={scheduleSearchRef}
        onOpenChange={(open) => {
          if (!open) setNoShowSchedule(null);
        }}
        open={noShowSchedule !== null}
        schedule={noShowSchedule}
      />
    </div>
  );
}
