import { Input, type InputProps } from "@/components/ui/input";
import { FormFieldItem } from "../form-field-item";
import type { FormFieldItemProps } from "../types";
import { useFormFieldItem } from "../use-form-field-item";

export type InputFieldInputProps = Omit<InputProps, "aria-invalid" | "id" | "name" | "disabled" | "value" | "onChange" | "onBlur"> & {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export type InputFieldProps = Omit<FormFieldItemProps<string | number, HTMLInputElement>, "children"> & {
  inputProps?: InputFieldInputProps;
};

export const InputFormFieldItem = (inputProps: InputFieldInputProps) => {
  const {
    error,
    id,
    onChange,
    disabled,
    value: contextValue,
    onBlur,
    fieldRef,
  } = useFormFieldItem<string | number, HTMLInputElement>();

  return (
    <Input
      {...inputProps}
      aria-invalid={!!error}
      id={id}
      disabled={disabled}
      value={(contextValue as string) ?? ""}
      onBlur={onBlur}
      ref={fieldRef}
      onChange={(e) => {
        if (inputProps.type === "number") {
          onChange?.(e.target.valueAsNumber);
        } else {
          onChange?.(e.target.value);
        }
        inputProps.onChange?.(e);
      }}
    />
  );
};

export const InputField = ({ inputProps, ...formFieldItemProps }: InputFieldProps) => {
  return (
    <FormFieldItem {...formFieldItemProps}>
      <InputFormFieldItem {...inputProps} />
    </FormFieldItem>
  );
};
