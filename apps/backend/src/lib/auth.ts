import { type Auth, createAuth } from "./auth-factory";
import { getLocalPrisma } from "./db";
import { getLocalAppConfig } from "./local-config";

export type { Auth } from "./auth-factory";
export { createAuth } from "./auth-factory";

let localAuth: Auth | undefined;

export function getLocalAuth() {
	localAuth ??= createAuth(getLocalAppConfig(), getLocalPrisma());
	return localAuth;
}

export const auth = new Proxy({} as Auth, {
	get(_target, property) {
		const instance = getLocalAuth();
		const value = Reflect.get(instance, property);

		return typeof value === "function" ? value.bind(instance) : value;
	},
});
