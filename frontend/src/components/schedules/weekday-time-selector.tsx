import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { RHFTimeField } from "@/components/ui/form/rhf";
import type { Control, FieldArrayPath } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import type { Weekday, ScheduleFormData } from "@/types/schedule";
import { useState } from "react";

interface WeekdayTimeSelectorProps {
  name: FieldArrayPath<ScheduleFormData>;
  control: Control<ScheduleFormData>;
  disabled?: boolean;
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

export function WeekdayTimeSelector({
  name,
  control,
  disabled,
}: WeekdayTimeSelectorProps) {
  const { t } = useTranslation(["schedules"]);
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const [selectAll, setSelectAll] = useState(false);

  const selectedWeekdays = new Set(fields.map((f) => f.weekday as Weekday));

  const handleToggleWeekday = (weekday: Weekday) => {
    if (selectedWeekdays.has(weekday)) {
      const index = fields.findIndex((f) => f.weekday === weekday);
      if (index !== -1) {
        remove(index);
      }
    } else {
      append({ weekday, time: "09:00" });
    }
    setSelectAll(false);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      remove();
    } else {
      WEEKDAY_ORDER.forEach((weekday) => {
        if (!selectedWeekdays.has(weekday)) {
          append({ weekday, time: "09:00" });
        }
      });
    }
    setSelectAll(!selectAll);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium">{t("schedules:drawer.weekdayTime.label")}</label>
          <p className="text-xs text-muted-foreground">
            {t("schedules:drawer.weekdayTime.caption")}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
          disabled={disabled}
        >
          {selectAll ? t("schedules:drawer.weekdayTime.clearAll") : t("schedules:drawer.weekdayTime.selectAll")}
        </Button>
      </div>

      <div className="space-y-2">
        {WEEKDAY_ORDER.map((weekday) => {
          const isSelected = selectedWeekdays.has(weekday);
          const field = fields.find((f) => f.weekday === weekday);

          return (
            <div key={weekday} className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Checkbox
                  id={`weekday-${weekday}`}
                  checked={isSelected}
                  onCheckedChange={() => handleToggleWeekday(weekday)}
                  disabled={disabled}
                />
                <label
                  htmlFor={`weekday-${weekday}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {t(`schedules:drawer.weekdayTime.weekdays.${weekday}`)}
                </label>
              </div>

              {isSelected && field && (
                <div className="w-24">
                  <RHFTimeField
                    control={control}
                    name={`${name}.${fields.indexOf(field)}.time` as any}
                    disabled={disabled}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}