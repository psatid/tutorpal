import type { Hono } from "hono";
import type { Auth } from "../lib/auth-factory";

type AuthenticatedSession = NonNullable<
	Awaited<ReturnType<Auth["api"]["getSession"]>>
>;

export type AppEnv = {
	Variables: {
		user: AuthenticatedSession["user"];
		session: AuthenticatedSession["session"];
		tutorId: string;
	};
};

export type AppHono = Hono<AppEnv>;
