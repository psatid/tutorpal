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

## 1. Define a translated schema factory outside the component

Keep feature schemas and their inferred types under `frontend/src/types/`.
The schema is the source of truth for validation and should also normalize
values before submission, such as trimming names or converting numeric input.

Validation messages must be created with the current translator rather than at
module load. Export a schema factory that accepts `TFunction`, call it from the
form with `t`, and infer types from its return value:

```ts
export function createCourseSchema(t: TFunction) {
  return z.object({
    name: z.string().trim().min(1, t("courses:validation.courseName")),
  });
}

export type CourseFormData = z.output<ReturnType<typeof createCourseSchema>>;
```

```tsx
const { t } = useTranslation("courses");
const form = useForm<CourseFormInput, unknown, CourseFormData>({
  resolver: zodResolver(createCourseSchema(t)),
});
```

This keeps future validation attempts aligned with the active UI language while
preserving the same parsed form output and API request shape.

When input and output types differ, export both and pass all three generics to
`useForm`:

```ts
const form = useForm<CourseFormInput, unknown, CourseFormData>({
  resolver: zodResolver(createCourseSchema(t)),
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
The shared `Input` hides browser spinner controls on `type="number"` fields.
Scrolling the wheel while a numeric field is focused blurs that field before
the browser can step its value, leaving wheel scrolling available to the page
or drawer. Keyboard arrows, `min`/`max`/`step`, and numeric input semantics remain.

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

`DateField` uses a read-only shared `Input` with a leading calendar icon as its
default trigger. The input opens an anchored calendar on desktop; below the
`md` breakpoint it opens the calendar in a nested drawer, which avoids shifting
the parent form drawer while keeping the same date-only form value. The default
input opens with click, Enter, or Space and regains focus when the mobile drawer
closes. Callers can provide a custom trigger for controls such as the schedule
week selector.

In Add New Schedule, one-time duration and each selected recurring weekday use
numeric selects with 30-minute choices from 30 minutes through 3 hours; each
weekday keeps its own duration, defaulting to 60 minutes. Edit mode also offers
the stored duration when an older schedule falls outside those choices. The
select trigger is linked to its visible label, caption, and error. Each
recurring duration also includes its weekday in the accessible name.

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

Drawer actions for data-entry forms are full width at every breakpoint. Keep
their text-only labels free of icons; field icons and labelled icon-only drawer
close controls remain appropriate. Shared `Button` loading replaces the visible
label and icons with three centered decorative dots, keeps an accessible label
and busy state, preserves the button width, and uses static dots when reduced
motion is preferred.

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
