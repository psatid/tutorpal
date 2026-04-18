import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

type FormFieldProps = React.ComponentProps<"div"> & {
  label?: string;
  description?: string;
  error?: string | string[];
  required?: boolean;
  orientation?: "vertical" | "horizontal" | "responsive";
};

function FormField({
  label,
  description,
  error,
  required,
  orientation = "vertical",
  className,
  children,
  ...props
}: FormFieldProps) {
  const errors = Array.isArray(error)
    ? error.map((e) => ({ message: e }))
    : error
      ? [{ message: error }]
      : undefined;

  return (
    <Field
      data-invalid={!!error}
      orientation={orientation}
      className={cn(className)}
      {...props}
    >
      {label && (
        <FieldLabel>
          {label}
          {required && <span className="text-destructive">*</span>}
        </FieldLabel>
      )}
      <FieldContent>
        {children}
        {description && <FieldDescription>{description}</FieldDescription>}
        {errors && <FieldError errors={errors} />}
      </FieldContent>
    </Field>
  );
}

export { FormField, type FormFieldProps };
