import { Input, type InputProps } from "../input";
import { cn } from "../../lib/utils";
import { Clock03Icon as Clock3HugeIcon } from "@hugeicons/core-free-icons";
import { type ChangeEvent, type FocusEvent, useId, useState } from "react";
import { FormField } from "./form-field";

type TimeFieldProps = Omit<InputProps, "type"> & {
  label?: string;
  caption?: string;
  error?: string | string[];
  required?: boolean;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
};

function TimeField({
  label,
  caption,
  error,
  required,
  disabled,
  orientation,
  className,
  placeholder,
  value,
  defaultValue,
  onChange,
  onFocus,
  onBlur,
  ...inputProps
}: TimeFieldProps) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = inputProps.id ?? `time-${generatedId}`;
  const [isFocused, setIsFocused] = useState(false);
  const [uncontrolledValue, setUncontrolledValue] = useState(() =>
    String(defaultValue ?? ""),
  );
  const hasValue =
    value === undefined
      ? uncontrolledValue.length > 0
      : String(value ?? "").length > 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (value === undefined) {
      setUncontrolledValue(event.target.value);
    }
    onChange?.(event);
  };

  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  return (
    <FormField
      label={label}
      htmlFor={inputId}
      caption={caption}
      error={error}
      required={required}
      disabled={disabled}
      orientation={orientation}
      className="min-w-0"
    >
      <div className="relative w-full">
        <Input
          type="time"
          className={cn(
            "w-full min-w-0 max-w-full appearance-none box-border [&::-webkit-calendar-picker-indicator]:hidden",
            className,
          )}
          disabled={disabled}
          {...inputProps}
          id={inputId}
          leftIcon={Clock3HugeIcon}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          aria-required={required ? true : inputProps["aria-required"]}
        />
        {placeholder && !isFocused && !hasValue ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-9 right-3 z-10 flex items-center truncate text-base text-placeholder-foreground md:text-sm"
          >
            {placeholder}
          </span>
        ) : null}
      </div>
    </FormField>
  );
}

export { TimeField };
