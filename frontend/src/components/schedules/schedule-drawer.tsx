import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlert, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import type { DefaultValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ScheduleTypeField } from "@/components/schedules/schedule-type-field";
import { WeekdayTimeSelector } from "@/components/schedules/weekday-time-selector";
import { ClassSelectorDrawer } from "@/components/schedules/class-selector-drawer";
import { NoShowScheduleDialog } from "@/components/schedules/no-show-schedule-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormField } from "@/components/ui/form/form-field";
import { Input } from "@/components/ui/input";
import {
	RHFDateField,
	RHFInputField,
	RHFSelectField,
	RHFTimeField,
} from "@/components/ui/form/rhf";
import {
	type DrawerMode,
	ResponsiveDrawer,
} from "@/components/ui/responsive-drawer";
import {
	useCompleteSchedule,
	useCreateSchedule,
	useDeleteSchedule,
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
import {
	getOverlappingRecurringScheduleItemIndexes,
	minutesToTimeString,
	sortRecurringScheduleItems,
	type ScheduleFormData,
	createScheduleSchema,
	timeStringToMinutes,
} from "@/types/schedule";

export type { DrawerMode } from "@/components/ui/responsive-drawer";

const SCHEDULE_DRAWER_FORM_ID = "schedule-drawer-form";
function getScheduleDefaultValues(date: string): DefaultValues<ScheduleFormData> {
	return {
		classId: "",
		date,
		type: undefined,
		time: "09:00",
		durationMinutes: 60,
		notes: "",
		recurring: undefined,
	};
}

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
}: ScheduleDrawerProps) {
	const { t } = useTranslation(["schedules"]);
	const navigate = useNavigate();
	const classTriggerRef = useRef<HTMLInputElement>(null);
	const editButtonRef = useRef<HTMLButtonElement>(null);
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
		defaultValues: getScheduleDefaultValues(selectedDateValue),
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
	const selectedClassIsExhausted =
		selectedClass?.getBalanceState() === "exhausted";
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
			reset(getScheduleDefaultValues(selectedDateValue));
			if (!isOpen) {
				setIsClassDrawerOpen(false);
				setIsNoShowDialogOpen(false);
			}
			return;
		}

		if (scheduleData) {
			reset({
				classId: scheduleData.classId,
				date: scheduleData.date,
				type: scheduleData.type,
				time: minutesToTimeString(scheduleData.time),
				durationMinutes: scheduleData.durationMinutes,
				notes: scheduleData.notes || "",
				recurring: undefined,
			});
		}
	}, [isOpen, mode, reset, scheduleData, selectedDateValue]);

	const createMutation = useCreateSchedule({
		onSuccess: () => {
			reset(getScheduleDefaultValues(selectedDateValue));
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
	const deleteMutation = useDeleteSchedule({
		onSuccess: () => onOpenChange(false),
	});

	const onSubmit = (data: ScheduleFormData) => {
		if (!data.type || isCreateSubmissionBlocked) {
			return;
		}

		const timeInMinutes = data.recurring
			? 0
			: timeStringToMinutes(data.time || "");

		if (mode === "create") {
			createMutation.mutate({
				classId: data.classId,
				date: data.date,
				type: data.type,
				time: timeInMinutes,
				durationMinutes: data.durationMinutes,
				notes: data.notes,
				recurring: data.recurring
					? {
							startDate: data.date,
							scheduleItems: sortRecurringScheduleItems(
								data.recurring.scheduleItems,
							).map((item) => ({
								weekday: item.weekday,
								time: timeStringToMinutes(item.time),
								durationMinutes: item.durationMinutes,
							})),
						}
					: undefined,
			});
		} else if (mode === "edit" && scheduleId) {
			updateMutation.mutate({
				id: scheduleId,
				data: {
					classId: data.classId,
					date: data.date,
					type: data.type,
					time: timeInMinutes,
					durationMinutes: data.durationMinutes,
					notes: data.notes,
				},
			});
		}
	};

	const focusFirstOverlappingRecurringTime = () => {
		const scheduleItems = getValues("recurring.scheduleItems") ?? [];
		const firstOverlappingIndex = [...getOverlappingRecurringScheduleItemIndexes(
			scheduleItems,
		)].sort(
			(left, right) =>
				timeStringToMinutes(scheduleItems[left]?.time ?? "") -
				timeStringToMinutes(scheduleItems[right]?.time ?? ""),
		)[0];

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
		completeMutation.isPending ||
		restoreMutation.isPending ||
		deleteMutation.isPending;
	const noShowNote = scheduleData?.noShowNote?.trim();
	const scheduleStatus = scheduleData
		? statusColors[scheduleData.status]
		: undefined;
	const ScheduleStatusIcon = scheduleStatus?.icon;

	const handleDelete = () => {
		if (!scheduleData || isScheduleActionPending) return;

		toast(t("schedules:delete.confirm"), {
			action: {
				label: t("schedules:delete.confirmButton"),
				onClick: () => deleteMutation.mutate(scheduleData.id),
			},
			cancel: {
				label: t("schedules:delete.cancelButton"),
				onClick: () => {},
			},
		});
	};

	const handleComplete = () => {
		if (!scheduleData || isScheduleActionPending) return;

		const hoursToDeduct = (scheduleData.durationMinutes / 60).toFixed(1);
		toast(t("schedules:complete.confirm", { hours: hoursToDeduct }), {
			action: {
				label: t("schedules:complete.confirmButton"),
				onClick: () => completeMutation.mutate(scheduleData.id),
			},
			cancel: {
				label: t("schedules:complete.cancelButton"),
				onClick: () => {},
			},
		});
	};

	const handleRestore = () => {
		if (!scheduleData || isScheduleActionPending) return;

		const hoursToRestore = (scheduleData.durationMinutes / 60).toFixed(1);
		toast(t("schedules:restore.confirm", { hours: hoursToRestore }), {
			action: {
				label: t("schedules:restore.confirmButton"),
				onClick: () => restoreMutation.mutate(scheduleData.id),
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
				{scheduleData.status === "SCHEDULED" ? (
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
							onClick={() => setIsNoShowDialogOpen(true)}
							type="button"
							variant="outline"
						>
							{t("schedules:noShow.action")}
						</Button>
					</>
				) : null}
				{(scheduleData.status === "COMPLETED" ||
					scheduleData.status === "NO_SHOW") && (
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
				<Button
					className="sm:col-span-2"
					disabled={isScheduleActionPending}
					loading={deleteMutation.isPending}
					onClick={handleDelete}
					type="button"
					variant="destructive"
				>
					{t("schedules:delete.confirmButton")}
				</Button>
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
					variant="outline"
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
						<Field>
							<FieldLabel>{t("schedules:drawer.status.label")}</FieldLabel>
							<Badge
								className={cn("w-fit gap-1", scheduleStatus.className)}
								variant="outline"
							>
								{ScheduleStatusIcon ? (
									<ScheduleStatusIcon aria-hidden="true" className="size-3" />
								) : null}
								{t(`schedules:status.${scheduleData.status}`)}
							</Badge>
						</Field>
					) : null}

					<FormField
						caption={
							mode === "create"
								? t("schedules:drawer.class.caption")
								: undefined
						}
						captionId="schedule-class-description"
						disabled={isDisabled}
						error={errors.classId?.message}
						errorId="schedule-class-error"
						htmlFor="schedule-class"
						label={t("schedules:drawer.class.label")}
					>
						<Input
							aria-haspopup="dialog"
							aria-expanded={isClassDrawerOpen}
							aria-invalid={!!errors.classId}
							aria-describedby={
								[
									mode === "create" ? "schedule-class-description" : null,
									errors.classId ? "schedule-class-error" : null,
								]
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
								<Loader2
									aria-hidden="true"
									className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground"
								/>
							) : (
								<CircleAlert
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
							<CircleAlert
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
									{t("schedules:classNoAvailability.description")}
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
							mode === "create"
								? isRecurring
									? t("schedules:drawer.date.recurringCaption")
									: t("schedules:drawer.date.caption")
								: undefined
						}
						disabled={isDisabled}
					/>

					{!isRecurring && (
						<RHFTimeField
							control={control}
							name="time"
							label={t("schedules:drawer.time.label")}
							caption={
								mode === "create"
									? t("schedules:drawer.time.caption")
									: undefined
							}
							disabled={isDisabled}
						/>
					)}

					{isRecurring && mode === "create" && (
						<WeekdayTimeSelector
							name="recurring.scheduleItems"
							control={control}
							disabled={isDisabled}
						/>
					)}

					{!isRecurring && (
						<RHFSelectField
							control={control}
							name="durationMinutes"
							label={t("schedules:drawer.duration.label")}
							options={durationOptions}
							caption={
								mode === "create"
									? t("schedules:drawer.duration.caption")
									: undefined
							}
							disabled={isDisabled}
						/>
					)}

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
				finalFocus={editButtonRef}
				onOpenChange={setIsNoShowDialogOpen}
				open={isNoShowDialogOpen}
				schedule={scheduleData ?? null}
			/>
		</ResponsiveDrawer>
	);
}
