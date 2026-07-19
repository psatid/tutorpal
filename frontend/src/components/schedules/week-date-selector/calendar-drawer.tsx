import { useTranslation } from "react-i18next";
import { ResponsiveDrawer } from "@/components/ui/responsive-drawer";
import { CalendarView } from "./calendar-view";

export interface CalendarDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function CalendarDrawer({
  isOpen,
  onOpenChange,
  selectedDate,
  onSelectDate,
}: CalendarDrawerProps) {
	const { t } = useTranslation(["schedules"]);
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onSelectDate(date);
      onOpenChange(false);
    }
  };

	return (
		<ResponsiveDrawer
			open={isOpen}
			onOpenChange={onOpenChange}
			title={t("schedules:weekSelector.calendarTitle")}
		>
			<CalendarView selected={selectedDate} onSelect={handleDateSelect} />
		</ResponsiveDrawer>
	);
}
