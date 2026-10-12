import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Clock3 } from "lucide-react";
import { useId } from "react";
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
  ...inputProps
}: TimeFieldProps) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const inputId = inputProps.id ?? `time-${generatedId}`;

  return (
    <FormField
      label={label}
      htmlFor={inputId}
      caption={caption}
      error={error}
      required={required}
      disabled={disabled}
      orientation={orientation}
    >
      <Input
        type="time"
        className={cn(
          "w-full min-w-0 max-w-full box-border [&::-webkit-calendar-picker-indicator]:hidden",
          className,
        )}
        disabled={disabled}
        {...inputProps}
        id={inputId}
        leftIcon={Clock3}
        aria-required={required ? true : inputProps["aria-required"]}
      />
    </FormField>
  );
}

export { TimeField };
