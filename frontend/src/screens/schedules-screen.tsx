import { useState } from "react";
import { Calendar, Clock, Loader2, Plus, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSchedules } from "@/hooks/queries/use-schedules";
import { ScheduleDrawer, DrawerMode } from "@/components/schedules/schedule-drawer";
import type { GetV1Schedules200Item } from "@/api/generated/models";

// Helper function to format minutes since midnight to time string
function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMins = mins.toString().padStart(2, "0");
  return `${displayHours}:${displayMins} ${ampm}`;
}

// Helper function to format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

// Group schedules by date
function groupByDate(schedules: GetV1Schedules200Item[]): Map<string, GetV1Schedules200Item[]> {
  const grouped = new Map<string, GetV1Schedules200Item[]>();
  
  for (const schedule of schedules) {
    const existing = grouped.get(schedule.date) || [];
    existing.push(schedule);
    grouped.set(schedule.date, existing);
  }
  
  return grouped;
}

// Get border color based on schedule status
function getStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "border-tertiary opacity-60";
    case "CANCELLED":
      return "border-outline-variant opacity-50";
    case "SCHEDULED":
    default:
      return "border-primary";
  }
}

export function SchedulesScreen() {
  const { t } = useTranslation(["schedules"]);
  const { data: schedules, isLoading, isError } = useSchedules();
  
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("create");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);

  const handleOpenCreate = () => {
    setDrawerMode("create");
    setSelectedScheduleId(null);
    setIsDrawerOpen(true);
  };

  const handleOpenView = (scheduleId: string) => {
    setDrawerMode("view");
    setSelectedScheduleId(scheduleId);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (scheduleId: string) => {
    setDrawerMode("edit");
    setSelectedScheduleId(scheduleId);
    setIsDrawerOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="mt-4 font-body text-on-surface-variant">
          {t("schedules:loading")}
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-20 h-20 rounded-2xl bg-error-container flex items-center justify-center mb-6">
          <Calendar className="w-10 h-10 text-error" />
        </div>
        <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-tight mb-2">
          {t("schedules:errorTitle")}
        </h2>
        <p className="font-body text-on-surface-variant text-lg text-center max-w-xs">
          {t("schedules:errorDescription")}
        </p>
      </div>
    );
  }

  const hasSchedules = schedules && schedules.length > 0;

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      <div className="w-20 h-20 rounded-2xl bg-primary-container flex items-center justify-center mb-6">
        <Calendar className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-headline font-extrabold text-4xl text-on-surface tracking-tight leading-tight mb-2">
        {t("schedules:title")}
      </h2>
      <p className="font-body text-on-surface-variant text-lg text-center max-w-xs">
        {t("schedules:description")}
      </p>

      {/* Add Schedule Button */}
      <button
        onClick={handleOpenCreate}
        className="mt-6 flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-full font-label font-semibold text-sm hover:bg-primary/90 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Schedule
      </button>

      {hasSchedules ? (
        <div className="mt-12 w-full max-w-sm">
          {Array.from(groupByDate(schedules!).entries()).map(([date, dateSchedules]) => (
            <div key={date} className="mb-8">
              <h3 className="font-label text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-4">
                {t("schedules:dateLabel", { date: formatDate(date) })}
              </h3>

              <div className="space-y-3">
                {dateSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    onClick={() => handleOpenView(schedule.id)}
                    className={`bg-surface-container-lowest p-4 rounded-xl border-l-4 ${getStatusColor(schedule.status)} cursor-pointer hover:bg-surface-container-low transition-colors`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-headline font-bold text-on-surface">
                          {schedule.className}
                        </h4>
                        {schedule.notes && (
                          <p className="font-body text-sm text-primary mt-1">
                            {schedule.notes}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            schedule.status === "SCHEDULED"
                              ? "bg-primary-container text-on-primary-container"
                              : schedule.status === "COMPLETED"
                                ? "bg-surface-container-high text-on-surface-variant"
                                : "bg-outline-variant text-on-surface-variant line-through"
                          }`}
                        >
                          {formatTime(schedule.time)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEdit(schedule.id);
                          }}
                          className="p-1 hover:bg-surface-container-high rounded-md transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-on-surface-variant" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {t("schedules:duration", { minutes: schedule.durationMinutes })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="font-body text-on-surface-variant">
            {t("schedules:empty")}
          </p>
        </div>
      )}

      {/* Schedule Drawer */}
      <ScheduleDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        mode={drawerMode}
        scheduleId={selectedScheduleId}
        onModeChange={setDrawerMode}
      />
    </div>
  );
}
