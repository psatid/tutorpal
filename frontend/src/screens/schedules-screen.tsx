import { CalendarDays, Plus, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
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
import { WeekDateSelector } from "@/components/schedules/week-date-selector";
import { WeeklyScheduleTimeline } from "@/components/schedules/weekly-schedule-timeline";
import { type ScheduleViewMode } from "@/components/schedules/schedule-view-switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { WorkspaceErrorState } from "@/components/workspaces/workspace-state";
import { DateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";

export function SchedulesScreen() {
  const { t } = useTranslation(["schedules"]);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);
  const activeTriggerRef = useRef<HTMLButtonElement>(null);
  const emptyActionRef = useRef<HTMLButtonElement>(null);
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
    activeTriggerRef.current = trigger ?? fabRef.current ?? triggerRef.current;
    setSelectedScheduleId(null);
    setDrawerMode("create");
    setIsDrawerOpen(true);
  };

  const focusTrigger = () => {
    const trigger = [
      activeTriggerRef.current,
      fabRef.current,
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

  const handleDrawerOpenChange = (open: boolean) => {
    setIsDrawerOpen(open);
    if (!open) {
      setDrawerMode("create");
      setSelectedScheduleId(null);
    }
  };

  const hasActiveFilters =
    statusFilter !== "ALL" || Boolean(searchQuery.trim());

  return (
    <div
      className={
        viewMode === "week"
          ? "flex h-[calc(100dvh-3rem)] min-h-0 flex-col overflow-hidden"
          : "flex min-h-[calc(100vh-200px)] flex-col"
      }
    >
      <WeekDateSelector
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Search */}
      <div className="mb-4 shrink-0 px-3 sm:px-4 lg:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("schedules:searchPlaceholder")}
              leftIcon={Search}
            />
          </div>
          <Button
            className="hidden sm:inline-flex"
            onClick={() => handleAddSchedule(triggerRef.current)}
            ref={triggerRef}
            leftIcon={Plus}
          >
            {t("schedules:addSchedule")}
          </Button>
        </div>
      </div>

      {/* Status Filter */}
      {schedules && schedules.length > 0 && (
        <div className="mb-4 shrink-0 px-3 sm:px-4 lg:px-6">
          <div className="flex gap-2 overflow-x-auto">
            {(
              ["ALL", "SCHEDULED", "COMPLETED", "NO_SHOW", "CANCELLED"] as const
            ).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                aria-pressed={statusFilter === status}
                className="group inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full px-1 text-sm font-medium whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
      )}

      {/* Content */}
      <div
        className={cn(
          "px-3 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-4 sm:pb-0 lg:px-6",
          viewMode === "week"
            ? "flex min-h-0 flex-1 flex-col"
            : "",
        )}
      >
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <div className="animate-pulse w-16 h-16 rounded-full bg-muted" />
            <div className="animate-pulse h-4 w-40 bg-muted rounded" />
            <p className="text-sm text-muted-foreground">
              {t("schedules:loading")}
            </p>
          </div>
        ) : isError ? (
          <WorkspaceErrorState
            description={t("schedules:error.description")}
            onRetry={() => refetch()}
            retryLabel={t("schedules:error.retry")}
            title={t("schedules:error.title")}
          />
        ) : !schedules || schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-xl bg-primary-container">
              <CalendarDays className="size-10 text-primary" />
            </div>
            <h2 className="mb-2 font-headline text-xl font-normal tracking-[-0.01em] text-foreground">
              {hasActiveFilters
                ? viewMode === "week"
                  ? t("schedules:weekNoResults")
                  : t("schedules:noResults")
                : viewMode === "week"
                  ? t("schedules:weekNoSchedules")
                  : t("schedules:noSchedules")}
            </h2>
            {!hasActiveFilters ? (
              <>
                <p className="font-body text-muted-foreground max-w-xs mb-6">
                  {viewMode === "week"
                    ? t("schedules:weekNoSchedulesDescription")
                    : t("schedules:noSchedulesDescription")}
                </p>
                <Button
                  onClick={() => handleAddSchedule(emptyActionRef.current)}
                  ref={emptyActionRef}
                  leftIcon={Plus}
                >
                  {t("schedules:addSchedule")}
                </Button>
              </>
            ) : null}
          </div>
        ) : filteredSchedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-muted-foreground">
              {viewMode === "week"
                ? t("schedules:weekNoResults")
                : t("schedules:noResults")}
            </p>
          </div>
        ) : viewMode === "week" ? (
          <WeeklyScheduleTimeline
            onViewSchedule={handleViewSchedule}
            schedules={filteredSchedules}
            selectedDate={selectedDate}
          />
        ) : (
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
        )}
      </div>

      <WorkspaceFab
        label={t("schedules:addSchedule")}
        onClick={() => handleAddSchedule(fabRef.current)}
        triggerRef={fabRef}
      />

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
