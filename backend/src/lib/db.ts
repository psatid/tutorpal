import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { ENV } from "./env";

const adapter = new PrismaPg({ connectionString: ENV.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
