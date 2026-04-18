import { Input, type InputProps } from "@/components/ui/input";
import { FormField } from "./form-field";

type DateFieldProps = Omit<InputProps, "type"> & {
  label?: string;
  caption?: string;
  error?: string | string[];
  required?: boolean;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
};

function DateField({
  label,
  caption,
  error,
  required,
  disabled,
  orientation,
  className,
  ...inputProps
}: DateFieldProps) {
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
        type="date"
        className={className}
        disabled={disabled}
        {...inputProps}
      />
    </FormField>
  );
}

export { DateField };
