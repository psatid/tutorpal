import * as React from "react";
import type { FormFieldItemContextValue } from "./types";

export const FormFieldItemContext = React.createContext<
  FormFieldItemContextValue<unknown, HTMLElement> | undefined
>(undefined);

export function useFormFieldItemContext<
  TValue = string,
  TElement extends HTMLElement = HTMLInputElement,
>(): FormFieldItemContextValue<TValue, TElement> | undefined {
  const context = React.useContext(FormFieldItemContext);
  return context as FormFieldItemContextValue<TValue, TElement> | undefined;
}
