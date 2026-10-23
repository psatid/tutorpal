export const socialAccountQueryKeys = {
  all: ["social-accounts"] as const,
  status: () => [...socialAccountQueryKeys.all, "status"] as const,
} as const;
