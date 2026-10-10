import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import {
	Controller,
	useFieldArray,
	useForm,
	useWatch,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
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
import {
	GroupedWeekdayEditor,
	type GroupedWeekdayScheduleItem,
} from "@/components/schedules/grouped-weekday-editor";
import { RHFDateField, RHFSelectField, RHFTimeField } from "@/components/ui/form/rhf";
import { ScheduleTypeField } from "@/components/schedules/schedule-type-field";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { useCreateSchedule, useUpdateRecurringSchedule } from "@/hooks/mutations/use-schedules";
import { DateTime } from "@/lib/date-time";
import { formatDuration, SCHEDULE_DURATION_OPTIONS } from "@/lib/schedule-utils";
import {
	getOverlappingRecurringScheduleItemIndexes,
	sortRecurringScheduleItems,
	timeStringToMinutes,
	type RecurringScheduleSummary,
	scheduleTypeSchema,
	type Weekday,
} from "@/types/schedule";
import type { GetV1Schedules200Item } from "@/api/generated/models/getV1Schedules200Item";

function createRecurringScheduleFormSchema(t: TFunction) {
	return z.object({
		effectiveDate: z
			.string()
			.min(1, t("schedules:validation.effectiveDateRequired")),
		type: scheduleTypeSchema
			.optional()
			.refine(
				(value) => value !== undefined,
				t("schedules:validation.typeRequired"),
			),
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
						t("schedules:validation.invalidTime"),
					),
					durationMinutes: z
						.number()
						.min(1, t("schedules:validation.durationRequired")),
				}),
			)
			.min(1, t("schedules:validation.weekdayRequired")),
	}).superRefine((data, ctx) => {
		if (getOverlappingRecurringScheduleItemIndexes(data.scheduleItems).size > 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["scheduleItems"],
				message: t("schedules:validation.overlappingWeekdayTimes"),
			});
		}
	});
}

type RecurringScheduleFormData = z.infer<
	ReturnType<typeof createRecurringScheduleFormSchema>
>;

interface RecurringScheduleDrawerProps {
	hasNoAvailableHours: boolean;
	isOpen: boolean;
	onAddHours: () => void;
	onOpenChange: (open: boolean) => void;
	classId: string;
	recurringSchedule?: RecurringScheduleSummary | null;
	schedules: GetV1Schedules200Item[];
}

const WEEKDAYS: Weekday[] = [
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

function formatRecurringDate(value: string | undefined, fallback: string) {
	const date = DateTime.tryFromDateOnlyString(value);

	return date
		? DateTime.formatDate(date, {
				day: "numeric",
				month: "long",
				year: "numeric",
			})
		: fallback;
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

function getTimeAtMinute(minute: number) {
	return `${Math.floor(minute / 60)
		.toString()
		.padStart(2, "0")}:${(minute % 60).toString().padStart(2, "0")}`;
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
	const watchedItems = useWatch({ control, name: "scheduleItems" }) ?? [];
	const items: GroupedWeekdayScheduleItem[] = fields.map((field, index) => {
		const watchedItem = watchedItems[index] ?? field;
		return {
			id: field.id,
			index,
			weekday: watchedItem.weekday,
			time: watchedItem.time,
			durationMinutes: watchedItem.durationMinutes,
		};
	});
	const durationOptions = [
		...SCHEDULE_DURATION_OPTIONS,
		...items
			.map((item) => item.durationMinutes)
			.filter((duration) => !SCHEDULE_DURATION_OPTIONS.includes(duration)),
	]
		.filter((duration, index, options) => options.indexOf(duration) === index)
		.sort((left, right) => left - right)
		.map((value) => ({ value, label: formatDuration(value, t) }));

	const toggleWeekday = (weekday: Weekday) => {
		const indexes = items
			.filter((item) => item.weekday === weekday)
			.map((item) => item.index);

		if (indexes.length > 0) {
			remove(indexes);
			return;
		}

		append({ weekday, time: "09:00", durationMinutes: 60 });
	};

	return (
		<GroupedWeekdayEditor
			items={items}
			onAddInterval={(weekday) => {
				const latestEnd = items
					.filter((item) => item.weekday === weekday)
					.reduce(
						(latest, item) =>
							Math.max(
								latest,
								timeStringToMinutes(item.time) + item.durationMinutes,
							),
						0,
					);

				if (latestEnd < 24 * 60) {
					append({
						weekday,
						time: getTimeAtMinute(latestEnd),
						durationMinutes: 60,
					});
				}
			}}
			onRemoveInterval={remove}
			onSelectAll={() => {
				if (new Set(items.map((item) => item.weekday)).size === WEEKDAYS.length) {
					remove();
					return;
				}

				append(
					WEEKDAYS.filter(
						(weekday) => !items.some((item) => item.weekday === weekday),
					).map((weekday) => ({ weekday, time: "09:00", durationMinutes: 60 })),
				);
			}}
			onToggleWeekday={toggleWeekday}
			renderInterval={({
				item,
				intervalNumber,
				weekdayLabel,
				overlapDescriptionId,
			}) => {
				const intervalLabel = t("schedules:drawer.weekdayTime.intervalLabel", {
					weekday: weekdayLabel,
					number: intervalNumber,
				});

				return (
					<div className="grid gap-3 sm:grid-cols-2">
						<RHFTimeField
							caption={t("schedules:drawer.weekdayTime.timeCaption")}
							control={control}
							inputProps={{
								"aria-describedby": overlapDescriptionId,
								"aria-invalid": Boolean(overlapDescriptionId),
								id: `recurring-weekday-time-${item.id}`,
							}}
							label={t("schedules:drawer.weekdayTime.timeLabel", {
								interval: intervalLabel,
							})}
							name={`scheduleItems.${item.index}.time`}
						/>
						<RHFSelectField
							caption={t("schedules:drawer.weekdayTime.durationCaption")}
							control={control}
							label={t("schedules:drawer.weekdayTime.durationSelectLabel", {
								interval: intervalLabel,
							})}
							name={`scheduleItems.${item.index}.durationMinutes`}
							options={durationOptions}
							selectProps={{
								ariaLabel: t(
									"schedules:drawer.weekdayTime.durationSelectLabel",
									{ interval: intervalLabel },
								),
								ariaDescribedBy: overlapDescriptionId,
								ariaInvalid: Boolean(overlapDescriptionId),
							}}
						/>
					</div>
				);
			}}
		/>
	);
}

export function RecurringScheduleDrawer({
	hasNoAvailableHours,
	isOpen,
	onAddHours,
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
	const isCreateUnavailable = mode === "create" && hasNoAvailableHours;
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
		getValues,
		handleSubmit,
		reset,
		setFocus,
	} = useForm<RecurringScheduleFormData>({
		resolver: zodResolver(createRecurringScheduleFormSchema(t)),
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
		if (isCreateUnavailable || !values.type) {
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
					scheduleItems: sortRecurringScheduleItems(
						values.scheduleItems,
					).map((item) => ({
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

	const focusFirstOverlappingRecurringTime = () => {
		const firstOverlappingIndex = [
			...getOverlappingRecurringScheduleItemIndexes(getValues("scheduleItems")),
		][0];

		if (firstOverlappingIndex !== undefined) {
			setFocus(`scheduleItems.${firstOverlappingIndex}.time`);
		}
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
				scheduleItems: sortRecurringScheduleItems(
					pendingValues.scheduleItems,
				).map((item) => ({
					weekday: item.weekday,
					time: timeStringToMinutes(item.time),
					durationMinutes: item.durationMinutes,
				})),
			},
		});
	};

	const footer = (
		<Button
			className="w-full"
			disabled={isCreateUnavailable}
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
					onSubmit={handleSubmit(
						submitValues,
						focusFirstOverlappingRecurringTime,
					)}
				>
				{isCreateUnavailable ? (
					<div className="rounded-lg border border-border bg-muted/50 p-4">
						<p className="text-sm text-foreground">
							{t("schedules:recurring.noAvailabilityDescription")}
						</p>
						<Button
							className="mt-3"
							onClick={onAddHours}
							size="sm"
							type="button"
							variant="outline"
						>
							{t("schedules:recurring.addHoursAction")}
						</Button>
					</div>
				) : null}
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
								date: formatRecurringDate(
									effectiveDate,
									t("schedules:recurring.notSelected"),
								),
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
								date: formatRecurringDate(
									pendingValues?.effectiveDate,
									t("schedules:recurring.notSelected"),
								),
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
