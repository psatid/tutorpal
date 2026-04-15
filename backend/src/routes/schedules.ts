import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import { describeRoute } from "hono-openapi";
import { requireAuth } from "../middleware/auth";
import { scheduleRepository } from "../repositories";
import {
	CreateScheduleSchema,
	CreateScheduleSchemaResolver,
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
			description: "Create a new schedule",
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
			description: "Get all schedules",
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
		async (c) => {
			const schedules = await scheduleService.getAllSchedules();
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
	);

export default scheduleRoutes;
export type ScheduleRoutesType = typeof scheduleRoutes;
