import { Hono, type MiddlewareHandler } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { requireAuth } from "../middleware/auth";
import { classRepository } from "../repositories";
import {
	ClassDetailSchemaResolver,
	ClassHourAdditionListQuerySchema,
	ClassHourAdditionResultSchemaResolver,
	ClassListQuerySchema,
	ClassSchemaResolver,
	CreateClassHourAdditionSchema,
	CreateClassSchema,
	ErrorResponseSchemaResolver,
	PaginatedClassHourAdditionListSchemaResolver,
	PaginatedClassListSchemaResolver,
	UpdateClassSchema,
} from "../schemas";
import { ClassService } from "../services";
import type { AppEnv } from "../types/hono-env";

export type ClassRouteDependencies = {
	requireAuth: MiddlewareHandler<AppEnv>;
	classService: ClassService;
};

export function createClassRoutes({
	requireAuth,
	classService,
}: ClassRouteDependencies) {
	return (
		new Hono<AppEnv>()
			.use(requireAuth)
			// Create class
			.post(
				"/",
				describeRoute({
					tags: ["classes"],
					description: "Create a new class",
					responses: {
						201: {
							description: "Class created successfully",
							content: {
								"application/json": {
									schema: ClassSchemaResolver,
								},
							},
						},
						400: {
							description: "Validation error",
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
					},
				}),
				validator("json", CreateClassSchema),
				async (c) => {
					const data = c.req.valid("json");
					const tutorId = c.get("tutorId");
					const classData = await classService.createClass({
						...data,
						tutorId,
					});
					return c.json(classData.toClassDTO(), 201);
				},
			)

			// List all classes
			.get(
				"/",
				describeRoute({
					tags: ["classes"],
					description: "Get all classes with pagination and search",
					parameters: [
						{
							name: "page",
							in: "query",
							required: false,
							schema: {
								type: "integer",
								default: 1,
								minimum: 1,
							},
							description: "Page number",
						},
						{
							name: "limit",
							in: "query",
							required: false,
							schema: {
								type: "integer",
								default: 10,
								minimum: 1,
								maximum: 100,
							},
							description: "Items per page",
						},
						{
							name: "search",
							in: "query",
							required: false,
							schema: {
								type: "string",
							},
							description: "Search by class name",
						},
						{
							name: "sortBy",
							in: "query",
							required: false,
							schema: {
								type: "string",
								enum: ["name", "totalHours", "createdAt"],
								default: "createdAt",
							},
							description: "Field to sort by",
						},
						{
							name: "sortOrder",
							in: "query",
							required: false,
							schema: {
								type: "string",
								enum: ["asc", "desc"],
								default: "desc",
							},
							description: "Sort order",
						},
					],
					responses: {
						200: {
							description: "Paginated list of classes",
							content: {
								"application/json": {
									schema: PaginatedClassListSchemaResolver,
								},
							},
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
					},
				}),
				validator("query", ClassListQuerySchema),
				async (c) => {
					const query = c.req.valid("query");
					const tutorId = c.get("tutorId");
					const classes = await classService.getAllClasses(tutorId, query);
					return c.json({
						...classes,
						data: classes.data.map((classData) => classData.toClassDTO()),
					});
				},
			)

			// Add hours to a standalone class
			.post(
				"/:id/hour-additions",
				describeRoute({
					tags: ["classes"],
					description:
						"Add course-preset or custom hours to a class. Request IDs are idempotent per class.",
					responses: {
						200: {
							description:
								"Hours added or an existing matching request returned",
							content: {
								"application/json": {
									schema: ClassHourAdditionResultSchemaResolver,
								},
							},
						},
						400: {
							description:
								"Validation error, unavailable course, or hour limit exceeded",
							content: {
								"application/json": { schema: ErrorResponseSchemaResolver },
							},
						},
						401: { description: "Unauthorized - Authentication required" },
						404: {
							description: "Class not found",
							content: {
								"application/json": { schema: ErrorResponseSchemaResolver },
							},
						},
						409: {
							description:
								"Request ID conflicts with a different hour addition",
							content: {
								"application/json": { schema: ErrorResponseSchemaResolver },
							},
						},
					},
				}),
				validator("json", CreateClassHourAdditionSchema),
				async (c) => {
					const result = await classService.addHourAddition(
						c.req.param("id"),
						c.get("tutorId"),
						c.req.valid("json"),
					);
					return c.json({
						addition: result.addition.toClassHourAdditionDTO(),
						totalHours: result.totalHours,
						remainingHours: result.remainingHours,
					});
				},
			)

			// List immutable hour additions, newest first
			.get(
				"/:id/hour-additions",
				describeRoute({
					tags: ["classes"],
					description: "Get immutable hour additions for a class, newest first",
					parameters: [
						{
							name: "page",
							in: "query",
							required: false,
							schema: { type: "integer", default: 1, minimum: 1 },
						},
						{
							name: "limit",
							in: "query",
							required: false,
							schema: {
								type: "integer",
								default: 20,
								minimum: 1,
								maximum: 100,
							},
						},
					],
					responses: {
						200: {
							description: "Paginated class hour additions",
							content: {
								"application/json": {
									schema: PaginatedClassHourAdditionListSchemaResolver,
								},
							},
						},
						401: { description: "Unauthorized - Authentication required" },
						404: {
							description: "Class not found",
							content: {
								"application/json": { schema: ErrorResponseSchemaResolver },
							},
						},
					},
				}),
				validator("query", ClassHourAdditionListQuerySchema),
				async (c) => {
					const additions = await classService.getHourAdditions(
						c.req.param("id"),
						c.get("tutorId"),
						c.req.valid("query"),
					);
					return c.json({
						...additions,
						data: additions.data.map((addition) =>
							addition.toClassHourAdditionDTO(),
						),
					});
				},
			)

			// Get single class
			.get(
				"/:id",
				describeRoute({
					tags: ["classes"],
					description: "Get a class by ID",
					responses: {
						200: {
							description: "Class found with recorded revenue",
							content: {
								"application/json": {
									schema: ClassDetailSchemaResolver,
								},
							},
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
						404: {
							description: "Class not found",
						},
					},
				}),
				async (c) => {
					const id = c.req.param("id");
					const tutorId = c.get("tutorId");
					const classData = await classService.getClassDetailById(id, tutorId);
					return c.json(
						classData.classData.toClassDetailDTO(classData.recordedRevenue),
					);
				},
			)

			// Update class
			.put(
				"/:id",
				describeRoute({
					tags: ["classes"],
					description: "Update a class by ID",
					responses: {
						200: {
							description: "Class updated successfully",
							content: {
								"application/json": {
									schema: ClassSchemaResolver,
								},
							},
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
						404: {
							description: "Class not found",
						},
						400: {
							description: "Validation error",
						},
					},
				}),
				validator("json", UpdateClassSchema),
				async (c) => {
					const id = c.req.param("id");
					const data = c.req.valid("json");
					const tutorId = c.get("tutorId");
					const classData = await classService.updateClass(id, tutorId, data);
					return c.json(classData.toClassDTO());
				},
			)

			// Delete class
			.delete(
				"/:id",
				describeRoute({
					tags: ["classes"],
					description: "Delete a class by ID",
					responses: {
						204: {
							description: "Class deleted successfully",
						},
						401: {
							description: "Unauthorized - Authentication required",
							content: {
								"application/json": { schema: ErrorResponseSchemaResolver },
							},
						},
						404: {
							description: "Class not found",
							content: {
								"application/json": { schema: ErrorResponseSchemaResolver },
							},
						},
					},
				}),
				async (c) => {
					const id = c.req.param("id");
					const tutorId = c.get("tutorId");
					await classService.deleteClass(id, tutorId);
					return c.body(null, 204);
				},
			)
	);
}

const classRoutes = createClassRoutes({
	requireAuth,
	classService: new ClassService(classRepository),
});

export default classRoutes;
export type ClassRoutesType = typeof classRoutes;
