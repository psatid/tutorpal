# API Integration

This document covers practical patterns for integrating with the backend API using React Query, including queries, mutations, error handling, and common scenarios.

## Overview

The TutorPal frontend uses a layered approach to API integration:

```
┌─────────────────────────────────────┐
│  Component (Screen)                │
│  - Uses custom hooks                │
│  - Handles UI state                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Custom Hooks                      │
│  - useQuery / useMutation           │
│  - Encapsulate data fetching        │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  API Client                        │
│  - Generated from OpenAPI           │
│  - Axios-based                      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  Backend API                       │
└─────────────────────────────────────┘
```

## Basic Query Pattern

### Simple Data Fetching

```typescript
// src/hooks/queries/use-students.ts
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

### Using in Components

```typescript
// src/screens/student-screen.tsx
import { useStudents } from "@/hooks/queries/use-students";

export function StudentScreen() {
  const { data: students, isLoading, error } = useStudents();

  if (isLoading) {
    return <div>Loading students...</div>;
  }

  if (error) {
    return <div>Error loading students: {error.message}</div>;
  }

  return (
    <ul>
      {students?.map((student) => (
        <li key={student.id}>{student.name}</li>
      ))}
    </ul>
  );
}
```

## Query with Parameters

### Dynamic Query Keys

```typescript
// src/hooks/queries/use-student.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "./query-keys";

export const useStudent = (id: string) => {
  return useQuery({
    queryKey: studentsKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.getV1StudentsById(id);
      return response.data;
    },
    // Don't run query if id is empty
    enabled: !!id,
  });
};
```

### Conditional Fetching

```typescript
function StudentDetail({ studentId }: { studentId?: string }) {
  const { data: student } = useStudent(studentId ?? "");
  
  // Query won't run if studentId is undefined (enabled: false)
  return student ? <div>{student.name}</div> : null;
}
```

## Mutation Patterns

### Basic Mutation

```typescript
// src/hooks/mutations/use-create-student.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { studentsKeys } from "@/hooks/queries/query-keys";
import type { StudentFormData } from "@/types/student";

export const useCreateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StudentFormData) => {
      const response = await apiClient.postV1Students(data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch the students list
      queryClient.invalidateQueries({
        queryKey: studentsKeys.lists(),
      });
    },
  });
};
```

### Using Mutations in Forms

```typescript
// src/screens/student-screen.tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateStudent } from "@/hooks/mutations/use-create-student";
import { studentSchema, type StudentFormData } from "@/types/student";

function AddStudentForm() {
  const { register, handleSubmit, reset } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  });

  const createStudent = useCreateStudent();

  const onSubmit = (data: StudentFormData) => {
    createStudent.mutate(data, {
      onSuccess: () => {
        reset(); // Clear form
        // Could also close modal, show toast, etc.
      },
      onError: (error) => {
        console.error("Failed to create student:", error);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      <button type="submit" disabled={createStudent.isPending}>
        {createStudent.isPending ? "Creating..." : "Create Student"}
      </button>
    </form>
  );
}
```

## Error Handling Strategies

### Component-Level Error

```typescript
function StudentList() {
  const { data, isLoading, error, refetch } = useStudents();

  if (error) {
    return (
      <div className="error-state">
        <p>Failed to load students</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  // ... render data
}
```

### Error Boundary Pattern

```typescript
// src/components/error-boundary.tsx
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback: ReactNode;
}

interface State {
  hasError: boolean;
}

export class QueryErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

// Usage
<QueryErrorBoundary fallback={<div>Something went wrong</div>}>
  <StudentScreen />
</QueryErrorBoundary>
```

### Global Error Handler

```typescript
// src/lib/query-client.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 404s
        if (error.response?.status === 404) return false;
        // Retry up to 3 times
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      onError: (error) => {
        // Log to error tracking service
        console.error("Mutation error:", error);
      },
    },
  },
});
```

## Loading State Patterns

### Skeleton Loading

```typescript
function StudentCard({ student }: { student?: Student }) {
  if (!student) {
    return (
      <div className="skeleton-card">
        <div className="skeleton-avatar" />
        <div className="skeleton-text" />
      </div>
    );
  }

  return (
    <div className="student-card">
      <img src={student.avatar} alt={student.name} />
      <h3>{student.name}</h3>
    </div>
  );
}

// Usage
function StudentList() {
  const { data: students, isLoading } = useStudents();

  if (isLoading) {
    return (
      <>
        <StudentCard /> {/* Skeleton */}
        <StudentCard /> {/* Skeleton */}
        <StudentCard /> {/* Skeleton */}
      </>
    );
  }

  return students?.map((student) => (
    <StudentCard key={student.id} student={student} />
  ));
}
```

### Suspense Mode

```typescript
// Enable suspense for a specific query
const { data: students } = useStudents({
  suspense: true,
});

// Wrap component in Suspense
import { Suspense } from "react";

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudentScreen />
    </Suspense>
  );
}
```

## Pagination Patterns

### Offset-Based Pagination

```typescript
// src/hooks/queries/use-students.ts
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface UseStudentsParams {
  page?: number;
  limit?: number;
}

export const useStudents = ({ page = 1, limit = 20 }: UseStudentsParams = {}) => {
  return useQuery({
    queryKey: ["students", "list", { page, limit }],
    queryFn: async () => {
      const response = await apiClient.getV1Students({
        page,
        limit,
      });
      return response.data;
    },
    keepPreviousData: true, // Keep old data while fetching new page
  });
};

// Usage
function PaginatedStudentList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useStudents({ page, limit: 20 });

  return (
    <>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <>
          <ul>
            {data?.students.map((student) => (
              <li key={student.id}>{student.name}</li>
            ))}
          </ul>
          
          <div className="pagination">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 1}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!data?.hasMore}
            >
              Next
            </button>
          </div>
          
          {isFetching && <span>Fetching...</span>}
        </>
      )}
    </>
  );
}
```

### Infinite Scroll

```typescript
// src/hooks/queries/use-infinite-students.ts
import { useInfiniteQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export const useInfiniteStudents = (limit = 20) => {
  return useInfiniteQuery({
    queryKey: ["students", "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.getV1Students({
        page: pageParam,
        limit,
      });
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.hasMore ? allPages.length + 1 : undefined;
    },
  });
};

// Usage with Intersection Observer
function InfiniteStudentList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteStudents();

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allStudents = data?.pages.flatMap((page) => page.students) ?? [];

  return (
    <>
      <ul>
        {allStudents.map((student) => (
          <li key={student.id}>{student.name}</li>
        ))}
      </ul>
      <div ref={loadMoreRef}>
        {isFetchingNextPage ? "Loading more..." : hasNextPage ? "Load more" : "No more students"}
      </div>
    </>
  );
}
```

## Combining Queries

### Parallel Queries

```typescript
function Dashboard() {
  // Both queries run in parallel
  const studentsQuery = useStudents();
  const classesQuery = useClasses();

  const isLoading = studentsQuery.isLoading || classesQuery.isLoading;

  if (isLoading) return <div>Loading...</div>;

  return (
    <>
      <StudentCount count={studentsQuery.data?.length} />
      <ClassCount count={classesQuery.data?.length} />
    </>
  );
}
```

### Dependent Queries

```typescript
function StudentWithClasses({ studentId }: { studentId: string }) {
  // First query
  const { data: student } = useStudent(studentId);

  // Second query depends on first
  const { data: classes } = useQuery({
    queryKey: ["student-classes", student?.classIds],
    queryFn: async () => {
      // Fetch classes for this student
      const promises = student!.classIds.map((id) =>
        apiClient.getV1ClassesById(id)
      );
      const responses = await Promise.all(promises);
      return responses.map((r) => r.data);
    },
    // Only run when student data is available
    enabled: !!student?.classIds?.length,
  });

  // ...
}
```

## Optimistic Updates

### Basic Optimistic Update

```typescript
export const useUpdateStudent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updatedStudent: Student) => {
      const response = await apiClient.patchV1StudentsById(
        updatedStudent.id,
        updatedStudent
      );
      return response.data;
    },
    onMutate: async (newStudent) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: studentsKeys.detail(newStudent.id),
      });

      // Snapshot previous value
      const previousStudent = queryClient.getQueryData<Student>(
        studentsKeys.detail(newStudent.id)
      );

      // Optimistically update
      queryClient.setQueryData(studentsKeys.detail(newStudent.id), newStudent);

      // Return context for rollback
      return { previousStudent };
    },
    onError: (err, newStudent, context) => {
      // Rollback on error
      queryClient.setQueryData(
        studentsKeys.detail(newStudent.id),
        context?.previousStudent
      );
    },
    onSettled: (newStudent) => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: studentsKeys.detail(newStudent?.id),
      });
    },
  });
};
```

## Real-World Examples

### Complete CRUD Screen

```typescript
// src/screens/student-screen.tsx
import { useState } from "react";
import { useStudents } from "@/hooks/queries/use-students";
import { useCreateStudent } from "@/hooks/mutations/use-create-student";
import { useDeleteStudent } from "@/hooks/mutations/use-delete-student";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";

export function StudentScreen() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: students, isLoading, error, refetch } = useStudents();
  const createStudent = useCreateStudent();
  const deleteStudent = useDeleteStudent();

  const handleDelete = (id: string) => {
    if (confirm("Are you sure?")) {
      deleteStudent.mutate(id);
    }
  };

  if (isLoading) {
    return <div>Loading students...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Failed to load students</p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      <h1>Students</h1>
      
      <Button onClick={() => setIsFormOpen(true)}>
        Add Student
      </Button>

      <ul>
        {students?.map((student) => (
          <li key={student.id}>
            {student.name}
            <Button
              variant="danger"
              onClick={() => handleDelete(student.id)}
              loading={deleteStudent.isPending}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>

      {isFormOpen && (
        <StudentForm
          onSubmit={(data) => {
            createStudent.mutate(data, {
              onSuccess: () => setIsFormOpen(false),
            });
          }}
          onCancel={() => setIsFormOpen(false)}
          isSubmitting={createStudent.isPending}
        />
      )}
    </div>
  );
}
```

## Testing API Hooks

### Testing Query Hooks

```typescript
// src/hooks/queries/__tests__/use-students.test.ts
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStudents } from "../use-students";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useStudents", () => {
  it("should return students data", async () => {
    const { result } = renderHook(() => useStudents(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

### Testing Mutation Hooks

```typescript
// src/hooks/mutations/__tests__/use-create-student.test.ts
import { renderHook, waitFor, act } from "@testing-library/react";
import { useCreateStudent } from "../use-create-student";

describe("useCreateStudent", () => {
  it("should create a student", async () => {
    const { result } = renderHook(() => useCreateStudent(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.mutate({
        name: "John Doe",
        email: "john@example.com",
        grade: "10",
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
```

## Best Practices

### Query Keys
- ✅ Always use query key factories
- ✅ Include all parameters in the key
- ✅ Structure hierarchically: `["resource", "action", params]`

### Error Handling
- ✅ Handle errors at component level
- ✅ Provide retry functionality
- ✅ Show user-friendly error messages

### Loading States
- ✅ Show skeleton screens for better UX
- ✅ Use `keepPreviousData` for pagination
- ✅ Handle both `isLoading` and `isFetching`

### Mutations
- ✅ Invalidate related queries on success
- ✅ Use optimistic updates for better perceived performance
- ✅ Handle loading states in UI
- ✅ Rollback on errors

### Performance
- ✅ Use `staleTime` to reduce refetches
- ✅ Use `cacheTime` for garbage collection
- ✅ Prefetch data on hover/navigation
- ✅ Use `select` to transform data

### Code Organization
- ✅ Co-locate hooks with their usage
- ✅ Keep API client logic in hooks
- ✅ Don't use API client directly in components
- ✅ Export types from hooks

## Troubleshooting

### Query Not Refetching After Mutation

**Symptom**: List doesn't update after creating/updating

**Solution**: Check query key matches:

```typescript
// Mutation invalidates
queryClient.invalidateQueries({ queryKey: studentsKeys.lists() });

// Query uses
useQuery({ queryKey: studentsKeys.lists(), ... });
```

### Race Conditions

**Symptom**: Stale data showing after rapid updates

**Solution**: Cancel outgoing queries:

```typescript
onMutate: async (newData) => {
  await queryClient.cancelQueries({ queryKey: ["students"] });
  // ...
}
```

### Type Errors

**Symptom**: TypeScript errors with generated API client

**Solution**: Regenerate clients:

```bash
cd frontend
npm run generate:api
```

### CORS Errors

**Symptom**: Network errors when calling API

**Solution**: Ensure Vite proxy is configured in `vite.config.ts`.

## Related Documentation

- **[State Management](./state-management.md)** - Detailed TanStack Query patterns
- **[OpenAPI Workflow](../openapi-workflow.md)** - Generating API clients
- **[Forms](./forms.md)** - Form handling with React Hook Form
