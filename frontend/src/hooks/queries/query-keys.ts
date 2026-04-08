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
  list: (filters?: Record<string, unknown>) =>
    [...classesKeys.lists(), filters] as const,
  details: () => [...classesKeys.all, "detail"] as const,
  detail: (id: string) => [...classesKeys.details(), id] as const,
};
