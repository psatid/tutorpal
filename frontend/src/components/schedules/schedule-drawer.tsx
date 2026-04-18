import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Pencil, Save, Eye, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  RHFInputField,
  RHFSelectField,
  RHFTimeField,
  RHFDateField,
} from "@/components/ui/form/rhf";
import {
  Drawer,
  DrawerPortal,
  DrawerBackdrop,
  DrawerViewport,
  DrawerPopup,
  DrawerContent,
  DrawerClose,
} from "@/components/ui/drawer";
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

export type DrawerMode = "create" | "view" | "edit";

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
  const { data: scheduleData, isLoading: isLoadingSchedule } = useGetSchedule(
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
      // Convert minutes since midnight to HH:MM format
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
    // Convert HH:MM format to minutes since midnight for API
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

  const isDisabled = mode === "view" || isLoadingSchedule;

  const getTitle = () => {
    switch (mode) {
      case "create":
        return "Add New Schedule";
      case "view":
        return "Schedule Details";
      case "edit":
        return "Edit Schedule";
      default:
        return "";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "create":
        return "Create Schedule";
      case "edit":
        return "Update Schedule";
      default:
        return "";
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerBackdrop />
        <DrawerViewport>
          <DrawerPopup>
            <DrawerContent>
              <div className="w-12 h-1.5 bg-surface-variant rounded-full mx-auto my-4" />

              <div className="px-8 pb-10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    {mode === "create" && (
                      <Plus className="w-6 h-6 text-primary" />
                    )}
                    {mode === "view" && (
                      <Eye className="w-6 h-6 text-primary" />
                    )}
                    {mode === "edit" && (
                      <Pencil className="w-6 h-6 text-primary" />
                    )}
                    <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
                      {getTitle()}
                    </h2>
                  </div>
                  <DrawerClose>
                    <X className="w-6 h-6" />
                  </DrawerClose>
                </div>

                {isLoadingSchedule ? (
                  <div className="text-center py-8 text-on-surface-variant">
                    Loading schedule details...
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <RHFSelectField
                      control={control}
                      name="classId"
                      label="Class"
                      caption={mode === "create" ? "Required" : undefined}
                      options={classOptions}
                      disabled={isDisabled}
                      selectProps={{
                        placeholder: "Select a class",
                      }}
                    />

                    <RHFDateField
                      control={control}
                      name="date"
                      label="Date"
                      caption={mode === "create" ? "Required" : undefined}
                      disabled={isDisabled}
                    />

                    <RHFTimeField
                      control={control}
                      name="time"
                      label="Time"
                      caption={mode === "create" ? "Required" : undefined}
                      disabled={isDisabled}
                    />

                    <RHFInputField
                      control={control}
                      name="durationMinutes"
                      label="Duration (minutes)"
                      caption={mode === "create" ? "Required" : undefined}
                      disabled={isDisabled}
                      inputProps={{
                        type: "number",
                        min: 1,
                        placeholder: "e.g., 60",
                      }}
                    />

                    <RHFInputField
                      control={control}
                      name="notes"
                      label="Notes"
                      caption="Optional"
                      disabled={isDisabled}
                      inputProps={{
                        type: "text",
                        placeholder: "Add any notes...",
                      }}
                    />

                    <RHFSelectField
                      control={control}
                      name="status"
                      label="Status"
                      caption={mode === "create" ? "Required" : undefined}
                      options={statusOptions}
                      disabled={isDisabled}
                      selectProps={{
                        placeholder: "Select status",
                      }}
                    />

                    <div className="pt-4 space-y-3">
                      {mode === "view" ? (
                        <Button
                          type="button"
                          className="w-full"
                          leftIcon={Pencil}
                          onClick={(e: React.MouseEvent) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setTimeout(() => onModeChange("edit"), 0);
                          }}
                        >
                          Edit Schedule
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          className="w-full"
                          loading={
                            createMutation.isPending || updateMutation.isPending
                          }
                          leftIcon={mode === "create" ? Calendar : Save}
                        >
                          {getSubmitButtonText()}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="tertiary"
                        className="w-full"
                        onClick={() => onOpenChange(false)}
                      >
                        {mode === "view" ? "Close" : "Cancel"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </DrawerContent>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  );
}
