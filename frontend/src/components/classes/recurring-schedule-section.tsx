import { CalendarRange, MapPin, Monitor, Pencil, Repeat2 } from "lucide-react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/common/badge";
import { Button } from "@/components/common/button";
import { DateTime } from "@/lib/date-time";
import { formatDuration } from "@/lib/schedule-utils";
import {
	minutesToTimeString,
	WEEKDAY_ORDER,
	type RecurringScheduleSummary,
	type Weekday,
} from "@/types/schedule";

interface RecurringScheduleSectionProps {
	balanceState?: "no-hours" | "all-scheduled" | "exhausted" | "available";
	hasNoAvailableHours: boolean;
	onAddHours: () => void;
	recurringSchedule?: RecurringScheduleSummary | null;
	onEdit: () => void;
	onCreate: () => void;
}

const WEEKDAY_LABEL_KEYS: Record<Weekday, string> = {
	MONDAY: "schedules:drawer.weekdayTime.weekdays.MONDAY",
	TUESDAY: "schedules:drawer.weekdayTime.weekdays.TUESDAY",
	WEDNESDAY: "schedules:drawer.weekdayTime.weekdays.WEDNESDAY",
	THURSDAY: "schedules:drawer.weekdayTime.weekdays.THURSDAY",
	FRIDAY: "schedules:drawer.weekdayTime.weekdays.FRIDAY",
	SATURDAY: "schedules:drawer.weekdayTime.weekdays.SATURDAY",
	SUNDAY: "schedules:drawer.weekdayTime.weekdays.SUNDAY",
};

function formatRecurringItems(
	recurringSchedule: RecurringScheduleSummary,
	t: TFunction,
) {
	const groupedItems = new Map<
		Weekday,
		{
			weekday: string;
			items: Array<{
				id: string;
				startTime: string;
				durationLabel: string;
				time: number;
			}>;
		}
	>();

	for (const item of recurringSchedule.scheduleItems) {
		const group = groupedItems.get(item.weekday) ?? {
			weekday: t(WEEKDAY_LABEL_KEYS[item.weekday]),
			items: [],
		};
		group.items.push({
			id: item.id ?? `${item.weekday}-${item.time}-${item.durationMinutes}`,
			startTime: minutesToTimeString(item.time),
			durationLabel: formatDuration(item.durationMinutes, t),
			time: item.time,
		});
		groupedItems.set(item.weekday, group);
	}

	return [...groupedItems.entries()]
		.map(([weekdayKey, group]) => ({
			weekdayKey,
			...group,
			items: group.items.sort((left, right) => left.time - right.time),
		}))
		.sort(
			(left, right) => WEEKDAY_ORDER[left.weekdayKey] - WEEKDAY_ORDER[right.weekdayKey],
		);
}

export function RecurringScheduleSection({
	balanceState = "no-hours",
	hasNoAvailableHours,
	onAddHours,
	recurringSchedule,
	onEdit,
	onCreate,
}: RecurringScheduleSectionProps) {
	const { t } = useTranslation(["schedules", "classes"]);
	const recurringItems = recurringSchedule
		? formatRecurringItems(recurringSchedule, t)
		: [];
	const unavailableBalanceLabel =
		balanceState === "no-hours"
			? t("classes:balance.noHours")
			: balanceState === "all-scheduled"
				? t("classes:balance.allScheduled")
				: t("classes:balance.exhausted");

	if (!recurringSchedule) {
		return (
			<section aria-labelledby="recurring-schedule-title" className="rounded-xl border border-border bg-card p-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex min-w-0 items-start gap-3 sm:flex-1">
						<div className="mt-0.5 rounded-full bg-surface-container-low p-2">
							<Repeat2 className="h-4 w-4 text-on-surface" />
						</div>
						<div className="min-w-0 flex-1 space-y-1">
							<h2 id="recurring-schedule-title" className="text-base font-semibold text-on-surface">
								{t("schedules:recurring.sectionTitle")}
							</h2>
							<p className="max-w-[34ch] text-sm leading-6 text-on-surface-variant">
								{hasNoAvailableHours
									? t("schedules:recurring.noAvailabilityDescription", {
											balance: unavailableBalanceLabel,
										})
									: t("schedules:recurring.emptyDescription")}
							</p>
						</div>
					</div>
					<Button
						className="w-full shrink-0 sm:w-auto"
						onClick={hasNoAvailableHours ? onAddHours : onCreate}
						size="md"
						variant="outline"
					>
						{hasNoAvailableHours
							? t("schedules:recurring.addHoursAction")
							: t("schedules:recurring.createAction")}
					</Button>
				</div>
			</section>
		);
	}

	return (
		<section
			aria-labelledby="recurring-schedule-title"
			className="rounded-xl border border-border bg-card p-4"
		>
			<div className="flex min-w-0 items-start gap-3">
				<div className="mt-0.5 rounded-full bg-surface-container-low p-2">
					<Repeat2 aria-hidden="true" className="h-4 w-4 text-on-surface" />
				</div>
					<div className="min-w-0 flex-1 space-y-3">
					<div className="min-w-0 space-y-2">
						<h2
							className="text-base font-semibold text-on-surface"
							id="recurring-schedule-title"
						>
							{t("schedules:recurring.sectionTitle")}
						</h2>
						<div className="flex flex-wrap gap-2">
							<Badge
								className="inline-flex max-w-full gap-1 self-start whitespace-normal text-left"
								variant="info"
							>
								<CalendarRange className="mt-0.5 h-3 w-3 shrink-0" />
								<span>
									{t("schedules:recurring.startsOn", {
										date: DateTime.formatDate(recurringSchedule.startDate, {
											day: "numeric",
											month: "long",
											year: "numeric",
										}),
									})}
								</span>
							</Badge>
							<Badge className="inline-flex gap-1" variant="info">
								{recurringSchedule.type === "ONLINE" ? (
									<Monitor aria-hidden="true" className="h-3 w-3 shrink-0" />
								) : (
									<MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
								)}
								<span>{t(`schedules:type.${recurringSchedule.type}`)}</span>
							</Badge>
						</div>
					</div>

					<div className="space-y-1.5 text-sm leading-5 text-on-surface-variant">
						{recurringItems.map((item) => (
							<div
								className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5"
								key={item.weekdayKey}
							>
								<span className="font-medium text-on-surface">{item.weekday}</span>
								{item.items.map((interval) => (
									<span key={interval.id}>
										{interval.startTime} · {interval.durationLabel}
									</span>
								))}
							</div>
						))}
					</div>
				</div>
				<Button
					aria-label={t("schedules:recurring.editAction")}
					className="size-11 -m-1 shrink-0"
					onClick={onEdit}
					size="icon"
					type="button"
					variant="ghost"
				>
					<Pencil aria-hidden="true" className="size-4" />
				</Button>
			</div>
		</section>
	);
}
