# Backend Architecture

This document outlines the architecture and organization of the TutorPal backend application.

## Overview

The backend is built with a layered architecture pattern separating concerns into distinct layers: **Routes** (HTTP), **Services** (Business Logic), **Repositories** (Data Access), and **Schemas** (Validation). This structure promotes testability, maintainability, and clear separation of concerns.

## Technology Stack

| Technology | Purpose |
|------------|---------|
| **Bun** | JavaScript runtime |
| **Hono** | Web framework |
| **TypeScript** | Type safety |
| **Prisma** | ORM and database schema management |
| **PostgreSQL** | Primary database |
| **Zod** | Schema validation |
| **hono-openapi** | OpenAPI documentation generation |
| **Scalar** | API documentation UI |
| **Biome** | Linter and formatter |
| **Vitest** | Testing framework |

## Directory Structure

```
backend/
├── prisma/                  # Database schema & migrations
│   ├── schema.prisma        # Prisma schema definition
│   ├── migrations/          # Migration files
│   └── config.ts            # Prisma configuration
├── scripts/                 # Utility scripts
│   └── download-openapi.ts  # OpenAPI spec downloader
├── src/
│   ├── index.ts             # Application entry point
│   ├── lib/                 # Shared utilities/libraries
│   │   ├── db.ts            # Prisma client initialization
│   │   ├── env.ts           # Environment configuration
│   │   └── error.ts         # Custom error class (AppError)
│   ├── middleware/          # Express/Hono middleware
│   │   └── error-handler.ts # Global error handler
│   ├── repositories/        # Data access layer
│   │   ├── student.repository.ts
│   │   └── index.ts         # Barrel exports
│   ├── routes/              # API route definitions (HTTP layer)
│   │   ├── index.ts         # Route aggregator
│   │   ├── base-router.ts   # System routes (health, docs)
│   │   └── students.ts      # Student routes
│   ├── schemas/             # Validation schemas (Zod + OpenAPI)
│   │   ├── student.schema.ts
│   │   └── index.ts         # Barrel exports
│   ├── services/            # Business logic layer
│   │   ├── student.service.ts
│   │   └── index.ts         # Barrel exports
│   ├── types/               # Shared TypeScript types
│   │   ├── student.types.ts # DTOs and interfaces
│   │   └── index.ts         # Barrel exports
│   └── utils/               # Helper utilities (if needed)
├── openapi/                 # Generated OpenAPI specs
│   └── openapi.json
├── package.json
├── tsconfig.json
└── biome.jsonc              # Biome configuration
```

## Architecture Layers

### 1. Routes Layer (`src/routes/`)

**Responsibility**: HTTP handling only

Routes handle incoming HTTP requests, validate input using Zod schemas, delegate to services, and return HTTP responses. Routes should contain minimal logic—just request/response handling.

```typescript
// Example: routes/students.ts
.post(
  "/",
  describeRoute({ /* OpenAPI metadata */ }),
  sValidator("json", CreateStudentSchema),
  async (c) => {
    const data = c.req.valid("json");
    const student = await studentService.createStudent(data);
    return c.json(student, 201);
  }
)
```

**Key Rules**:
- Import schemas from `../schemas`
- Import services from `../services`
- Never call Prisma directly
- Never contain business logic
- Return proper HTTP status codes

### 2. Services Layer (`src/services/`)

**Responsibility**: Business logic and orchestration

Services contain business rules, validation, and orchestration between repositories. They throw domain errors (e.g., `AppError.notFound()`) when business rules are violated.

```typescript
// Example: services/student.service.ts
export class StudentService {
  constructor(private readonly repository: IStudentRepository) {}

  async getStudentById(id: string): Promise<StudentDTO> {
    const student = await this.repository.findById(id);
    if (!student) {
      throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
    }
    return student;
  }
}
```

**Key Rules**:
- Accept repository interfaces via constructor (dependency injection)
- Throw `AppError` for domain errors
- Orchestrate multiple repositories if needed
- No HTTP-specific code
- Return DTOs, not raw database objects

### 3. Repository Layer (`src/repositories/`)

**Responsibility**: Data access and persistence

Repositories abstract database operations and provide a clean interface for data access. They handle Prisma queries and map database results to DTOs.

```typescript
// Example: repositories/student.repository.ts
export class StudentRepository implements IStudentRepository {
  async findById(id: string): Promise<StudentDTO | null> {
    const student = await prisma.student.findUnique({ where: { id } });
    return student ? toDTO(student) : null;
  }
}
```

**Key Rules**:
- Implement interfaces defined in `src/types/`
- Handle all Prisma/database operations
- Map database types to DTOs (e.g., Date → ISO string)
- No business logic or error throwing
- Export singleton instances for DI
- For tutor-owned entities such as classes, students, and schedules, apply tutor scoping in repository queries instead of relying on callers or frontend filters.

**Derived availability rule**:
- When exposing class `remainingHours`, treat `SCHEDULED`, `COMPLETED`, and `NO_SHOW` schedules as reserved time and exclude `CANCELLED` schedules.
- Prefer a shared repository helper for this calculation so class, student-detail, and schedule responses all use the same source of truth.
- Class `totalHours` is decimal-capable. Repositories should convert Prisma `Decimal` values to plain `number` DTO fields before returning API responses.
- Recurring schedule edits should version the recurring series instead of mutating history in place: keep past occurrences untouched, recreate only future generated schedules from the effective date, and link generated occurrences back to their `recurringScheduleId` for future revisions.

### 4. Schemas Layer (`src/schemas/`)

**Responsibility**: Validation and OpenAPI documentation

Schemas define Zod validation schemas and OpenAPI resolvers for request/response validation and documentation.

```typescript
// Example: schemas/student.schema.ts
export const CreateStudentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phoneNumber: z.string().optional(),
  grade: z.number().int(),
});

export const CreateStudentSchemaResolver = resolver(CreateStudentSchema);
export type CreateStudentSchemaType = z.infer<typeof CreateStudentSchema>;
```

**Key Rules**:
- Define request, response, and param schemas
- Export OpenAPI resolvers for `describeRoute()`
- Export TypeScript types using `z.infer`
- Keep schemas pure (no business logic)

### 5. Types Layer (`src/types/`)

**Responsibility**: Shared TypeScript definitions

Types define DTOs (Data Transfer Objects) and interfaces used across layers.

```typescript
// Example: types/student.types.ts
export interface StudentDTO {
  id: string;
  name: string;
  phoneNumber: string | null;
  grade: number;
  createdAt: string;
  updatedAt: string;
}

export interface IStudentRepository {
  findById(id: string): Promise<StudentDTO | null>;
  // ... other methods
}
```

**Key Rules**:
- DTOs should use primitive types (no Prisma types)
- Define repository interfaces for dependency injection
- Export from barrel file (`index.ts`)

## Adding a New Feature

To add a new entity (e.g., "Teacher"):

### 1. Update Database Schema

```prisma
// prisma/schema.prisma
model Teacher {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  subject   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Run migration:
```bash
cd backend
bun run db:migrate
```

### 2. Create Types

```typescript
// src/types/teacher.types.ts
export interface TeacherDTO {
  id: string;
  name: string;
  email: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeacherDTO {
  name: string;
  email: string;
  subject: string;
}

export interface ITeacherRepository {
  create(data: CreateTeacherDTO): Promise<TeacherDTO>;
  findAll(): Promise<TeacherDTO[]>;
  findById(id: string): Promise<TeacherDTO | null>;
  // ... etc
}
```

Add to `src/types/index.ts`:
```typescript
export * from "./teacher.types";
```

### 3. Create Schemas

```typescript
// src/schemas/teacher.schema.ts
import { z } from "zod";
import { resolver } from "hono-openapi";

export const TeacherSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  subject: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const CreateTeacherSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string(),
});

export const TeacherSchemaResolver = resolver(TeacherSchema);
export const CreateTeacherSchemaResolver = resolver(CreateTeacherSchema);
export type CreateTeacherSchemaType = z.infer<typeof CreateTeacherSchema>;
```

Add to `src/schemas/index.ts`.

### 4. Create Repository

```typescript
// src/repositories/teacher.repository.ts
import { prisma } from "../lib/db";
import type { CreateTeacherDTO, ITeacherRepository, TeacherDTO } from "../types";

function toDTO(teacher: /* Prisma type */): TeacherDTO {
  return {
    ...teacher,
    createdAt: teacher.createdAt.toISOString(),
    updatedAt: teacher.updatedAt.toISOString(),
  };
}

export class TeacherRepository implements ITeacherRepository {
  async create(data: CreateTeacherDTO): Promise<TeacherDTO> {
    const teacher = await prisma.teacher.create({ data });
    return toDTO(teacher);
  }
  // ... implement other methods
}

export const teacherRepository = new TeacherRepository();
```

Add to `src/repositories/index.ts`.

### 5. Create Service

```typescript
// src/services/teacher.service.ts
import { AppError } from "../lib/error";
import type { CreateTeacherDTO, ITeacherRepository, TeacherDTO } from "../types";

export class TeacherService {
  constructor(private readonly repository: ITeacherRepository) {}

  async createTeacher(data: CreateTeacherDTO): Promise<TeacherDTO> {
    return this.repository.create(data);
  }

  async getTeacherById(id: string): Promise<TeacherDTO> {
    const teacher = await this.repository.findById(id);
    if (!teacher) {
      throw AppError.notFound("TEACHER_NOT_FOUND", "Teacher not found");
    }
    return teacher;
  }
}
```

Add to `src/services/index.ts`.

### 6. Create Routes

```typescript
// src/routes/teachers.ts
import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { teacherRepository } from "../repositories";
import { CreateTeacherSchema, CreateTeacherSchemaResolver, TeacherSchemaResolver } from "../schemas";
import { TeacherService } from "../services";

const teacherService = new TeacherService(teacherRepository);

const teacherRoutes = new Hono()
  .post(
    "/",
    describeRoute({
      tags: ["teachers"],
      description: "Create a new teacher",
      requestBody: {
        content: {
          "application/json": {
            schema: CreateTeacherSchemaResolver as any,
          },
        },
      },
      responses: {
        201: {
          description: "Teacher created",
          content: {
            "application/json": {
              schema: TeacherSchemaResolver as any,
            },
          },
        },
      },
    }),
    sValidator("json", CreateTeacherSchema),
    async (c) => {
      const data = c.req.valid("json");
      const teacher = await teacherService.createTeacher(data);
      return c.json(teacher, 201);
    }
  );

export default teacherRoutes;
export type TeacherRoutesType = typeof teacherRoutes;
```

### 7. Register Routes

```typescript
// src/routes/index.ts
import { Hono } from "hono";
import baseRoutes from "./base-router";
import studentRoutes from "./students";
import teacherRoutes from "./teachers"; // Add this

export function createRoutes() {
  return new Hono()
    .route("/v1", baseRoutes)
    .route("/v1/students", studentRoutes)
    .route("/v1/teachers", teacherRoutes); // Add this
}
```

## Testing Strategy

### Repository Tests

Test repositories with an in-memory database or mocked Prisma client:

```typescript
// tests/repositories/student.repository.test.ts
import { describe, expect, it } from "vitest";
import { StudentRepository } from "../../src/repositories/student.repository";

describe("StudentRepository", () => {
  const repository = new StudentRepository();

  it("should create a student", async () => {
    const result = await repository.create({
      name: "John Doe",
      grade: 10,
    });
    expect(result.name).toBe("John Doe");
    expect(result.id).toBeDefined();
  });
});
```

### Service Tests

Test services with mocked repositories:

```typescript
// tests/services/student.service.test.ts
import { describe, expect, it, vi } from "vitest";
import { StudentService } from "../../src/services/student.service";
import { AppError } from "../../src/lib/error";

describe("StudentService", () => {
  const mockRepository = {
    findById: vi.fn(),
    create: vi.fn(),
  };

  const service = new StudentService(mockRepository as any);

  it("should throw not found error when student doesn't exist", async () => {
    mockRepository.findById.mockResolvedValue(null);
    
    await expect(service.getStudentById("123"))
      .rejects
      .toThrow(AppError);
  });
});
```

### Route Tests

Test routes with mocked services:

```typescript
// tests/routes/students.test.ts
import { Hono } from "hono";
import { describe, expect, it } from "vitest";

describe("Student Routes", () => {
  // Setup test app with mocked services
});
```

## Error Handling

The backend uses a centralized error handling approach:

1. **Custom Errors**: Use `AppError` for domain errors
   ```typescript
   throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
   throw AppError.badRequest("INVALID_DATA", "Invalid input");
   ```

2. **Error Middleware**: Global error handler in `src/middleware/error-handler.ts`

3. **Error Response Format**:
   ```json
   {
     "errorCode": "STUDENT_NOT_FOUND",
     "message": "Student not found"
   }
   ```

## Development Commands

```bash
# Development server with hot reload
cd backend
bun run dev

# Database operations
bun run db:generate    # Generate Prisma client
bun run db:migrate     # Run migrations
bun run db:studio      # Open Prisma Studio

# OpenAPI
cd backend
bun run gen:openapi    # Download OpenAPI spec to file

# Code quality
cd backend
npx @biomejs/biome check .        # Check for issues
npx @biomejs/biome check . --write # Fix auto-fixable issues

# Testing (when tests are added)
bun test
```

## Best Practices

1. **Dependency Injection**: Pass repositories to services via constructor for testability
2. **DTOs**: Always use DTOs for data transfer between layers
3. **Validation**: Validate at route level with Zod, business rules in services
4. **Error Handling**: Use `AppError` for domain errors, let middleware handle HTTP responses
5. **Naming**: Use consistent naming (`StudentService`, `studentService`, `IStudentRepository`)
6. **Barrel Exports**: Use `index.ts` files for clean imports
7. **Type Safety**: Enable strict TypeScript and avoid `any`
8. **OpenAPI**: Keep OpenAPI metadata in sync with actual route behavior

## Integration with Frontend

The backend generates OpenAPI specs that the frontend consumes:

1. Backend serves OpenAPI spec at `/v1/docs/open-api`
2. Run `bun run gen:openapi` to save spec to `openapi/openapi.json`
3. Frontend uses Orval to generate type-safe API clients
4. Generated clients use TanStack Query for data fetching

See the [OpenAPI Workflow](./openapi-workflow.md) documentation for details.
