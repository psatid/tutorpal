import { useId, useRef, useMemo } from "react";
import type { Control, FieldPath, FieldValues, ControllerRenderProps } from "react-hook-form";
import { useController } from "react-hook-form";

interface RHFFormFieldAdapterResult<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TValue = string,
  TElement extends HTMLElement = HTMLInputElement,
> {
  id: string;
  name: TName;
  value: TValue;
  error: string | undefined;
  disabled: boolean;
  required: boolean;
  onChange: (value: TValue) => void;
  onBlur: () => void;
  fieldRef: React.RefObject<TElement | null>;
  field: ControllerRenderProps<TFieldValues, TName>;
}

export function useRHFFormFieldAdapter<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TValue = string,
  TElement extends HTMLElement = HTMLInputElement,
>(
  control: Control<TFieldValues>,
  name: TName,
  disabled?: boolean,
): RHFFormFieldAdapterResult<TFieldValues, TName, TValue, TElement> {
  const generatedId = useId();
  const id = generatedId;
  const fieldRef = useRef<TElement>(null);
  
  const {
    field,
    fieldState: { error },
  } = useController<TFieldValues, TName>({
    name,
    control,
    disabled,
  });

  const adapter = useMemo(
    () => ({
      id,
      name,
      value: field.value as TValue,
      error: error?.message,
      disabled: field.disabled ?? false,
      required: false, // Can be inferred from schema if needed
      onChange: (value: TValue) => {
        field.onChange(value);
      },
      onBlur: field.onBlur,
      fieldRef,
      field,
    }),
    [id, name, field, error, fieldRef],
  );

  return adapter;
}
