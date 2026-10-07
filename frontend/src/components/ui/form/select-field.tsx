import {
  SelectInput,
  type SelectInputProps,
} from "@/components/ui/select";
import { useId } from "react";
import { FormField } from "./form-field";

type SelectFieldProps<T = string> = SelectInputProps<T> & {
  label?: string;
  caption?: string;
  error?: string | string[];
  required?: boolean;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
  ariaLabelledBy?: string;
};

function SelectField<T = string>({
  label,
  caption,
  error,
  required,
  disabled,
  orientation,
  ariaLabelledBy,
  ...selectProps
}: SelectFieldProps<T>) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const triggerId = `select-${generatedId}`;
  const labelId = `${triggerId}-label`;
  const captionId = `${triggerId}-description`;
  const errorId = `${triggerId}-error`;
  const describedBy = [caption ? captionId : null, error ? errorId : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <FormField
      label={label}
      labelId={labelId}
      htmlFor={triggerId}
      caption={caption}
      captionId={captionId}
      error={error}
      errorId={errorId}
      required={required}
      disabled={disabled}
      orientation={orientation}
    >
      <SelectInput
        disabled={disabled}
        {...selectProps}
        triggerProps={{
          id: triggerId,
          "aria-labelledby": ariaLabelledBy
            ? [label ? labelId : null, ariaLabelledBy].filter(Boolean).join(" ")
            : undefined,
          "aria-describedby": describedBy,
          "aria-invalid": !!error,
          "aria-errormessage": error ? errorId : undefined,
        }}
      />
    </FormField>
  );
}

export { SelectField };
