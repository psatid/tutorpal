export const studentsKeys = {
  all: ["students"] as const,
  lists: () => [...studentsKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...studentsKeys.lists(), filters] as const,
  infinites: () => [...studentsKeys.all, "infinite"] as const,
  infinite: (filters?: Record<string, unknown>) =>
    [...studentsKeys.infinites(), filters] as const,
  details: () => [...studentsKeys.all, "detail"] as const,
  detail: (id: string) => [...studentsKeys.details(), id] as const,
};

export const classesKeys = {
  all: ["classes"] as const,
  lists: () => [...classesKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...classesKeys.lists(), filters] as const,
  infinites: () => [...classesKeys.all, "infinite"] as const,
  infinite: (filters?: Record<string, unknown>) =>
    [...classesKeys.infinites(), filters] as const,
  details: () => [...classesKeys.all, "detail"] as const,
  detail: (id: string) => [...classesKeys.details(), id] as const,
};

export const coursesKeys = {
	all: ["courses"] as const,
	lists: () => [...coursesKeys.all, "list"] as const,
	list: (filters?: Record<string, unknown>) => [...coursesKeys.lists(), filters] as const,
	details: () => [...coursesKeys.all, "detail"] as const,
	detail: (id: string) => [...coursesKeys.details(), id] as const,
};

export const schedulesKeys = {
  all: ["schedules"] as const,
  lists: () => [...schedulesKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...schedulesKeys.lists(), filters] as const,
  details: () => [...schedulesKeys.all, "detail"] as const,
  detail: (id: string) => [...schedulesKeys.details(), id] as const,
};
