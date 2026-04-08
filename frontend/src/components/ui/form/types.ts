import type { FocusEvent, RefObject } from "react";

export interface FormFieldItemContextValue<
  TValue = string,
  TElement extends HTMLElement = HTMLInputElement,
> {
  id: string;
  name: string;
  value: TValue | undefined;
  error: string | undefined;
  disabled: boolean;
  required: boolean;
  onChange: (value: TValue) => void;
  onBlur: (event: FocusEvent<TElement>) => void;
  fieldRef: RefObject<TElement | null>;
}

export type FormFieldItemOrientation = "vertical" | "horizontal" | "responsive";

export interface FormFieldItemProps<
  TValue = string,
  TElement extends HTMLElement = HTMLInputElement,
> {
  id?: string;
  name?: string;
  label?: React.ReactNode;
  caption?: React.ReactNode;
  value?: TValue;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  orientation?: FormFieldItemOrientation;
  onChange?: (value: TValue) => void;
  onBlur?: (event: FocusEvent<TElement>) => void;
  fieldRef?: RefObject<TElement | null>;
  children: React.ReactNode;
}
