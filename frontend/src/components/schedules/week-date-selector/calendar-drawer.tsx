import {
  Drawer,
  DrawerPortal,
  DrawerBackdrop,
  DrawerViewport,
  DrawerPopup,
  DrawerContent,
} from "@/components/ui/drawer";
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
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onSelectDate(date);
      onOpenChange(false);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerPortal>
        <DrawerBackdrop />
        <DrawerViewport>
          <DrawerPopup>
            <DrawerContent>
              <CalendarView selected={selectedDate} onSelect={handleDateSelect} />
            </DrawerContent>
          </DrawerPopup>
        </DrawerViewport>
      </DrawerPortal>
    </Drawer>
  );
}