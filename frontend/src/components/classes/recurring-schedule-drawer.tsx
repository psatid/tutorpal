import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import {
	Controller,
	useFieldArray,
	useForm,
	useWatch,
} from "react-hook-form";
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
} from "@/components/common/alert-dialog";
import { Button } from "@/components/common/button";
import {
	GroupedWeekdayEditor,
	type GroupedWeekdayScheduleItem,
} from "@/components/schedules/grouped-weekday-editor";
import { RHFDateField, RHFSelectField, RHFTimeField } from "@/components/common/form/rhf";
import { ScheduleTypeField } from "@/components/schedules/schedule-type-field";
import { ResponsiveDrawer } from "@/components/common/responsive-drawer";
import { useCreateSchedule, useUpdateRecurringSchedule } from "@/hooks/mutations/use-schedules";
import { DateTime } from "@/lib/date-time";
import { formatDuration, SCHEDULE_DURATION_OPTIONS } from "@/lib/schedule-utils";
import {
	RecurringSchedule,
	RecurringSchedulePattern,
} from "@/models/recurring-schedule";
import type { Schedule } from "@/models/schedule";
import {
	createRecurringScheduleSchema,
	type RecurringScheduleFormData,
	type Weekday,
} from "@/types/schedule";

interface RecurringScheduleDrawerProps {
	balanceState?: "no-hours" | "all-scheduled" | "exhausted" | "available";
	hasNoAvailableHours: boolean;
	isOpen: boolean;
	onAddHours: () => void;
	onOpenChange: (open: boolean) => void;
	classId: string;
	recurringSchedule?: RecurringSchedule | null;
	schedules: Schedule[];
}

const RECURRING_SCHEDULE_DRAWER_FORM_ID = "recurring-schedule-drawer-form";

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
		const decision = RecurringSchedulePattern.fromFormItems(items).getToggleWeekdayDecision(
			weekday,
		);

		if (decision.kind === "remove") {
			remove(decision.indexes);
			return;
		}

		append(decision.item);
	};

	return (
		<GroupedWeekdayEditor
			items={items}
			onAddInterval={(weekday) => {
				const item = RecurringSchedulePattern.fromFormItems(
					items,
				).getAddIntervalItem(weekday);
				if (item) append(item);
			}}
			onRemoveInterval={remove}
			onSelectAll={() => {
				const decision = RecurringSchedulePattern.fromFormItems(
					items,
				).getSelectAllWeekdaysDecision();
				if (decision.kind === "clear") {
					remove();
					return;
				}

				append(decision.items);
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
					<div className="grid grid-cols-2 gap-3">
						<RHFTimeField
							control={control}
							inputProps={{
								"aria-label": t("schedules:drawer.weekdayTime.timeLabel", {
									interval: intervalLabel,
								}),
								"aria-describedby": overlapDescriptionId,
								"aria-invalid": Boolean(overlapDescriptionId),
								id: `recurring-weekday-time-${item.id}`,
							}}
							label={t("schedules:drawer.time.label")}
							name={`scheduleItems.${item.index}.time`}
							required
						/>
						<RHFSelectField
							control={control}
							label={t("schedules:drawer.duration.label")}
							name={`scheduleItems.${item.index}.durationMinutes`}
							options={durationOptions}
							required
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
	balanceState = "no-hours",
	hasNoAvailableHours,
	isOpen,
	onAddHours,
	onOpenChange,
	classId,
	recurringSchedule,
	schedules,
}: RecurringScheduleDrawerProps) {
	const { t } = useTranslation(["schedules", "classes"]);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [pendingValues, setPendingValues] = useState<RecurringScheduleFormData | null>(
		null,
	);
	const drawerSessionDate = useMemo(
		() => DateTime.today().toDateOnlyString(),
		[isOpen],
	);
	const mode = recurringSchedule ? "edit" : "create";
	const isCreateUnavailable = mode === "create" && hasNoAvailableHours;
	const unavailableBalanceLabel =
		balanceState === "no-hours"
			? t("classes:balance.noHours")
			: balanceState === "all-scheduled"
				? t("classes:balance.allScheduled")
				: t("classes:balance.exhausted");
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
		resolver: zodResolver(createRecurringScheduleSchema(t)),
		defaultValues: RecurringSchedule.getFormDefaults(
			recurringSchedule,
			drawerSessionDate,
		),
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
			reset(
				RecurringSchedule.getFormDefaults(recurringSchedule, drawerSessionDate),
			);
			return;
		}

		setIsConfirmOpen(false);
		setPendingValues(null);
		reset(
			RecurringSchedule.getFormDefaults(recurringSchedule, drawerSessionDate),
		);
	}, [drawerSessionDate, isOpen, recurringSchedule, reset]);

	const affectedCount = useMemo(() => {
		if (!recurringSchedule || !effectiveDate) {
			return 0;
		}

		return recurringSchedule.getAffectedOccurrenceCount(
			schedules,
			effectiveDate,
		);
	}, [effectiveDate, recurringSchedule, schedules]);

	const submitValues = (values: RecurringScheduleFormData) => {
		if (isCreateUnavailable) {
			return;
		}

		if (mode === "create") {
			const command = RecurringSchedule.toCreateCommand(classId, values);
			if (command) createMutation.mutate(command);
			return;
		}

		setPendingValues(values);
		setIsConfirmOpen(true);
	};

	const focusFirstOverlappingRecurringTime = () => {
		const [firstOverlappingIndex] = RecurringSchedulePattern.fromFormItems(
			getValues("scheduleItems"),
		).getOverlappingItemIndexes();

		if (firstOverlappingIndex !== undefined) {
			setFocus(`scheduleItems.${firstOverlappingIndex}.time`);
		}
	};

	const handleConfirmEdit = () => {
		if (!pendingValues || !recurringSchedule) {
			return;
		}

		const command = recurringSchedule.toUpdateCommand(pendingValues);
		if (command) updateRecurringMutation.mutate(command);
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
							{t("schedules:recurring.noAvailabilityDescription", {
								balance: unavailableBalanceLabel,
							})}
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
