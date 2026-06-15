import type { Hono } from "hono";

export type AppEnv = {
	Variables: {
		user: any;
		session: any;
		tutorId: string;
	};
};

export type AppHono = Hono<AppEnv>;
