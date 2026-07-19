import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { WeekdayTimeSelector } from "@/components/schedules/weekday-time-selector";
import { ClassSelectorDrawer } from "@/components/schedules/class-selector-drawer";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form/form-field";
import {
	RHFDateField,
	RHFInputField,
	RHFSelectField,
	RHFTimeField,
} from "@/components/ui/form/rhf";
import { type DrawerMode, ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { DateTime } from "@/lib/date-time";
import {
	useCreateSchedule,
	useUpdateSchedule,
} from "@/hooks/mutations/use-schedules";
import { useClass } from "@/hooks/queries/use-class";
import { useGetSchedule } from "@/hooks/queries/use-get-schedule";
import {
	minutesToTimeString,
	type ScheduleFormData,
	scheduleSchema,
	timeStringToMinutes,
} from "@/types/schedule";

export type { DrawerMode } from "@/components/ui/responsive-drawer";

const SCHEDULE_DRAWER_FORM_ID = "schedule-drawer-form";

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
	const [isRecurring, setIsRecurring] = useState(false);
	const [isClassDrawerOpen, setIsClassDrawerOpen] = useState(false);
	const { handleSubmit, reset, control, setValue, watch } =
		useForm<ScheduleFormData>({
			resolver: zodResolver(scheduleSchema),
			defaultValues: {
				classId: "",
				date: selectedDate ? DateTime.from(selectedDate).toDateOnlyString() : "",
				time: "09:00",
				durationMinutes: 60,
				notes: "",
				status: "SCHEDULED",
				recurring: undefined,
			},
		});

	const classIdValue = watch("classId");
	const { data: selectedClass } = useClass(classIdValue || null);
	const { data: scheduleData } = useGetSchedule(
		mode !== "create" ? scheduleId : null,
	);

	const selectedClassName = selectedClass?.displayName || "";

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
				date: selectedDate ? DateTime.from(selectedDate).toDateOnlyString() : "",
				time: "09:00",
				durationMinutes: 60,
				notes: "",
				status: "SCHEDULED",
				recurring: undefined,
			});
			setIsRecurring(false);
		}
	}, [isOpen, reset, selectedDate]);

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
		const timeInMinutes = isRecurring
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
			<form
				className="flex flex-col gap-5"
				id={SCHEDULE_DRAWER_FORM_ID}
				onSubmit={handleSubmit(onSubmit)}
			>
			{mode === "create" || mode === "edit" ? (
				<button
					className="w-full cursor-pointer text-left"
					onClick={() => !isDisabled && setIsClassDrawerOpen(true)}
					type="button"
				>
					<FormField
						label={t("schedules:drawer.class.label")}
						caption={
							mode === "create" ? t("schedules:drawer.class.caption") : undefined
						}
					>
						<div
							className={`h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-base flex items-center transition-colors ${
								!isDisabled
									? "hover:bg-input/50 focus-within:border-ring focus-within:ring-[3px] focus-within:ring-primary/40"
									: "opacity-50 cursor-not-allowed"
							}`}
						>
							{selectedClassName || (
								<span className="text-muted-foreground">
									{t("schedules:drawer.class.placeholder")}
								</span>
							)}
						</div>
					</FormField>
				</button>
			) : (
				<FormField
					label={t("schedules:drawer.class.label")}
				>
					<div className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 py-1 text-base flex items-center opacity-50">
						{selectedClassName || t("schedules:drawer.class.placeholder")}
					</div>
				</FormField>
			)}

			<ClassSelectorDrawer
				isOpen={isClassDrawerOpen}
				onOpenChange={setIsClassDrawerOpen}
				selectedClassId={classIdValue || null}
				onSelect={(id) => setValue("classId", id)}
			/>

			{mode === "create" && (
				<div className="flex items-center space-x-2">
					<Checkbox
						id="recurring"
						checked={isRecurring}
						onCheckedChange={(checked) => {
							setIsRecurring(checked === true);
							if (checked) {
								setValue("recurring", {
									scheduleItems: [],
								});
							} else {
								setValue("recurring", undefined);
							}
						}}
						disabled={isDisabled}
					/>
					<label htmlFor="recurring" className="text-sm font-medium">
						{t("schedules:drawer.recurring.label")}
					</label>
				</div>
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
						mode === "create" ? t("schedules:drawer.time.caption") : undefined
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
			</form>
		</ResponsiveDrawer>
	);
}
