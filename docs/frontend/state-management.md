# State Management

TutorPal uses **TanStack Query** (React Query) for server state management with a focus on caching, synchronization, and optimistic updates.

## Overview

| Pattern | Purpose |
|---------|---------|
| **TanStack Query** | Server state (API data) |
| **React State** | Local component state |
| **Query Key Factory** | Cache management |
| **Mutations** | Data modifications |

## Query Key Factory Pattern

Centralize query keys in `src/hooks/queries/query-keys.ts`:

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

export const classesKeys = {
  all: ["classes"] as const,
  lists: () => [...classesKeys.all, "list"] as const,
  // ... etc
};
```

## Query Hooks

Place query hooks in `src/hooks/queries/`:

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

### Using Query Hooks

```typescript
import { useStudents } from "@/hooks/queries/use-students";

function StudentList() {
  const { data: students, isLoading, error } = useStudents();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {students.map((student) => (
        <li key={student.id}>{student.name}</li>
      ))}
    </ul>
  );
}
```

## Mutation Hooks

Place mutations in `src/hooks/mutations/`:

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
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: studentsKeys.lists(),
      });
    },
  });
};
```

### Using Mutations

```typescript
import { useCreateStudent } from "@/hooks/mutations/use-create-student";

function CreateStudentForm() {
  const mutation = useCreateStudent();

  const handleSubmit = (data: StudentFormData) => {
    mutation.mutate(data, {
      onSuccess: () => {
        // Handle success
      },
      onError: (error) => {
        // Handle error
      },
    });
  };
}
```

## API Client Setup

### Single Initialized Client

Create one API client in `src/lib/api-client.ts`:

```typescript
// src/lib/api-client.ts
import axios from "axios";
import { getTutorPalAPI } from "@/api/generated/tutorPalAPI";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "",
});

export const apiClient = getTutorPalAPI(axiosInstance);
```

### Using the Client

```typescript
import { apiClient } from "@/lib/api-client";

// All methods are typed from OpenAPI spec
const response = await apiClient.getV1Students();
const response = await apiClient.postV1Students(data);
const response = await apiClient.getV1StudentsById(id);
```

## Caching Strategies

### Default Caching

TanStack Query caches data with these defaults:

- **Stale Time**: 0 (data considered stale immediately)
- **Cache Time**: 5 minutes (garbage collection)
- **Refetch**: On window focus, network reconnect

### Custom Configuration

```typescript
const query = useQuery({
  queryKey: studentsKeys.lists(),
  queryFn: fetchStudents,
  staleTime: 1000 * 60 * 5, // 5 minutes
  cacheTime: 1000 * 60 * 30, // 30 minutes
  refetchOnWindowFocus: false,
});
```

### Prefetching

Prefetch data for faster navigation:

```typescript
const queryClient = useQueryClient();

// Prefetch on hover
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: studentsKeys.lists(),
    queryFn: fetchStudents,
  });
};
```

## Optimistic Updates

Update UI immediately, rollback on error:

```typescript
const mutation = useMutation({
  mutationFn: updateStudent,
  onMutate: async (newStudent) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({
      queryKey: studentsKeys.detail(newStudent.id),
    });

    // Snapshot previous value
    const previousStudent = queryClient.getQueryData(
      studentsKeys.detail(newStudent.id)
    );

    // Optimistically update
    queryClient.setQueryData(
      studentsKeys.detail(newStudent.id),
      newStudent
    );

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
```

## Query Invalidation

Invalidate queries to trigger refetch:

```typescript
// Invalidate specific query
queryClient.invalidateQueries({
  queryKey: studentsKeys.lists(),
});

// Invalidate all student queries
queryClient.invalidateQueries({
  queryKey: studentsKeys.all,
});

// Invalidate multiple query types
queryClient.invalidateQueries({
  queryKey: ["students", "classes"],
});
```

## Background Refetching

Show stale data while fetching fresh data:

```typescript
const { data, isFetching, isStale } = useQuery({
  queryKey: studentsKeys.lists(),
  queryFn: fetchStudents,
});

// Show loading indicator when fetching in background
{isFetching && <span>Refreshing...</span>}
```

## Error Handling

### Global Error Handler

Configure in your root component:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

### Component-Level Error

```typescript
const { error, isError } = useQuery({
  queryKey: studentsKeys.lists(),
  queryFn: fetchStudents,
});

if (isError) {
  return <div>Error: {error.message}</div>;
}
```

## Best Practices

### Query Keys
- ✅ Use query key factories for consistency
- ✅ Include all dependencies in query keys
- ✅ Structure keys hierarchically: `["students", "list", filters]`

### Mutations
- ✅ Invalidate related queries on success
- ✅ Use optimistic updates for better UX
- ✅ Handle errors gracefully

### API Client
- ✅ Use single initialized client
- ✅ Never modify generated files
- ✅ Regenerate clients after backend changes

### State Separation
- ✅ Server state → TanStack Query
- ✅ Local UI state → React useState
- ✅ Global UI state → React Context (sparingly)

## Troubleshooting

### Data Not Updating

**Symptom**: Changes not reflected after mutation

**Solution**: Ensure you're invalidating the correct query keys:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({
    queryKey: studentsKeys.lists(), // Match your query
  });
}
```

### Type Errors

**Symptom**: Type errors with API client

**Solution**: Regenerate API clients:

```bash
npm run generate:api
```

### Stale Data

**Symptom**: Seeing old data after updates

**Solution**: Check staleTime and cacheTime configuration:

```typescript
useQuery({
  queryKey: studentsKeys.lists(),
  queryFn: fetchStudents,
  staleTime: 0, // Consider data stale immediately
});
```
