# OpenAPI Spec Generation Workflow

This document describes the complete workflow for generating OpenAPI specifications from the backend and using them to generate type-safe API clients for the frontend.

## Overview

```
┌─────────────────────┐
│   Backend (Hono)    │
│  define routes with  │
│  hono-openapi       │
└──────────┬──────────┘
           │ Runtime
           ↓
┌─────────────────────┐
│  OpenAPI Spec       │
│  served at          │
│  /v1/docs/open-api │
└──────────┬──────────┘
           │ Manual script
           ↓
┌─────────────────────┐
│  Saved to file      │
│  openapi/           │
│  openapi.json       │
└──────────┬──────────┘
           │ Orval reads
           ↓
┌─────────────────────┐
│   Frontend API      │
│   Clients Generated │
│  in src/api/        │
└─────────────────────┘
```

## Part 1: Backend - Defining API Routes

### Technology Stack

| Library | Purpose |
|---------|---------|
| **Hono** | Fast, lightweight web framework |
| **hono-openapi** | Generate OpenAPI specs from route definitions |
| **@scalar/hono-api-reference** | Interactive API documentation UI |

### Defining Routes with OpenAPI Metadata

Routes are defined using the `describeRoute` function from `hono-openapi`. This function adds OpenAPI metadata to route handlers.

```typescript
// backend/src/routes/base-router.ts
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";

const baseRoutes = new Hono()
  .get(
    "/health",
    describeRoute({
      tags: ["system"],
      description: "Health check endpoint",
      responses: {
        200: {
          description: "Service is healthy",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string" }
                }
              }
            }
          }
        }
      }
    }),
    (c) => c.json({ status: "ok" })
  );
```

### OpenAPI Metadata Schema

```typescript
describeRoute({
  // API Grouping
  tags: ["students"],        // Category for the endpoint
  summary: "Get all students",  // Short description

  // Detailed documentation
  description: "Returns a paginated list of all students in the system",

  // Request parameters
  parameters: [
    {
      name: "page",
      in: "query",
      required: false,
      schema: { type: "integer", default: 1 }
    }
  ],

  // Response definitions
  responses: {
    200: {
      description: "Successful response",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              data: { type: "array" },
              pagination: { type: "object" }
            }
          }
        }
      }
    },
    404: {
      description: "Not found"
    }
  }
})
```

### Route Organization

```
backend/src/routes/
├── base-router.ts      # Base routes with OpenAPI metadata
├── index.ts           # Route aggregation
└── [other routers].ts # Additional route modules
```

---

## Part 2: Backend - Serving the OpenAPI Spec

### Runtime OpenAPI Generation

The OpenAPI spec is generated at runtime using `openAPIRouteHandler`:

```typescript
// backend/src/index.ts
import { openAPIRouteHandler } from "hono-openapi";

const app = new Hono();

// Serve OpenAPI spec at /v1/docs/open-api
app.get(
  "/v1/docs/open-api",
  openAPIRouteHandler(app, {
    documentation: {
      info: {
        title: "TutorPal API",
        version: "1.0.0",
        description: "TutorPal API documentation"
      },
      servers: [
        {
          url: `http://localhost:${port}`,
          description: "Local development server"
        }
      ]
    }
  })
);
```

### Accessing the Spec

- **OpenAPI JSON**: `http://localhost:3000/v1/docs/open-api`
- **Interactive Docs**: `http://localhost:3000/v1/docs`

The interactive documentation uses Scalar (an alternative to Swagger UI) with:
- Theme: "kepler"
- Layout: "modern"
- Default HTTP client: Axios

---

## Part 3: Backend - Downloading the Spec to File

### Why Save to File?

1. **Version Control**: Track API changes in Git
2. **CI/CD**: Generate frontend clients without running backend
3. **Offline Development**: Frontend can work independently

### Download Script

The backend includes a script to download the OpenAPI spec:

```bash
npm run gen:openapi
```

This runs `scripts/download-openapi.ts` which:

1. Fetches the spec from the running backend
2. Saves it to `openapi/openapi.json`
3. Creates the directory if it doesn't exist
4. Handles errors gracefully

### Script Configuration

```typescript
// backend/scripts/download-openapi.ts
const services: ServiceConfig[] = [
  {
    name: "main",
    port: 3000,
    endpoint: "/v1/docs/open-api",
    outputFile: "openapi/openapi.json",
    envPortVar: "PORT"
  }
];
```

### Complete Workflow

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Download OpenAPI spec (after backend is running)
cd backend
npm run gen:openapi
```

Output:
```
Downloading OpenAPI specs from services...

✅ Successfully updated:
   main: openapi/openapi.json
      └─ from http://localhost:3000/v1/docs/open-api

Summary: 1 updated, 0 skipped (out of 1 services)
```

### Output File

The generated spec is saved as:
```
backend/openapi/openapi.json
```

This file should be committed to version control.

---

## Part 4: Frontend - Generating API Clients

### Technology Stack

| Library | Purpose |
|---------|---------|
| **Orval** | Generate API clients from OpenAPI specs |
| **Axios** | HTTP client (used by Orval) |

### Orval Configuration

```typescript
// frontend/orval.config.ts
import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      // Backend OpenAPI spec endpoint
      target: "http://localhost:3000/v1/docs/open-api"
    },
    output: {
      mode: "split",          // Separate files for client and models
      target: "./src/api/generated",
      schemas: "./src/api/generated/models",
      client: "axios"
    }
  }
});
```

### Generating API Clients

```bash
cd frontend
npm run generate:api
```

**Prerequisite**: Backend must be running on `http://localhost:3000`

### Generated Output Structure

```
frontend/src/api/generated/
├── models/
│   └── index.ts           # TypeScript types from API schemas
└── tutorPalAPI.ts         # Generated API client
```

### Example Generated Code

```typescript
// frontend/src/api/generated/tutorPalAPI.ts
// Auto-generated - DO NOT EDIT

import axios from 'axios';

export const tutorPalAPI = {
  endpoints: {
    /**
     * Health check endpoint
     */
    getHealth: () =>
      axios.get('/v1/health')
        .then(res => res.data)
  }
};

// TypeScript interfaces for request/response
export interface HealthResponse {
  status: string;
}
```

---

## Part 5: Frontend - Using Generated API Clients

### Importing the Client

```typescript
import { tutorPalAPI } from '@/api/generated/tutorPalAPI';
import type { HealthResponse } from '@/api/generated/models';
```

### With TanStack Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { tutorPalAPI } from '@/api/generated/tutorPalAPI';

function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => tutorPalAPI.endpoints.getHealth()
  });
}

function HealthStatus() {
  const { data, isLoading, error } = useHealthCheck();

  if (isLoading) return <p>Checking...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return <p>Status: {data?.status}</p>;
}
```

### Direct API Calls

```typescript
async function fetchStudents() {
  try {
    const data = await tutorPalAPI.endpoints.getStudents({
      page: 1,
      limit: 20
    });
    return data;
  } catch (error) {
    console.error('Failed to fetch students:', error);
  }
}
```

---

## Complete End-to-End Workflow

### Initial Setup

```bash
# 1. Start backend
cd backend
npm run dev

# 2. Download OpenAPI spec to file
npm run gen:openapi

# 3. Generate frontend API clients
cd ../frontend
npm run generate:api
```

### Ongoing Development

When you add or modify API endpoints:

```bash
# 1. Update backend routes with describeRoute()
# 2. Regenerate OpenAPI spec
cd backend
npm run gen:openapi

# 3. Regenerate frontend clients
cd ../frontend
npm run generate:api

# 4. Use the new typed endpoints in your components
```

### Development Cycle

```
┌─────────────────────────────────────────────────────────┐
│  1. Define/Update Route (Backend)                     │
│     - Add describeRoute() metadata                      │
│     - Update response schemas                          │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────┐
│  2. Regenerate OpenAPI Spec                          │
│     cd backend && npm run gen:openapi                  │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────┐
│  3. Update Frontend API Clients                        │
│     cd frontend && npm run generate:api                │
└───────────────────┬─────────────────────────────────────┘
                    │
                    ↓
┌─────────────────────────────────────────────────────────┐
│  4. Use Typed Endpoints (Frontend)                    │
│     - Import from @/api/generated                     │
│     - Use with TanStack Query                         │
└─────────────────────────────────────────────────────────┘
```

---

## Best Practices

### Backend

1. **Always use `describeRoute`** for all public endpoints
2. **Include response schemas** for better type generation
3. **Use descriptive tags** to group related endpoints
4. **Keep documentation in sync** with implementation
5. **Commit the generated spec** to track API changes

### Frontend

1. **Never edit generated files** in `src/api/generated/`
2. **Use TanStack Query** for data fetching and caching
3. **Import types** from the generated models directory
4. **Regenerate clients** after backend API changes
5. **Commit generated clients** to version control

### Version Control

- `backend/openapi/openapi.json` - Commit this file
- `frontend/src/api/generated/*` - Commit these files
- Use git diffs to review API changes

---

## Troubleshooting

### Backend: Spec Not Generating

**Issue**: `/v1/docs/open-api` returns 404 or error

**Solutions**:
1. Check that `openAPIRouteHandler` is mounted correctly
2. Verify all routes use `describeRoute` for metadata
3. Check server console for errors

### Frontend: Orval Generation Fails

**Issue**: `npm run generate:api` fails

**Solutions**:
1. Ensure backend is running on `http://localhost:3000`
2. Check that `/v1/docs/open-api` returns valid JSON
3. Verify network connectivity
4. Check orval.config.ts endpoint URL

### Type Errors After Regeneration

**Issue**: TypeScript errors in frontend after generating clients

**Solutions**:
1. Clear TypeScript cache: `rm -rf node_modules/.cache`
2. Restart TypeScript server in your editor
3. Check for conflicting type definitions
4. Ensure all generated files are saved

### Missing Types

**Issue**: Response types not generated properly

**Solutions**:
1. Add `content.application/json.schema` to route responses
2. Include Zod or manual schema definitions
3. Verify OpenAPI spec structure

---

## Package.json Scripts Reference

### Backend

```json
{
  "scripts": {
    "dev": "bun run --hot src/index.ts",
    "gen:openapi": "bun run scripts/download-openapi.ts"
  }
}
```

### Frontend

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "generate:api": "orval"
  }
}
```

---

## Additional Resources

- **Hono OpenAPI Docs**: https://hono-openapi.vercel.app/
- **Orval Documentation**: https://orval.dev/
- **Scalar API Reference**: https://scalar.com/
- **OpenAPI Specification**: https://swagger.io/specification/
