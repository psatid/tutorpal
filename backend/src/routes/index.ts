import { Hono } from "hono";
import baseRoutes from "./base-router";
import studentRoutes from "./students";
import classRoutes from "./classes";

export function createRoutes() {
	return new Hono()
		.basePath("/v1")
		.route("/", baseRoutes)
		.route("/students", studentRoutes)
		.route("/classes", classRoutes);
}

export type AppType = ReturnType<typeof createRoutes>;
