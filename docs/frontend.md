# Frontend Project Structure

This document outlines the architecture and organization of the TutorPal frontend application.

## Overview

The frontend is a React-based Single Page Application (SPA) built with modern tooling and design principles. It follows the **"Academic Atelier"** design system philosophy, creating a refined, scholarly aesthetic.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool & dev server |
| **TanStack Router** | Type-safe file-based routing |
| **TanStack Query** | Data fetching & caching |
| **Tailwind CSS 4** | Utility-first styling |
| **shadcn/ui** | Component primitives |
| **Base UI** | Accessible component foundations (MUI) |
| **Framer Motion** | Animation library |
| **Orval** | OpenAPI client generator |
| **Axios** | HTTP client |
| **React Hook Form** | Form handling |
| **Zod** | Schema validation |

## Directory Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── api/               # API integration
│   │   └── generated/     # Auto-generated API clients (Orval) - DO NOT EDIT
│   ├── components/        # React components
│   │   ├── add-student-drawer.tsx    # Feature-specific component
│   │   ├── layout/        # Layout components
│   │   │   ├── bottom-nav.tsx
│   │   │   └── top-app-bar.tsx
│   │   └── ui/            # shadcn/ui + Base UI primitives
│   │       ├── avatar.tsx
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       └── select.tsx
│   ├── constants/         # App-wide constants
│   │   └── routes.ts      # Route path constants
│   ├── hooks/             # Custom React hooks
│   │   ├── mutations/     # TanStack Query mutations
│   │   │   └── use-create-student.ts
│   │   └── queries/       # TanStack Query hooks + query key factories
│   │       ├── query-keys.ts
│   │       └── use-students.ts
│   ├── lib/               # Utility functions & clients
│   │   ├── api-client.ts  # Initialized API client
│   │   └── utils.ts       # General utilities (cn, etc.)
│   ├── routes/            # TanStack Router file-based routes (thin layer)
│   │   ├── __root.tsx     # Root route (QueryClient provider)
│   │   ├── _layout.tsx    # Layout wrapper
│   │   ├── _layout/       # Nested routes - ONLY import screens, no implementation
│   │   │   ├── index.tsx  # Dashboard route
│   │   │   ├── students.tsx
│   │   │   ├── classes.tsx
│   │   │   └── schedules.tsx
│   │   └── routeTree.gen.ts  # Auto-generated
│   ├── screens/           # Screen components (all page logic lives here)
│   │   ├── dashboard-screen.tsx
│   │   ├── student-screen.tsx
│   │   ├── classes-screen.tsx
│   │   └── schedules-screen.tsx
│   ├── types/             # TypeScript type definitions + Zod schemas
│   │   └── student.ts     # Types, interfaces, and validation schemas
│   ├── index.css          # Global styles & Tailwind directives
│   ├── main.tsx           # Application entry point
│   └── vite-env.d.ts      # Vite type definitions
├── .gitignore
├── components.json        # shadcn/ui configuration
├── index.html
├── orval.config.ts        # OpenAPI client generator config
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Architecture Patterns

### 1. Route Layer is a Thin Layer

**Golden Rule**: Route files (`src/routes/`) contain ONLY imports. No implementation logic.

**❌ Bad (old pattern)**:
```typescript
// src/routes/_layout/students.tsx
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
// ... 200+ lines of component code ...

export const Route = createFileRoute("/_layout/students")({
  component: StudentsPage,  // Implementation here
});
```

**✅ Good (new pattern)**:
```typescript
// src/routes/_layout/students.tsx
import { createFileRoute } from "@tanstack/react-router";
import { StudentScreen } from "@/screens/student-screen";

export const Route = createFileRoute("/_layout/students")({
  component: StudentScreen,  // Just import from screens/
});
```

### 2. Screens Contain All Implementation

All page-level logic lives in `src/screens/*.tsx`:
- Component composition
- State management
- Feature components
- Form handling
- UI layout

### 3. File Naming Conventions

**Kebab-case everywhere**:
- `src/components/add-student-drawer.tsx`
- `src/hooks/queries/use-students.ts`
- `src/screens/student-screen.tsx`
- `src/types/student.ts`

**No folders in screens/**:
```
✅ screens/student-screen.tsx
❌ screens/students/index.tsx
```

**No folders in hooks/** (flat structure):
```
✅ hooks/mutations/use-create-student.ts
❌ hooks/mutations/students/use-create-student.ts
```

### 4. Base UI + shadcn/ui Components

All UI primitives use **Base UI** (from MUI) instead of Radix UI:

**Import Pattern**:
```typescript
// Base UI exports namespaces
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";

// Usage
<AvatarPrimitive.Root>
  <AvatarPrimitive.Image />
  <AvatarPrimitive.Fallback />
</AvatarPrimitive.Root>
```

**Available Components** (`src/components/ui/`):
- `avatar.tsx` - Base UI Avatar namespace
- `button.tsx` - Styled button (no Radix dependency)
- `input.tsx` - Base UI Field primitive
- `select.tsx` - Base UI Select namespace with simplified API

**Adding New Components**:
```bash
# Install from shadcn registry (will use Base UI if available)
npx shadcn add <component-name>

# Or create manually using Base UI primitives
```

### 5. Query Key Factory Pattern

Use centralized query key factories in `src/hooks/queries/query-keys.ts`:

```typescript
// src/hooks/queries/query-keys.ts
export const studentsKeys = {
  all: ["students"] as const,
  lists: () => [...studentsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...studentsKeys.lists(), filters] as const,
  details: () => [...studentsKeys.all, "detail"] as const,
  detail: (id: string) => [...studentsKeys.details(), id] as const,
};
```

**Usage in Query Hooks**:
```typescript
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "./query-keys";

export const useStudents = () => {
  return useQuery({
    queryKey: studentsKeys.lists(),
    queryFn: async () => {
      const response = await apiClient.getV1Students();
      return response.data;
    },
  });
};
```

**Usage in Mutations**:
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "@/hooks/queries/query-keys";

export const useCreateStudent = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateStudentInput) => {
      const response = await apiClient.postV1Students(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate using factory keys
      queryClient.invalidateQueries({ 
        queryKey: studentsKeys.lists() 
      });
    },
  });
};
```

### 6. API Client Setup

**Single initialized client** in `src/lib/api-client.ts`:

```typescript
import axios from "axios";
import { getTutorPalAPI } from "@/api/generated/tutorPalAPI";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

export const apiClient = getTutorPalAPI(axiosInstance);
```

**Usage**:
```typescript
import { apiClient } from "@/lib/api-client";

// All methods are typed from OpenAPI spec
const response = await apiClient.getV1Students();
const response = await apiClient.postV1Students(data);
const response = await apiClient.getV1StudentsById(id);
```

### 7. Types & Zod Schemas Together

Keep TypeScript types and Zod schemas in `src/types/*.ts`:

```typescript
// src/types/student.ts
import { z } from "zod";

// TypeScript interfaces
export interface Student {
  id: string;
  name: string;
  phone?: string;
  grade: number;
}

// Zod schemas for validation
export const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  grade: z.enum(["6", "7", "8", "9", "10", "11", "12"]),
});

// Derived type
export type StudentFormData = z.infer<typeof studentSchema>;
```

### 8. Form Handling Pattern

Use **React Hook Form** + **Zod** in screen components:

```typescript
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { studentSchema, type StudentFormData } from "@/types/student";
import { useCreateStudent } from "@/hooks/mutations/use-create-student";

function StudentForm() {
  const { register, handleSubmit, control, formState: { errors } } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });
  
  const mutation = useCreateStudent();
  
  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))}>
      <Input
        {...register("name")}
        error={errors.name?.message}
      />
      <Controller
        name="grade"
        control={control}
        render={({ field }) => (
          <Select
            options={gradeOptions}
            value={field.value}
            onChange={field.onChange}
            error={errors.grade?.message}
          />
        )}
      />
    </form>
  );
}
```

### 9. Routing: File-Based with TanStack Router

Route structure determines URL hierarchy:

```
src/routes/
├── __root.tsx           → / (root, provides QueryClient)
├── _layout.tsx          → Layout wrapper (TopAppBar, BottomNav)
├── _layout/
│   ├── index.tsx        → / (home/dashboard)
│   ├── classes.tsx      → /classes
│   ├── schedules.tsx    → /schedules
│   └── students.tsx     → /students
```

**Route Naming Convention**:
- `__root.tsx` - Root layout with providers
- `_layout.tsx` - Named layout (underscore = no URL segment)
- `_layout/page.tsx` - Route under layout

### 10. API Integration: Orval-Generated Clients

API clients are **automatically generated** from the backend's OpenAPI spec:

```bash
# Regenerate API clients
npm run generate:api
```

This fetches the OpenAPI spec from `http://localhost:3000/v1/docs/open-api`.

**For complete OpenAPI workflow documentation**, see [`docs/openapi-workflow.md`](./openapi-workflow.md).

## Key Configuration Files

### `vite.config.ts`

```typescript
// Plugin configuration
- @vitejs/plugin-react: React support
- @tanstack/router-plugin: Route generation
- @tailwindcss/vite: Tailwind integration

// Server
- Dev server on port 3001
- Proxy: `/v1/*` → `http://localhost:3000` (backend)

// Aliases
- @ → ./src
```

### `components.json`

shadcn/ui configuration:
- `rsc: false` - Not using React Server Components
- `tsx: true` - TypeScript JSX enabled
- `tailwind.cssVariables: true` - Using CSS variables

### `orval.config.ts`

OpenAPI client generation:
- Source: Backend OpenAPI spec
- Output: `./src/api/generated`
- Mode: Split (separate files)
- Client: Axios

## Development Workflow

### Starting the Dev Server

```bash
cd frontend
npm run dev
```

Server runs on `http://localhost:3001`

### Building for Production

```bash
npm run build
```

- TypeScript compilation
- Vite build to `dist/`

### Regenerating API Clients

```bash
npm run generate:api
```

Run after backend API changes.

## Design System Integration

The frontend implements the **Academic Atelier** design system (see `docs/design.md`):

- **Typography**: Manrope (headlines) + Inter (body)
- **Colors**: Scholarly purple tonal palette
- **Components**: Gradient buttons, no-border inputs, glassmorphism
- **Layout**: Editorial asymmetry, generous whitespace

## Backend Integration

### API Proxy

Vite proxies API requests to the backend:

```
http://localhost:3001/v1/* → http://localhost:3000/v1/*
```

### Data Fetching Pattern

```typescript
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "@/hooks/queries/query-keys";

function useStudents() {
  return useQuery({
    queryKey: studentsKeys.lists(),
    queryFn: () => apiClient.getV1Students(),
  });
}
```

## Best Practices

### 1. Route Organization
- ✅ Route files are thin - only import from screens/
- ✅ All page logic lives in screens/
- ✅ Use descriptive file names matching URL segments

### 2. Component Design
- ✅ Keep components small and single-purpose
- ✅ Use Base UI primitives for accessible components
- ✅ shadcn/ui components wrap Base UI with custom styling

### 3. Type Safety
- ❌ Never modify `api/generated/*` files
- ✅ Use generated types from `api/generated/models/`
- ✅ Use Zod schemas for form validation
- ✅ Leverage TanStack Router's type-safe navigation

### 4. Styling
- ✅ Use Tailwind utility classes
- ✅ Reference design system tokens
- ✅ Maintain CSS variables in `src/index.css`

### 5. State Management
- ✅ Use TanStack Query for server state
- ✅ Use React state for local component state
- ✅ Use query key factories for cache management

### 6. File Naming
- ✅ Use kebab-case for all files
- ✅ No nested folders in screens/
- ✅ No nested folders in hooks/ (flat structure)

## Troubleshooting

### API Client Out of Date
**Symptom**: TypeScript errors in generated API files
**Solution**: Run `npm run generate:api` with backend running

### Route Tree Not Updating
**Symptom**: New routes not recognized
**Solution**: Restart dev server (route tree regenerates on startup)

### Import Path Errors
**Symptom**: `@/` imports not resolving
**Solution**: Check `vite.config.ts` alias configuration

### Base UI Import Errors
**Symptom**: Properties not found on Base UI components
**Solution**: Base UI exports namespaces, not individual components:
```typescript
// Correct
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
<AvatarPrimitive.Root>...</AvatarPrimitive.Root>

// Incorrect
import * as AvatarPrimitive from "@base-ui/react/avatar";
```
