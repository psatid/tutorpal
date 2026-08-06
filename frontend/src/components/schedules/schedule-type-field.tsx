import { Monitor, MapPin } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { ScheduleType } from "@/types/schedule";
import { cn } from "@/lib/utils";

const SCHEDULE_TYPE_OPTIONS: Array<{
  value: ScheduleType;
  icon: typeof MapPin;
}> = [
  { value: "ON_SITE", icon: MapPin },
  { value: "ONLINE", icon: Monitor },
];

interface ScheduleTypeFieldProps {
  name?: string;
  value?: ScheduleType;
  onChange: (value: ScheduleType) => void;
  error?: string;
  label?: string;
  caption?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export function ScheduleTypeField({
  name = "schedule-type",
  value,
  onChange,
  error,
  label,
  caption,
  disabled = false,
  readOnly = false,
}: ScheduleTypeFieldProps) {
  const { t } = useTranslation(["schedules"]);
  const generatedId = useId();
  const fieldId = `${name}-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const labelText = label ?? t("schedules:drawer.type.label");
  const captionText = caption ?? t("schedules:drawer.type.caption");
  const captionId = `${fieldId}-caption`;
  const errorId = `${fieldId}-error`;

  if (readOnly) {
    const selectedOption = SCHEDULE_TYPE_OPTIONS.find(
      (option) => option.value === value,
    );
    const Icon = selectedOption?.icon ?? MapPin;

    return (
      <div className="space-y-2" aria-label={labelText} role="group">
        <p className="text-sm font-medium text-on-surface">{labelText}</p>
        <div className="flex min-h-11 items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-low px-3 text-sm text-on-surface">
          <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>
            {value
              ? t(`schedules:type.${value}`)
              : t("schedules:drawer.type.error")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <fieldset
      aria-describedby={error ? errorId : captionId}
      aria-invalid={error ? true : undefined}
      className="space-y-3"
    >
      <legend className="text-sm font-medium text-on-surface">
        {labelText}
      </legend>
      <p id={captionId} className="text-xs text-muted-foreground">
        {captionText}
      </p>
      <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
        {SCHEDULE_TYPE_OPTIONS.map(({ value: optionValue, icon: Icon }) => {
          const optionId = `${fieldId}-${optionValue.toLowerCase()}`;
          const isSelected = value === optionValue;

          return (
            <label
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors",
                "border-outline-variant bg-card hover:bg-surface-container",
                isSelected && "border-primary bg-primary/5 text-primary",
                disabled && "cursor-not-allowed opacity-50",
              )}
              htmlFor={optionId}
              key={optionValue}
            >
              <input
                aria-describedby={error ? errorId : captionId}
                aria-invalid={error ? true : undefined}
                checked={isSelected}
                className="h-4 w-4 shrink-0 accent-primary"
                disabled={disabled}
                id={optionId}
                name={name}
                onChange={() => onChange(optionValue)}
                type="radio"
                value={optionValue}
              />
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{t(`schedules:type.${optionValue}`)}</span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
