import { Clock3 } from "lucide-react";
import { Input, type InputProps } from "@/components/ui/input";
import { cn } from "@/lib/utils";
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
  return (
    <FormField
      label={label}
      caption={caption}
      error={error}
      required={required}
      disabled={disabled}
      orientation={orientation}
    >
      <Input
        type="time"
        leftIcon={Clock3}
        className={cn("[&::-webkit-calendar-picker-indicator]:opacity-0", className)}
        disabled={disabled}
        {...inputProps}
      />
    </FormField>
  );
}

export { TimeField };
