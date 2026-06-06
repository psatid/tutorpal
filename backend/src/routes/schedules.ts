import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { scheduleRepository } from "../repositories";
import {
	CreateScheduleSchema,
	CreateScheduleSchemaResolver,
	ScheduleListQuerySchema,
	ScheduleListQuerySchemaResolver,
	ScheduleListSchemaResolver,
	ScheduleSchemaResolver,
	UpdateScheduleSchema,
	UpdateScheduleSchemaResolver,
} from "../schemas";
import { ScheduleService } from "../services";

// Initialize service with repository
const scheduleService = new ScheduleService(scheduleRepository);

const scheduleRoutes = new Hono()
	.use(requireAuth)
	// Create schedule
		.post(
			"/",
			describeRoute({
				tags: ["schedules"],
				description: "Create a new schedule (one-time or recurring)",
				requestBody: {
					content: {
						"application/json": {
							schema: CreateScheduleSchemaResolver as any,
						},
					},
				},
				responses: {
					201: {
						description: "Schedule created successfully",
						content: {
							"application/json": {
								schema: ScheduleSchemaResolver as any,
							},
						},
					},
					400: {
						description: "Validation error or class not found",
					},
					401: {
						description: "Unauthorized - Authentication required",
					},
				},
			}),
			sValidator("json", CreateScheduleSchema),
			async (c) => {
				const data = c.req.valid("json");
				const schedule = await scheduleService.createSchedule(data);
				return c.json(schedule, 201);
			},
		)

	// List all schedules
	.get(
		"/",
		describeRoute({
			tags: ["schedules"],
			description: "Get all schedules with optional filtering",
			parameters: [
				{
					name: "date",
					in: "query",
					required: false,
					schema: {
						type: "string",
						pattern: "^\\d{4}-\\d{2}-\\d{2}$",
					},
					description: "Filter by date (YYYY-MM-DD format)",
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
			],
			responses: {
				200: {
					description: "List of schedules",
					content: {
						"application/json": {
							schema: ScheduleListSchemaResolver as any,
						},
					},
				},
				401: {
					description: "Unauthorized - Authentication required",
				},
			},
		}),
		sValidator("query", ScheduleListQuerySchema),
		async (c) => {
			const query = c.req.valid("query");
			const schedules = await scheduleService.getAllSchedules(query);
			return c.json(schedules);
		},
	)

	// Get single schedule
	.get(
		"/:id",
		describeRoute({
			tags: ["schedules"],
			description: "Get a schedule by ID",
			responses: {
				200: {
					description: "Schedule found",
					content: {
						"application/json": {
							schema: ScheduleSchemaResolver as any,
						},
					},
				},
				401: {
					description: "Unauthorized - Authentication required",
				},
				404: {
					description: "Schedule not found",
				},
			},
		}),
		async (c) => {
			const id = c.req.param("id");
			const schedule = await scheduleService.getScheduleById(id);
			return c.json(schedule);
		},
	)

	// Update schedule
	.put(
		"/:id",
		describeRoute({
			tags: ["schedules"],
			description: "Update a schedule by ID",
			requestBody: {
				content: {
					"application/json": {
						schema: UpdateScheduleSchemaResolver as any,
					},
				},
			},
			responses: {
				200: {
					description: "Schedule updated successfully",
					content: {
						"application/json": {
							schema: ScheduleSchemaResolver as any,
						},
					},
				},
				401: {
					description: "Unauthorized - Authentication required",
				},
				404: {
					description: "Schedule not found",
				},
				400: {
					description: "Validation error or class not found",
				},
			},
		}),
		sValidator("json", UpdateScheduleSchema),
		async (c) => {
			const id = c.req.param("id");
			const data = c.req.valid("json");
			const schedule = await scheduleService.updateSchedule(id, data);
			return c.json(schedule);
		},
	)

	// Delete schedule
	.delete(
		"/:id",
		describeRoute({
			tags: ["schedules"],
			description: "Delete a schedule by ID",
			responses: {
				204: {
					description: "Schedule deleted successfully",
				},
				401: {
					description: "Unauthorized - Authentication required",
				},
				404: {
					description: "Schedule not found",
				},
			},
		}),
		async (c) => {
			const id = c.req.param("id");
			await scheduleService.deleteSchedule(id);
			return c.body(null, 204);
		},
	)

	// Complete schedule (mark as completed and deduct hours)
	.patch(
		"/:id/complete",
		describeRoute({
			tags: ["schedules"],
			description:
				"Complete a schedule (marks as COMPLETED and deducts hours from class)",
			responses: {
				200: {
					description: "Schedule completed successfully",
					content: {
						"application/json": {
							schema: ScheduleSchemaResolver as any,
						},
					},
				},
				400: {
					description: "Invalid status transition or insufficient hours",
				},
				401: {
					description: "Unauthorized - Authentication required",
				},
				404: {
					description: "Schedule not found",
				},
			},
		}),
		async (c) => {
			const id = c.req.param("id");
			const schedule = await scheduleService.completeSchedule(id);
			return c.json(schedule);
		},
	)

	// Restore hours (when cancelling a completed schedule)
	.patch(
		"/:id/restore",
		describeRoute({
			tags: ["schedules"],
			description:
				"Restore hours for a completed schedule (marks as CANCELLED)",
			responses: {
				200: {
					description: "Hours restored successfully",
					content: {
						"application/json": {
							schema: ScheduleSchemaResolver as any,
						},
					},
				},
				400: {
					description:
						"Invalid operation - schedule not completed or hours already restored",
				},
				401: {
					description: "Unauthorized - Authentication required",
				},
				404: {
					description: "Schedule not found",
				},
			},
		}),
		async (c) => {
			const id = c.req.param("id");
			const schedule = await scheduleService.restoreHours(id);
			return c.json(schedule);
		},
	)

	// Get remaining hours for a class
	.get(
		"/class/:classId/remaining-hours",
		describeRoute({
			tags: ["schedules"],
			description: "Get remaining hours for a class",
			responses: {
				200: {
					description: "Remaining hours",
					content: {
						"application/json": {
							schema: resolver(z.object({ remainingHours: z.number() })) as any,
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
			const classId = c.req.param("classId");
			const remainingHours = await scheduleService.getRemainingHours(classId);
			return c.json({ remainingHours });
		},
	);

export default scheduleRoutes;
export type ScheduleRoutesType = typeof scheduleRoutes;
