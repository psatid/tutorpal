"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FormFieldItem } from "../form-field-item";
import { useFormFieldItem } from "../use-form-field-item";
import type { FormFieldItemProps } from "../types";

export type DateFieldInputProps = {
  placeholder?: string;
};

export type DateFieldProps = Omit<FormFieldItemProps<string, HTMLButtonElement>, "children"> & {
  inputProps?: DateFieldInputProps;
};

export const DateFormFieldItem = (inputProps: DateFieldInputProps) => {
  const {
    error,
    id,
    onChange,
    disabled,
    value: contextValue,
    onBlur,
    fieldRef,
  } = useFormFieldItem<string, HTMLButtonElement>();

  const [open, setOpen] = useState(false);

  // Convert string value (YYYY-MM-DD) to Date object for Calendar
  const selectedDate = contextValue ? parseISO(contextValue) : undefined;

  // Format date for display
  const displayValue = contextValue
    ? format(parseISO(contextValue), "PPP")
    : inputProps.placeholder ?? "Pick a date";

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      // Format as YYYY-MM-DD for the form value
      const formattedDate = format(date, "yyyy-MM-dd");
      onChange?.(formattedDate);
    } else {
      onChange?.("");
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={fieldRef}
          id={id}
          variant="outline"
          disabled={disabled}
          aria-invalid={!!error}
          onBlur={onBlur}
          className={cn(
            "flex h-14 w-full rounded-xl border border-outline bg-surface px-4 py-2 font-body text-base text-on-surface shadow-sm transition-colors",
            "justify-start text-left font-normal",
            "hover:bg-surface hover:text-on-surface",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !contextValue && "text-on-surface-variant"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {displayValue}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export const DateField = ({ inputProps, ...formFieldItemProps }: DateFieldProps) => {
  return (
    <FormFieldItem {...formFieldItemProps}>
      <DateFormFieldItem {...inputProps} />
    </FormFieldItem>
  );
};
