import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export type ScheduleViewMode = "day" | "week";

interface ScheduleViewSwitchProps {
  value: ScheduleViewMode;
  onChange: (value: ScheduleViewMode) => void;
}

export function ScheduleViewSwitch({
  value,
  onChange,
}: ScheduleViewSwitchProps) {
  const { t } = useTranslation(["schedules"]);
  const options: Array<{ value: ScheduleViewMode; label: string }> = [
    { value: "day", label: t("schedules:viewMode.day") },
    { value: "week", label: t("schedules:viewMode.week") },
  ];

  return (
    <fieldset
      aria-label={t("schedules:viewMode.label")}
      className="inline-flex h-11 items-center rounded-full border border-border bg-card p-0 sm:p-0.5"
    >
      <legend className="sr-only">{t("schedules:viewMode.label")}</legend>
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            aria-pressed={isSelected}
            className={cn(
              "h-11 min-w-11 rounded-full px-2 text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none sm:h-auto sm:min-h-9 sm:min-w-0 sm:px-3",
              isSelected
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </fieldset>
  );
}
