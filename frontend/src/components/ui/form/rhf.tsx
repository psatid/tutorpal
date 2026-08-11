import { type LucideIcon } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { useId } from "react";

import { InputField } from "./input-field";
import { PasswordField } from "./password-field";
import { SelectField } from "./select-field";
import { DateField } from "./date-field";
import { TimeField } from "./time-field";

interface RHFInputFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  caption?: string;
  captionId?: string;
  errorId?: string;
  required?: boolean;
  disabled?: boolean;
  inputProps?: Omit<React.ComponentProps<"input">, "name"> & {
    leftIcon?: LucideIcon;
  };
}

function RHFInputField<T extends FieldValues>({
  control,
  name,
  label,
  caption,
  captionId,
  errorId,
  required,
  disabled,
  inputProps,
}: RHFInputFieldProps<T>) {
  const generatedId = useId();
  const fieldId =
    inputProps?.id ?? `field-${generatedId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const resolvedCaptionId = caption
    ? (captionId ?? `${fieldId}-description`)
    : undefined;
  const resolvedErrorId = errorId ?? `${fieldId}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const { onChange, ...rest } = field;
        const describedBy = [
          inputProps?.["aria-describedby"],
          resolvedCaptionId,
          fieldState.error ? resolvedErrorId : undefined,
        ]
          .filter(Boolean)
          .join(" ") || undefined;

        return (
          <InputField
            {...rest}
            {...inputProps}
            id={fieldId}
            label={label}
            caption={caption}
            captionId={resolvedCaptionId}
            error={fieldState.error?.message}
            errorId={resolvedErrorId}
            required={required}
            disabled={disabled}
            aria-describedby={describedBy}
            aria-invalid={!!fieldState.error}
            aria-errormessage={
              fieldState.error
                ? resolvedErrorId
                : inputProps?.["aria-errormessage"]
            }
            onChange={(e) => {
              const isNumber = inputProps?.type === "number";
              if (isNumber) {
                onChange(parseFloat(e.target.value));
              } else {
                onChange(e.target.value);
              }
            }}
          />
        );
      }}
    />
  );
}

interface RHFPasswordFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  caption?: string;
  required?: boolean;
  disabled?: boolean;
  inputProps?: Omit<React.ComponentProps<"input">, "name" | "type"> & {
    leftIcon?: LucideIcon;
  };
}

function RHFPasswordField<T extends FieldValues>({
  control,
  name,
  label,
  caption,
  required,
  disabled,
  inputProps,
}: RHFPasswordFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PasswordField
          {...field}
          {...inputProps}
          label={label}
          caption={caption}
          error={fieldState.error?.message}
          required={required}
          disabled={disabled}
          aria-invalid={!!fieldState.error}
          onChange={(e) => field.onChange(e.target.value)}
        />
      )}
    />
  );
}

interface RHFSelectFieldProps<T extends FieldValues, O = string> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  caption?: string;
  required?: boolean;
  disabled?: boolean;
  options: { value: O; label: string }[];
  selectProps?: {
    placeholder?: string;
  };
}

function RHFSelectField<T extends FieldValues, O = string>({
  control,
  name,
  label,
  caption,
  required,
  disabled,
  options,
  selectProps,
}: RHFSelectFieldProps<T, O>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <SelectField
          value={field.value}
          onValueChange={field.onChange}
          options={options}
          placeholder={selectProps?.placeholder}
          label={label}
          caption={caption}
          error={fieldState.error?.message}
          required={required}
          disabled={disabled}
        />
      )}
    />
  );
}

interface RHFDateFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  caption?: string;
  required?: boolean;
  disabled?: boolean;
}

function RHFDateField<T extends FieldValues>({
  control,
  name,
  label,
  caption,
  required,
  disabled,
}: RHFDateFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <DateField
          {...field}
          label={label}
          caption={caption}
          error={fieldState.error?.message}
          required={required}
          disabled={disabled}
          aria-invalid={!!fieldState.error}
        />
      )}
    />
  );
}

interface RHFTimeFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  caption?: string;
  required?: boolean;
  disabled?: boolean;
}

function RHFTimeField<T extends FieldValues>({
  control,
  name,
  label,
  caption,
  required,
  disabled,
}: RHFTimeFieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TimeField
          {...field}
          label={label}
          caption={caption}
          error={fieldState.error?.message}
          required={required}
          disabled={disabled}
          aria-invalid={!!fieldState.error}
        />
      )}
    />
  );
}

export {
  RHFInputField,
  RHFPasswordField,
  RHFSelectField,
  RHFDateField,
  RHFTimeField,
};
