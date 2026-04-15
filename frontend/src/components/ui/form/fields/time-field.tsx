import { useFormFieldItem } from "../use-form-field-item";
import type { FormFieldItemProps } from "../types";

export type TimeFieldInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "aria-invalid" | "id" | "name" | "disabled" | "value" | "onChange" | "onBlur" | "type"
> & {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export type TimeFieldProps = Omit<FormFieldItemProps<string, HTMLInputElement>, "children"> & {
  inputProps?: TimeFieldInputProps;
};

export const TimeFormFieldItem = (inputProps: TimeFieldInputProps) => {
  const {
    error,
    id,
    onChange,
    disabled,
    value: contextValue,
    onBlur,
    fieldRef,
  } = useFormFieldItem<string, HTMLInputElement>();

  return (
    <input
      {...inputProps}
      type="time"
      aria-invalid={!!error}
      id={id}
      disabled={disabled}
      value={(contextValue as string) ?? ""}
      onBlur={onBlur}
      ref={fieldRef}
      onChange={(e) => {
        onChange?.(e.target.value);
        inputProps.onChange?.(e);
      }}
      className="flex h-14 w-full rounded-xl border border-outline bg-surface px-4 py-2 font-body text-base text-on-surface shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
    />
  );
};

export const TimeField = ({ inputProps, ...formFieldItemProps }: TimeFieldProps) => {
  return (
    <FormFieldItem {...formFieldItemProps}>
      <TimeFormFieldItem {...inputProps} />
    </FormFieldItem>
  );
};

// Import FormFieldItem here to avoid circular dependency
import { FormFieldItem } from "../form-field-item";
