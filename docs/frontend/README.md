# Frontend Documentation

Documentation for the TutorPal frontend application.

## Overview

The frontend is a React 19 Single Page Application (SPA) built with Vite, following the **"Academic Atelier"** design system philosophy. It uses TypeScript throughout for type safety and modern tooling for developer experience.

## Quick Links

| Topic | Description |
|-------|-------------|
| **[Architecture](./architecture.md)** | Project structure, thin routes pattern, naming conventions |
| **[Routing](./routing.md)** | TanStack Router file-based routing |
| **[API Integration](./api-integration.md)** | React Query/Mutation patterns, error handling, pagination |
| **[State Management](./state-management.md)** | TanStack Query caching, optimistic updates |
| **[Components](./components.md)** | Base UI primitives, shadcn/ui, component organization |
| **[Forms](./forms.md)** | React Hook Form, Zod validation |
| **[Development](./development.md)** | Dev workflow, config files, troubleshooting |
| **[i18n](./i18n.md)** | Internationalization setup |

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
| **i18next** | Internationalization |
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
│   │   └── generated/     # Auto-generated API clients (Orval)
│   ├── components/        # React components
│   │   ├── layout/        # Layout components (bottom-nav, top-app-bar)
│   │   └── ui/            # shadcn/ui + Base UI primitives
│   ├── constants/         # App-wide constants
│   ├── hooks/             # Custom React hooks
│   │   ├── mutations/     # TanStack Query mutations
│   │   └── queries/       # TanStack Query hooks + query keys
│   ├── i18n/              # i18n configuration
│   ├── lib/               # Utility functions & clients
│   ├── locales/           # Translation files
│   ├── routes/            # TanStack Router file-based routes
│   ├── screens/           # Screen components (page logic)
│   ├── types/             # TypeScript types + Zod schemas
│   ├── index.css          # Global styles
│   └── main.tsx           # Application entry point
└── [config files]
```

## Development Workflow

```bash
# Start dev server
cd frontend
npm run dev                    # http://localhost:3001

# Build for production
npm run build

# Regenerate API clients (after backend changes)
npm run generate:api
```

## Key Principles

1. **Thin Routes**: Route files contain only imports, no implementation
2. **Screens-First**: All page logic lives in `src/screens/`
3. **Type Safety**: Use generated API types, never modify generated files
4. **Kebab Case**: All files use kebab-case naming
5. **Flat Structure**: No nested folders in `screens/` or `hooks/`

See individual topic docs for detailed patterns and best practices.
