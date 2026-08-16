# React Query and Domain Model Convention

This guide defines how TutorPal integrates API-backed server state with TanStack
Query. Use it for new features and when refactoring existing ones.

> **Adoption status:** students are the reference implementation for this
> convention. Students, classes, and courses now use raw `use-fetch-*.ts`
> hooks, stable selected domain hooks, resource-owned keys, and class models in
> `src/models/`. Schedules remain the next migration candidate.

The admin portal follows the same generated-client boundary. Its Orval
configuration lives at `admin-frontend/orval.config.ts`, and its ignored client
output is regenerated automatically before development and production builds.

## Goals

- Keep the TanStack Query cache in the raw API-response shape.
- Give every API caller one focused, reusable raw query hook.
- Transform raw payloads into class-based domain models with `select`.
- Keep API schema knowledge out of screens and components.
- Centralize entity behavior, formatting, status checks, and UI-ready derived
  data in model classes.
- Use stable, resource-owned query keys and explicit cache reconciliation.

## Data flow

```text
OpenAPI contract
  -> Orval-generated endpoint types and API client
  -> raw endpoint query hook (returns response.data)
  -> feature/domain hook (select)
  -> model class static factory
  -> model instances or envelopes of model instances
  -> screens and components
```

The raw endpoint response remains in the TanStack Query cache. `select` derives
model instances for the observer that needs them; it does not replace the
cached raw response. This lets different app surfaces select different domain
representations from the same endpoint cache when necessary.

## Source layout

The target ownership is:

- `src/api/generated/` — Orval-generated API clients and wire types. Never
  edit these files manually.
- `src/lib/api-client.ts` — the shared Axios instance and generated client.
- `src/constants/query-keys/` — one key factory per resource, for example
  `students-query-keys.ts`.
- `src/types/base-query.ts` — shared query-option contracts.
- `src/hooks/queries/` — raw endpoint hooks and feature/domain hooks.
- `src/hooks/mutations/` — write operations and cache reconciliation.
- `src/models/` — domain model classes and their internal plain data types.
- `src/screens/` and `src/components/` — rendering, local interaction state,
  and translated copy.

Existing files may be migrated incrementally. Do not mix a generated API type
into a component merely because the feature has not been fully migrated yet.

## 1. Define resource-owned query keys

Create one file per resource under `src/constants/query-keys/`. Keys are
deterministic and include every input that can change the response.

```ts
// src/constants/query-keys/students-query-keys.ts
import type { StudentListFilters } from "@/types/student-query";

export const studentsQueryKeys = {
  all: ["students"] as const,
  lists: () => [...studentsQueryKeys.all, "list"] as const,
  list: (filters?: StudentListFilters) =>
    [...studentsQueryKeys.lists(), filters] as const,
  infinites: () => [...studentsQueryKeys.all, "infinite"] as const,
  infinite: (filters?: Omit<StudentListFilters, "page">) =>
    [...studentsQueryKeys.infinites(), filters] as const,
  details: () => [...studentsQueryKeys.all, "detail"] as const,
  detail: (studentId: string) =>
    [...studentsQueryKeys.details(), studentId] as const,
} as const;
```

Rules:

- Build narrow keys from broad prefixes so invalidation is intentional.
- Normal and infinite queries always use separate keys because their cached
  shapes differ.
- Normalize equivalent optional inputs before creating the key.
- Never use a literal key such as `["courses"]` outside its key factory.
- Mutation hooks invalidate the narrowest correct key prefix and use the same
  resource factory as query hooks.

## 2. Share query option contracts

Add these types to `src/types/base-query.ts` when implementing the convention:

```ts
import type { InfiniteData } from "@tanstack/react-query";

export type BaseQuery<T, N> = {
  select?: (data: N | undefined) => Awaited<T>;
  enabled?: boolean;
  placeholderData?: N | ((previousData: N | undefined) => N | undefined);
};

export type BaseInfiniteQuery<T, N> = {
  select?: (data: InfiniteData<N> | undefined) => Awaited<T>;
  enabled?: boolean;
  placeholderData?:
    | InfiniteData<N>
    | ((
        previousData: InfiniteData<N> | undefined,
      ) => InfiniteData<N> | undefined);
};
```

`N` is the raw API payload stored in the query cache. `T` is the selected
result exposed to the caller. Raw endpoint hooks own `queryKey` and `queryFn`;
callers may supply only the safe options defined above.

## 3. Create one raw hook per API caller

Each generated endpoint call receives a raw query hook. It returns
`response.data`, not the Axios response object, and it does not construct a
model inside `queryFn`.

```ts
import type { GetV1StudentsById200 } from
  "@/api/generated/models/getV1StudentsById200";
import { useQuery } from "@tanstack/react-query";
import { studentsQueryKeys } from "@/constants/query-keys/students-query-keys";
import { apiClient } from "@/lib/api-client";
import type { BaseQuery } from "@/types/base-query";

type FetchStudentByIdParams<T> = {
  studentId: string | null;
} & BaseQuery<T, GetV1StudentsById200>;

export function useFetchStudentById<T = GetV1StudentsById200>({
  studentId,
  ...options
}: FetchStudentByIdParams<T>) {
  return useQuery({
    queryKey: studentsQueryKeys.detail(studentId ?? ""),
    queryFn: async () =>
      (await apiClient.getV1StudentsById(studentId!)).data,
    ...options,
    enabled: studentId !== null && (options.enabled ?? true),
  });
}
```

Rules:

- Use an object parameter so required inputs and query options are explicit.
- A raw hook has one endpoint/query behavior. For example, a paginated list and
  its infinite-query version are separate hooks because their query behavior
  and cache shapes differ.
- Combine endpoint prerequisites with caller-provided `enabled` after spreading
  options so invalid input cannot enable a request.
- Keep navigation, toasts, and component state out of query hooks.
- Import generated request and response types only at this API boundary or in
  a model factory.

## 4. Select domain models in feature hooks

Feature hooks compose raw hooks with a stable selector. The selector creates
models through static factories and returns the UI-facing domain result.

```ts
import type { GetV1StudentsById200 } from
  "@/api/generated/models/getV1StudentsById200";
import { Student } from "@/models/student";
import { useFetchStudentById } from "./use-fetch-student-by-id";

const selectStudentDetails = (
  data: GetV1StudentsById200 | undefined,
): Student | undefined =>
  data ? Student.fromGetStudentByIdResponse(data) : undefined;

export function useStudentDetails(studentId: string | null) {
  return useFetchStudentById<Student | undefined>({
    studentId,
    select: selectStudentDetails,
  });
}
```

Keep selectors at module scope whenever possible. TanStack Query reruns a
selection when either the raw data or selector reference changes; a module-level
selector avoids work caused solely by a new inline function on each render.

For list responses, return a plain envelope containing model instances:

```ts
type StudentList = {
  students: Student[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

const selectStudentList = (
  data: GetV1Students200 | undefined,
): StudentList | undefined =>
  data
    ? {
        students: data.data.map(Student.fromListItem),
        pagination: data.pagination,
      }
    : undefined;
```

The list envelope is a plain object; every entity inside it is a model
instance. For infinite queries, select `InfiniteData<RawPage>` into an object
whose `pages` are those same plain envelopes and whose `pageParams` are
preserved.

## 5. Encapsulate mapping and behavior in model classes

Models are classes, not exported mapper functions or passive response aliases.
They own a private internal plain-data shape, static factory methods for API
responses, and the behavior required by their consumers.

```ts
import type { GetV1Students200DataItem } from
  "@/api/generated/models/getV1Students200DataItem";
import type { GetV1StudentsById200 } from
  "@/api/generated/models/getV1StudentsById200";

export type StudentDetails = {
  id: string;
  name: string;
  phoneNumber: string | null;
  grade: number;
  lineLinkStatus: "linked" | "needs_relink" | "not_linked";
  classes: Array<{
    id: string;
    displayName: string;
    totalHours: number;
    remainingHours?: number;
  }>;
};

export class Student {
  constructor(private readonly data: StudentDetails) {}

  static fromListItem(response: GetV1Students200DataItem): Student {
    return new Student({
      id: response.id,
      name: response.name,
      phoneNumber: response.phoneNumber,
      grade: response.grade,
      lineLinkStatus: response.lineLinkStatus,
      classes: [],
    });
  }

  static fromGetStudentByIdResponse(response: GetV1StudentsById200): Student {
    return new Student({
      id: response.id,
      name: response.name,
      phoneNumber: response.phoneNumber,
      grade: response.grade,
      lineLinkStatus: response.lineLinkStatus,
      classes: response.classes.map((classItem) => ({
        id: classItem.id,
        displayName: classItem.displayName,
        totalHours: classItem.totalHours,
        remainingHours: classItem.remainingHours,
      })),
    });
  }

  getId() {
    return this.data.id;
  }

  getName() {
    return this.data.name;
  }

  getInitials() {
    return this.data.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  isLineLinked() {
    return this.data.lineLinkStatus === "linked";
  }

  needsLineRelink() {
    return this.data.lineLinkStatus === "needs_relink";
  }

  getListItemData() {
    return {
      id: this.getId(),
      name: this.getName(),
      initials: this.getInitials(),
      phoneNumber: this.data.phoneNumber,
      grade: this.data.grade,
      isLineLinked: this.isLineLinked(),
      needsLineRelink: this.needsLineRelink(),
    };
  }

  getClasses() {
    return this.data.classes;
  }
}
```

Rules:

- Within a model module, generated types may be imported only for static
  factories and their private helpers. The model's stored data and public return
  types are application-owned plain types.
- Do not export `toStudent`, `mapStudent`, or similar standalone mappers.
  Private normalization helpers in the same file are allowed when a factory is
  complex, but callers use only the model factory.
- Keep raw fields private. Expose focused getters, predicates, formatters, and
  view-data methods instead of a public `data` object.
- Put entity-specific business logic, status checks, initials, date/hour
  formatting, and UI-ready derived values on the model. Locale-sensitive
  formatting may accept a locale or call a shared non-React utility.
- Do not import React, React hooks, router hooks, or i18n hooks into models.
  Components retain translated labels and interaction behavior.
- A model may provide multiple factories for different API response shapes,
  such as list items and detail responses.

## 6. Keep components API-agnostic

Screens compose domain hooks, navigation, loading/error/empty states, and local
UI state. Components receive model instances or values returned by model
methods. They must not import generated API types, call generated client
methods, or construct query-key arrays.

Prefer model methods such as `student.getListItemData()` or
`student.isLineLinked()` over repeating field access and formatting in every
component. Keep translated strings in components; models return semantic data
and booleans, not translated copy.

## 7. Infinite queries

An infinite endpoint hook still caches raw pages. It uses `BaseInfiniteQuery`
and selects model envelopes after TanStack Query assembles `InfiniteData`.

```ts
const selectInfiniteStudents = (
  data: InfiniteData<GetV1Students200> | undefined,
) =>
  data
    ? {
        pages: data.pages.map((page) => ({
          students: page.data.map(Student.fromListItem),
          pagination: page.pagination,
        })),
        pageParams: data.pageParams,
      }
    : undefined;
```

The raw infinite hook owns `initialPageParam`, page-size policy, and
`getNextPageParam`. The feature hook owns this selector. Components flatten
selected pages only when they need a flat render list.

## 8. Mutations and cache reconciliation

Mutation hooks own application commands, endpoint calls, and affected-cache
reconciliation. Mutation responses that do not reach the UI do not require a
model factory.

Rules:

- Convert an application command or form value to the generated request body
  inside the mutation hook.
- Invalidate or update every resource affected by the backend change, using
  resource-owned key factories only.
- Await invalidations before invoking a success callback when the callback
  assumes active data is fresh.
- Remove a deleted entity's detail key with `removeQueries` when retaining it
  could show stale UI.
- Keep drawer closing, navigation, and caller-specific toast copy in callbacks
  or UI code. A mutation hook may own a message that is identical for all
  callers.

## Checklist for a new API integration

- [ ] Confirm or regenerate the Orval endpoint and response types.
- [ ] Add the resource key factory in `src/constants/query-keys/`.
- [ ] Add a raw query hook for the endpoint; return `response.data`.
- [ ] Add a feature hook with a stable selector that creates model instances.
- [ ] Add a model class with private plain data and static response factories.
- [ ] Put formatting, predicates, and reusable derived data on the model.
- [ ] Keep generated API types out of screens and components.
- [ ] Use `BaseInfiniteQuery` for infinite endpoints.
- [ ] Handle pending, error, empty, and background-fetch states explicitly.
- [ ] Reconcile affected caches through key factories after mutations.

## Refactoring order

Adopt the convention feature by feature:

1. Add resource-owned query keys and shared query option types.
2. Add model classes and their static factories.
3. Replace mapper-style query functions with raw endpoint hooks.
4. Add domain hooks that select model instances from raw responses.
5. Update screens and components to use model methods and model-derived data.
6. Move cache reconciliation into the related mutation hooks.
7. Build and exercise the migrated feature before starting the next one.

Students, classes, and courses establish the working reference. Migrate
schedules next, following the same raw-hook, stable-selector, and class-model
boundaries.
