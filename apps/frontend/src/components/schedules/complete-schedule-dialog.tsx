import {
  type ComponentProps,
  useEffect,
  useId,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@tutorpal/ui/alert-dialog";
import { useCompleteSchedule } from "@/hooks/mutations/use-schedules";
import { DateTime } from "@/lib/date-time";
import type { Schedule } from "@/models/schedule";

interface CompleteScheduleDialogProps {
  finalFocus?: ComponentProps<typeof AlertDialogContent>["finalFocus"];
  onOpenChange: (open: boolean) => void;
  onSuccess?: (schedule: Schedule) => void;
  schedule: Schedule | null;
}

export function CompleteScheduleDialog({
  finalFocus,
  onOpenChange,
  onSuccess,
  schedule,
}: CompleteScheduleDialogProps) {
  const { t } = useTranslation("schedules");
  const { isError, isPending, mutateAsync, reset } = useCompleteSchedule();
  const cancelButtonId = useId();
  const submittedRef = useRef(false);
  const previousScheduleIdRef = useRef<string | null>(null);
  const scheduleId = schedule?.getId() ?? null;
  const durationHours = schedule?.getDurationHours() ?? 0;
  const hours = schedule
    ? DateTime.formatDurationHours(durationHours)
    : "";
  const errorMessage = isError ? t("toast.completeError") : null;

  useEffect(() => {
    if (previousScheduleIdRef.current === scheduleId) {
      return;
    }

    submittedRef.current = false;
    reset();
    previousScheduleIdRef.current = scheduleId;
  }, [reset, scheduleId]);

  const handleOpenChange = (
    nextOpen: boolean,
    eventDetails: { preventUnmountOnClose: () => void },
  ) => {
    if (!nextOpen && isPending) {
      eventDetails.preventUnmountOnClose();
      return;
    }

    if (!nextOpen) {
      onOpenChange(false);
    }
  };

  const handleConfirm = async () => {
    if (!schedule || isPending || submittedRef.current) {
      return;
    }

    submittedRef.current = true;
    try {
      await mutateAsync(schedule.getId());
    } catch {
      submittedRef.current = false;
      return;
    }

    onSuccess?.(schedule);
    onOpenChange(false);
  };

  return (
    <AlertDialog onOpenChange={handleOpenChange} open={schedule !== null}>
      <AlertDialogContent
        aria-busy={isPending}
        className="w-[calc(100%-2rem)] sm:w-full"
        finalFocus={finalFocus ?? true}
        initialFocus={() => document.getElementById(cancelButtonId)}
      >
        <AlertDialogHeader>
          <AlertDialogTitle>{t("complete.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("complete.confirm", { count: durationHours, hours })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {errorMessage ? (
          <p
            className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} id={cancelButtonId}>
            {t("complete.cancelButton")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isPending}
            loading={isPending}
            onClick={() => void handleConfirm()}
            type="button"
          >
            {t("complete.confirmButton")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
