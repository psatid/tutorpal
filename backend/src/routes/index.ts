import { Hono } from "hono";
import baseRoutes from "./base-router";
import classRoutes from "./classes";
import scheduleRoutes from "./schedules";
import studentRoutes from "./students";

export function createRoutes() {
	return new Hono()
		.basePath("/v1")
		.route("/", baseRoutes)
		.route("/students", studentRoutes)
		.route("/classes", classRoutes)
		.route("/schedules", scheduleRoutes);
}

export type AppType = ReturnType<typeof createRoutes>;
