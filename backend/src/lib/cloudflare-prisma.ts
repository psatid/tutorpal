// Keep the Worker seam separate from the local Bun compatibility export so
// Worker lifecycle tests cannot replace Prisma delegates used by repository
// tests in the same Bun test process.
export { createPrismaClient } from "./prisma";
