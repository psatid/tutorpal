export const lineQueryKeys = {
	all: ["line"] as const,
	connection: () => [...lineQueryKeys.all, "connection"] as const,
} as const;
