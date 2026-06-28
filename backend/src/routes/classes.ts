import { Hono } from "hono";
import { describeRoute, validator } from "hono-openapi";
import { requireAuth } from "../middleware/auth";
import { classRepository } from "../repositories";
import {
	ClassListQuerySchema,
	ClassSchemaResolver,
	CreateClassSchema,
	PaginatedClassListSchemaResolver,
	UpdateClassSchema,
} from "../schemas";
import { ClassService } from "../services";
import type { AppEnv } from "../types/hono-env";

// Initialize service with repository
const classService = new ClassService(classRepository);

const classRoutes = new Hono<AppEnv>()
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
			const classData = await classService.createClass({ ...data, tutorId });
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

	// Get single class
	.get(
		"/:id",
		describeRoute({
			tags: ["classes"],
			description: "Get a class by ID",
			responses: {
				200: {
					description: "Class found",
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
			},
		}),
		async (c) => {
			const id = c.req.param("id");
			const tutorId = c.get("tutorId");
			const classData = await classService.getClassById(id, tutorId);
			return c.json(classData.toClassDTO());
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
				},
				404: {
					description: "Class not found",
				},
			},
		}),
		async (c) => {
			const id = c.req.param("id");
			const tutorId = c.get("tutorId");
			await classService.deleteClass(id, tutorId);
			return c.body(null, 204);
		},
	);

export default classRoutes;
export type ClassRoutesType = typeof classRoutes;
