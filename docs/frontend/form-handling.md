# Frontend Form Handling

TutorPal forms use Zod for validation and normalization, React Hook Form for
state, and the adapters in `frontend/src/components/ui/form/` for consistent
labels, descriptions, errors, disabled states, and controls.

Use `frontend/src/components/schedules/schedule-drawer.tsx` as the reference
for forms that load existing data, switch between create/view/edit modes, or
place their submit action in a drawer footer. The smaller
`frontend/src/components/courses/course-form.tsx` is the reference for a
create/edit form whose parent owns the drawer.

## Data flow

```text
Zod schema and inferred types
  -> useForm with zodResolver
  -> RHF field adapter
  -> shared field/control components
  -> handleSubmit
  -> mutation hook
```

## 1. Define the schema outside the component

Keep feature schemas and their inferred types under `frontend/src/types/`.
The schema is the source of truth for validation and should also normalize
values before submission, such as trimming names or converting numeric input.

When input and output types differ, export both and pass all three generics to
`useForm`:

```ts
const form = useForm<CourseFormInput, unknown, CourseFormData>({
  resolver: zodResolver(courseSchema),
  defaultValues: {
    name: "",
    defaultTotalHours: "",
  },
});
```

`CourseFormInput` describes values held by controls. `CourseFormData` describes
the validated, normalized object received by the submit handler.

## 2. Use the shared React Hook Form adapters

Prefer the adapters exported from `frontend/src/components/ui/form/rhf.tsx`:

- `RHFInputField`
- `RHFPasswordField`
- `RHFSelectField`
- `RHFDateField`
- `RHFTimeField`

They connect a control to React Hook Form and pass validation errors to the
shared `FormField`. Put native control properties inside `inputProps` or
`selectProps`.

`RHFInputField` generates a stable input ID and connects its label,
description, and validation error automatically. Pass an explicit `id` in
`inputProps` only when another element must reference the control.

```tsx
<RHFInputField
  control={form.control}
  inputProps={{ type: "number", min: 1 }}
  label="Duration"
  name="durationMinutes"
/>
```

Use the lower-level components such as `InputField`, `DateField`, and
`FormField` only when a control is not owned by React Hook Form. Do not recreate
label, description, error, or invalid-state markup in a feature component.

`DateField` uses an anchored calendar on desktop. Below the `md` breakpoint it
opens the calendar in a nested drawer, which avoids shifting the parent form
drawer while keeping the same date-only form value.

Its trigger exposes the controlled picker state as `data-state="open"` or
`"closed"` in both presentations, so custom triggers can style their open
state consistently.

## 3. Submit through `handleSubmit`

Wrap the mutation call with `handleSubmit`. The handler then receives validated
and normalized data and does not need a separate submitted flag or manual
validity checks.

```tsx
<form onSubmit={form.handleSubmit(onSubmit)}>
  {/* fields */}
</form>
```

Keep API mapping at this boundary when the form shape intentionally differs
from the request shape. Keep success/error feedback and query-cache updates in
the mutation hook.

## 4. Initialize and reset deliberately

Provide every field with a default value. A create form should start from a
single reusable empty-value object. An edit or view form should call `reset`
when its loaded entity or mode changes. A drawer should also reset when it
closes so values and validation errors do not leak into its next use.

Use `setValue` for a targeted update from a custom selector. Pass
`{ shouldValidate: true }` when the user action should immediately revalidate
that field. Prefer `reset` when replacing the whole form with fetched data.

Use `useWatch` when form values control conditional UI. Do not mirror a form
value in `useState`; duplicated state can make the rendered fields disagree
with the values validated and submitted by React Hook Form.

## 5. Support actions outside the form

Drawer and dialog footers may render outside the `<form>`. Give the form a
stable ID and connect the submit button with its `form` attribute:

```tsx
const FORM_ID = "schedule-drawer-form";

<form id={FORM_ID} onSubmit={form.handleSubmit(onSubmit)} />
<Button form={FORM_ID} type="submit">Save</Button>
```

Disable or show loading state on the submit action while its mutation is
pending. View mode should disable its controls and use a separate `type="button"`
action to enter edit mode.

## Checklist

- Schema and inferred types live outside the component.
- `useForm` uses `zodResolver` and complete default values.
- Shared `RHF*Field` adapters render standard controls and errors.
- `handleSubmit` is the only submission path.
- Fetched records populate the form with `reset`.
- Closing a reusable drawer clears values and validation state.
- Custom selectors use `setValue`; whole-record changes use `reset`.
- External submit buttons reference a stable form ID.
- Mutation hooks own server feedback and cache reconciliation.
