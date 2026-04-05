import type { Control, FieldPath, FieldValues } from "react-hook-form";
import type { SelectOption } from "@/components/ui/select";
import { FormFieldItem } from "../form-field-item";
import { useRHFFormFieldAdapter } from "./use-rhf-form-field-adapter";
import { SelectFormFieldItem, type SelectFieldProps } from "../fields/select-field";

export type RHFSelectFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  control: Control<TFieldValues>;
  name: TName;
  label: string;
  caption?: string;
  options: SelectOption[];
  selectProps?: Omit<SelectFieldProps["selectProps"], "value" | "onChange" | "onBlur">;
  disabled?: boolean;
} & Pick<SelectFieldProps, "orientation">;

export function RHFSelectField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  control,
  name,
  label,
  caption,
  options,
  selectProps,
  orientation,
  disabled,
}: RHFSelectFieldProps<TFieldValues, TName>) {
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
      <SelectFormFieldItem options={options} {...selectProps} />
    </FormFieldItem>
  );
}
