import { CalendarRange, MapPin, Monitor, Pencil, Repeat2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { minutesToTimeString, type RecurringScheduleSummary, type Weekday } from "@/types/schedule";

interface RecurringScheduleSectionProps {
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

const WEEKDAY_ORDER: Record<Weekday, number> = {
	MONDAY: 0,
	TUESDAY: 1,
	WEDNESDAY: 2,
	THURSDAY: 3,
	FRIDAY: 4,
	SATURDAY: 5,
	SUNDAY: 6,
};

function formatRecurringItems(
	recurringSchedule: RecurringScheduleSummary,
	t: (key: string) => string,
) {
	return recurringSchedule.scheduleItems
		.map((item) => {
			const weekday = t(WEEKDAY_LABEL_KEYS[item.weekday]);
			const startTime = minutesToTimeString(item.time);
			return {
				id: item.id ?? `${item.weekday}-${item.time}-${item.durationMinutes}`,
				weekdayKey: item.weekday,
				weekday,
				startTime,
				durationLabel: `${item.durationMinutes}m`,
			};
		})
		.sort((left, right) => WEEKDAY_ORDER[left.weekdayKey] - WEEKDAY_ORDER[right.weekdayKey]);
}

export function RecurringScheduleSection({
	recurringSchedule,
	onEdit,
	onCreate,
}: RecurringScheduleSectionProps) {
	const { t } = useTranslation(["schedules"]);
	const recurringItems = recurringSchedule
		? formatRecurringItems(recurringSchedule, (key) => t(key))
		: [];

	if (!recurringSchedule) {
		return (
			<div className="rounded-xl border border-outline-variant bg-card p-4">
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex min-w-0 items-start gap-3">
						<div className="mt-0.5 rounded-full bg-surface-container-low p-2">
							<Repeat2 className="h-4 w-4 text-on-surface" />
						</div>
						<div className="min-w-0 flex-1 space-y-1">
							<p className="text-base font-semibold text-on-surface">
								{t("schedules:recurring.sectionTitle")}
							</p>
							<p className="max-w-[34ch] text-sm leading-6 text-on-surface-variant">
								{t("schedules:recurring.emptyDescription")}
							</p>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={onCreate}
						className="w-full sm:w-auto"
					>
						{t("schedules:recurring.createAction")}
					</Button>
				</div>
			</div>
		);
	}

	return (
		<Accordion
			defaultValue={[]}
			className="rounded-xl border-outline-variant bg-card"
		>
			<AccordionItem
				value="recurring-schedule"
				className="border-outline-variant data-open:bg-transparent"
			>
				<AccordionTrigger className="gap-3 p-4 text-left hover:no-underline">
					<div className="mt-0.5 rounded-full bg-surface-container-low p-2">
						<Repeat2 className="h-4 w-4 text-on-surface" />
					</div>
					<div className="min-w-0 flex-1 space-y-3">
						<div className="min-w-0 space-y-2">
							<p className="text-base font-semibold text-on-surface">
								{t("schedules:recurring.sectionTitle")}
							</p>
							<div className="flex flex-wrap gap-2">
								<Badge
									variant="outline"
									className="inline-flex max-w-full gap-1 self-start whitespace-normal text-left"
								>
									<CalendarRange className="mt-0.5 h-3 w-3 shrink-0" />
									<span>
										{t("schedules:recurring.startsOn", {
											date: recurringSchedule.startDate,
										})}
									</span>
								</Badge>
								<Badge variant="outline" className="inline-flex gap-1">
									{recurringSchedule.type === "ONLINE" ? (
										<Monitor className="h-3 w-3 shrink-0" aria-hidden="true" />
									) : (
										<MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
									)}
									<span>{t(`schedules:type.${recurringSchedule.type}`)}</span>
								</Badge>
							</div>
						</div>

						<div className="flex flex-wrap gap-2">
							{recurringItems.map((item) => (
								<Badge
									key={item.id}
									variant="outline"
									className="min-w-0 bg-surface-container-low px-2.5 py-1 text-xs font-medium text-on-surface"
								>
									{item.weekday}
								</Badge>
							))}
						</div>
					</div>
				</AccordionTrigger>

				<AccordionContent className="space-y-4 border-t border-outline-variant pl-[2.75rem] sm:pl-[3.75rem]">
					<ul className="space-y-2">
						{recurringItems.map((item) => (
							<li
								key={item.id}
								className="flex items-start justify-between gap-3 rounded-lg bg-surface-container-low px-3 py-2"
							>
								<div className="min-w-0">
									<p className="text-sm font-medium leading-5 text-on-surface">
										{item.weekday}
									</p>
									<p className="text-sm leading-5 text-on-surface-variant">
										{item.startTime}
									</p>
								</div>
								<span className="shrink-0 text-sm font-medium leading-5 text-on-surface">
									{item.durationLabel}
								</span>
							</li>
						))}
					</ul>
					<p className="max-w-[34ch] text-xs leading-6 text-on-surface-variant">
						{t("schedules:recurring.editHint")}
					</p>
					<Button
						variant="outline"
						size="sm"
						leftIcon={Pencil}
						onClick={onEdit}
						className="w-full sm:w-auto"
					>
						{t("schedules:recurring.editAction")}
					</Button>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}
