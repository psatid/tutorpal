import { Input, type InputProps } from "@/components/ui/input";
import { FormField, type FormFieldProps } from "./form-field";

type InputFieldProps = Omit<FormFieldProps, "children"> & InputProps;

function InputField({
  label,
  description,
  error,
  required,
  orientation,
  className,
  ...inputProps
}: InputFieldProps) {
  return (
    <FormField
      label={label}
      description={description}
      error={error}
      required={required}
      orientation={orientation}
      className={className}
    >
      <Input aria-invalid={!!error} {...inputProps} />
    </FormField>
  );
}

export { InputField, type InputFieldProps };
