import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import {
	Controller,
	useFieldArray,
	useForm,
	useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RHFDateField, RHFInputField, RHFTimeField } from "@/components/ui/form/rhf";
import { ScheduleTypeField } from "@/components/schedules/schedule-type-field";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { useCreateSchedule, useUpdateRecurringSchedule } from "@/hooks/mutations/use-schedules";
import { DateTime } from "@/lib/date-time";
import {
	timeStringToMinutes,
	type RecurringScheduleSummary,
	scheduleTypeSchema,
	type Weekday,
} from "@/types/schedule";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";

const recurringScheduleFormSchema = z.object({
	effectiveDate: z.string().min(1, "Effective date is required"),
	type: scheduleTypeSchema
		.optional()
		.refine((value) => value !== undefined, "Choose a schedule type."),
	scheduleItems: z
		.array(
			z.object({
				weekday: z.enum([
					"MONDAY",
					"TUESDAY",
					"WEDNESDAY",
					"THURSDAY",
					"FRIDAY",
					"SATURDAY",
					"SUNDAY",
				]),
				time: z.string().regex(
					/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
					"Invalid time format",
				),
				durationMinutes: z.number().min(1, "Duration must be at least 1 minute"),
			}),
		)
		.min(1, "At least one weekday must be selected"),
});

type RecurringScheduleFormData = z.infer<typeof recurringScheduleFormSchema>;

interface RecurringScheduleDrawerProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	classId: string;
	recurringSchedule?: RecurringScheduleSummary | null;
	schedules: GetV1Schedules200Item[];
}

const WEEKDAY_ORDER: Weekday[] = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
];
const RECURRING_SCHEDULE_DRAWER_FORM_ID = "recurring-schedule-drawer-form";

function getTodayDateString() {
	return DateTime.today().toDateOnlyString();
}

function isLegacyRecurringOccurrence(
	schedule: GetV1Schedules200Item,
	recurringSchedule: RecurringScheduleSummary,
) {
	if (schedule.recurringScheduleId === recurringSchedule.id) {
		return true;
	}

	if (schedule.recurringScheduleId) {
		return false;
	}

	if (schedule.date < recurringSchedule.startDate) {
		return false;
	}

	const scheduleWeekday = DateTime.fromDateOnlyString(
		schedule.date,
	).getWeekdayIndex();
	const weekdayMap: Record<Weekday, number> = {
		MONDAY: 1,
		TUESDAY: 2,
		WEDNESDAY: 3,
		THURSDAY: 4,
		FRIDAY: 5,
		SATURDAY: 6,
		SUNDAY: 0,
	};

	return recurringSchedule.scheduleItems.some(
		(item) =>
			weekdayMap[item.weekday] === scheduleWeekday &&
			item.time === schedule.time &&
			item.durationMinutes === schedule.durationMinutes,
	);
}

function getDefaultValues(
	recurringSchedule?: RecurringScheduleSummary | null,
): RecurringScheduleFormData {
	return {
		effectiveDate: recurringSchedule?.startDate ?? getTodayDateString(),
		type: recurringSchedule?.type,
		scheduleItems:
			recurringSchedule?.scheduleItems.map((item) => ({
				weekday: item.weekday,
				time: `${Math.floor(item.time / 60)
					.toString()
					.padStart(2, "0")}:${(item.time % 60)
					.toString()
					.padStart(2, "0")}`,
				durationMinutes: item.durationMinutes,
			})) ?? [],
	};
}

function RecurringWeekdayTimeSelector({
	control,
}: {
	control: ReturnType<typeof useForm<RecurringScheduleFormData>>["control"];
}) {
	const { t } = useTranslation(["schedules"]);
	const { fields, append, remove } = useFieldArray({
		control,
		name: "scheduleItems",
	});
	const [selectAll, setSelectAll] = useState(false);
	const selectedWeekdays = new Set(fields.map((field) => field.weekday as Weekday));

	const toggleWeekday = (weekday: Weekday) => {
		if (selectedWeekdays.has(weekday)) {
			const index = fields.findIndex((field) => field.weekday === weekday);
			if (index !== -1) {
				remove(index);
			}
		} else {
			append({ weekday, time: "09:00", durationMinutes: 60 });
		}
		setSelectAll(false);
	};

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<p className="text-sm font-medium">
						{t("schedules:drawer.weekdayTime.label")}
					</p>
					<p className="text-xs text-muted-foreground">
						{t("schedules:drawer.weekdayTime.caption")}
					</p>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => {
						if (selectAll) {
							remove();
						} else {
							WEEKDAY_ORDER.forEach((weekday) => {
								if (!selectedWeekdays.has(weekday)) {
									append({ weekday, time: "09:00", durationMinutes: 60 });
								}
							});
						}
						setSelectAll((current) => !current);
					}}
				>
					{selectAll
						? t("schedules:drawer.weekdayTime.clearAll")
						: t("schedules:drawer.weekdayTime.selectAll")}
				</Button>
			</div>

			<div className="space-y-2">
				{WEEKDAY_ORDER.map((weekday) => {
					const isSelected = selectedWeekdays.has(weekday);
					const fieldIndex = fields.findIndex((field) => field.weekday === weekday);

					return (
						<div
							key={weekday}
							className="rounded-2xl border border-border/60 p-3"
						>
							<div className="flex items-center gap-2">
								<Checkbox
									id={`recurring-${weekday}`}
									checked={isSelected}
									onCheckedChange={() => toggleWeekday(weekday)}
								/>
								<label
									htmlFor={`recurring-${weekday}`}
									className="cursor-pointer text-sm font-medium"
								>
									{t(`schedules:drawer.weekdayTime.weekdays.${weekday}`)}
								</label>
							</div>

							{isSelected && fieldIndex !== -1 ? (
								<div className="mt-3 grid gap-3 sm:grid-cols-2">
									<RHFTimeField
										control={control}
										name={`scheduleItems.${fieldIndex}.time`}
										label={t("schedules:drawer.weekdayTime.timeLabel")}
										caption={t("schedules:drawer.weekdayTime.timeCaption")}
									/>
									<RHFInputField
										control={control}
										name={`scheduleItems.${fieldIndex}.durationMinutes`}
										label={t("schedules:drawer.weekdayTime.durationLabel")}
										caption={t("schedules:drawer.weekdayTime.durationCaption")}
										inputProps={{
											type: "number",
											min: 1,
											placeholder: t(
												"schedules:drawer.weekdayTime.durationPlaceholder",
											),
										}}
									/>
								</div>
							) : null}
						</div>
					);
				})}
			</div>
		</div>
	);
}

export function RecurringScheduleDrawer({
	isOpen,
	onOpenChange,
	classId,
	recurringSchedule,
	schedules,
}: RecurringScheduleDrawerProps) {
	const { t } = useTranslation(["schedules"]);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [pendingValues, setPendingValues] = useState<RecurringScheduleFormData | null>(
		null,
	);
	const mode = recurringSchedule ? "edit" : "create";
	const createMutation = useCreateSchedule({
		onSuccess: () => {
			onOpenChange(false);
		},
	});
	const updateRecurringMutation = useUpdateRecurringSchedule({
		onSuccess: () => {
			setIsConfirmOpen(false);
			setPendingValues(null);
			onOpenChange(false);
		},
	});
	const {
		control,
		formState: { errors },
		handleSubmit,
		reset,
	} = useForm<RecurringScheduleFormData>({
		resolver: zodResolver(recurringScheduleFormSchema),
		defaultValues: getDefaultValues(recurringSchedule),
	});
	const effectiveDate = useWatch({
		control,
		name: "effectiveDate",
	});
	const selectedType = useWatch({
		control,
		name: "type",
	});

	useEffect(() => {
		if (isOpen) {
			reset(getDefaultValues(recurringSchedule));
			return;
		}

		setIsConfirmOpen(false);
		setPendingValues(null);
		reset(getDefaultValues(recurringSchedule));
	}, [isOpen, recurringSchedule, reset]);

	const affectedCount = useMemo(() => {
		if (!recurringSchedule || !effectiveDate) {
			return 0;
		}

		return schedules.filter(
			(schedule) =>
				isLegacyRecurringOccurrence(schedule, recurringSchedule) &&
				schedule.date >= effectiveDate &&
				(schedule.status === "SCHEDULED" || schedule.status === "CANCELLED"),
		).length;
	}, [effectiveDate, recurringSchedule, schedules]);

	const submitValues = (values: RecurringScheduleFormData) => {
		if (!values.type) {
			return;
		}

		if (mode === "create") {
			createMutation.mutate({
				classId,
				date: values.effectiveDate,
				type: values.type,
				time: 0,
				recurring: {
					startDate: values.effectiveDate,
					scheduleItems: values.scheduleItems.map((item) => ({
						weekday: item.weekday,
						time: timeStringToMinutes(item.time),
						durationMinutes: item.durationMinutes,
					})),
				},
			});
			return;
		}

		setPendingValues(values);
		setIsConfirmOpen(true);
	};

	const handleConfirmEdit = () => {
		if (!pendingValues || !recurringSchedule) {
			return;
		}

		updateRecurringMutation.mutate({
			id: recurringSchedule.id,
			data: {
				effectiveDate: pendingValues.effectiveDate,
				type: pendingValues.type,
				scheduleItems: pendingValues.scheduleItems.map((item) => ({
					weekday: item.weekday,
					time: timeStringToMinutes(item.time),
					durationMinutes: item.durationMinutes,
				})),
			},
		});
	};

	const footer = (
		<Button
			className="w-full md:w-fit"
			form={RECURRING_SCHEDULE_DRAWER_FORM_ID}
			loading={createMutation.isPending || updateRecurringMutation.isPending}
			type="submit"
		>
			{t(
				mode === "create"
					? "schedules:recurring.createAction"
					: "schedules:recurring.saveAction",
			)}
		</Button>
	);

	return (
		<>
			<ResponsiveDrawer
				footer={footer}
				onOpenChange={onOpenChange}
				open={isOpen}
				title={t(
					mode === "create"
						? "schedules:recurring.drawer.createTitle"
						: "schedules:recurring.drawer.editTitle",
				)}
			>
				<form
					className="flex flex-col gap-5"
					id={RECURRING_SCHEDULE_DRAWER_FORM_ID}
					onSubmit={handleSubmit(submitValues)}
				>
				<div className="rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-3">
					<p className="text-sm font-medium text-on-surface">
						{t("schedules:recurring.untouchedTitle")}
					</p>
					<p className="mt-1 text-sm text-on-surface-variant">
						{t("schedules:recurring.untouchedDescription")}
					</p>
				</div>

				<Controller
					control={control}
					name="type"
					render={({ field, fieldState }) => (
						<ScheduleTypeField
							caption={t("schedules:drawer.type.caption")}
							error={fieldState.error?.message ?? errors.type?.message}
							label={t("schedules:drawer.type.label")}
							name="recurring-schedule-type"
							onChange={field.onChange}
							value={field.value}
						/>
					)}
				/>

				<RHFDateField
					control={control}
					name="effectiveDate"
					label={t(
						mode === "create"
							? "schedules:recurring.startDateLabel"
							: "schedules:recurring.effectiveDateLabel",
					)}
					caption={t(
						mode === "create"
							? "schedules:recurring.startDateCaption"
							: "schedules:recurring.effectiveDateCaption",
					)}
				/>

				<RecurringWeekdayTimeSelector control={control} />

				{mode === "edit" ? (
					<div className="rounded-2xl border border-outline-variant bg-card px-4 py-3">
						<p className="text-sm font-medium text-on-surface">
							{t("schedules:recurring.previewTitle")}
						</p>
						<p className="mt-1 text-sm text-on-surface-variant">
							{t("schedules:recurring.previewDescription", {
								count: affectedCount,
								date: effectiveDate || t("schedules:recurring.notSelected"),
							})}
						</p>
						<p className="mt-1 text-sm font-medium text-on-surface-variant">
							{t("schedules:recurring.previewType", {
								type: selectedType
									? t(`schedules:type.${selectedType}`)
									: t("schedules:recurring.typeNotSelected"),
							})}
						</p>
					</div>
				) : null}
				</form>
			</ResponsiveDrawer>

			<AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("schedules:recurring.confirmTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("schedules:recurring.confirmDescription", {
								count: affectedCount,
								date:
									pendingValues?.effectiveDate ??
									t("schedules:recurring.notSelected"),
								type: pendingValues?.type
									? t(`schedules:type.${pendingValues.type}`)
									: t("schedules:recurring.typeNotSelected"),
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							{t("schedules:recurring.cancelAction")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleConfirmEdit}
							disabled={updateRecurringMutation.isPending}
						>
							{t("schedules:recurring.confirmAction")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
