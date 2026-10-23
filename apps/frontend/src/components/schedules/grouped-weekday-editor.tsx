import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick02Icon as CheckHugeIcon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { Button } from "@tutorpal/ui/button";
import {
  type RecurringScheduleItemInput,
  type Weekday,
} from "@/types/schedule";
import {
	recurringScheduleWeekdays,
	RecurringSchedulePattern,
} from "@/models/recurring-schedule";

export interface GroupedWeekdayScheduleItem extends RecurringScheduleItemInput {
  id: string;
  index: number;
}

interface GroupedWeekdayEditorProps {
  disabled?: boolean;
  items: GroupedWeekdayScheduleItem[];
  onAddInterval: (weekday: Weekday) => void;
  onSelectAll: () => void;
  onToggleWeekday: (weekday: Weekday) => void;
  renderInterval: (item: {
    item: GroupedWeekdayScheduleItem;
    intervalNumber: number;
    weekday: Weekday;
    weekdayLabel: string;
    overlapDescriptionId?: string;
  }) => React.ReactNode;
  onRemoveInterval: (index: number) => void;
}

export function GroupedWeekdayEditor({
  disabled,
  items,
  onAddInterval,
  onRemoveInterval,
  onSelectAll,
  onToggleWeekday,
  renderInterval,
}: GroupedWeekdayEditorProps) {
  const { t } = useTranslation(["schedules"]);
	const pattern = RecurringSchedulePattern.fromFormItems(items);
	const selectedWeekdays = new Set(
		pattern.getItems().map((item) => item.weekday),
	);
	const allWeekdaysSelected =
		selectedWeekdays.size === recurringScheduleWeekdays.length;
	const overlappingIndexes = pattern.getOverlappingItemIndexes();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-0.5">
          <p className="text-sm font-medium">
            {t("schedules:drawer.weekdayTime.label")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("schedules:drawer.weekdayTime.caption")}
          </p>
        </div>
        <Button
          disabled={disabled}
          onClick={onSelectAll}
          size="sm"
          type="button"
          variant="ghost"
        >
          {allWeekdaysSelected
            ? t("schedules:drawer.weekdayTime.clearAll")
            : t("schedules:drawer.weekdayTime.selectAll")}
        </Button>
      </div>

      <div className="space-y-2">
		{recurringScheduleWeekdays.map((weekday) => {
          const weekdayLabel = t(
            `schedules:drawer.weekdayTime.weekdays.${weekday}`,
          );
			const weekdayItems = pattern
				.getWeekdayItemIndexes(weekday)
				.map((index) => items[index])
				.filter((item): item is GroupedWeekdayScheduleItem => Boolean(item));
          const isSelected = weekdayItems.length > 0;
			const cannotAddInterval = !pattern.canAddInterval(weekday);
          const overlapDescriptionId = `weekday-${weekday.toLowerCase()}-overlap`;
          const hasOverlap = weekdayItems.some((item) =>
            overlappingIndexes.has(item.index),
          );

          return (
            <div
              className="rounded-xl border border-border/60 p-3"
              key={weekday}
            >
              <button
                aria-checked={isSelected}
                aria-label={weekdayLabel}
                className={
                  disabled
                    ? "flex w-full cursor-not-allowed items-center gap-2 rounded-lg text-left opacity-50"
                    : "flex w-full cursor-pointer items-center gap-2 rounded-lg text-left transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                }
                disabled={disabled}
                onClick={() => onToggleWeekday(weekday)}
                role="checkbox"
                type="button"
              >
                <span
                  aria-hidden="true"
                  className={
                    isSelected
                      ? "flex size-4 shrink-0 items-center justify-center rounded-[6px] border border-primary bg-primary text-primary-foreground"
                      : "flex size-4 shrink-0 items-center justify-center rounded-[6px] border border-input"
                  }
                >
                  {isSelected ? <HugeiconsIcon icon={CheckHugeIcon} strokeWidth={2} aria-hidden="true" className="size-3.5" /> : null}
                </span>
                <span className="text-sm font-medium">{weekdayLabel}</span>
              </button>

              {isSelected ? (
                <div className="mt-3 space-y-3">
                  {weekdayItems.map((item, intervalIndex) => (
                    <div
                      className="border-t border-border/40 py-3 first:border-t-0 first:pt-0 last:pb-0"
                      key={item.id}
                    >
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          {t("schedules:drawer.weekdayTime.interval", {
                            number: intervalIndex + 1,
                          })}
                        </p>
                        {weekdayItems.length > 1 ? (
                          <Button
                            aria-label={t(
                              "schedules:drawer.weekdayTime.removeInterval",
                              {
                                weekday: weekdayLabel,
                                number: intervalIndex + 1,
                              },
                            )}
                            disabled={disabled}
                            className="min-h-11"
                            onClick={() => onRemoveInterval(item.index)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            {t("schedules:drawer.weekdayTime.remove")}
                          </Button>
                        ) : null}
                      </div>
                      {renderInterval({
                        item,
                        intervalNumber: intervalIndex + 1,
                        weekday,
                        weekdayLabel,
                        overlapDescriptionId: overlappingIndexes.has(item.index)
                          ? overlapDescriptionId
                          : undefined,
                      })}
                    </div>
                  ))}

                  {hasOverlap ? (
                    <p
                      className="text-sm text-destructive"
                      id={overlapDescriptionId}
                      role="alert"
                    >
                      {t("schedules:drawer.weekdayTime.overlap", {
                        weekday: weekdayLabel,
                      })}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      aria-describedby={
                        cannotAddInterval
                          ? `weekday-${weekday.toLowerCase()}-limit`
                          : undefined
                      }
                      aria-label={t(
                        "schedules:drawer.weekdayTime.addInterval",
                        {
                          weekday: weekdayLabel,
                        },
                      )}
                      disabled={disabled || cannotAddInterval}
                      className="min-h-11"
                      onClick={() => onAddInterval(weekday)}
                      size="sm"
                      type="button"
                      variant="outline"
                    >
                      {t("schedules:drawer.weekdayTime.add")}
                    </Button>
                    {cannotAddInterval ? (
                      <p
                        className="text-xs text-muted-foreground"
                        id={`weekday-${weekday.toLowerCase()}-limit`}
                      >
                        {t("schedules:drawer.weekdayTime.noMoreIntervals", {
                          weekday: weekdayLabel,
                        })}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
