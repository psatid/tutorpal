import { useMemo, useId, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Divider } from "@/components/ui/divider";
import { FormFieldItemContext } from "./form-field-context";
import type { FormFieldItemProps, FormFieldItemContextValue } from "./types";

function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {
  return (
    <fieldset
      data-slot="field-set"
      className={cn(
        "gap-4 has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3 flex flex-col",
        className,
      )}
      {...props}
    />
  );
}

function FieldLegend({
  className,
  variant = "legend",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        "mb-1.5 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base",
        className,
      )}
      {...props}
    />
  );
}

function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-group"
      className={cn(
        "gap-5 data-[slot=checkbox-group]:gap-3 *:data-[slot=field-group]:gap-4 group/field-group @container/field-group flex w-full flex-col",
        className,
      )}
      {...props}
    />
  );
}

const fieldVariants = cva("data-[invalid=true]:text-error gap-2 group/field flex w-full", {
  variants: {
    orientation: {
      vertical: "flex-col w-full [&>.sr-only]:w-auto",
      horizontal:
        "flex-row items-start gap-5 *:data-[slot=field-label]:flex-auto has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      responsive:
        "flex-col *:w-full [&>.sr-only]:w-auto md:flex-row @md/field-group:items-center @md/field-group:*:w-auto @md/field-group:*:data-[slot=field-label]:flex-auto @md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
    },
  },
  defaultVariants: {
    orientation: "vertical",
  },
});

export type FieldProps = React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>;

function Field({ className, orientation = "vertical", ...props }: FieldProps) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation={orientation}
      className={cn(fieldVariants({ orientation }), className)}
      {...props}
    />
  );
}

function FieldContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-content"
      className={cn("gap-0.5 group/field-content flex flex-1 flex-col leading-snug", className)}
      {...props}
    />
  );
}

export type FieldLabelProps = React.ComponentProps<typeof Label>;

function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <Label
      data-slot="field-label"
      className={cn(
        `text-on-surface group-data-[orientation=vertical]:text-sm group-data-[orientation=vertical]:font-medium
        group-data-[orientation=horizontal]:text-base group-data-[orientation=horizontal]:font-semibold
        group-data-[orientation=responsive]:text-sm group-data-[orientation=responsive]:font-medium
        group-data-[orientation=responsive]:md:text-base group-data-[orientation=responsive]:md:font-semibold`,
        className,
      )}
      {...props}
    />
  );
}

function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="field-label"
      className={cn(
        "gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50 flex w-fit items-center leading-snug",
        className,
      )}
      {...props}
    />
  );
}

export type FieldCaptionProps = React.ComponentProps<"p">;

function FieldCaption({ className, ...props }: FieldCaptionProps) {
  return (
    <p
      data-slot="field-caption"
      className={cn(
        `data-[orientation=vertical]:text-sm data-[orientation=vertical]:font-medium text-on-surface-variant 
        data-[orientation=horizontal]:text-base data-[orientation=horizontal]:font-semibold
        data-[orientation=responsive]:text-sm data-[orientation=responsive]:font-medium
        data-[orientation=responsive]:@md/field-group:text-base data-[orientation=responsive]:@md/field-group:font-semibold`,
        className,
      )}
      {...props}
    />
  );
}

function FieldSeparator({
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="field-separator"
      data-content={!!children}
      className={cn(
        "-my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2 relative",
        className,
      )}
      {...props}
    >
      <Divider className="absolute inset-0 top-1/2" />
      {children && (
        <span
          className="text-on-surface-variant px-2 bg-surface relative mx-auto block w-fit"
          data-slot="field-separator-content"
        >
          {children}
        </span>
      )}
    </div>
  );
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<"div"> & {
  errors?: Array<{ message?: string } | undefined>;
}) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

    if (uniqueErrors?.length == 1) {
      return uniqueErrors[0]?.message;
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
      </ul>
    );
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-sm text-error", className)}
      {...props}
    >
      {content}
    </div>
  );
}

function FormFieldItem<
  TValue = string,
  TElement extends HTMLElement = HTMLInputElement,
>({
  id: idProp,
  name: nameProp,
  label,
  caption,
  value,
  error,
  disabled = false,
  required = false,
  orientation = "vertical",
  onChange,
  onBlur,
  fieldRef: fieldRefProp,
  children,
}: FormFieldItemProps<TValue, TElement>) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const name = nameProp ?? id;
  const generatedRef = useRef<TElement>(null);
  const fieldRef = fieldRefProp ?? generatedRef;

  const contextValue = useMemo(
    () => ({
      id,
      name,
      value,
      error,
      disabled,
      required,
      onChange: onChange ?? (() => {}),
      onBlur: onBlur ?? (() => {}),
      fieldRef,
    } as FormFieldItemContextValue<TValue, TElement>),
    [id, name, value, error, disabled, required, onChange, onBlur, fieldRef],
  );

  return (
    <FormFieldItemContext.Provider value={contextValue as unknown as FormFieldItemContextValue<unknown, HTMLElement>}>
      <Field orientation={orientation} data-invalid={!!error} data-disabled={disabled}>
        {label && (
          <FieldLabel htmlFor={id} required={required}>
            {label}
          </FieldLabel>
        )}
        <FieldContent>
          {children}
          {caption && <FieldCaption>{caption}</FieldCaption>}
          {error && <FieldError>{error}</FieldError>}
        </FieldContent>
      </Field>
    </FormFieldItemContext.Provider>
  );
}

export {
  Field,
  FieldLabel,
  FieldCaption,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldContent,
  FieldTitle,
  FormFieldItem,
};
