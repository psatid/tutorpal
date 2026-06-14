import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { requireAuth } from "../middleware/auth";
import { classRepository } from "../repositories";
import {
	ClassListQuerySchema,
	ClassListQuerySchemaResolver,
	ClassSchemaResolver,
	CreateClassSchema,
	CreateClassSchemaResolver,
	PaginatedClassListSchemaResolver,
	UpdateClassSchema,
	UpdateClassSchemaResolver,
} from "../schemas";
import { ClassService } from "../services";

// Initialize service with repository
const classService = new ClassService(classRepository);

const classRoutes = new Hono()
	.use(requireAuth)
	// Create class
	.post(
		"/",
		describeRoute({
			tags: ["classes"],
			description: "Create a new class",
			requestBody: {
				content: {
					"application/json": {
						schema: CreateClassSchemaResolver as any,
					},
				},
			},
			responses: {
				201: {
					description: "Class created successfully",
					content: {
						"application/json": {
							schema: ClassSchemaResolver as any,
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
		sValidator("json", CreateClassSchema),
		async (c) => {
			const data = c.req.valid("json");
			const classData = await classService.createClass(data);
			return c.json(classData, 201);
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
							schema: PaginatedClassListSchemaResolver as any,
						},
					},
				},
				401: {
					description: "Unauthorized - Authentication required",
				},
			},
		}),
		sValidator("query", ClassListQuerySchema),
		async (c) => {
			const query = c.req.valid("query");
			const classes = await classService.getAllClasses(query);
			return c.json(classes);
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
							schema: ClassSchemaResolver as any,
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
			const classData = await classService.getClassById(id);
			return c.json(classData);
		},
	)

	// Update class
	.put(
		"/:id",
		describeRoute({
			tags: ["classes"],
			description: "Update a class by ID",
			requestBody: {
				content: {
					"application/json": {
						schema: UpdateClassSchemaResolver as any,
					},
				},
			},
			responses: {
				200: {
					description: "Class updated successfully",
					content: {
						"application/json": {
							schema: ClassSchemaResolver as any,
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
		sValidator("json", UpdateClassSchema),
		async (c) => {
			const id = c.req.param("id");
			const data = c.req.valid("json");
			const classData = await classService.updateClass(id, data);
			return c.json(classData);
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
			await classService.deleteClass(id);
			return c.body(null, 204);
		},
	);

export default classRoutes;
export type ClassRoutesType = typeof classRoutes;
