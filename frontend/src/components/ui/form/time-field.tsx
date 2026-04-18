import { Input, type InputProps } from "@/components/ui/input";
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
        className={className}
        disabled={disabled}
        {...inputProps}
      />
    </FormField>
  );
}

export { TimeField };
