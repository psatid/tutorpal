import { Input, type InputProps } from "@/components/ui/input";
import { FormField } from "./form-field";

export interface InputFieldProps extends InputProps {
  label?: string;
  caption?: string;
  captionId?: string;
  error?: string | string[];
  errorId?: string;
  required?: boolean;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
}

function InputField({
  label,
  caption,
  captionId,
  error,
  errorId,
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
      captionId={captionId}
      error={error}
      errorId={errorId}
      htmlFor={inputProps.id}
      required={required}
      disabled={disabled}
      orientation={orientation}
    >
      <Input
        className={className}
        disabled={disabled}
        required={required}
        {...inputProps}
      />
    </FormField>
  );
}

export { InputField };
