import { Hono } from "hono";
import baseRoutes from "./base-router";
import studentRoutes from "./students";

export function createRoutes() {
	return new Hono()
		.basePath("/v1")
		.route("/", baseRoutes)
		.route("/students", studentRoutes);
}

export type AppType = ReturnType<typeof createRoutes>;
