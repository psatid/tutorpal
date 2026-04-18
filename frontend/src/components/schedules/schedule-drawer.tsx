import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  RHFInputField,
  RHFSelectField,
  RHFTimeField,
  RHFDateField,
} from "@/components/ui/form/rhf";
import { FormDrawer, type DrawerMode } from "@/components/ui/form-drawer";
import {
  useCreateSchedule,
  useUpdateSchedule,
} from "@/hooks/mutations/use-schedules";
import { useGetSchedule } from "@/hooks/queries/use-get-schedule";
import { useClasses } from "@/hooks/queries/use-classes";
import {
  scheduleSchema,
  type ScheduleFormData,
  minutesToTimeString,
  timeStringToMinutes,
} from "@/types/schedule";

export type { DrawerMode } from "@/components/ui/form-drawer";

interface ScheduleDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  scheduleId: string | null;
  onModeChange: (mode: DrawerMode) => void;
}

const statusOptions = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function ScheduleDrawer({
  isOpen,
  onOpenChange,
  mode,
  scheduleId,
  onModeChange,
}: ScheduleDrawerProps) {
  const { t } = useTranslation(["schedules"]);
  const { handleSubmit, reset, control, setValue } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      classId: "",
      date: "",
      time: "09:00",
      durationMinutes: 60,
      notes: "",
      status: "SCHEDULED",
    },
  });

  const { data: classes } = useClasses();
  const { data: scheduleData } = useGetSchedule(
    mode !== "create" ? scheduleId : null
  );

  const classOptions =
    classes?.map((cls) => ({
      value: cls.id,
      label: cls.name,
    })) || [];

  useEffect(() => {
    if (scheduleData && (mode === "view" || mode === "edit")) {
      setValue("classId", scheduleData.classId);
      setValue("date", scheduleData.date);
      setValue("time", minutesToTimeString(scheduleData.time));
      setValue("durationMinutes", scheduleData.durationMinutes);
      setValue("notes", scheduleData.notes || "");
      setValue("status", scheduleData.status);
    }
  }, [scheduleData, mode, setValue]);

  useEffect(() => {
    if (!isOpen) {
      reset({
        classId: "",
        date: "",
        time: "09:00",
        durationMinutes: 60,
        notes: "",
        status: "SCHEDULED",
      });
    }
  }, [isOpen, reset]);

  const createMutation = useCreateSchedule({
    onSuccess: () => {
      reset();
      onOpenChange(false);
    },
  });

  const updateMutation = useUpdateSchedule({
    onSuccess: () => {
      onOpenChange(false);
      onModeChange("view");
    },
  });

  const onSubmit = (data: ScheduleFormData) => {
    const timeInMinutes = timeStringToMinutes(data.time);

    if (mode === "create") {
      createMutation.mutate({
        classId: data.classId,
        date: data.date,
        time: timeInMinutes,
        durationMinutes: data.durationMinutes,
        notes: data.notes,
        status: data.status,
      });
    } else if (mode === "edit" && scheduleId) {
      updateMutation.mutate({
        id: scheduleId,
        data: {
          classId: data.classId,
          date: data.date,
          time: timeInMinutes,
          durationMinutes: data.durationMinutes,
          notes: data.notes,
          status: data.status,
        },
      });
    }
  };

  const isDisabled = mode === "view";

  const getTitle = () => {
    switch (mode) {
      case "create":
        return t("schedules:drawer.createTitle");
      case "view":
        return t("schedules:drawer.viewTitle");
      case "edit":
        return t("schedules:drawer.editTitle");
      default:
        return "";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "create":
        return t("schedules:addSchedule");
      case "edit":
        return t("schedules:drawer.updateButton");
      default:
        return "";
    }
  };

  return (
    <FormDrawer
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      mode={mode}
      onModeChange={onModeChange}
      title={getTitle()}
      editButtonText={t("schedules:drawer.editButton")}
      submitButtonText={getSubmitButtonText()}
      submitButtonIcon={mode === "create" ? Plus : Save}
      isLoading={createMutation.isPending || updateMutation.isPending}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={reset}
    >
      <RHFSelectField
        control={control}
        name="classId"
        label={t("schedules:drawer.class.label")}
        caption={
          mode === "create" ? t("schedules:drawer.class.caption") : undefined
        }
        options={classOptions}
        disabled={isDisabled}
        selectProps={{
          placeholder: t("schedules:drawer.class.placeholder"),
        }}
      />

      <RHFDateField
        control={control}
        name="date"
        label={t("schedules:drawer.date.label")}
        caption={
          mode === "create" ? t("schedules:drawer.date.caption") : undefined
        }
        disabled={isDisabled}
      />

      <RHFTimeField
        control={control}
        name="time"
        label={t("schedules:drawer.time.label")}
        caption={
          mode === "create" ? t("schedules:drawer.time.caption") : undefined
        }
        disabled={isDisabled}
      />

      <RHFInputField
        control={control}
        name="durationMinutes"
        label={t("schedules:drawer.duration.label")}
        caption={
          mode === "create"
            ? t("schedules:drawer.duration.caption")
            : undefined
        }
        disabled={isDisabled}
        inputProps={{
          type: "number",
          min: 1,
          placeholder: t("schedules:drawer.duration.placeholder"),
        }}
      />

      <RHFInputField
        control={control}
        name="notes"
        label={t("schedules:drawer.notes.label")}
        caption={t("schedules:drawer.notes.caption")}
        disabled={isDisabled}
        inputProps={{
          type: "text",
          placeholder: t("schedules:drawer.notes.placeholder"),
        }}
      />

      <RHFSelectField
        control={control}
        name="status"
        label={t("schedules:drawer.status.label")}
        caption={
          mode === "create" ? t("schedules:drawer.status.caption") : undefined
        }
        options={statusOptions}
        disabled={isDisabled}
        selectProps={{
          placeholder: t("schedules:drawer.status.placeholder"),
        }}
      />
    </FormDrawer>
  );
}
