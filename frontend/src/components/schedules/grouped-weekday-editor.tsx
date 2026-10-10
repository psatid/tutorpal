import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	getOverlappingRecurringScheduleItemIndexes,
	timeStringToMinutes,
	type RecurringScheduleItemInput,
	type Weekday,
} from "@/types/schedule";

const WEEKDAY_ORDER: Weekday[] = [
	"MONDAY",
	"TUESDAY",
	"WEDNESDAY",
	"THURSDAY",
	"FRIDAY",
	"SATURDAY",
	"SUNDAY",
];

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
	const selectedWeekdays = new Set(items.map((item) => item.weekday));
	const allWeekdaysSelected = selectedWeekdays.size === WEEKDAY_ORDER.length;
	const overlappingIndexes = getOverlappingRecurringScheduleItemIndexes(items);

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
					className="min-h-11"
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
				{WEEKDAY_ORDER.map((weekday) => {
					const weekdayLabel = t(
						`schedules:drawer.weekdayTime.weekdays.${weekday}`,
					);
					const weekdayItems = items
						.filter((item) => item.weekday === weekday)
						.sort(
							(left, right) =>
								timeStringToMinutes(left.time) - timeStringToMinutes(right.time),
						);
					const isSelected = weekdayItems.length > 0;
					const latestEnd = weekdayItems.reduce(
						(latest, item) =>
							Math.max(
								latest,
								timeStringToMinutes(item.time) + item.durationMinutes,
							),
						0,
					);
					const cannotAddInterval = latestEnd >= 24 * 60;
					const overlapDescriptionId = `weekday-${weekday.toLowerCase()}-overlap`;
					const hasOverlap = weekdayItems.some((item) =>
						overlappingIndexes.has(item.index),
					);

					return (
						<div
							className="rounded-xl border border-border/60 p-3"
							key={weekday}
						>
							<div className="flex items-center gap-2">
								<Checkbox
									checked={isSelected}
									disabled={disabled}
									id={`weekday-${weekday}`}
									onCheckedChange={() => onToggleWeekday(weekday)}
								/>
								<label
									className="cursor-pointer text-sm font-medium"
									htmlFor={`weekday-${weekday}`}
									id={`weekday-${weekday}-label`}
								>
									{weekdayLabel}
								</label>
							</div>

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
											aria-label={t("schedules:drawer.weekdayTime.addInterval", {
												weekday: weekdayLabel,
											})}
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
