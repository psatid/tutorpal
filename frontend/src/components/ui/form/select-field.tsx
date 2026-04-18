import {
  SelectInput,
  type SelectInputProps,
} from "@/components/ui/select";
import { FormField } from "./form-field";

type SelectFieldProps<T = string> = SelectInputProps<T> & {
  label?: string;
  caption?: string;
  error?: string | string[];
  required?: boolean;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
};

function SelectField<T = string>({
  label,
  caption,
  error,
  required,
  disabled,
  orientation,
  ...selectProps
}: SelectFieldProps<T>) {
  return (
    <FormField
      label={label}
      caption={caption}
      error={error}
      required={required}
      disabled={disabled}
      orientation={orientation}
    >
      <SelectInput disabled={disabled} {...selectProps} />
    </FormField>
  );
}

export { SelectField };
