# Development Workflow

This document covers the development workflow, configuration files, and troubleshooting for the TutorPal frontend.

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Backend running on port 3000

### Installation

```bash
cd frontend
pnpm install
```

### Start Development Server

```bash
pnpm run dev
```

Server runs at `http://localhost:3001`

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm generate:api` | Regenerate API clients from OpenAPI spec |

## Configuration Files

### vite.config.ts

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    TanStackRouterVite(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    proxy: {
      "/v1": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
```

**Key configurations:**
- **Port**: 3001
- **Proxy**: `/v1/*` → `http://localhost:3000` (backend)
- **Alias**: `@` → `./src`
- **Plugins**: React, TanStack Router, Tailwind CSS

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

**Key settings:**
- Strict TypeScript checking enabled
- Path mapping for `@` alias
- Bundler module resolution

### components.json

shadcn/ui configuration:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

**Key settings:**
- `rsc: false` - Not using React Server Components
- `tsx: true` - TypeScript enabled
- `cssVariables: true` - Using CSS variables

### orval.config.ts

OpenAPI client generation:

```typescript
import { defineConfig } from "orval";

export default defineConfig({
  tutorPal: {
    input: {
      target: "./api-spec.json",
    },
    output: {
      mode: "split",
      target: "./src/api/generated",
      client: "axios",
      clean: true,
    },
  },
});
```

**Key settings:**
- Source: `api-spec.json` (downloaded from backend)
- Output: `./src/api/generated`
- Client: Axios
- Mode: Split (separate files)

## Development Workflow

### 1. Start Backend First

```bash
cd backend
pnpm dev
```

### 2. Start Frontend

```bash
cd frontend
pnpm dev
```

### 3. Generate API Clients (After Backend Changes)

When the backend API changes:

```bash
# 1. Download latest OpenAPI spec
cd backend
pnpm gen:openapi

# 2. Regenerate clients
cd frontend
pnpm generate:api
```

### 4. Access the App

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000
- **API Docs**: http://localhost:3000/v1/docs

## API Integration Workflow

### Adding a New Endpoint

1. **Define in Backend**: Add route with OpenAPI metadata
2. **Regenerate Spec**: `cd backend && pnpm gen:openapi`
3. **Generate Clients**: `cd frontend && pnpm generate:api`
4. **Create Hook**: Add query/mutation hook
5. **Use in Component**: Import and use the hook

See [OpenAPI Workflow](../openapi-workflow.md) for detailed steps.

## Building for Production

```bash
pnpm build
```

Build process:
1. TypeScript compilation (`tsc`)
2. Vite build
3. Output to `dist/`

### Preview Production Build

```bash
pnpm preview
```

## Environment Variables

Create `.env` file:

```bash
VITE_API_URL=http://localhost:3000
```

**Note**: Only variables prefixed with `VITE_` are exposed to the client.

## Code Quality

### Linting

The project uses TypeScript's strict mode for type checking. Build will fail on type errors.

### Code Style

- **Formatter**: Prettier (if configured)
- **Case**: Kebab-case for all files
- **Imports**: Use `@/` alias for src imports

## Troubleshooting

### API Client Out of Date

**Symptom**: TypeScript errors in generated API files

**Solution**: Regenerate API clients:

```bash
pnpm generate:api
```

**Prerequisite**: Backend must be running

### Route Tree Not Updating

**Symptom**: New routes not recognized

**Solution**: Restart dev server

```bash
# Stop (Ctrl+C) and restart
pnpm dev
```

### Import Path Errors

**Symptom**: `@/` imports not resolving

**Solution**: Check `vite.config.ts` alias configuration:

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
}
```

### TypeScript Build Errors

**Symptom**: Build fails with type errors

**Solution**: Check for:
1. Missing type imports
2. Incorrect API client usage
3. Outdated generated files

### CORS Errors

**Symptom**: API requests blocked by CORS

**Solution**: Ensure Vite proxy is configured:

```typescript
server: {
  proxy: {
    "/v1": {
      target: "http://localhost:3000",
      changeOrigin: true,
    },
  },
}
```

### Module Not Found

**Symptom**: Cannot resolve module

**Solutions**:
1. Check import path (use `@/` alias)
2. Ensure file exists
3. Check file extension
4. Restart TypeScript server (VS Code: Cmd+Shift+P → "Restart TS Server")

### Hot Reload Not Working

**Symptom**: Changes not reflecting

**Solutions**:
1. Check for syntax errors
2. Hard refresh browser (Cmd+Shift+R)
3. Restart dev server
4. Clear browser cache

## Performance Tips

### Bundle Analysis

```bash
pnpm build -- --analyze
```

### Code Splitting

Use dynamic imports for heavy components:

```typescript
const HeavyComponent = lazy(() => import("./heavy-component"));
```

### Query Optimization

- Use `staleTime` to reduce refetches
- Implement infinite scroll for large lists
- Use `select` to transform data

## Deployment

### Static Hosting

The built app is a static SPA that can be deployed to:

- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

### Environment Setup

Set environment variables in hosting platform:

```bash
VITE_API_URL=https://api.production.com
```

## Additional Resources

- [TanStack Router Docs](https://tanstack.com/router/latest)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Vite Docs](https://vitejs.dev/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
