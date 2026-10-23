# Frontend Domain Model Conventions

This guide defines the model boundary for the user-facing app in
`apps/frontend/`. The admin portal is outside this convention for now. For the
backend equivalent, see [Backend Model Conventions](../backend/domain-models.md).
For API and query wiring, see [React Query API Integration](react-query-api-integration.md).

## Responsibility boundary

Frontend domain models are class-based objects in `apps/frontend/src/models/` that
hold application-owned data and deterministic behavior. They own entity
mapping and normalization, business calculations and invariants, status and
eligibility decisions, domain-relevant state transitions, and derived domain
values that callers need to display.

Models remain independent of React and external effects. They do not fetch data,
update React state, navigate, access browser storage, render UI, or create
translated messages. A model operation receives its inputs and returns a value
or decision that its caller can act on.

## Data flows

For API data, keep the query cache in the raw response shape and select models
for the consuming query observer:

```text
API response -> raw query hook/cache -> feature hook select -> model factory
  -> model-derived values -> screen/component
```

Model factories map generated response types into private, application-owned
data. Use static factories for the response shapes a feature consumes; keep
generated API types at this boundary. The query and cache rules are in the
[React Query guide](react-query-api-integration.md).

For domain-related state changes, pass current values and the user's intent to
the model, then let the UI commit the returned value:

```ts
const result = model.applyAction(currentValue, action);
setValue(result.nextValue);
```

The model calculates the domain result without calling a setter or mutating
shared state. React Hook Form and React state continue to own drafts and
ephemeral view state such as open drawers, focus targets, and selected tabs.

## Model responsibilities

- Keep stored fields private and expose focused getters, predicates, and
  derived-data methods. A model may return a small view-ready data object when
  several callers need the same domain-derived values.
- Put feature-specific calculations, business invariants, domain normalization,
  and state-transition decisions on the owning model. Keep one-off helpers
  private in the model module.
- Expose formatted domain values through model methods, using shared formatters
  such as `DateTime` for dates, times, hours, and money. Keep translated labels,
  sentences, and component-specific wording in the UI.
- Keep model operations deterministic and side-effect free. Return a result,
  decision, or next value; do not call React setters, query clients, routers, or
  browser APIs from a model.
- Do not import React, React hooks, router hooks, or i18n hooks into models.

## Forms, validation, and utilities

React Hook Form owns form draft state. Zod schemas define the form input/output
shape, parse control values, validate field-level input, and create localized
validation messages. Simple form-boundary conversions or cleanup may stay in a
schema. Domain rules and canonicalization that must behave consistently across
callers belong to the model; a schema may call the model and map its result to
a localized field issue. Models do not import Zod or `TFunction`.

Keep feature-specific business logic on its model even when a form needs to
display a preview or validate a draft. Use shared utilities for generic
primitives such as `DateTime`, or for pure domain rules genuinely reused by
multiple models. Avoid creating a one-caller business utility. Presentation
details such as icons, CSS variants, translated labels, and focus behavior stay
with the UI.

## Adoption

Apply this convention to new features and incrementally when existing features
are refactored. It describes the target boundary; it does not require a broad
rewrite of current code. The React Query guide records the current adoption
status and migration order.

Schedules are the current example of a feature-owned model boundary: `Schedule`
maps list, detail, and awaiting-confirmation transport shapes and owns session
calculations and lifecycle predicates. `RecurringSchedulePattern` owns recurring
ordering, overlap checks, command conversion, and pure editor decisions, while
`RecurringSchedule` owns persisted-series behavior and affected-occurrence
counts. React Hook Form and components keep drafts, focus, translated copy, and
visual layout.
