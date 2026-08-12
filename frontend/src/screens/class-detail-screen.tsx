import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isAxiosError } from "axios";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";
import { DateTime } from "@/lib/date-time";

interface ClassDetailScreenProps {
  classId: string;
  openHourAdditionsOnMount?: boolean;
}

function isClassNotFoundError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;

  const payload = error.response?.data as { errorCode?: string } | undefined;
  return (
    payload?.errorCode === "CLASS_NOT_FOUND" || error.response?.status === 404
  );
}

export function ClassDetailScreen({
  classId,
  openHourAdditionsOnMount = false,
}: ClassDetailScreenProps) {
  const { t } = useTranslation(["classes", "schedules", "common"]);
  const navigate = useNavigate();

  const {
    data: classData,
    error: classError,
    isError: isClassError,
    isLoading: isLoadingClass,
    refetch: refetchClass,
  } = useClassDetails(classId);
  const {
    data: schedules,
    isError: isSchedulesError,
    isLoading: isLoadingSchedules,
    refetch: refetchSchedules,
  } = useClassSchedules(classId);

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
  const [scheduleReferenceTime, setScheduleReferenceTime] = useState(DateTime.now);
  const isClassNotFound = isClassNotFoundError(classError);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setScheduleReferenceTime(DateTime.now());
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

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

  if (isLoadingClass && !classData) {
    return (
      <div className="flex h-full flex-col gap-6 py-4">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="h-7 w-2/5 rounded" />
            <Skeleton className="w-9 h-9 rounded-full" />
          </div>
          <div className="mt-5 grid gap-5 border-t border-border pt-5 lg:grid-cols-[minmax(0,1fr)_minmax(15rem,0.65fr)]">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
            <div className="space-y-3 rounded-lg bg-overlay-navy p-4">
              <Skeleton className="h-3 w-16 bg-white/20" />
              <Skeleton className="h-7 w-36 bg-white/20" />
              <Skeleton className="h-3 w-24 bg-white/20" />
              <Skeleton className="h-11 w-28 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
          <div className="mt-4 divide-y divide-border border-y border-border">
            <Skeleton className="h-18 w-full rounded-none" />
            <Skeleton className="h-18 w-full rounded-none" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.55fr)]">
          <div className="space-y-6">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>
          <Skeleton className="h-44 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isClassNotFound || (!classData && !isClassError)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center py-8">
        <p className="text-on-surface-variant">{t("classDetail.notFound")}</p>
        <Button
          className="mt-4"
          onClick={handleBack}
          type="button"
          variant="ghost"
        >
          {t("classDetail.backToClasses")}
        </Button>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="flex h-full items-center justify-center py-8">
        <div className="w-full max-w-md rounded-xl border border-destructive/30 bg-card p-5" role="alert">
          <h1 className="text-lg font-medium text-on-surface">
            {t("classDetail.loadError.title")}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {t("classDetail.loadError.description")}
          </p>
          <Button
            className="mt-4"
            onClick={() => {
              void refetchClass();
            }}
            type="button"
            variant="outline"
          >
            {t("common:retry")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-6 py-4">
      <ClassInfoHeader
        classData={classData}
        onAddHours={handleAddHours}
        onBack={handleBack}
        onEdit={handleEditClass}
      />

      {isClassError ? (
        <div
          className="flex flex-col gap-3 rounded-lg border border-warning/30 bg-warning-container px-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <p className="text-sm text-warning-container-foreground">
            {t("classDetail.refreshError")}
          </p>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              void refetchClass();
            }}
            type="button"
            variant="outline"
          >
            {t("common:retry")}
          </Button>
        </div>
      ) : null}

      <ScheduleLog
        section="upcoming"
        schedules={schedules ?? []}
        hasData={schedules !== undefined}
        isError={isSchedulesError}
        isLoading={isLoadingSchedules}
        errorOwner
        onRetry={() => {
          void refetchSchedules();
        }}
        referenceTime={scheduleReferenceTime}
        onViewSchedule={handleViewSchedule}
        onAddSchedule={handleAddSchedule}
        onCompleteSchedule={handleCompleteSchedule}
        onNoShowSchedule={handleNoShowSchedule}
        onRestoreSchedule={handleRestoreHours}
        onDeleteSchedule={handleDeleteSchedule}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,0.55fr)] lg:items-start">
        <div className="space-y-6">
          <RecurringScheduleSection
            hasNoAvailableHours={classData.hasNoAvailableHours()}
            onAddHours={handleAddHours}
            recurringSchedule={classData.getRecurringSchedule()}
            onEdit={handleOpenRecurringDrawer}
            onCreate={handleOpenRecurringDrawer}
          />

          <ScheduleLog
            section="recent"
            schedules={schedules ?? []}
            hasData={schedules !== undefined}
            isError={isSchedulesError}
            isLoading={isLoadingSchedules}
            errorOwner={false}
            onRetry={() => {
              void refetchSchedules();
            }}
            referenceTime={scheduleReferenceTime}
            onViewSchedule={handleViewSchedule}
            onAddSchedule={handleAddSchedule}
            onCompleteSchedule={handleCompleteSchedule}
            onNoShowSchedule={handleNoShowSchedule}
            onRestoreSchedule={handleRestoreHours}
            onDeleteSchedule={handleDeleteSchedule}
          />
        </div>

        <aside>
          <ClassHourAdditionsSection classId={classId} />
        </aside>
      </div>

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
