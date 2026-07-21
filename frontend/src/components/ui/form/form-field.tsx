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
  htmlFor?: string;
  caption?: string;
  error?: string | string[];
  required?: boolean;
  disabled?: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
  className?: string;
  children: React.ReactNode;
}

function FormField({
  label,
  htmlFor,
  caption,
  error,
  required,
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
        <FieldLabel htmlFor={htmlFor}>
          {label}
          {required && <span className="text-destructive">*</span>}
        </FieldLabel>
      )}
      <FieldContent>
        {children}
        {caption && <FieldDescription>{caption}</FieldDescription>}
        {errors && <FieldError errors={errors} />}
      </FieldContent>
    </Field>
  );
}

export { FormField };
