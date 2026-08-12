import { createApp } from "./app";
import { createApplicationDependencies } from "./app-dependencies";
import { ENV } from "./lib/env";
import { createPrismaClient } from "./lib/prisma";

const port = Number(ENV.PORT);
const prisma = createPrismaClient(ENV.DATABASE_URL);
const app = createApp(createApplicationDependencies(ENV, prisma));

Bun.serve({
	port,
	fetch: app.fetch,
});

console.log(`Server running on http://localhost:${port}`);
