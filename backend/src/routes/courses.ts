import { Hono, type MiddlewareHandler } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { requireAuth } from "../middleware/auth";
import { courseRepository } from "../repositories/course.repository";
import {
	CourseDetailSchemaResolver,
	CourseListQuerySchema,
	CourseSchemaResolver,
	CreateCourseSchema,
	ErrorResponseSchemaResolver,
	PaginatedCourseListSchemaResolver,
	UpdateCourseSchema,
} from "../schemas/course.schema";
import { CourseService } from "../services/course.service";
import type { AppEnv } from "../types/hono-env";

export type CourseRouteDependencies = {
	requireAuth: MiddlewareHandler<AppEnv>;
	courseService: CourseService;
};

export function createCourseRoutes({
	requireAuth,
	courseService,
}: CourseRouteDependencies) {
	return new Hono<AppEnv>()
		.use(requireAuth)
		.post(
			"/",
			describeRoute({
				tags: ["courses"],
				description: "Create a course",
				responses: {
					201: {
						description: "Course created",
						content: { "application/json": { schema: CourseSchemaResolver } },
					},
				},
			}),
			validator("json", CreateCourseSchema),
			async (c) => {
				const course = await courseService.createCourse({
					...c.req.valid("json"),
					tutorId: c.get("tutorId"),
				});
				return c.json(course.toCourseDTO(), 201);
			},
		)
		.get(
			"/",
			describeRoute({
				tags: ["courses"],
				description: "List courses",
				responses: {
					200: {
						description: "Paginated courses",
						content: {
							"application/json": { schema: PaginatedCourseListSchemaResolver },
						},
					},
				},
			}),
			validator("query", CourseListQuerySchema),
			async (c) => {
				const courses = await courseService.getAllCourses(
					c.get("tutorId"),
					c.req.valid("query"),
				);
				return c.json({
					...courses,
					data: courses.data.map((course) => course.toCourseDTO()),
				});
			},
		)
		.get(
			"/:id",
			describeRoute({
				tags: ["courses"],
				description: "Get a course",
				responses: {
					200: {
						description: "Course with recorded revenue",
						content: {
							"application/json": { schema: CourseDetailSchemaResolver },
						},
					},
					404: { description: "Course not found" },
				},
			}),
			async (c) => {
				const course = await courseService.getCourseDetailById(
					c.req.param("id"),
					c.get("tutorId"),
				);
				return c.json(
					course.course.toCourseDetailDTO(
						course.recordedHours,
						course.recordedRevenue,
					),
				);
			},
		)
		.put(
			"/:id",
			describeRoute({
				tags: ["courses"],
				description: "Update a course",
				responses: {
					200: {
						description: "Course updated",
						content: { "application/json": { schema: CourseSchemaResolver } },
					},
				},
			}),
			validator("json", UpdateCourseSchema),
			async (c) => {
				const course = await courseService.updateCourse(
					c.req.param("id"),
					c.get("tutorId"),
					c.req.valid("json"),
				);
				return c.json(course.toCourseDTO());
			},
		)
		.delete(
			"/:id",
			describeRoute({
				tags: ["courses"],
				description: "Delete a course",
				responses: {
					204: { description: "Course deleted" },
					401: {
						description: "Unauthorized - Authentication required",
						content: {
							"application/json": { schema: ErrorResponseSchemaResolver },
						},
					},
					404: {
						description: "Course not found",
						content: {
							"application/json": { schema: ErrorResponseSchemaResolver },
						},
					},
				},
			}),
			async (c) => {
				await courseService.deleteCourse(c.req.param("id"), c.get("tutorId"));
				return c.body(null, 204);
			},
		);
}

const courseRoutes = createCourseRoutes({
	requireAuth,
	courseService: new CourseService(courseRepository),
});

export default courseRoutes;
