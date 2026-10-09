import { useWatch } from "react-hook-form";
import type { Control, FieldArrayPath, FieldPath } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
	GroupedWeekdayEditor,
	type GroupedWeekdayScheduleItem,
} from "@/components/schedules/grouped-weekday-editor";
import { RHFSelectField, RHFTimeField } from "@/components/ui/form/rhf";
import {
	formatDuration,
	SCHEDULE_DURATION_OPTIONS,
} from "@/lib/schedule-utils";
import {
	timeStringToMinutes,
	type ScheduleFormData,
	type Weekday,
} from "@/types/schedule";

interface WeekdayTimeSelectorProps {
	name: FieldArrayPath<ScheduleFormData>;
	control: Control<ScheduleFormData>;
	disabled?: boolean;
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

function getTimeAtMinute(minute: number) {
	return `${Math.floor(minute / 60)
		.toString()
		.padStart(2, "0")}:${(minute % 60).toString().padStart(2, "0")}`;
}

export function WeekdayTimeSelector({
	name,
	control,
	disabled,
}: WeekdayTimeSelectorProps) {
	const { t } = useTranslation(["schedules"]);
	const durationOptions = SCHEDULE_DURATION_OPTIONS.map((value) => ({
		value,
		label: formatDuration(value, t),
	}));
	const { fields, append, remove } = useFieldArray({
		control,
		name,
	});
	const watchedItems = useWatch({ control, name }) ?? [];
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

	const addInterval = (weekday: Weekday) => {
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
			append({ weekday, time: getTimeAtMinute(latestEnd), durationMinutes: 60 });
		}
	};

	return (
		<GroupedWeekdayEditor
			disabled={disabled}
			items={items}
			onAddInterval={addInterval}
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
				const timeFieldName = `${name}.${item.index}.time` as FieldPath<ScheduleFormData>;
				const durationFieldName = `${name}.${item.index}.durationMinutes` as FieldPath<ScheduleFormData>;
				const intervalLabel = t("schedules:drawer.weekdayTime.intervalLabel", {
					weekday: weekdayLabel,
					number: intervalNumber,
				});

				return (
					<div className="grid gap-3 sm:grid-cols-2">
						<RHFTimeField
							caption={t("schedules:drawer.weekdayTime.timeCaption")}
							control={control}
							disabled={disabled}
							inputProps={{
								"aria-describedby": overlapDescriptionId,
								"aria-invalid": Boolean(overlapDescriptionId),
								id: `weekday-time-${item.id}`,
							}}
							label={t("schedules:drawer.weekdayTime.timeLabel", {
								interval: intervalLabel,
							})}
							name={timeFieldName}
						/>
						<RHFSelectField
							caption={t("schedules:drawer.weekdayTime.durationCaption")}
							control={control}
							disabled={disabled}
							label={t("schedules:drawer.weekdayTime.durationSelectLabel", {
								interval: intervalLabel,
							})}
							name={durationFieldName}
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
