import { useState, useMemo } from "react";
import { Plus, Search, CalendarDays, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSchedules } from "@/hooks/queries/use-schedules";
import { useDeleteSchedule } from "@/hooks/mutations/use-schedules";
import { ScheduleCard } from "@/components/schedules/schedule-card";
import {
  ScheduleDrawer,
  type DrawerMode,
} from "@/components/schedules/schedule-drawer";
import { WeekDateSelector } from "@/components/schedules/week-date-selector";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";

export function SchedulesScreen() {
  const { t } = useTranslation(["schedules"]);
  const { data: schedules, isLoading } = useSchedules();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null
  );

  const deleteMutation = useDeleteSchedule();

  const filteredSchedules = useMemo(() => {
    if (!schedules) return [];
    if (!searchQuery.trim()) return schedules;

    const query = searchQuery.toLowerCase();
    return schedules.filter(
      (schedule) =>
        schedule.className.toLowerCase().includes(query) ||
        schedule.date.includes(query) ||
        schedule.status.toLowerCase().includes(query) ||
        (schedule.notes && schedule.notes.toLowerCase().includes(query))
    );
  }, [schedules, searchQuery]);

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
          <div>
            <h2 className="font-headline font-extrabold text-3xl text-on-surface tracking-tight leading-tight">
              {t("schedules:title")}
            </h2>
            {schedules && schedules.length > 0 && (
              <p className="font-body text-on-surface-variant mt-1">
                {t("schedules:managingCount", { count: schedules.length })}
              </p>
            )}
          </div>
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
      {schedules && schedules.length > 0 && (
        <div className="mb-4">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("schedules:searchPlaceholder")}
            leftIcon={Search}
          />
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
          <Calendar className="w-12 h-12 text-surface-variant mb-3" />
          <p className="text-on-surface-variant">{t("schedules:noResults")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSchedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onView={() => handleViewSchedule(schedule)}
              onDelete={() => handleDeleteSchedule(schedule)}
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
      />
    </div>
  );
}
