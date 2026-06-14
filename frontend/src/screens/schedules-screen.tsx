import { useMemo, useState } from "react";
import { Plus, Search, CalendarDays } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSchedules } from "@/hooks/queries/use-schedules";
import { useDebounce } from "@/hooks/use-debounce";
import {
  useDeleteSchedule,
  useCompleteSchedule,
  useRestoreHours,
} from "@/hooks/mutations/use-schedules";
import { ScheduleCard } from "@/components/schedules/schedule-card";
import {
  ScheduleDrawer,
  type DrawerMode,
} from "@/components/schedules/schedule-drawer";
import { WeekDateSelector } from "@/components/schedules/week-date-selector";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";

export function SchedulesScreen() {
  const { t } = useTranslation(["schedules"]);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const formattedDate = format(selectedDate, "yyyy-MM-dd");
  const { data: schedules, isLoading } = useSchedules({
    date: formattedDate,
    search: debouncedSearchQuery || undefined,
  });

  const deleteMutation = useDeleteSchedule();
  const completeMutation = useCompleteSchedule();
  const restoreMutation = useRestoreHours();

  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];
    if (statusFilter === "ALL") return schedules;
    return schedules.filter((s) => s.status === statusFilter);
  }, [schedules, statusFilter]);

  const handleAddSchedule = () => {
    setSelectedScheduleId(null);
    setDrawerMode("create");
    setIsDrawerOpen(true);
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

  return (
    <div className="flex flex-col min-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight leading-tight">
            {t("schedules:title")}
          </h2>
          <Button
            size="icon"
            onClick={handleAddSchedule}
            aria-label={t("schedules:addSchedule")}
          >
            <Plus className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Week Date Selector */}
      <WeekDateSelector
        selectedDate={selectedDate}
        onDateSelect={setSelectedDate}
      />

      {/* Search */}
      <div className="mb-4">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("schedules:searchPlaceholder")}
          leftIcon={Search}
        />
      </div>

      {/* Status Filter */}
      {schedules && schedules.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {(["ALL", "SCHEDULED", "COMPLETED", "CANCELLED"] as const).map(
            (status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  statusFilter === status
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-low",
                )}
              >
                {status === "ALL"
                  ? t("schedules:filter.all")
                  : t(`schedules:status.${status}`)}
              </button>
            ),
          )}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="animate-pulse w-16 h-16 rounded-full bg-surface-variant" />
          <div className="animate-pulse h-4 w-40 bg-surface-variant rounded" />
          <p className="text-sm text-on-surface-variant">
            {t("schedules:loading")}
          </p>
        </div>
      ) : !schedules || schedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
            <CalendarDays className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-headline font-bold text-xl text-on-surface mb-2">
            {t("schedules:noSchedules")}
          </h3>
          <p className="font-body text-on-surface-variant max-w-xs mb-6">
            {t("schedules:noSchedulesDescription")}
          </p>
          <Button onClick={handleAddSchedule} leftIcon={Plus}>
            {t("schedules:addSchedule")}
          </Button>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-on-surface-variant">
            {t("schedules:noResults")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onView={() => handleViewSchedule(schedule)}
              onDelete={() => handleDeleteSchedule(schedule)}
              onComplete={() => handleCompleteSchedule(schedule)}
              onRestore={() => handleRestoreHours(schedule)}
            />
          ))}
        </div>
      )}

      {/* Schedule Drawer */}
      <ScheduleDrawer
        isOpen={isDrawerOpen}
        onOpenChange={handleDrawerOpenChange}
        mode={drawerMode}
        scheduleId={selectedScheduleId}
        onModeChange={handleModeChange}
        selectedDate={selectedDate}
      />
    </div>
  );
}
