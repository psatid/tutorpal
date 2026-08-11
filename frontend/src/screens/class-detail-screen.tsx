import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useClassDetails } from "@/hooks/queries/use-class-details";
import { useClassSchedules } from "@/hooks/queries/use-class-schedules";
import {
  useDeleteSchedule,
  useCompleteSchedule,
  useRestoreHours,
  useUpdateSchedule,
} from "@/hooks/mutations/use-schedules";
import { ClassInfoHeader } from "@/components/classes/class-info-header";
import { ClassHourAdditionsDrawer } from "@/components/classes/class-hour-additions-drawer";
import { ClassHourAdditionsSection } from "@/components/classes/class-hour-additions-section";
import { RecurringScheduleDrawer } from "@/components/classes/recurring-schedule-drawer";
import { RecurringScheduleSection } from "@/components/classes/recurring-schedule-section";
import { ScheduleLog } from "@/components/classes/schedule-log";
import {
  ClassDrawer,
  type DrawerMode,
} from "@/components/classes/class-drawer";
import {
  ScheduleDrawer,
  type DrawerMode as ScheduleDrawerMode,
} from "@/components/schedules/schedule-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";

interface ClassDetailScreenProps {
  classId: string;
  openHourAdditionsOnMount?: boolean;
}

export function ClassDetailScreen({
  classId,
  openHourAdditionsOnMount = false,
}: ClassDetailScreenProps) {
  const { t } = useTranslation(["classes", "schedules"]);
  const navigate = useNavigate();

  const { data: classData, isLoading: isLoadingClass } = useClassDetails(classId);
  const { data: schedules, isLoading: isLoadingSchedules } =
    useClassSchedules(classId);

  const deleteScheduleMutation = useDeleteSchedule();
  const completeMutation = useCompleteSchedule();
  const updateMutation = useUpdateSchedule();
  const restoreMutation = useRestoreHours();

  const [isClassDrawerOpen, setIsClassDrawerOpen] = useState(false);
  const [classDrawerMode, setClassDrawerMode] = useState<DrawerMode>("edit");
  const classEditOriginRef = useRef<HTMLButtonElement | null>(null);
  const classHoursOriginRef = useRef<HTMLButtonElement | null>(null);
  const addHoursIntentHandledRef = useRef(false);
  const [isClassHoursDrawerOpen, setIsClassHoursDrawerOpen] = useState(false);

  const [isScheduleDrawerOpen, setIsScheduleDrawerOpen] = useState(false);
  const [scheduleDrawerMode, setScheduleDrawerMode] =
    useState<ScheduleDrawerMode>("view");
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(
    null,
  );
  const [isRecurringDrawerOpen, setIsRecurringDrawerOpen] = useState(false);

  const handleBack = useCallback(() => {
    navigate({ to: "/classes" });
  }, [navigate]);

  const handleEditClass = useCallback(() => {
    const activeElement = document.activeElement;
    classEditOriginRef.current =
      activeElement instanceof HTMLButtonElement ? activeElement : null;
    setClassDrawerMode("edit");
    setIsClassDrawerOpen(true);
  }, []);

  const focusClassEditOrigin = useCallback(() => {
    classEditOriginRef.current?.focus();
  }, []);

  const handleAddHours = useCallback(() => {
    const activeElement = document.activeElement;
    classHoursOriginRef.current =
      activeElement instanceof HTMLButtonElement ? activeElement : null;
    setIsClassHoursDrawerOpen(true);
  }, []);

  const focusClassHoursOrigin = useCallback(() => {
    classHoursOriginRef.current?.focus();
  }, []);

  useEffect(() => {
    if (
      !openHourAdditionsOnMount ||
      isLoadingClass ||
      addHoursIntentHandledRef.current
    ) {
      return;
    }

    addHoursIntentHandledRef.current = true;
    if (classData) {
      setIsClassHoursDrawerOpen(true);
    }
    void navigate({
      to: "/classes/$classId",
      params: { classId },
      search: {},
      replace: true,
    });
  }, [classData, classId, isLoadingClass, navigate, openHourAdditionsOnMount]);

  useEffect(() => {
    if (!openHourAdditionsOnMount) {
      addHoursIntentHandledRef.current = false;
    }
  }, [openHourAdditionsOnMount]);

  const handleViewSchedule = useCallback((schedule: GetV1Schedules200Item) => {
    setSelectedScheduleId(schedule.id);
    setScheduleDrawerMode("view");
    setIsScheduleDrawerOpen(true);
  }, []);

  const handleAddSchedule = useCallback(() => {
    setSelectedScheduleId(null);
    setScheduleDrawerMode("create");
    setIsScheduleDrawerOpen(true);
  }, []);

  const handleOpenRecurringDrawer = useCallback(() => {
    setIsRecurringDrawerOpen(true);
  }, []);

  const handleAddHoursFromRecurring = useCallback(() => {
    setIsRecurringDrawerOpen(false);
    handleAddHours();
  }, [handleAddHours]);

  const handleDeleteSchedule = useCallback(
    (schedule: GetV1Schedules200Item) => {
      toast(t("schedules:delete.confirm", { ns: "schedules" }), {
        action: {
          label: t("schedules:delete.confirmButton", { ns: "schedules" }),
          onClick: () => deleteScheduleMutation.mutate(schedule.id),
        },
        cancel: {
          label: t("schedules:delete.cancelButton", { ns: "schedules" }),
          onClick: () => {},
        },
      });
    },
    [deleteScheduleMutation, t],
  );

  const handleCompleteSchedule = useCallback(
    (schedule: GetV1Schedules200Item) => {
      const hoursToDeduct = (schedule.durationMinutes / 60).toFixed(1);
      toast(
        t("schedules:complete.confirm", {
          hours: hoursToDeduct,
          ns: "schedules",
        }),
        {
          action: {
            label: t("schedules:complete.confirmButton", { ns: "schedules" }),
            onClick: () => completeMutation.mutate(schedule.id),
          },
          cancel: {
            label: t("schedules:complete.cancelButton", { ns: "schedules" }),
            onClick: () => {},
          },
        },
      );
    },
    [completeMutation, t],
  );

  const handleRestoreHours = useCallback(
    (schedule: GetV1Schedules200Item) => {
      const hoursToRestore = (schedule.durationMinutes / 60).toFixed(1);
      toast(
        t("schedules:restore.confirm", {
          hours: hoursToRestore,
          ns: "schedules",
        }),
        {
          action: {
            label: t("schedules:restore.confirmButton", { ns: "schedules" }),
            onClick: () => restoreMutation.mutate(schedule.id),
          },
          cancel: {
            label: t("schedules:restore.cancelButton", { ns: "schedules" }),
            onClick: () => {},
          },
        },
      );
    },
    [restoreMutation, t],
  );

  const handleNoShowSchedule = useCallback(
    (schedule: GetV1Schedules200Item) => {
      const reservedHours = (schedule.durationMinutes / 60).toFixed(1);
      toast(
        t("schedules:noShow.confirm", {
          hours: reservedHours,
          ns: "schedules",
        }),
        {
          action: {
            label: t("schedules:noShow.confirmButton", { ns: "schedules" }),
            onClick: () =>
              updateMutation.mutate({
                id: schedule.id,
                data: { status: "NO_SHOW" },
              }),
          },
          cancel: {
            label: t("schedules:noShow.cancelButton", { ns: "schedules" }),
            onClick: () => {},
          },
        },
      );
    },
    [t, updateMutation],
  );

  const handleScheduleDrawerOpenChange = useCallback((open: boolean) => {
    setIsScheduleDrawerOpen(open);
    if (!open) {
      setSelectedScheduleId(null);
    }
  }, []);

  const handleClassDrawerOpenChange = useCallback((open: boolean) => {
    setIsClassDrawerOpen(open);
  }, []);

  if (isLoadingClass) {
    return (
      <div className="flex flex-col h-full py-4 space-y-4">
        <div className="space-y-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="flex-1 h-6 rounded" />
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-5 w-8 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, groupIdx) => (
            <div key={groupIdx} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              {Array.from({ length: 2 }).map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
                >
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <p className="text-on-surface-variant">{t("classDetail.notFound")}</p>
        <button
          type="button"
          onClick={handleBack}
          className="mt-4 text-sm text-primary font-medium hover:underline"
        >
          {t("classDetail.backToClasses")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full py-4 space-y-4">
      <ClassInfoHeader
        classData={classData}
        onAddHours={handleAddHours}
        onBack={handleBack}
        onEdit={handleEditClass}
      />

      <ClassHourAdditionsSection classId={classId} />

      <RecurringScheduleSection
        hasNoAvailableHours={classData.hasNoAvailableHours()}
        onAddHours={handleAddHours}
        recurringSchedule={classData.getRecurringSchedule()}
        onEdit={handleOpenRecurringDrawer}
        onCreate={handleOpenRecurringDrawer}
      />

      <ScheduleLog
        schedules={schedules ?? []}
        isLoading={isLoadingSchedules}
        onViewSchedule={handleViewSchedule}
        onAddSchedule={handleAddSchedule}
        onCompleteSchedule={handleCompleteSchedule}
        onNoShowSchedule={handleNoShowSchedule}
        onRestoreSchedule={handleRestoreHours}
        onDeleteSchedule={handleDeleteSchedule}
      />

      <ClassDrawer
        isOpen={isClassDrawerOpen}
        onOpenChange={handleClassDrawerOpenChange}
        onCloseAutoFocus={focusClassEditOrigin}
        mode={classDrawerMode}
        classData={classData}
        onModeChange={setClassDrawerMode}
      />

      <ClassHourAdditionsDrawer
        classData={classData}
        onCloseAutoFocus={focusClassHoursOrigin}
        onOpenChange={setIsClassHoursDrawerOpen}
        open={isClassHoursDrawerOpen}
      />

      <ScheduleDrawer
        isOpen={isScheduleDrawerOpen}
        onOpenChange={handleScheduleDrawerOpenChange}
        mode={scheduleDrawerMode}
        scheduleId={selectedScheduleId}
        onModeChange={setScheduleDrawerMode}
      />

      <RecurringScheduleDrawer
        hasNoAvailableHours={classData.hasNoAvailableHours()}
        isOpen={isRecurringDrawerOpen}
        onAddHours={handleAddHoursFromRecurring}
        onOpenChange={setIsRecurringDrawerOpen}
        classId={classId}
        recurringSchedule={classData.getRecurringSchedule()}
        schedules={schedules ?? []}
      />
    </div>
  );
}
