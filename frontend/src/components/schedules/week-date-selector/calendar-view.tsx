import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DateTime } from "@/lib/date-time";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDown,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React from "react";
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
} from "react-day-picker";

export interface CalendarViewProps {
  selected: Date | null;
  onSelect: (date: Date | undefined) => void;
  className?: string;
}

export function CalendarView({
  selected,
  onSelect,
  className,
}: CalendarViewProps) {
  return (
    <div className={cn("py-3 px-3", className)}>
      <InlineCalendar selected={selected} onSelect={onSelect} />
    </div>
  );
}

function InlineCalendar({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (date: Date | undefined) => void;
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      mode="single"
      selected={selected || undefined}
      onSelect={onSelect}
      showOutsideDays={true}
      captionLayout="label"
      className="w-full group/calendar relative"
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: cn("flex flex-col gap-4", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 select-none aria-disabled:opacity-50",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center text-sm font-medium",
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          "font-medium select-none text-sm",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 text-[0.75rem] font-normal text-muted-foreground select-none py-1",
          defaultClassNames.weekday
        ),
        week: cn("mt-1 flex w-full", defaultClassNames.week),
        day: cn(
          "group/day relative aspect-square h-full w-full rounded-full p-0 text-center select-none",
          defaultClassNames.day
        ),
        today: cn(
          "rounded-full bg-muted text-foreground",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground aria-selected:text-muted-foreground",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-50",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <HugeiconsIcon
                icon={ArrowLeftIcon}
                strokeWidth={2}
                className={cn("size-4", className)}
                {...props}
              />
            );
          }
          if (orientation === "right") {
            return (
              <HugeiconsIcon
                icon={ArrowRightIcon}
                strokeWidth={2}
                className={cn("size-4", className)}
                {...props}
              />
            );
          }
          return (
            <HugeiconsIcon
              icon={ChevronDown}
              strokeWidth={2}
              className={cn("size-4", className)}
              {...props}
            />
          );
        },
        DayButton: ({ ...props }) => <CalendarDayButton {...props} />,
      }}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={DateTime.from(day.date).format("P")}
      data-selected={modifiers.selected}
      className={cn(
        "relative isolate z-10 flex aspect-square size-auto w-full min-w-8 flex-col gap-0 border-0 leading-none font-normal rounded-full transition-all duration-200",
        "hover:bg-muted",
        "data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground data-[selected=true]:hover:bg-primary/90",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}
