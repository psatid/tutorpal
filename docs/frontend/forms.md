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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFInputField, RHFSelectField } from "@/components/ui/form/rhf";
import { Button } from "@/components/ui/button";
import { studentSchema, type StudentFormData } from "@/types/student";
import { useCreateStudent } from "@/hooks/mutations/use-create-student";

export function StudentForm() {
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const mutation = useCreateStudent();

  const onSubmit = (data: StudentFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <RHFInputField
        control={control}
        name="name"
        label="Name"
        inputProps={{ placeholder: "Enter name" }}
      />

      <RHFInputField
        control={control}
        name="email"
        label="Email"
        inputProps={{ type: "email", placeholder: "Enter email" }}
      />

      <RHFSelectField
        control={control}
        name="grade"
        label="Grade"
        placeholder="Select grade"
        options={gradeOptions}
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
import { RHFInputField } from "@/components/ui/form/rhf";

<RHFInputField
  control={control}
  name="email"
  label="Email"
  description="Your email address"
  inputProps={{
    type: "email",
    placeholder: "you@example.com",
    leftIcon: Mail,
  }}
/>
```

### Select/Dropdown

```typescript
import { RHFSelectField } from "@/components/ui/form/rhf";

<RHFSelectField
  control={control}
  name="grade"
  label="Grade"
  description="Select the student's grade"
  placeholder="Select grade"
  options={[
    { value: "6", label: "Grade 6" },
    { value: "7", label: "Grade 7" },
  ]}
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

The project provides built-in RHF field components in `@/components/ui/form/rhf`:

### RHFInputField

Wraps `Controller` + `InputField`. Errors are automatically extracted from field state.

```typescript
import { RHFInputField } from "@/components/ui/form/rhf";

<RHFInputField
  control={control}
  name="email"
  label="Email"
  description="Optional hint text"
  inputProps={{
    type: "email",
    placeholder: "you@example.com",
    leftIcon: Mail,
  }}
/>
```

### RHFSelectField

Wraps `Controller` + `FormField` + `SelectInput`.

```typescript
import { RHFSelectField } from "@/components/ui/form/rhf";

<RHFSelectField
  control={control}
  name="grade"
  label="Grade"
  placeholder="Select grade"
  options={[
    { value: "6", label: "Grade 6" },
    { value: "7", label: "Grade 7" },
  ]}
/>
```

### Composable FormField

For custom inputs, use `FormField` directly with children:

```typescript
import { FormField } from "@/components/ui/form/form-field";

<FormField label="Custom Field" error={errors.custom?.message}>
  <MyCustomInput {...register("custom")} />
</FormField>
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
