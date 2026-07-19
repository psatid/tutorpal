export const schedulesKeys = {
  all: ["schedules"] as const,
  lists: () => [...schedulesKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...schedulesKeys.lists(), filters] as const,
  details: () => [...schedulesKeys.all, "detail"] as const,
  detail: (id: string) => [...schedulesKeys.details(), id] as const,
};
