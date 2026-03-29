import { Hono } from "hono";
import baseRoutes from "./base-router";
import studentRoutes from "./students";

export function createRoutes() {
	return new Hono()
		.route("/v1", baseRoutes)
		.route("/v1/students", studentRoutes);
}

export type AppType = ReturnType<typeof createRoutes>;
