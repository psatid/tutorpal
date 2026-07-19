import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { DateTime } from "@/lib/date-time";
import { FormField } from "./form-field";
import { useState } from "react";

interface DateFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  caption?: string;
  error?: string | string[];
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function DateField({
  value,
  onChange,
  label,
  caption,
  error,
  required,
  disabled,
  placeholder = "Pick a date",
  className,
}: DateFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const date = DateTime.tryFromDateOnlyString(value)?.toDate();

  const handleSelect = (selected: Date | undefined) => {
    if (selected && onChange) {
      onChange(DateTime.from(selected).toDateOnlyString());
      setIsOpen(false);
    }
  };

  return (
    <FormField
      label={label}
      caption={caption}
      error={error}
      required={required}
      disabled={disabled}
    >
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-start gap-2 rounded-4xl border border-input bg-input/30 px-3 py-1 text-left text-sm transition-colors outline-none hover:bg-input/50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-primary/40 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-primary/40",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0" />
          {date ? DateTime.from(date).format("PPP") : <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelect}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </FormField>
  );
}

export { DateField, type DateFieldProps };
