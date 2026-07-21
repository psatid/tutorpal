import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { WeekdayTimeSelector } from "@/components/schedules/weekday-time-selector";
import { ClassSelectorDrawer } from "@/components/schedules/class-selector-drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { FormField } from "@/components/ui/form/form-field";
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
	useCreateSchedule,
	useUpdateSchedule,
} from "@/hooks/mutations/use-schedules";
import { useClassDetails } from "@/hooks/queries/use-class-details";
import { useGetSchedule } from "@/hooks/queries/use-get-schedule";
import { DateTime } from "@/lib/date-time";
import { cn } from "@/lib/utils";
import {
	minutesToTimeString,
	type ScheduleFormData,
	scheduleSchema,
	timeStringToMinutes,
} from "@/types/schedule";

export type { DrawerMode } from "@/components/ui/responsive-drawer";

const SCHEDULE_DRAWER_FORM_ID = "schedule-drawer-form";

function getScheduleDefaultValues(date: string): ScheduleFormData {
	return {
		classId: "",
		date,
		time: "09:00",
		durationMinutes: 60,
		notes: "",
		status: "SCHEDULED",
		recurring: undefined,
	};
}

interface ScheduleDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	mode: DrawerMode;
	scheduleId: string | null;
	onModeChange: (mode: DrawerMode) => void;
	selectedDate?: Date;
}

export function ScheduleDrawer({
	isOpen,
	onOpenChange,
	mode,
	scheduleId,
	onModeChange,
	selectedDate,
}: ScheduleDrawerProps) {
	const { t } = useTranslation(["schedules"]);
	const statusOptions = [
		{ value: "SCHEDULED", label: t("schedules:status.SCHEDULED") },
		{ value: "COMPLETED", label: t("schedules:status.COMPLETED") },
		{ value: "NO_SHOW", label: t("schedules:status.NO_SHOW") },
		{ value: "CANCELLED", label: t("schedules:status.CANCELLED") },
	];
	const [isClassDrawerOpen, setIsClassDrawerOpen] = useState(false);
	const selectedDateValue = selectedDate
		? DateTime.from(selectedDate).toDateOnlyString()
		: "";
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
		setValue,
	} = useForm<ScheduleFormData>({
		resolver: zodResolver(scheduleSchema),
		defaultValues: getScheduleDefaultValues(selectedDateValue),
	});
	const classIdValue = useWatch({ control, name: "classId" });
	const recurring = useWatch({ control, name: "recurring" });
	const isRecurring = recurring !== undefined;
	const { data: selectedClass } = useClassDetails(classIdValue || null);
	const { data: scheduleData } = useGetSchedule(
		mode !== "create" ? scheduleId : null,
	);

	const selectedClassName = selectedClass?.getDisplayName() || "";

	useEffect(() => {
		if (!isOpen || mode === "create") {
			reset(getScheduleDefaultValues(selectedDateValue));
			if (!isOpen) setIsClassDrawerOpen(false);
			return;
		}

		if (scheduleData) {
			reset({
				classId: scheduleData.classId,
				date: scheduleData.date,
				time: minutesToTimeString(scheduleData.time),
				durationMinutes: scheduleData.durationMinutes,
				notes: scheduleData.notes || "",
				status: scheduleData.status,
				recurring: undefined,
			});
		}
	}, [isOpen, mode, reset, scheduleData, selectedDateValue]);

	const createMutation = useCreateSchedule({
		onSuccess: () => {
			reset(getScheduleDefaultValues(selectedDateValue));
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
		const timeInMinutes = data.recurring
			? 0
			: timeStringToMinutes(data.time || "");

		if (mode === "create") {
			createMutation.mutate({
				classId: data.classId,
				date: data.date,
				time: timeInMinutes,
				durationMinutes: data.durationMinutes,
				notes: data.notes,
				recurring: data.recurring
					? {
							startDate: data.date,
							scheduleItems: data.recurring.scheduleItems.map((item) => ({
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

	const footer =
		mode === "view" ? (
			<Button
				className="w-full md:w-fit"
				leftIcon={Pencil}
				onClick={() => onModeChange("edit")}
				type="button"
			>
				{t("schedules:drawer.editButton")}
			</Button>
		) : (
			<Button
				className="w-full md:w-fit"
				form={SCHEDULE_DRAWER_FORM_ID}
				leftIcon={mode === "create" ? Plus : Save}
				loading={createMutation.isPending || updateMutation.isPending}
				type="submit"
			>
				{getSubmitButtonText()}
			</Button>
		);

	return (
		<ResponsiveDrawer
			footer={footer}
			onOpenChange={onOpenChange}
			open={isOpen}
			title={getTitle()}
		>
			<form id={SCHEDULE_DRAWER_FORM_ID} onSubmit={handleSubmit(onSubmit)}>
				<FieldGroup className="gap-5">
					<FormField
						caption={
							mode === "create"
								? t("schedules:drawer.class.caption")
								: undefined
						}
						disabled={isDisabled}
						error={errors.classId?.message}
						htmlFor="schedule-class"
						label={t("schedules:drawer.class.label")}
					>
						<button
							aria-haspopup="dialog"
							aria-invalid={!!errors.classId}
							className={cn(
								"flex h-9 w-full items-center rounded-4xl border border-input bg-input/30 px-3 py-1 text-left text-base transition-colors outline-none",
								"hover:bg-input/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-primary/40",
								"disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
								"aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20",
							)}
							disabled={isDisabled}
							id="schedule-class"
							onClick={() => setIsClassDrawerOpen(true)}
							type="button"
						>
							{selectedClassName || (
								<span className="text-muted-foreground">
									{t("schedules:drawer.class.placeholder")}
								</span>
							)}
						</button>
					</FormField>

					<ClassSelectorDrawer
						isOpen={isClassDrawerOpen}
						onOpenChange={setIsClassDrawerOpen}
						onSelect={(id) =>
							setValue("classId", id, {
								shouldDirty: true,
								shouldValidate: true,
							})
						}
						selectedClassId={classIdValue || null}
					/>

					{mode === "create" && (
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

					{mode !== "create" && (
						<RHFSelectField
							control={control}
							name="status"
							label={t("schedules:drawer.status.label")}
							options={statusOptions}
							disabled={isDisabled}
							selectProps={{
								placeholder: t("schedules:drawer.status.placeholder"),
							}}
						/>
					)}
				</FieldGroup>
			</form>
		</ResponsiveDrawer>
	);
}
