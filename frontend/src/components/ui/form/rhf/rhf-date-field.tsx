"use client";

import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { FormFieldItem } from "../form-field-item";
import { useRHFFormFieldAdapter } from "./use-rhf-form-field-adapter";
import { DateFormFieldItem, type DateFieldProps } from "../fields/date-field";

type DateFieldInputProps = DateFieldProps["inputProps"];

export type RHFDateFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  caption?: string;
  inputProps?: Omit<DateFieldInputProps, "value" | "onChange" | "onBlur" | "name" | "id">;
  disabled?: boolean;
} & Pick<DateFieldProps, "orientation">;

export function RHFDateField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  caption,
  inputProps,
  orientation,
  disabled,
}: RHFDateFieldProps<TFieldValues, TName>) {
  const adapter = useRHFFormFieldAdapter<TFieldValues, TName, string, HTMLButtonElement>(
    control,
    name,
    disabled,
  );

  return (
    <FormFieldItem<string, HTMLButtonElement>
      label={label}
      caption={caption}
      id={adapter.id}
      name={adapter.name}
      value={adapter.value}
      error={adapter.error}
      disabled={adapter.disabled}
      onChange={adapter.onChange}
      onBlur={adapter.onBlur}
      fieldRef={adapter.fieldRef}
      orientation={orientation}
    >
      <DateFormFieldItem {...inputProps} />
    </FormFieldItem>
  );
}
