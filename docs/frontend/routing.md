# Routing

TutorPal uses **TanStack Router** for type-safe, file-based routing.

## File-Based Routing

Routes are automatically generated from the file structure in `src/routes/`.

```
src/routes/
├── __root.tsx              → / (root, provides QueryClient)
├── _layout.tsx             → Layout wrapper (TopAppBar, BottomNav)
├── _layout/
│   ├── index.tsx           → / (home/dashboard)
│   ├── classes.tsx         → /classes
│   ├── schedules.tsx       → /schedules
│   └── students.tsx        → /students
```

## Route Naming Conventions

| Pattern | Meaning | Example |
|---------|---------|---------|
| `__root.tsx` | Root layout with providers | `__root.tsx` |
| `_layout.tsx` | Named layout (no URL segment) | `_layout.tsx` |
| `_layout/page.tsx` | Route under layout | `_layout/students.tsx` → `/students` |
| `folder/page.tsx` | Nested route | `blog/post.tsx` → `/blog/post` |

## Creating Routes

### 1. Create the Screen

First, create your screen component:

```typescript
// src/screens/my-feature-screen.tsx
export function MyFeatureScreen() {
  return <div>My Feature</div>;
}
```

### 2. Create the Route File

Create a thin route that imports the screen:

```typescript
// src/routes/_layout/my-feature.tsx
import { createFileRoute } from "@tanstack/react-router";
import { MyFeatureScreen } from "@/screens/my-feature-screen";

export const Route = createFileRoute("/_layout/my-feature")({
  component: MyFeatureScreen,
});
```

### 3. Restart Dev Server

The route tree regenerates on startup. Restart to see your new route.

## Route Configuration

### Basic Route

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { DashboardScreen } from "@/screens/dashboard-screen";

export const Route = createFileRoute("/_layout/")({
  component: DashboardScreen,
});
```

### Route with Parameters

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { StudentDetailScreen } from "@/screens/student-detail-screen";

export const Route = createFileRoute("/_layout/students/$studentId")({
  component: StudentDetailScreen,
});
```

Access parameters in your screen:

```typescript
import { useParams } from "@tanstack/react-router";

function StudentDetailScreen() {
  const { studentId } = useParams({ from: "/_layout/students/$studentId" });
  // studentId is typed!
}
```

### Layout Routes

Layouts wrap child routes. Use underscore prefix for layout segments:

```typescript
// src/routes/_layout.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TopAppBar } from "@/components/layout/top-app-bar";
import { BottomNav } from "@/components/layout/bottom-nav";

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <div>
      <TopAppBar />
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
      <BottomNav />
    </div>
  );
}
```

### Root Route

The root route provides global providers:

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}
```

## Navigation

### Programmatic Navigation

```typescript
import { useNavigate } from "@tanstack/react-router";

function MyComponent() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate({ to: "/students" });
  };
}
```

### Link Component

```typescript
import { Link } from "@tanstack/react-router";

function Navigation() {
  return (
    <nav>
      <Link to="/">Dashboard</Link>
      <Link to="/students">Students</Link>
    </nav>
  );
}
```

### Active Link Styling

```typescript
import { Link, useLocation } from "@tanstack/react-router";

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={isActive ? "text-primary" : "text-gray-500"}
    >
      {children}
    </Link>
  );
}
```

## Type Safety

TanStack Router provides full type safety for routes, params, and search queries.

### Generated Route Tree

The route tree is auto-generated at `src/routeTree.gen.ts`. Never edit this file manually.

### Type-Safe Navigation

```typescript
// TypeScript knows all valid routes
navigate({ to: "/students" });     // ✅ Valid
navigate({ to: "/invalid" });      // ❌ Type error
```

### Type-Safe Params

```typescript
const params = useParams({ from: "/_layout/students/$studentId" });
// params.studentId is typed as string
```

## Route Constants

Use constants for route paths to avoid typos:

```typescript
// src/constants/routes.ts
export const APP_ROUTES = {
  HOME: "/",
  STUDENTS: "/students",
  CLASSES: "/classes",
  SCHEDULES: "/schedules",
} as const;

// Usage
import { APP_ROUTES } from "@/constants/routes";
<Link to={APP_ROUTES.STUDENTS}>Students</Link>
```

## Troubleshooting

### Route Tree Not Updating

**Symptom**: New routes not recognized

**Solution**: Restart the dev server. The route tree regenerates on startup.

### Type Errors on Routes

**Symptom**: TypeScript errors on `to` prop

**Solution**: Ensure route tree is generated. Run dev server to regenerate.

### Layout Not Applied

**Symptom**: Layout components not showing

**Solution**: Check that your route is nested under the layout folder:

```
✅ src/routes/_layout/my-page.tsx
❌ src/routes/my-page.tsx (not under layout)
```
