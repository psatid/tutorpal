import {
  Field,
  FieldLabel,
  FieldContent,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label?: string;
  labelId?: string;
  htmlFor?: string;
  caption?: string;
  captionId?: string;
  error?: string | string[];
  errorId?: string;
  required?: boolean;
  requiredLabel?: string;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
  className?: string;
  children: React.ReactNode;
}

function FormField({
  label,
  labelId,
  htmlFor,
  caption,
  captionId,
  error,
  errorId,
  required,
  requiredLabel,
  disabled,
  orientation,
  className,
  children,
}: FormFieldProps) {
  const errors = error
    ? Array.isArray(error)
      ? error.map((e) => ({ message: e }))
      : [{ message: error }]
    : undefined;

  return (
    <Field
      orientation={orientation}
      data-invalid={!!error}
      data-disabled={disabled}
      className={cn("w-full", className)}
    >
      {label && (
        <FieldLabel htmlFor={htmlFor} id={labelId}>
          {label}
          {required && (
            <>
              <span aria-hidden="true" className="text-destructive">
                *
              </span>
              {requiredLabel ? (
                <span className="sr-only"> {requiredLabel}</span>
              ) : null}
            </>
          )}
        </FieldLabel>
      )}
      <FieldContent>
        {children}
        {caption && <FieldDescription id={captionId}>{caption}</FieldDescription>}
        {errors && <FieldError id={errorId} errors={errors} />}
      </FieldContent>
    </Field>
  );
}

export { FormField };
