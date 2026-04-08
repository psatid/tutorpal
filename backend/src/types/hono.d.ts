import type { User, Session } from "better-auth";

declare module "hono" {
	interface ContextVariableMap {
		user: User;
		session: Session;
	}
}
