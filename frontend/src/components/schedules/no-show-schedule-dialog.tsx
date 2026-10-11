import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Check, X } from "lucide-react";
import {
	type FormEvent,
	type RefObject,
	useEffect,
	useRef,
	useState,
} from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogDescription,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
} from "@/components/ui/dialog";
import { overlayLayers } from "@/components/ui/overlay-layers";
import { useNoShowSchedule } from "@/hooks/mutations/use-schedules";
import { DateTime } from "@/lib/date-time";
import { formatDuration, formatTime24Hour } from "@/lib/schedule-utils";
import { cn } from "@/lib/utils";

export type NoShowSchedule = {
	id: string;
	className: string;
	date: string;
	time: number;
	durationMinutes: number;
};

interface NoShowScheduleDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	schedule: NoShowSchedule | null;
	onSuccess?: (schedule: NoShowSchedule) => void;
	finalFocus?: RefObject<HTMLElement | null>;
}

export function NoShowScheduleDialog({
	open,
	onOpenChange,
	schedule,
	onSuccess,
	finalFocus,
}: NoShowScheduleDialogProps) {
	const { t } = useTranslation(["schedules", "common"]);
	const [deductHours, setDeductHours] = useState<boolean | null>(null);
	const [note, setNote] = useState("");
	const deductHoursInputRef = useRef<HTMLInputElement>(null);
	const scheduleId = schedule?.id;
	const noShowMutation = useNoShowSchedule({
		onSuccess: () => {
			if (schedule) onSuccess?.(schedule);
			onOpenChange(false);
		},
	});
	const { reset: resetNoShowMutation } = noShowMutation;

	useEffect(() => {
		resetNoShowMutation();

		if (!open || !scheduleId) {
			setDeductHours(null);
			setNote("");
			return;
		}

		setDeductHours(null);
		setNote("");
	}, [open, resetNoShowMutation, scheduleId]);

	if (!schedule) return null;

	const hours = (schedule.durationMinutes / 60).toFixed(1);
	const startTime = formatTime24Hour(schedule.time);
	const endTime = formatTime24Hour(schedule.time + schedule.durationMinutes);
	const date = DateTime.formatDate(DateTime.fromDateOnlyString(schedule.date), {
		weekday: "long",
		month: "long",
		day: "numeric",
	});
	const submitLabel =
		deductHours === true
			? t("noShow.submitDeduct", { hours })
			: deductHours === false
				? t("noShow.submitRelease", { hours })
				: t("noShow.submitChooseOutcome");
	const errorMessage = noShowMutation.isError
		? noShowMutation.error instanceof Error && noShowMutation.error.message
			? noShowMutation.error.message
			: t("toast.noShowError")
		: null;

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen && noShowMutation.isPending) return;
		onOpenChange(nextOpen);
	};

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (deductHours === null || noShowMutation.isPending) return;

		noShowMutation.mutate({
			id: schedule.id,
			deductHours,
			note: note.trim() || undefined,
		});
	};

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			<DialogPortal>
				<DialogOverlay
					className={cn(
						overlayLayers.alertBackdrop,
						"motion-reduce:animate-none motion-reduce:transition-none",
					)}
				/>
				<DialogPrimitive.Popup
					aria-busy={noShowMutation.isPending}
					className={cn(
						overlayLayers.alertSurface,
						"fixed top-1/2 left-1/2 grid max-h-[calc(100dvh-2rem-env(safe-area-inset-top)-env(safe-area-inset-bottom))] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 gap-5 overflow-y-auto overscroll-contain rounded-xl border border-border bg-popover p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] text-popover-foreground shadow-transient-dialog outline-none duration-100 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 sm:p-6 sm:pb-6 motion-reduce:animate-none motion-reduce:transition-none",
					)}
					finalFocus={finalFocus ?? true}
					initialFocus={deductHoursInputRef}
				>
					<DialogHeader className="pr-10">
						<DialogTitle>{t("noShow.title")}</DialogTitle>
						<DialogDescription>{t("noShow.description")}</DialogDescription>
					</DialogHeader>
					<DialogPrimitive.Close
						disabled={noShowMutation.isPending}
						render={
							<Button
								aria-label={t("common:accessibility.close")}
								className="absolute top-3 right-3"
								disabled={noShowMutation.isPending}
								size="icon"
								type="button"
								variant="ghost"
							/>
						}
					>
						<X aria-hidden="true" className="size-4" />
					</DialogPrimitive.Close>

					<div className="rounded-lg border border-border bg-muted px-3 py-3">
						<p className="font-medium wrap-break-word text-foreground">
							{schedule.className}
						</p>
						<dl className="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 text-sm text-muted-foreground">
							<dt>{t("noShow.session.date")}</dt>
							<dd className="min-w-0 text-right text-foreground">{date}</dd>
							<dt>{t("noShow.session.time")}</dt>
							<dd className="text-right tabular-nums text-foreground">
								{startTime} – {endTime}
							</dd>
							<dt>{t("noShow.session.duration")}</dt>
							<dd className="text-right tabular-nums text-foreground">
								{formatDuration(schedule.durationMinutes, t)}
							</dd>
						</dl>
					</div>

					<form className="space-y-5" onSubmit={handleSubmit}>
						<fieldset className="space-y-2">
							<legend className="text-sm font-medium text-foreground">
								{t("noShow.outcome.label")}
							</legend>
							<label
								className={cn(
									"flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-primary/35 motion-reduce:transition-none",
									deductHours === true && "border-primary bg-primary/5",
									noShowMutation.isPending && "cursor-not-allowed opacity-50",
								)}
							>
								<input
									checked={deductHours === true}
									className="mt-0.5 size-4 shrink-0 accent-primary"
									disabled={noShowMutation.isPending}
									name="no-show-hours"
									onChange={() => setDeductHours(true)}
									ref={deductHoursInputRef}
									type="radio"
									value="deduct"
								/>
								<span>
									<span className="block text-sm font-medium text-foreground">
										{t("noShow.outcome.deduct.title")}
									</span>
									<span className="mt-0.5 block text-sm text-muted-foreground">
										{t("noShow.outcome.deduct.description", { hours })}
									</span>
								</span>
							</label>
							<label
								className={cn(
									"flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors has-[input:focus-visible]:ring-[3px] has-[input:focus-visible]:ring-primary/35 motion-reduce:transition-none",
									deductHours === false && "border-primary bg-primary/5",
									noShowMutation.isPending && "cursor-not-allowed opacity-50",
								)}
							>
								<input
									checked={deductHours === false}
									className="mt-0.5 size-4 shrink-0 accent-primary"
									disabled={noShowMutation.isPending}
									name="no-show-hours"
									onChange={() => setDeductHours(false)}
									type="radio"
									value="release"
								/>
								<span>
									<span className="block text-sm font-medium text-foreground">
										{t("noShow.outcome.release.title")}
									</span>
									<span className="mt-0.5 block text-sm text-muted-foreground">
										{t("noShow.outcome.release.description", { hours })}
									</span>
								</span>
							</label>
						</fieldset>

						<div>
							<label className="text-sm font-medium text-foreground" htmlFor="no-show-note">
								{t("noShow.note.label")}
							</label>
							<p className="mt-1 text-sm text-muted-foreground" id="no-show-note-description">
								{t("noShow.note.caption")}
							</p>
							<textarea
								aria-describedby="no-show-note-description"
								className="mt-2 min-h-24 w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm text-card-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-input-hover focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-primary/35 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none"
								disabled={noShowMutation.isPending}
								id="no-show-note"
								onChange={(event) => setNote(event.target.value)}
								placeholder={t("noShow.note.placeholder")}
								value={note}
							/>
						</div>
						{errorMessage ? (
							<p className="text-sm text-destructive" role="alert">
								{errorMessage}
							</p>
						) : null}

						<Button
							className="w-full"
							disabled={deductHours === null || noShowMutation.isPending}
							loading={noShowMutation.isPending}
							type="submit"
						>
							<Check aria-hidden="true" className="size-4" />
							{submitLabel}
						</Button>
					</form>
				</DialogPrimitive.Popup>
			</DialogPortal>
		</Dialog>
	);
}
