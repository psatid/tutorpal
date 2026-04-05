import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { FormFieldItem } from "../form-field-item";
import { useRHFFormFieldAdapter } from "./use-rhf-form-field-adapter";
import { InputFormFieldItem, type InputFieldProps } from "../fields/input-field";

type InputFieldInputProps = InputFieldProps["inputProps"];

export type RHFInputFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  caption?: string;
  inputProps?: Omit<InputFieldInputProps, "value" | "onChange" | "onBlur" | "name" | "id">;
  disabled?: boolean;
} & Pick<InputFieldProps, "orientation">;

export function RHFInputField<
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
}: RHFInputFieldProps<TFieldValues, TName>) {
  const adapter = useRHFFormFieldAdapter<TFieldValues, TName, string, HTMLInputElement>(
    control,
    name,
    disabled,
  );

  return (
    <FormFieldItem<string, HTMLInputElement>
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
      <InputFormFieldItem {...inputProps} />
    </FormFieldItem>
  );
}
