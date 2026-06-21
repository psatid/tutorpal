# Components

TutorPal uses **Base UI** (MUI) primitives wrapped with **shadcn/ui** patterns for accessible, customizable components.

## Component Architecture

```
src/components/
├── layout/                # Layout components
│   ├── bottom-nav.tsx     # Bottom navigation
│   └── top-app-bar.tsx    # Top app bar
├── ui/                    # shadcn/ui + Base UI primitives
│   ├── avatar.tsx
│   ├── button.tsx
│   ├── input.tsx
│   └── select.tsx
└── [feature]/             # Feature-specific components
    └── add-student-drawer.tsx
```

## Base UI vs. shadcn/ui

### Base UI

Base UI provides unstyled, accessible primitives:

```typescript
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";

// Base UI exports namespaces
<AvatarPrimitive.Root>
  <AvatarPrimitive.Image src={src} alt={alt} />
  <AvatarPrimitive.Fallback>{initials}</AvatarPrimitive.Fallback>
</AvatarPrimitive.Root>
```

### shadcn/ui Components

shadcn/ui provides styled components using Base UI primitives:

```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

<Avatar>
  <AvatarImage src={src} alt={alt} />
  <AvatarFallback>{initials}</AvatarFallback>
</Avatar>
```

## Available Components

### Avatar (`src/components/ui/avatar.tsx`)

```typescript
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

<Avatar className="w-10 h-10">
  <AvatarImage src="https://example.com/avatar.jpg" alt="User" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Button (`src/components/ui/button.tsx`)

```typescript
import { Button } from "@/components/ui/button";

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>

// With icons
<Button leftIcon={Plus}>Add Item</Button>
<Button rightIcon={ArrowRight}>Next</Button>
<Button loading={isLoading}>Submit</Button>
```

### Input (`src/components/ui/input.tsx`)

```typescript
import { Input } from "@/components/ui/input";

<Input
  placeholder="Enter your name"
  error={error?.message}
  leftIcon={Mail}
  rightIcon={Check}
/>
```

The shared `Input` primitive also supports a `rightAdornment` slot for inline actions that need to live inside the field chrome, such as auth password visibility toggles.

### PasswordField (`src/components/ui/form/password-field.tsx`)

```typescript
import { PasswordField } from "@/components/ui/form/password-field";
import { Lock } from "lucide-react";

<PasswordField
  label="Password"
  placeholder="Enter your password"
  leftIcon={Lock}
/>
```

Use `PasswordField` when the UI needs TutorPal's built-in password visibility toggle. It preserves the same label, caption, error, disabled, and icon behavior as `InputField`, while keeping the toggle button accessible and local to each field instance.

### Select (`src/components/ui/select.tsx`)

```typescript
import { Select } from "@/components/ui/select";

const options = [
  { value: "6", label: "Grade 6" },
  { value: "7", label: "Grade 7" },
];

<Select
  options={options}
  value={selectedValue}
  onChange={handleChange}
  placeholder="Select grade"
/>
```

The shared select is drawer-aware. Inside `FormDrawer`, mobile keeps the select popup anchored to the drawer surface, while tablet/desktop uses a separate overlay host plus non-modal popup behavior so repeated selections work without disturbing the drawer layout.

## Creating New Components

### Option 1: Install from shadcn Registry

```bash
npx shadcn add <component-name>
```

This will:
- Install required dependencies
- Create the component in `src/components/ui/`
- Use Base UI primitives if available

### Option 2: Create Manually

Create a component using Base UI primitives:

```typescript
// src/components/ui/my-component.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const myComponentVariants = cva(
  "base-styles",
  {
    variants: {
      variant: {
        default: "default-styles",
        primary: "primary-styles",
      },
      size: {
        default: "h-10",
        sm: "h-8",
        lg: "h-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface MyComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof myComponentVariants> {
  asChild?: boolean;
}

const MyComponent = React.forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    return (
      <Comp
        className={cn(myComponentVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
MyComponent.displayName = "MyComponent";

export { MyComponent, myComponentVariants };
```

## Layout Components

### Bottom Navigation

```typescript
import { BottomNav } from "@/components/layout/bottom-nav";

// Used in layout
function Layout() {
  return (
    <div>
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
```

### Top App Bar

```typescript
import { TopAppBar } from "@/components/layout/top-app-bar";

<TopAppBar title="Students" />
```

## Feature Components

Feature components that are specific to a screen can be co-located with the screen or placed in `src/components/[feature]/`:

```typescript
// src/screens/student-screen.tsx
function StudentScreen() {
  return (
    <div>
      <EditorialHeader />
      <SearchInput />
      <StudentList />
      <AddStudentFAB />
    </div>
  );
}

// Co-located components
function EditorialHeader() { /* ... */ }
function SearchInput() { /* ... */ }
function StudentList() { /* ... */ }
function AddStudentFAB() { /* ... */ }
```

## Styling with Tailwind

All components use Tailwind CSS with custom design system tokens:

```typescript
<button
  className="
    bg-primary 
    text-on-primary 
    px-4 py-2 
    rounded-lg
    hover:bg-primary-dim
    transition-colors
  "
>
  Click me
</button>
```

### Design System Tokens

Available CSS variables:

```css
/* Colors */
bg-primary, text-on-primary
bg-secondary, text-on-secondary
bg-surface, text-on-surface
bg-surface-container, text-on-surface-variant

/* Typography */
font-headline  /* Manrope */
font-body      /* Inter */
font-label

/* Spacing */
rounded-lg, rounded-xl, rounded-2xl
```

## Component Props Pattern

Standard props interface:

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
  leftIcon?: React.ComponentType<{ className?: string }>;
  rightIcon?: React.ComponentType<{ className?: string }>;
}
```

## Best Practices

### Component Design
- ✅ Keep components small and single-purpose
- ✅ Use composition over configuration
- ✅ Accept `className` for customization
- ✅ Forward refs for accessibility

### Base UI Usage
- ✅ Import namespaces: `import { Avatar as AvatarPrimitive }`
- ✅ Access with dot notation: `<AvatarPrimitive.Root>`
- ❌ Don't use `import * as AvatarPrimitive`

### Styling
- ✅ Use Tailwind utility classes
- ✅ Use design system tokens (CSS variables)
- ✅ Support dark mode via CSS variables

### Accessibility
- ✅ Use Base UI primitives for accessibility
- ✅ Include proper ARIA attributes
- ✅ Support keyboard navigation
- ✅ Test with screen readers

### File Organization
- ✅ UI primitives in `components/ui/`
- ✅ Layout components in `components/layout/`
- ✅ Feature components in `components/[feature]/` or co-located
- ✅ Kebab-case file names

## Troubleshooting

### Base UI Import Errors

**Symptom**: Properties not found on Base UI components

**Solution**: Base UI exports namespaces, not individual components:

```typescript
// ✅ Correct
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
<AvatarPrimitive.Root>...</AvatarPrimitive.Root>

// ❌ Incorrect
import * as AvatarPrimitive from "@base-ui/react/avatar";
```

### Styling Not Applied

**Symptom**: Tailwind classes not working

**Solution**: Ensure Tailwind is configured in `vite.config.ts`:

```typescript
import tailwindcss from "@tailwindcss/vite";

export default {
  plugins: [tailwindcss()],
};
```

### Type Errors with Variants

**Symptom**: Type errors with `cva` variants

**Solution**: Ensure proper type exports:

```typescript
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // custom props
}
```
