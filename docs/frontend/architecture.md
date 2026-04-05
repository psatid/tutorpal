# Frontend Architecture

This document covers the fundamental architectural patterns and project organization.

## Directory Organization

```
src/
├── api/                   # API integration
│   └── generated/         # Auto-generated API clients (Orval)
├── components/            # React components
│   ├── layout/            # Layout components (bottom-nav, top-app-bar)
│   └── ui/                # shadcn/ui + Base UI primitives
├── constants/             # App-wide constants
├── hooks/                 # Custom React hooks
│   ├── mutations/         # TanStack Query mutations
│   └── queries/           # TanStack Query hooks + query keys
├── i18n/                  # i18n configuration
├── lib/                   # Utility functions & clients
├── locales/               # Translation files
├── routes/                # TanStack Router file-based routes
├── screens/               # Screen components (page logic)
├── types/                 # TypeScript types + Zod schemas
└── [entry files]
```

## Core Principle: Thin Routes

**Golden Rule**: Route files (`src/routes/`) contain ONLY imports. No implementation logic.

### ❌ Bad (implementation in route)

```typescript
// src/routes/_layout/students.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
// ... 200+ lines of component code ...

export const Route = createFileRoute("/_layout/students")({
  component: StudentsPage,
});
```

### ✅ Good (thin route)

```typescript
// src/routes/_layout/students.tsx
import { createFileRoute } from "@tanstack/react-router";
import { StudentScreen } from "@/screens/student-screen";

export const Route = createFileRoute("/_layout/students")({
  component: StudentScreen,
});
```

## Screens Contain All Implementation

All page-level logic lives in `src/screens/*.tsx`:

- Component composition
- State management
- Feature components
- Form handling
- UI layout

Example structure:

```typescript
// src/screens/student-screen.tsx
export function StudentScreen() {
  return (
    <div>
      <EditorialHeader />
      <SearchInput />
      <StudentList />
      <AddStudentFAB />
    </div>
  );
}

function EditorialHeader() { /* ... */ }
function SearchInput() { /* ... */ }
function StudentList() { /* ... */ }
function AddStudentFAB() { /* ... */ }
```

## File Naming Conventions

### Kebab-Case Everywhere

```
✅ src/components/add-student-drawer.tsx
✅ src/hooks/queries/use-students.ts
✅ src/screens/student-screen.tsx
✅ src/types/student.ts
```

### No Nested Folders in Screens

```
✅ screens/student-screen.tsx
❌ screens/students/index.tsx
```

### No Nested Folders in Hooks

Flat structure for hooks:

```
✅ hooks/mutations/use-create-student.ts
❌ hooks/mutations/students/use-create-student.ts
```

### Screen Files

Screen files should be named with the `-screen` suffix:

```
✅ student-screen.tsx
❌ student.tsx
❌ students-page.tsx
```

## Feature Components

Feature-specific components that don't belong in `ui/` can live alongside screens or in a dedicated folder:

```
components/
├── students/              # Feature-specific components
│   └── add-student-drawer.tsx
├── layout/                # Layout components
└── ui/                    # Reusable primitives
```

## Constants

Keep app-wide constants in `src/constants/`:

```typescript
// src/constants/routes.ts
export const APP_ROUTES = {
  HOME: "/",
  STUDENTS: "/students",
  CLASSES: "/classes",
  SCHEDULES: "/schedules",
} as const;
```

## Utilities

Place utility functions in `src/lib/`:

```typescript
// src/lib/utils.ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// src/lib/api-client.ts
export const apiClient = getTutorPalAPI(axiosInstance);
```

## Best Practices

### Route Organization
- ✅ Route files are thin - only import from screens/
- ✅ All page logic lives in screens/
- ✅ Use descriptive file names matching URL segments

### Component Design
- ✅ Keep components small and single-purpose
- ✅ Co-locate related sub-components in the same file
- ✅ Extract reusable components to `components/ui/`

### File Naming
- ✅ Use kebab-case for all files
- ✅ No nested folders in screens/
- ✅ No nested folders in hooks/
- ✅ Use descriptive, consistent naming

### Type Safety
- ✅ Use generated types from `api/generated/models/`
- ✅ Define Zod schemas in `src/types/*.ts`
- ✅ Export both types and schemas from the same file
