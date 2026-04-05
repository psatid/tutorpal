import { useContext, useId } from "react";
import { FormFieldItemContext } from "./form-field-context";
import type { FormFieldItemContextValue } from "./types";

export function useFormFieldItem<
  TValue = string,
  TElement extends HTMLElement = HTMLInputElement,
>(): FormFieldItemContextValue<TValue, TElement> {
  const context = useContext(FormFieldItemContext);
  
  if (!context) {
    throw new Error(
      "useFormFieldItem must be used within a FormFieldItem component"
    );
  }
  
  return context as unknown as FormFieldItemContextValue<TValue, TElement>;
}

export function useFieldId(): string {
  return useId();
}
