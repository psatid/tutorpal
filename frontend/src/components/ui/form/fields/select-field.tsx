import { Select, type SelectOption } from "@/components/ui/select";
import { FormFieldItem } from "../form-field-item";
import type { FormFieldItemProps } from "../types";
import { useFormFieldItem } from "../use-form-field-item";

interface SelectFieldSelectProps {
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export type SelectFieldProps = Omit<FormFieldItemProps<string, HTMLButtonElement>, "children"> & {
  options: SelectOption[];
  selectProps?: Omit<SelectFieldSelectProps, "options">;
};

export const SelectFormFieldItem = ({ 
  options, 
  ...selectProps 
}: SelectFieldSelectProps) => {
  const {
    error,
    onChange,
    disabled,
    value: contextValue,
    onBlur,
  } = useFormFieldItem<string, HTMLButtonElement>();

  return (
    <Select
      options={options}
      value={contextValue}
      onChange={(value) => onChange?.(value ?? "")}
      onBlur={onBlur}
      error={error}
      disabled={disabled || selectProps.disabled}
      placeholder={selectProps.placeholder}
      className={selectProps.className}
    />
  );
};

export const SelectField = ({ options, selectProps, ...formFieldItemProps }: SelectFieldProps) => {
  return (
    <FormFieldItem {...formFieldItemProps}>
      <SelectFormFieldItem options={options} {...selectProps} />
    </FormFieldItem>
  );
};
