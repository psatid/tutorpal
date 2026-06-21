# Forms

TutorPal uses **React Hook Form** with **Zod** for type-safe, validated form handling.

## Overview

| Library | Purpose |
|---------|---------|
| **React Hook Form** | Form state management |
| **Zod** | Schema validation |
| **@hookform/resolvers** | Connect Zod to RHF |

## Basic Form Pattern

### 1. Define Zod Schema

```typescript
// src/types/student.ts
import { z } from "zod";

export const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Please enter a valid email"),
  grade: z.enum(["6", "7", "8", "9", "10", "11", "12"]),
  phone: z.string().optional(),
});

export type StudentFormData = z.infer<typeof studentSchema>;
```

### 2. Create Form Component

```typescript
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { studentSchema, type StudentFormData } from "@/types/student";
import { useCreateStudent } from "@/hooks/mutations/use-create-student";

export function StudentForm() {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const mutation = useCreateStudent();

  const onSubmit = (data: StudentFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register("name")}
        label="Name"
        error={errors.name?.message}
      />

      <Input
        {...register("email")}
        label="Email"
        type="email"
        error={errors.email?.message}
      />

      <Controller
        name="grade"
        control={control}
        render={({ field }) => (
          <Select
            label="Grade"
            options={gradeOptions}
            value={field.value}
            onChange={field.onChange}
            error={errors.grade?.message}
          />
        )}
      />

      <Button type="submit" loading={isSubmitting}>
        Create Student
      </Button>
    </form>
  );
}
```

## Form Fields with RHF

### Text Input

```typescript
import { Input } from "@/components/ui/input";

<Input
  {...register("name")}
  label="Name"
  placeholder="Enter name"
  error={errors.name?.message}
/>
```

### Select/Dropdown

```typescript
import { Controller } from "react-hook-form";
import { Select } from "@/components/ui/select";

<Controller
  name="grade"
  control={control}
  render={({ field }) => (
    <Select
      label="Grade"
      options={[
        { value: "6", label: "Grade 6" },
        { value: "7", label: "Grade 7" },
      ]}
      value={field.value}
      onChange={field.onChange}
      error={errors.grade?.message}
    />
  )}
/>
```

### Date Picker

```typescript
import { RHFDateField } from "@/components/ui/form/rhf";

<RHFDateField
  control={control}
  name="date"
  label="Date"
  caption="Required"
/>
```

The date picker uses shadcn's Calendar component (built on react-day-picker) with a popover. It outputs dates in YYYY-MM-DD format to match your schema.

### Password Input

```typescript
import { RHFPasswordField } from "@/components/ui/form/rhf";
import { Lock } from "lucide-react";

<RHFPasswordField
  control={control}
  name="password"
  label="Password"
  inputProps={{
    placeholder: "Enter your password",
    leftIcon: Lock,
  }}
/>
```

Use `RHFPasswordField` for auth and any other password entry flow. It reuses the shared form field styling, manages its own show/hide state per field, and exposes an accessible toggle button without changing your form schema or submit payload.

### Checkbox

```typescript
<input
  type="checkbox"
  {...register("isActive")}
/>
```

### Radio Group

```typescript
<Controller
  name="gender"
  control={control}
  render={({ field }) => (
    <div>
      <label>
        <input
          type="radio"
          value="male"
          checked={field.value === "male"}
          onChange={() => field.onChange("male")}
        />
        Male
      </label>
      <label>
        <input
          type="radio"
          value="female"
          checked={field.value === "female"}
          onChange={() => field.onChange("female")}
        />
        Female
      </label>
    </div>
  )}
/>
```

## Validation Patterns

### Required Fields

```typescript
const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Email is required"),
});
```

### Optional Fields

```typescript
const schema = z.object({
  phone: z.string().optional(),
  notes: z.string().nullable(),
});
```

### Custom Validation

```typescript
const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

### Transform Values

```typescript
const schema = z.object({
  age: z.string().transform((val) => parseInt(val, 10)),
});
```

## Form Submission

### Basic Submit

```typescript
const onSubmit = (data: StudentFormData) => {
  console.log(data);
  // Send to API
};

<form onSubmit={handleSubmit(onSubmit)}>
```

### With Mutation

```typescript
const mutation = useCreateStudent();

const onSubmit = (data: StudentFormData) => {
  mutation.mutate(data, {
    onSuccess: () => {
      // Reset form
      reset();
      // Show success message
      toast.success("Student created!");
    },
    onError: (error) => {
      // Show error message
      toast.error(error.message);
    },
  });
};
```

### Async Submit

```typescript
const onSubmit = async (data: StudentFormData) => {
  try {
    await createStudent(data);
    reset();
  } catch (error) {
    console.error(error);
  }
};
```

## Form State

### Default Values

```typescript
const { register } = useForm<StudentFormData>({
  resolver: zodResolver(studentSchema),
  defaultValues: {
    name: "",
    email: "",
    grade: "6",
  },
});
```

### Reset Form

```typescript
const { reset } = useForm<StudentFormData>();

// Reset to default values
reset();

// Reset with new values
reset({
  name: "John Doe",
  email: "john@example.com",
});
```

### Watch Values

```typescript
const { watch } = useForm<StudentFormData>();

const name = watch("name");
const allValues = watch();

// Or use useWatch for better performance
import { useWatch } from "react-hook-form";

const grade = useWatch({ control, name: "grade" });
```

### Set Value Programmatically

```typescript
const { setValue } = useForm<StudentFormData>();

setValue("name", "John Doe");
setValue("grade", "8", { shouldValidate: true });
```

## Error Handling

### Display Field Errors

```typescript
const { formState: { errors } } = useForm();

<Input
  {...register("name")}
  error={errors.name?.message}
/>
```

### Form-Level Errors

```typescript
const { setError } = useForm();

// Set from API error
mutation.mutate(data, {
  onError: (error) => {
    setError("root", {
      message: error.message,
    });
  },
});

// Display
{errors.root && (
  <div className="text-red-500">{errors.root.message}</div>
)}
```

## Advanced Patterns

### Conditional Fields

```typescript
const schema = z.object({
  hasPhone: z.boolean(),
  phone: z.string().optional(),
}).refine((data) => !data.hasPhone || data.phone, {
  message: "Phone is required when checked",
  path: ["phone"],
});
```

### Dynamic Fields (Arrays)

```typescript
const { fields, append, remove } = useFieldArray({
  control,
  name: "subjects",
});

{fields.map((field, index) => (
  <div key={field.id}>
    <Input
      {...register(`subjects.${index}.name`)}
    />
    <button type="button" onClick={() => remove(index)}>
      Remove
    </button>
  </div>
))}

<button type="button" onClick={() => append({ name: "" })}>
  Add Subject
</button>
```

### Nested Forms

```typescript
const schema = z.object({
  student: z.object({
    name: z.string(),
    email: z.email(),
  }),
  parent: z.object({
    name: z.string(),
    phone: z.string(),
  }),
});

<Input {...register("student.name")} />
<Input {...register("parent.name")} />
```

## Reusable Form Components

### RHF Input Wrapper

```typescript
// src/components/form/rhf-input.tsx
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";

interface RHFInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
}

export function RHFInput({ name, label, ...props }: RHFInputProps) {
  const { register, formState: { errors } } = useFormContext();

  return (
    <Input
      {...register(name)}
      label={label}
      error={errors[name]?.message as string}
      {...props}
    />
  );
}
```

### Usage with FormProvider

```typescript
import { FormProvider, useForm } from "react-hook-form";

function MyForm() {
  const methods = useForm();

  return (
    <FormProvider {...methods}>
      <form>
        <RHFInput name="name" label="Name" />
        <RHFInput name="email" label="Email" type="email" />
      </form>
    </FormProvider>
  );
}
```

## Best Practices

### Schema Organization
- ✅ Keep Zod schemas in `src/types/*.ts`
- ✅ Export both schema and inferred type
- ✅ Use descriptive error messages

### Form Organization
- ✅ Use Controller for complex components (Select, DatePicker)
- ✅ Use register for simple inputs
- ✅ Handle loading and error states

### Validation
- ✅ Validate on submit (default)
- ✅ Use validate on blur for better UX
- ✅ Show clear error messages

### Type Safety
- ✅ Always type useForm with your schema
- ✅ Use z.infer for form data types
- ✅ Type register and control properly

## Troubleshooting

### Form Not Submitting

**Symptom**: handleSubmit not called

**Solution**: Check for validation errors:

```typescript
const onError = (errors) => {
  console.log("Validation errors:", errors);
};

<form onSubmit={handleSubmit(onSubmit, onError)}>
```

### Type Errors

**Symptom**: Type errors with register

**Solution**: Ensure useForm is properly typed:

```typescript
const { register } = useForm<StudentFormData>({
  resolver: zodResolver(studentSchema),
});
```

### Controller Not Working

**Symptom**: Controlled component not updating

**Solution**: Ensure field prop is spread:

```typescript
<Controller
  name="grade"
  control={control}
  render={({ field }) => (
    <Select
      {...field} // Spread field (value, onChange, onBlur, ref)
    />
  )}
/>
```
