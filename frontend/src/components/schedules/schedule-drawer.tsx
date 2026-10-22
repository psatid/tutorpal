import { zodResolver } from "@hookform/resolvers/zod";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon as CircleAlertHugeIcon,
  Loading03Icon as Loader2HugeIcon,
} from "@hugeicons/core-free-icons";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ScheduleTypeField } from "@/components/schedules/schedule-type-field";
import { WeekdayTimeSelector } from "@/components/schedules/weekday-time-selector";
import { ClassSelectorDrawer } from "@/components/schedules/class-selector-drawer";
import { NoShowScheduleDialog } from "@/components/schedules/no-show-schedule-dialog";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { Checkbox } from "@/components/common/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/common/field";
import { FormField } from "@/components/common/form/form-field";
import { Input } from "@/components/common/input";
import {
  RHFDateField,
  RHFSelectField,
  RHFTimeField,
} from "@/components/common/form/rhf";
import {
  type DrawerMode,
  ResponsiveDrawer,
} from "@/components/common/responsive-drawer";
import {
  useCompleteSchedule,
  useCreateSchedule,
  useRestoreHours,
  useUpdateSchedule,
} from "@/hooks/mutations/use-schedules";
import { useClassDetails } from "@/hooks/queries/use-class-details";
import { useGetSchedule } from "@/hooks/queries/use-get-schedule";
import { DateTime } from "@/lib/date-time";
import {
  formatDuration,
  SCHEDULE_DURATION_OPTIONS,
  statusColors,
} from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";
import { RecurringSchedulePattern } from "@/models/recurring-schedule";
import { Schedule } from "@/models/schedule";
import { type ScheduleFormData, createScheduleSchema } from "@/types/schedule";

export type { DrawerMode } from "@/components/common/responsive-drawer";

const SCHEDULE_DRAWER_FORM_ID = "schedule-drawer-form";

interface ScheduleDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DrawerMode;
  scheduleId: string | null;
  onModeChange: (mode: DrawerMode) => void;
  onCloseAutoFocus?: () => void;
  onCreateSuccess?: () => void;
  oneTimeOnly?: boolean;
  selectedDate?: Date;
  initialTime?: number;
}

export function ScheduleDrawer({
  isOpen,
  onOpenChange,
  mode,
  scheduleId,
  onModeChange,
  onCloseAutoFocus,
  onCreateSuccess,
  oneTimeOnly = false,
  selectedDate,
  initialTime,
}: ScheduleDrawerProps) {
  const { t } = useTranslation(["schedules", "classes"]);
  const navigate = useNavigate();
  const classTriggerRef = useRef<HTMLInputElement>(null);
  const editButtonRef = useRef<HTMLButtonElement>(null);
  const noShowButtonRef = useRef<HTMLButtonElement>(null);
  const shouldFocusEditAfterNoShowRef = useRef(false);
  const [isClassDrawerOpen, setIsClassDrawerOpen] = useState(false);
  const [isNoShowDialogOpen, setIsNoShowDialogOpen] = useState(false);
  const selectedDateValue = selectedDate
    ? DateTime.from(selectedDate).toDateOnlyString()
    : "";
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    reset,
    setFocus,
    setValue,
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(createScheduleSchema(t)),
    defaultValues: Schedule.getFormDefaults(selectedDateValue, initialTime),
  });
  const classIdValue = useWatch({ control, name: "classId" });
  const recurring = useWatch({ control, name: "recurring" });
  const durationMinutes = useWatch({ control, name: "durationMinutes" });
  const isRecurring = recurring !== undefined;
  const durationOptions = [
    ...SCHEDULE_DURATION_OPTIONS,
    ...(mode !== "create" &&
    typeof durationMinutes === "number" &&
    !SCHEDULE_DURATION_OPTIONS.includes(durationMinutes)
      ? [durationMinutes]
      : []),
  ]
    .sort((a, b) => a - b)
    .map((value) => ({ value, label: formatDuration(value, t) }));
  const selectedClassQuery = useClassDetails(classIdValue || null);
  const { data: selectedClass } = selectedClassQuery;
  const { data: scheduleData } = useGetSchedule(
    mode !== "create" ? scheduleId : null,
  );

  const selectedClassName = selectedClass?.getDisplayName() || "";
  const selectedClassHasNoAvailability =
    selectedClass?.hasNoAvailableHours() ?? false;
  const selectedClassBalanceState = selectedClass?.getBalanceState();
  const selectedClassIsExhausted = selectedClassBalanceState === "exhausted";
  const selectedClassBalanceLabel =
    selectedClassBalanceState === "no-hours"
      ? t("classes:balance.noHours")
      : selectedClassBalanceState === "all-scheduled"
        ? t("classes:balance.allScheduled")
        : t("classes:balance.exhausted");
  const isSelectedClassAvailabilityUnresolved =
    Boolean(classIdValue) && !selectedClass;
  const isSelectedClassAvailabilityLoading =
    isSelectedClassAvailabilityUnresolved &&
    (selectedClassQuery.isLoading || selectedClassQuery.isFetching);
  const hasSelectedClassAvailabilityError =
    isSelectedClassAvailabilityUnresolved && selectedClassQuery.isError;
  const isCreateSubmissionBlocked =
    mode === "create" &&
    (isSelectedClassAvailabilityUnresolved || selectedClassHasNoAvailability);

  useEffect(() => {
    if (!isOpen || mode === "create") {
      reset(Schedule.getFormDefaults(selectedDateValue, initialTime));
      if (!isOpen) {
        setIsClassDrawerOpen(false);
        setIsNoShowDialogOpen(false);
      }
      return;
    }

    if (scheduleData) {
      reset(scheduleData.getFormValues());
    }
  }, [initialTime, isOpen, mode, reset, scheduleData, selectedDateValue]);

  const createMutation = useCreateSchedule({
    onSuccess: () => {
      reset(Schedule.getFormDefaults(selectedDateValue, initialTime));
      onOpenChange(false);
      onCreateSuccess?.();
    },
  });

  const updateMutation = useUpdateSchedule({
    onSuccess: () => {
      onOpenChange(false);
      onModeChange("view");
    },
  });
  const completeMutation = useCompleteSchedule();
  const restoreMutation = useRestoreHours();

  const onSubmit = (data: ScheduleFormData) => {
    if (isCreateSubmissionBlocked) {
      return;
    }

    if (mode === "create") {
      const command = Schedule.toCreateCommand(data);
      if (command) createMutation.mutate(command);
    } else if (mode === "edit" && scheduleId) {
      const command = Schedule.toUpdateCommand(data);
      if (command) updateMutation.mutate({ id: scheduleId, data: command });
    }
  };

  const focusFirstOverlappingRecurringTime = () => {
    const scheduleItems = getValues("recurring.scheduleItems") ?? [];
    const firstOverlappingIndex =
      RecurringSchedulePattern.fromFormItems(
        scheduleItems,
      ).getFirstOverlappingItemIndexByTime();

    if (firstOverlappingIndex !== undefined) {
      setFocus(`recurring.scheduleItems.${firstOverlappingIndex}.time`);
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

  const handleAddHours = () => {
    if (!classIdValue) return;
    onOpenChange(false);
    void navigate({
      to: "/classes/$classId",
      params: { classId: classIdValue },
      search: { addHours: true },
    });
  };

  const isScheduleActionPending =
    completeMutation.isPending || restoreMutation.isPending;
  const noShowNote = scheduleData?.getNoShowNote()?.trim();
  const scheduleStatus = scheduleData
    ? statusColors[scheduleData.getStatus()]
    : undefined;
  const ScheduleStatusIcon = scheduleStatus?.icon;

  const handleComplete = () => {
    if (!scheduleData || isScheduleActionPending) return;

    const hoursToDeduct = DateTime.formatDurationHours(
      scheduleData.getDurationHours(),
    );
    toast(t("schedules:complete.confirm", { hours: hoursToDeduct }), {
      action: {
        label: t("schedules:complete.confirmButton"),
        onClick: () => completeMutation.mutate(scheduleData.getId()),
      },
      cancel: {
        label: t("schedules:complete.cancelButton"),
        onClick: () => {},
      },
    });
  };

  const handleRestore = () => {
    if (!scheduleData || isScheduleActionPending) return;

    const hoursToRestore = DateTime.formatDurationHours(
      scheduleData.getDurationHours(),
    );
    toast(t("schedules:restore.confirm", { hours: hoursToRestore }), {
      action: {
        label: t("schedules:restore.confirmButton"),
        onClick: () => restoreMutation.mutate(scheduleData.getId()),
      },
      cancel: {
        label: t("schedules:restore.cancelButton"),
        onClick: () => {},
      },
    });
  };

  const scheduleActionGroup =
    mode === "view" && scheduleData ? (
      <div
        aria-label={t("schedules:drawer.actions.label")}
        className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2"
        role="group"
      >
        {scheduleData.canComplete() ? (
          <>
            <Button
              disabled={isScheduleActionPending}
              loading={completeMutation.isPending}
              onClick={handleComplete}
              type="button"
            >
              {t("schedules:complete.action")}
            </Button>
            <Button
              disabled={isScheduleActionPending}
              onClick={() => {
                shouldFocusEditAfterNoShowRef.current = false;
                setIsNoShowDialogOpen(true);
              }}
              ref={noShowButtonRef}
              type="button"
              variant="outline"
            >
              {t("schedules:noShow.action")}
            </Button>
          </>
        ) : null}
        {scheduleData.canRestore() && (
          <Button
            disabled={isScheduleActionPending}
            loading={restoreMutation.isPending}
            onClick={handleRestore}
            type="button"
            variant="outline"
          >
            {t("schedules:restore.action")}
          </Button>
        )}
      </div>
    ) : null;

  const footer =
    mode === "view" ? (
      <>
        <Button
          className="w-full"
          disabled={isScheduleActionPending}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onModeChange("edit");
          }}
          ref={editButtonRef}
          type="button"
          variant="secondary"
        >
          {t("schedules:drawer.editButton")}
        </Button>
        {scheduleActionGroup}
      </>
    ) : (
      <Button
        className="w-full"
        form={SCHEDULE_DRAWER_FORM_ID}
        loading={createMutation.isPending || updateMutation.isPending}
        disabled={isCreateSubmissionBlocked}
        type="submit"
      >
        {getSubmitButtonText()}
      </Button>
    );

  return (
    <ResponsiveDrawer
      footer={footer}
      coverContent={isNoShowDialogOpen}
      onCloseAutoFocus={onCloseAutoFocus}
      onOpenChange={onOpenChange}
      open={isOpen}
      title={getTitle()}
    >
      <form
        id={SCHEDULE_DRAWER_FORM_ID}
        onSubmit={handleSubmit(onSubmit, focusFirstOverlappingRecurringTime)}
      >
        <FieldGroup className="gap-5">
          {mode === "view" && scheduleData && scheduleStatus ? (
            <Badge variant={scheduleStatus.badgeVariant}>
              {ScheduleStatusIcon ? (
                <HugeiconsIcon
                  aria-hidden="true"
                  icon={ScheduleStatusIcon}
                  strokeWidth={2}
                />
              ) : null}
              {t(`schedules:status.${scheduleData.getStatus()}`)}
            </Badge>
          ) : null}

          <FormField
            disabled={isDisabled}
            error={errors.classId?.message}
            errorId="schedule-class-error"
            htmlFor="schedule-class"
            label={t("schedules:drawer.class.label")}
            required={mode !== "view"}
            requiredLabel={
              mode !== "view" ? t("common:form.requiredLabel") : undefined
            }
          >
            <Input
              aria-haspopup="dialog"
              aria-expanded={isClassDrawerOpen}
              aria-invalid={!!errors.classId}
              aria-describedby={
                [errors.classId ? "schedule-class-error" : null]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
              className="cursor-pointer"
              disabled={isDisabled}
              id="schedule-class"
              onClick={() => setIsClassDrawerOpen(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setIsClassDrawerOpen(true);
                }
              }}
              placeholder={t("schedules:drawer.class.placeholder")}
              readOnly
              ref={classTriggerRef}
              role="button"
              value={selectedClassName}
            />
          </FormField>

          <ClassSelectorDrawer
            isOpen={isClassDrawerOpen}
            onCloseAutoFocus={() => classTriggerRef.current?.focus()}
            onOpenChange={setIsClassDrawerOpen}
            onSelect={(id) =>
              setValue("classId", id, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            selectedClassId={classIdValue || null}
          />

          {mode === "create" && isSelectedClassAvailabilityUnresolved ? (
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                hasSelectedClassAvailabilityError
                  ? "border-destructive/30 bg-destructive/10"
                  : "border-border bg-muted/50",
              )}
              role={hasSelectedClassAvailabilityError ? "alert" : "status"}
            >
              {isSelectedClassAvailabilityLoading ? (
                <HugeiconsIcon
                  icon={Loader2HugeIcon}
                  strokeWidth={2}
                  aria-hidden="true"
                  className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground"
                />
              ) : (
                <HugeiconsIcon
                  icon={CircleAlertHugeIcon}
                  strokeWidth={2}
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    hasSelectedClassAvailabilityError
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                />
              )}
              <div className="min-w-0 space-y-2">
                <p className="text-sm text-foreground">
                  {hasSelectedClassAvailabilityError
                    ? t("schedules:classAvailability.loadError")
                    : t("schedules:classAvailability.loading")}
                </p>
                {hasSelectedClassAvailabilityError ? (
                  <Button
                    loading={selectedClassQuery.isFetching}
                    onClick={() => void selectedClassQuery.refetch()}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {t("schedules:error.retry")}
                  </Button>
                ) : null}
              </div>
            </div>
          ) : mode === "create" && selectedClassHasNoAvailability ? (
            <div
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3",
                selectedClassIsExhausted
                  ? "border-warning/30 bg-warning/10"
                  : "border-border bg-muted/50",
              )}
            >
              <HugeiconsIcon
                icon={CircleAlertHugeIcon}
                strokeWidth={2}
                aria-hidden="true"
                className={cn(
                  "mt-0.5 size-4 shrink-0",
                  selectedClassIsExhausted
                    ? "text-warning"
                    : "text-muted-foreground",
                )}
              />
              <div className="min-w-0 space-y-2">
                <p className="text-sm text-foreground">
                  {t("schedules:classNoAvailability.description", {
                    balance: selectedClassBalanceLabel,
                  })}
                </p>
                <Button
                  onClick={handleAddHours}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {t("schedules:classNoAvailability.addHours")}
                </Button>
              </div>
            </div>
          ) : null}

          <Controller
            control={control}
            name="type"
            render={({ field, fieldState }) => (
              <ScheduleTypeField
                caption={t("schedules:drawer.type.caption")}
                disabled={isDisabled}
                error={fieldState.error?.message}
                label={t("schedules:drawer.type.label")}
                name="schedule-type"
                onChange={field.onChange}
                readOnly={mode === "view"}
                value={field.value}
              />
            )}
          />

          {mode === "create" && !oneTimeOnly && (
            <Field orientation="horizontal">
              <Checkbox
                checked={isRecurring}
                id="schedule-recurring"
                onCheckedChange={(checked) =>
                  setValue(
                    "recurring",
                    checked === true ? { scheduleItems: [] } : undefined,
                    { shouldDirty: true, shouldValidate: true },
                  )
                }
                disabled={isDisabled}
              />
              <FieldLabel htmlFor="schedule-recurring">
                {t("schedules:drawer.recurring.label")}
              </FieldLabel>
            </Field>
          )}

          <RHFDateField
            control={control}
            name="date"
            label={
              isRecurring && mode === "create"
                ? t("schedules:drawer.date.recurringLabel")
                : t("schedules:drawer.date.label")
            }
            caption={
              mode === "create" && isRecurring
                ? t("schedules:drawer.date.recurringCaption")
                : undefined
            }
            required={mode !== "view"}
            disabled={isDisabled}
          />

          {!isRecurring && (
            <div className="grid grid-cols-2 gap-3">
              <RHFTimeField
                control={control}
                name="time"
                label={t("schedules:drawer.time.label")}
                required={mode !== "view"}
                disabled={isDisabled}
                inputProps={{
                  placeholder: t("schedules:drawer.time.placeholder"),
                }}
              />
              <RHFSelectField
                control={control}
                name="durationMinutes"
                label={t("schedules:drawer.duration.label")}
                required={mode !== "view"}
                options={durationOptions}
                selectProps={{
                  placeholder: t("schedules:drawer.duration.placeholder"),
                }}
                disabled={isDisabled}
              />
            </div>
          )}

          {isRecurring && mode === "create" && (
            <WeekdayTimeSelector
              name="recurring.scheduleItems"
              control={control}
              disabled={isDisabled}
            />
          )}

          <Controller
            control={control}
            name="notes"
            render={({ field, fieldState }) => {
              const descriptionId = "schedule-notes-description";
              const errorId = "schedule-notes-error";
              const describedBy =
                [descriptionId, fieldState.error ? errorId : undefined]
                  .filter(Boolean)
                  .join(" ") || undefined;

              return (
                <FormField
                  caption={t("schedules:drawer.notes.caption")}
                  captionId={descriptionId}
                  disabled={isDisabled}
                  error={fieldState.error?.message}
                  errorId={errorId}
                  htmlFor="schedule-notes"
                  label={t("schedules:drawer.notes.label")}
                >
                  <textarea
                    {...field}
                    aria-describedby={describedBy}
                    aria-errormessage={fieldState.error ? errorId : undefined}
                    aria-invalid={!!fieldState.error}
                    className="min-h-24 w-full min-w-0 resize-y rounded-md border border-input bg-card px-3 py-2 text-base text-card-foreground transition-colors outline-none placeholder:text-placeholder-foreground hover:border-input-hover focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-primary/35 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 md:text-sm"
                    disabled={isDisabled}
                    id="schedule-notes"
                    placeholder={t("schedules:drawer.notes.placeholder")}
                    rows={3}
                    value={field.value ?? ""}
                  />
                </FormField>
              );
            }}
          />

          {mode === "view" && noShowNote ? (
            <Field>
              <FieldLabel>{t("schedules:noShow.note.displayLabel")}</FieldLabel>
              <p className="rounded-md border border-input bg-surface-container-low px-3 py-2.5 text-sm whitespace-pre-wrap text-on-surface">
                {noShowNote}
              </p>
            </Field>
          ) : null}
        </FieldGroup>
      </form>
      <NoShowScheduleDialog
        finalFocus={() =>
          shouldFocusEditAfterNoShowRef.current
            ? editButtonRef.current
            : noShowButtonRef.current
        }
        onOpenChange={setIsNoShowDialogOpen}
        onSuccess={() => {
          shouldFocusEditAfterNoShowRef.current = true;
        }}
        open={isNoShowDialogOpen}
        schedule={scheduleData ?? null}
      />
    </ResponsiveDrawer>
  );
}
