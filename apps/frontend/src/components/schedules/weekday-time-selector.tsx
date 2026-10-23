import { useWatch } from "react-hook-form";
import type { Control, FieldArrayPath, FieldPath } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  GroupedWeekdayEditor,
  type GroupedWeekdayScheduleItem,
} from "@/components/schedules/grouped-weekday-editor";
import { RHFSelectField, RHFTimeField } from "@tutorpal/ui/form/rhf";
import {
  formatDuration,
  SCHEDULE_DURATION_OPTIONS,
} from "@/lib/schedule-utils";
import {
  type ScheduleFormData,
  type Weekday,
} from "@/types/schedule";
import {
	RecurringSchedulePattern,
} from "@/models/recurring-schedule";

interface WeekdayTimeSelectorProps {
  name: FieldArrayPath<ScheduleFormData>;
  control: Control<ScheduleFormData>;
  disabled?: boolean;
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
		const decision = RecurringSchedulePattern.fromFormItems(items).getToggleWeekdayDecision(
			weekday,
		);

		if (decision.kind === "remove") {
			remove(decision.indexes);
      return;
    }

		append(decision.item, { shouldFocus: false });
  };

  const addInterval = (weekday: Weekday) => {
		const item = RecurringSchedulePattern.fromFormItems(items).getAddIntervalItem(
			weekday,
		);
		if (item) append(item);
  };

  return (
    <GroupedWeekdayEditor
      disabled={disabled}
      items={items}
      onAddInterval={addInterval}
      onRemoveInterval={remove}
      onSelectAll={() => {
		const decision = RecurringSchedulePattern.fromFormItems(
			items,
		).getSelectAllWeekdaysDecision();

		if (decision.kind === "clear") {
          remove();
          return;
        }

		append(decision.items, { shouldFocus: false });
      }}
      onToggleWeekday={toggleWeekday}
      renderInterval={({
        item,
        intervalNumber,
        weekdayLabel,
        overlapDescriptionId,
      }) => {
        const timeFieldName =
          `${name}.${item.index}.time` as FieldPath<ScheduleFormData>;
        const durationFieldName =
          `${name}.${item.index}.durationMinutes` as FieldPath<ScheduleFormData>;
        const intervalLabel = t("schedules:drawer.weekdayTime.intervalLabel", {
          weekday: weekdayLabel,
          number: intervalNumber,
        });

        return (
          <div className="grid grid-cols-2 gap-3">
            <RHFTimeField
              control={control}
              disabled={disabled}
              inputProps={{
                "aria-label": t("schedules:drawer.weekdayTime.timeLabel", {
                  interval: intervalLabel,
                }),
                "aria-describedby": overlapDescriptionId,
                "aria-invalid": Boolean(overlapDescriptionId),
                id: `weekday-time-${item.id}`,
              }}
              label={t("schedules:drawer.time.label")}
              name={timeFieldName}
              required
            />
            <RHFSelectField
              control={control}
              disabled={disabled}
              label={t("schedules:drawer.duration.label")}
              name={durationFieldName}
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
