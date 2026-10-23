import { Hono, type MiddlewareHandler } from "hono";
import { describeRoute, resolver, validator } from "hono-openapi";
import { z } from "zod";
import { requireAuth } from "../middleware/auth";
import { scheduleRepository } from "../repositories";
import {
	AwaitingConfirmationPageSchemaResolver,
	AwaitingConfirmationQuerySchema,
	CreateScheduleSchema,
	NoShowScheduleSchema,
	RecurringScheduleUpdateResultSchemaResolver,
	ScheduleListQuerySchema,
	ScheduleListSchemaResolver,
	ScheduleSchemaResolver,
	UpdateRecurringScheduleSchema,
	UpdateScheduleSchema,
} from "../schemas";
import { ScheduleService } from "../services";
import type { AppEnv } from "../types/hono-env";

export type ScheduleRouteDependencies = {
	requireAuth: MiddlewareHandler<AppEnv>;
	scheduleService: ScheduleService;
};

export function createScheduleRoutes({
	requireAuth,
	scheduleService,
}: ScheduleRouteDependencies) {
	return (
		new Hono<AppEnv>()
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
					return c.json(schedule.toScheduleDTO(), 201);
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
							name: "startDate",
							in: "query",
							required: false,
							schema: {
								type: "string",
								pattern: "^\\d{4}-\\d{2}-\\d{2}$",
							},
							description:
								"Inclusive range start (YYYY-MM-DD format); provide with endDate",
						},
						{
							name: "endDate",
							in: "query",
							required: false,
							schema: {
								type: "string",
								pattern: "^\\d{4}-\\d{2}-\\d{2}$",
							},
							description:
								"Inclusive range end (YYYY-MM-DD format); provide with startDate",
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
					const schedules = await scheduleService.getAllSchedules(
						tutorId,
						query,
					);
					return c.json(schedules.map((schedule) => schedule.toScheduleDTO()));
				},
			)

			// List scheduled sessions whose end has passed and still need confirmation
			.get(
				"/awaiting-confirmation",
				validator("query", AwaitingConfirmationQuerySchema, (result, c) => {
					const hasCursorValidationError =
						!result.success &&
						result.error.some((issue) =>
							issue.path?.some(
								(path) =>
									path === "cursor" ||
									(typeof path === "object" &&
										path !== null &&
										"key" in path &&
										path.key === "cursor"),
							),
						);
					if (hasCursorValidationError) {
						return c.json(
							{
								errorCode: "INVALID_AWAITING_CONFIRMATION_CURSOR",
								message: "The confirmation cursor is invalid",
							},
							400,
						);
					}
					return undefined;
				}),
				describeRoute({
					tags: ["schedules"],
					description:
						"List tutor-owned scheduled sessions whose scheduled end has passed, oldest first",
					parameters: [
						{
							name: "limit",
							in: "query",
							required: false,
							schema: {
								type: "integer",
								default: 10,
								minimum: 1,
								maximum: 50,
							},
							description: "Maximum sessions to return",
						},
						{
							name: "cursor",
							in: "query",
							required: false,
							schema: {
								type: "string",
								pattern: "^[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+$",
								maxLength: 1024,
							},
							description:
								"Opaque signed cursor from the previous awaiting-confirmation response",
						},
					],
					responses: {
						200: {
							description: "Scheduled sessions awaiting confirmation",
							content: {
								"application/json": {
									schema: AwaitingConfirmationPageSchemaResolver,
								},
							},
						},
						400: {
							description: "Invalid pagination limit or cursor",
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
					},
				}),
				async (c) => {
					const page = await scheduleService.getSchedulesAwaitingConfirmation(
						c.get("tutorId"),
						c.req.valid("query"),
					);
					return c.json({
						data: page.data.map((schedule) => schedule.toScheduleDTO()),
						pagination: page.pagination,
					});
				},
			)

			// Update a recurring schedule from an effective date
			.patch(
				"/recurring/:id",
				describeRoute({
					tags: ["schedules"],
					description:
						"Update a recurring schedule from an effective date by recreating future generated schedules",
					responses: {
						200: {
							description: "Recurring schedule updated successfully",
							content: {
								"application/json": {
									schema: RecurringScheduleUpdateResultSchemaResolver,
								},
							},
						},
						400: {
							description:
								"Validation error, conflicting future schedules, or insufficient hours",
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
						404: {
							description: "Recurring schedule not found",
						},
					},
				}),
				validator("json", UpdateRecurringScheduleSchema),
				async (c) => {
					const id = c.req.param("id");
					const data = c.req.valid("json");
					const tutorId = c.get("tutorId");
					const result = await scheduleService.updateRecurringSchedule(
						id,
						data,
						tutorId,
					);
					return c.json(result.toRecurringScheduleUpdateResultDTO());
				},
			)

			// Mark a scheduled session as a no-show or cancel it without a deduction
			.patch(
				"/:id/no-show",
				describeRoute({
					tags: ["schedules"],
					description:
						"Mark a scheduled session as a no-show with an optional deduction, or cancel it without a deduction",
					responses: {
						200: {
							description: "Schedule status updated successfully",
							content: {
								"application/json": {
									schema: ScheduleSchemaResolver,
								},
							},
						},
						400: {
							description: "Validation error",
						},
						401: {
							description: "Unauthorized - Authentication required",
						},
						404: {
							description: "Schedule not found",
						},
						409: {
							description: "Schedule status changed before this action",
						},
					},
				}),
				validator("json", NoShowScheduleSchema),
				async (c) => {
					const id = c.req.param("id");
					const data = c.req.valid("json");
					const schedule = await scheduleService.markNoShow(
						id,
						data,
						c.get("tutorId"),
					);
					return c.json(schedule.toScheduleDTO());
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
					const schedule = await scheduleService.getScheduleById(
						id,
						c.get("tutorId"),
					);
					return c.json(schedule.toScheduleDTO());
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
					const schedule = await scheduleService.updateSchedule(
						id,
						data,
						tutorId,
					);
					return c.json(schedule.toScheduleDTO());
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
					await scheduleService.deleteSchedule(id, c.get("tutorId"));
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
						409: {
							description: "Schedule status changed before this action",
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
					const schedule = await scheduleService.completeSchedule(
						id,
						c.get("tutorId"),
					);
					return c.json(schedule.toScheduleDTO());
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
						409: {
							description:
								"Schedule status changed before this action or hours were already restored",
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
					const schedule = await scheduleService.restoreHours(
						id,
						c.get("tutorId"),
					);
					return c.json(schedule.toScheduleDTO());
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
					const remainingHours = await scheduleService.getRemainingHours(
						classId,
						c.get("tutorId"),
					);
					return c.json({ remainingHours });
				},
			)
	);
}

const scheduleRoutes = createScheduleRoutes({
	requireAuth,
	scheduleService: new ScheduleService(scheduleRepository),
});

export default scheduleRoutes;
export type ScheduleRoutesType = typeof scheduleRoutes;
