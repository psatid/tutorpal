import { Hono } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { scheduleRepository } from "../repositories";
import {
	CreateScheduleSchema,
	ScheduleListQuerySchema,
	ScheduleListSchemaResolver,
	ScheduleSchemaResolver,
	UpdateScheduleSchema,
} from "../schemas";
import { ScheduleService } from "../services";
import type { AppEnv } from "../types/hono-env";

// Initialize service with repository
const scheduleService = new ScheduleService(scheduleRepository);

const scheduleRoutes = new Hono<AppEnv>()
	.use(requireAuth)
	// Create schedule
	.post(
		"/",
		describeRoute({
			tags: ["schedules"],
			description: "Create a new schedule (one-time or recurring)",
			responses: {
				201: {
					description: "Schedule created successfully",
					content: {
						"application/json": {
							schema: ScheduleSchemaResolver,
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
		validator("json", CreateScheduleSchema),
		async (c) => {
			const data = c.req.valid("json");
			const tutorId = c.get("tutorId");
			const schedule = await scheduleService.createSchedule(data, tutorId);
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
				{
					name: "classId",
					in: "query",
					required: false,
					schema: {
						type: "string",
					},
					description: "Filter by class ID",
				},
			],
			responses: {
				200: {
					description: "List of schedules",
					content: {
						"application/json": {
							schema: ScheduleListSchemaResolver,
						},
					},
				},
				401: {
					description: "Unauthorized - Authentication required",
				},
			},
		}),
		validator("query", ScheduleListQuerySchema),
		async (c) => {
			const query = c.req.valid("query");
			const tutorId = c.get("tutorId");
			const schedules = await scheduleService.getAllSchedules(tutorId, query);
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
							schema: ScheduleSchemaResolver,
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
			responses: {
				200: {
					description: "Schedule updated successfully",
					content: {
						"application/json": {
							schema: ScheduleSchemaResolver,
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
		validator("json", UpdateScheduleSchema),
		async (c) => {
			const id = c.req.param("id");
			const data = c.req.valid("json");
			const tutorId = c.get("tutorId");
			const schedule = await scheduleService.updateSchedule(id, data, tutorId);
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
							schema: ScheduleSchemaResolver,
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
				"Restore hours for a completed or no-show schedule (marks as CANCELLED)",
			responses: {
				200: {
					description: "Hours restored successfully",
					content: {
						"application/json": {
							schema: ScheduleSchemaResolver,
						},
					},
				},
				400: {
					description:
						"Invalid operation - schedule not completed/no-show or hours already restored",
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
							schema: resolver(z.object({ remainingHours: z.number() })),
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
