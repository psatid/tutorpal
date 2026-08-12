import type { PrismaClient } from "@prisma/client";
import { getLocalAppConfig } from "./local-config";
import { createPrismaClient } from "./prisma";

export { createPrismaClient } from "./prisma";

let localPrisma: PrismaClient | undefined;

export function getLocalPrisma() {
	localPrisma ??= createPrismaClient(getLocalAppConfig().DATABASE_URL);
	return localPrisma;
}

// Keep the legacy Bun/test export lazy so importing Worker modules does not
// construct a local client. Once accessed, delegates are forwarded to the
// same mutable Prisma client used by the local repository test doubles.
export const prisma = new Proxy({} as PrismaClient, {
	get(_target, property) {
		const client = getLocalPrisma();
		const value = Reflect.get(client, property, client);

		return typeof value === "function" ? value.bind(client) : value;
	},
	set(_target, property, value) {
		return Reflect.set(getLocalPrisma(), property, value);
	},
});
