import { useState } from "react";
import type { Control, FieldArrayPath, FieldPath } from "react-hook-form";
import { useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RHFInputField, RHFTimeField } from "@/components/ui/form/rhf";
import type { ScheduleFormData, Weekday } from "@/types/schedule";

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
			append({ weekday, time: "09:00", durationMinutes: 60 });
		}
		setSelectAll(false);
	};

	const handleSelectAll = () => {
		if (selectAll) {
			remove();
		} else {
			WEEKDAY_ORDER.forEach((weekday) => {
				if (!selectedWeekdays.has(weekday)) {
					append({ weekday, time: "09:00", durationMinutes: 60 });
				}
			});
		}
		setSelectAll(!selectAll);
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
					onClick={handleSelectAll}
					disabled={disabled}
				>
					{selectAll
						? t("schedules:drawer.weekdayTime.clearAll")
						: t("schedules:drawer.weekdayTime.selectAll")}
				</Button>
			</div>

			<div className="space-y-2">
				{WEEKDAY_ORDER.map((weekday) => {
					const isSelected = selectedWeekdays.has(weekday);
					const fieldIndex = fields.findIndex((f) => f.weekday === weekday);
					const timeFieldName =
						`${name}.${fieldIndex}.time` as FieldPath<ScheduleFormData>;
					const durationFieldName =
						`${name}.${fieldIndex}.durationMinutes` as FieldPath<ScheduleFormData>;

					return (
						<div
							key={weekday}
							className="rounded-2xl border border-border/60 p-3"
						>
							<div className="flex items-center gap-2">
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

							{isSelected && fieldIndex !== -1 && (
								<div className="mt-3 grid gap-3 sm:grid-cols-2">
									<RHFTimeField
										control={control}
										name={timeFieldName}
										label={t("schedules:drawer.weekdayTime.timeLabel")}
										caption={t("schedules:drawer.weekdayTime.timeCaption")}
										disabled={disabled}
									/>
									<RHFInputField
										control={control}
										name={durationFieldName}
										label={t("schedules:drawer.weekdayTime.durationLabel")}
										caption={t("schedules:drawer.weekdayTime.durationCaption")}
										disabled={disabled}
										inputProps={{
											type: "number",
											min: 1,
											placeholder: t(
												"schedules:drawer.weekdayTime.durationPlaceholder",
											),
										}}
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
