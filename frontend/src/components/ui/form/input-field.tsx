import { Input, type InputProps } from "@/components/ui/input";
import { FormField } from "./form-field";

export interface InputFieldProps extends InputProps {
  label?: string;
  caption?: string;
  error?: string | string[];
  required?: boolean;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
}

function InputField({
  label,
  caption,
  error,
  required,
  disabled,
  orientation,
  className,
  ...inputProps
}: InputFieldProps) {
  return (
    <FormField
      label={label}
      caption={caption}
      error={error}
      required={required}
      disabled={disabled}
      orientation={orientation}
    >
      <Input className={className} disabled={disabled} {...inputProps} />
    </FormField>
  );
}

export { InputField };
