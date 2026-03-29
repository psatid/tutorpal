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
| **Radix UI** | Accessible component foundations |
| **Framer Motion** | Animation library |
| **Orval** | OpenAPI client generator |
| **Axios** | HTTP client |

## Directory Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── api/               # API integration
│   │   └── generated/     # Auto-generated API clients (Orval)
│   ├── components/        # React components
│   │   ├── layout/       # Layout components (TopAppBar, BottomNav)
│   │   └── ui/           # shadcn/ui component primitives
│   ├── constants/        # App-wide constants
│   │   └── routes.ts     # Route path constants
│   ├── lib/              # Utility functions
│   │   └── utils.ts      # General utilities (cn, etc.)
│   ├── routes/           # TanStack Router file-based routes
│   │   ├── __root.tsx    # Root route (QueryClient provider)
│   │   ├── _layout.tsx   # Layout wrapper (app shell)
│   │   ├── _layout/      # Nested routes under layout
│   │   └── routeTree.gen.ts # Auto-generated route tree
│   ├── types/            # TypeScript type definitions
│   ├── index.css         # Global styles & Tailwind directives
│   ├── main.tsx          # Application entry point
│   └── vite-env.d.ts     # Vite type definitions
├── .gitignore
├── bun.lock              # Dependency lock file
├── components.json       # shadcn/ui configuration
├── index.html            # HTML template
├── orval.config.ts       # OpenAPI client generator config
├── package.json          # Dependencies & scripts
├── postcss.config.js     # PostCSS configuration
├── tsconfig.json         # TypeScript configuration
├── tsconfig.node.json    # TypeScript config for build scripts
└── vite.config.ts        # Vite configuration
```

## Architecture Patterns

### Routing: File-Based with TanStack Router

The application uses **TanStack Router's file-based routing** system. Route structure determines the URL hierarchy:

```
src/routes/
├── __root.tsx           → / (root)
├── _layout.tsx          → Layout wrapper
├── _layout/
│   ├── index.tsx        → / (home)
│   ├── classes.tsx      → /classes
│   ├── schedules.tsx    → /schedules
│   └── students.tsx     → /students
```

**Key Files:**
- `__root.tsx`: Root route that provides the `QueryClient` to the entire app
- `_layout.tsx`: Shared layout wrapper with TopAppBar and BottomNav
- `routeTree.gen.ts`: Auto-generated route tree (do not edit manually)

**Route Naming Convention:**
- `__root.tsx` - Root layout
- `_layout.tsx` - Named layout (appears as `/`)
- `_layout/page.tsx` - Route under layout (`/page`)

### API Integration: Orval-Generated Clients

API clients are **automatically generated** from the backend's OpenAPI spec:

```typescript
// src/api/generated/tutorPalAPI.ts
// Auto-generated, do not edit manually

// src/api/generated/models/
// Type definitions auto-generated from API schemas
```

**Regenerating API Clients:**
```bash
npm run generate:api
```

This fetches the OpenAPI spec from `http://localhost:3000/v1/docs/open-api` and generates TypeScript clients.

**For complete OpenAPI workflow documentation**, see [`docs/openapi-workflow.md`](./openapi-workflow.md) which covers:
- How backend defines routes with OpenAPI metadata
- How the OpenAPI spec is generated and served
- How to download the spec to a file
- How Orval generates type-safe API clients
- Complete end-to-end development workflow

### Component Organization

Components are organized by **functionality** rather than file type:

```
src/components/
├── layout/       # Structural, app-wide components
│   ├── TopAppBar.tsx
│   └── BottomNav.tsx
└── ui/           # Reusable, design system primitives
    ├── button.tsx
    └── avatar.tsx
```

**Adding UI Components (shadcn/ui):**
The project uses shadcn/ui as a component library. Components are added as source code, not dependencies.

### Styling: Tailwind CSS 4 + CSS Variables

- **Tailwind CSS 4**: Utility-first CSS framework
- **CSS Variables**: Design tokens defined in `src/index.css`
- **@ Alias**: Import `@/components/...` resolves to `src/components/...`

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
- `tailwind.cssVariables: true` - Using CSS variables for theming
- Import aliases configured for clean imports

### `orval.config.ts`

OpenAPI client generation:
- Source: Backend OpenAPI spec
- Output: `./src/api/generated`
- Mode: Split (separate files for models and client)
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

- TypeScript compilation (`tsc`)
- Vite build (bundles to `dist/`)

### Preview Production Build

```bash
npm run preview
```

### Regenerating API Clients

```bash
npm run generate:api
```

Run this after backend API changes.

## Design System Integration

The frontend implements the **Academic Atelier** design system (see `docs/design.md`):

- **Typography**: Manrope (headlines) + Inter (body)
- **Colors**: Scholarly purple tonal palette
- **Components**: Gradient buttons, no-border inputs, glassmorphism
- **Layout**: Editorial asymmetry, generous whitespace

**Design Tokens in Tailwind:**
- `surface`, `surface-container-*`: Background layers
- `primary`, `primary-container`: Brand colors
- `on-surface`: Primary text color

## Backend Integration

### API Proxy

Vite proxies API requests to the backend:

```
http://localhost:3001/v1/* → http://localhost:3000/v1/*
```

This avoids CORS issues during development.

### Data Fetching

Use **TanStack Query** (`@tanstack/react-query`) for data fetching:

```typescript
import { useQuery } from '@tanstack/react-query'
import { tutorPalAPI } from '@/api/generated/tutorPalAPI'

function useClasses() {
  return useQuery({
    queryKey: ['classes'],
    queryFn: () => tutorPalAPI.endpoints.getClasses(),
  })
}
```

## Best Practices

### 1. Route Organization
- Group related routes under layout files (`_layout/`)
- Use descriptive file names matching URL segments
- Keep route components focused on rendering, move logic to hooks

### 2. Component Design
- Keep components small and single-purpose
- Use Radix UI primitives for accessible components
- Extend shadcn/ui components rather than creating from scratch

### 3. Type Safety
- Never modify `api/generated/*` files
- Use generated types from `api/generated/models/`
- Leverage TanStack Router's type-safe navigation

### 4. Styling
- Use Tailwind utility classes for styling
- Reference design system tokens (avoid arbitrary values)
- Maintain CSS variables in `src/index.css`

### 5. State Management
- Use TanStack Query for server state
- Use React state for local component state
- Consider global state via Context if needed

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
