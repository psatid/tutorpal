import { Hono, type MiddlewareHandler } from "hono";
import { getLocalAppConfig } from "../lib/local-config";
import { requireAuth } from "../middleware/auth";
import {
	classRepository,
	courseRepository,
	lineRepository,
	scheduleRepository,
	studentRepository,
} from "../repositories";
import {
	ClassService,
	CourseService,
	LineService,
	ScheduleService,
	StudentService,
} from "../services";
import type { AppEnv } from "../types/hono-env";
import baseRoutes from "./base-router";
import { createClassRoutes } from "./classes";
import { createCourseRoutes } from "./courses";
import { createLineRoutes } from "./line";
import { createScheduleRoutes } from "./schedules";
import { createStudentRoutes } from "./students";

export type RouteDependencies = {
	requireAuth: MiddlewareHandler<AppEnv>;
	classService: ClassService;
	courseService: CourseService;
	lineService: LineService;
	scheduleService: ScheduleService;
	studentService: StudentService;
	getFrontendUrl(): string;
};

function createDefaultRouteDependencies(): RouteDependencies {
	return {
		requireAuth,
		classService: new ClassService(classRepository),
		courseService: new CourseService(courseRepository),
		lineService: new LineService(lineRepository, studentRepository),
		scheduleService: new ScheduleService(scheduleRepository, classRepository),
		studentService: new StudentService(studentRepository),
		getFrontendUrl: () => getLocalAppConfig().FRONTEND_URL,
	};
}

export function createRoutes(
	dependencies: RouteDependencies = createDefaultRouteDependencies(),
) {
	return new Hono<AppEnv>()
		.basePath("/v1")
		.route("/", baseRoutes)
		.route("/students", createStudentRoutes(dependencies))
		.route("/classes", createClassRoutes(dependencies))
		.route("/courses", createCourseRoutes(dependencies))
		.route("/schedules", createScheduleRoutes(dependencies))
		.route("/line", createLineRoutes(dependencies));
}

export type AppType = ReturnType<typeof createRoutes>;
