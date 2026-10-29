import { describe, expect, test } from "bun:test";
import { Hono, type MiddlewareHandler } from "hono";
import { AppError } from "../lib/error";
import { errorHandler } from "../middleware/error-handler";
import { ScheduleModel } from "../models/schedule.model";
import type { ScheduleService } from "../services";
import type { AppEnv } from "../types/hono-env";
import { createScheduleRoutes } from "./schedules";

const onlineSchedule = ScheduleModel.fromSchedulePrisma({
	id: "schedule-online",
	classId: "class-1",
	date: new Date("2026-08-10T00:00:00.000Z"),
	time: 540,
	durationSeconds: 3_600n,
	notes: null,
	noShowNote: null,
	status: "SCHEDULED",
	type: "ONLINE",
	createdAt: new Date("2026-08-01T00:00:00.000Z"),
	updatedAt: new Date("2026-08-01T00:00:00.000Z"),
	class: {
		name: "Algebra",
	},
});

let listTutorId: string | undefined;
let listQuery: unknown;
let detailTutorId: string | undefined;
let detailScheduleId: string | undefined;
let createCalls: Array<{ data: unknown; tutorId: string }> = [];
let noShowCalls: Array<{
	id: string;
	tutorId: string;
	data: { deductHours: boolean; note?: string };
}> = [];
let completeCalls: Array<[string, string]> = [];
let restoreCalls: Array<[string, string]> = [];
let awaitingConfirmationTutorId: string | undefined;
let awaitingConfirmationQuery: unknown;
let awaitingConfirmationCalls = 0;

const requireTestAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
	if (c.req.header("Authorization") !== "Bearer test-session") {
		throw AppError.unauthorized("UNAUTHORIZED", "Authentication required");
	}

	c.set("tutorId", "tutor-1");
	return next();
};

const scheduleService = {
	createSchedule: async (data: unknown, tutorId: string) => {
		createCalls.push({ data, tutorId });
		return onlineSchedule;
	},
	getAllSchedules: async (tutorId: string, query?: unknown) => {
		listTutorId = tutorId;
		listQuery = query;
		return [onlineSchedule];
	},
	getSchedulesAwaitingConfirmation: async (tutorId: string, query: unknown) => {
		awaitingConfirmationTutorId = tutorId;
		awaitingConfirmationQuery = query;
		awaitingConfirmationCalls += 1;
		return {
			data: [onlineSchedule],
			pagination: {
				total: 1,
				hasNext: true,
				nextCursor: "next-confirmation-page",
			},
		};
	},
	getScheduleById: async (id: string, tutorId: string) => {
		detailScheduleId = id;
		detailTutorId = tutorId;
		return onlineSchedule;
	},
	markNoShow: async (
		id: string,
		data: { deductHours: boolean; note?: string },
		tutorId: string,
	) => {
		noShowCalls.push({ id, tutorId, data });
		return onlineSchedule;
	},
	completeSchedule: async (id: string, tutorId: string) => {
		completeCalls.push([id, tutorId]);
		return onlineSchedule;
	},
	restoreHours: async (id: string, tutorId: string) => {
		restoreCalls.push([id, tutorId]);
		return onlineSchedule;
	},
} as unknown as ScheduleService;

const app = new Hono<AppEnv>();
app.onError(errorHandler);
app.route(
	"/v1/schedules",
	createScheduleRoutes({ requireAuth: requireTestAuth, scheduleService }),
);

describe("schedule routes", () => {
	test("rejects fractional one-time durations before calling the schedule service", async () => {
		createCalls = [];
		const response = await app.request("http://api.test/v1/schedules", {
			method: "POST",
			headers: {
				Authorization: "Bearer test-session",
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				classId: "class-1",
				date: "2026-08-10",
				type: "ON_SITE",
				time: 540,
				durationMinutes: 1.5,
			}),
		});

		expect(response.status).toBe(400);
		expect(createCalls).toEqual([]);
	});

	test("serializes ONLINE type in an authenticated list response", async () => {
		const response = await app.request("http://api.test/v1/schedules", {
			headers: { Authorization: "Bearer test-session" },
		});

		expect(response.status).toBe(200);
		expect((await response.json()) as Array<{ type: string }>).toEqual([
			expect.objectContaining({ type: "ONLINE" }),
		]);
		expect(listTutorId).toBe("tutor-1");
	});

	test("passes an authenticated inclusive date range to the repository", async () => {
		const response = await app.request(
			"http://api.test/v1/schedules?startDate=2026-08-10&endDate=2026-08-16&search=Algebra",
			{
				headers: { Authorization: "Bearer test-session" },
			},
		);

		expect(response.status).toBe(200);
		expect(listQuery).toEqual({
			startDate: "2026-08-10",
			endDate: "2026-08-16",
			search: "Algebra",
		});
	});

	test("rejects a partial date range", async () => {
		const response = await app.request(
			"http://api.test/v1/schedules?startDate=2026-08-10",
			{
				headers: { Authorization: "Bearer test-session" },
			},
		);

		expect(response.status).toBe(400);
	});

	test("returns an authenticated confirmation page through the schedule DTO boundary", async () => {
		awaitingConfirmationCalls = 0;
		awaitingConfirmationTutorId = undefined;
		awaitingConfirmationQuery = undefined;

		const response = await app.request(
			"http://api.test/v1/schedules/awaiting-confirmation?limit=2&cursor=v1.Ab-_9.Cd-_9",
			{ headers: { Authorization: "Bearer test-session" } },
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			data: [
				{
					id: "schedule-online",
					classId: "class-1",
					className: "Algebra",
					recurringScheduleId: null,
					date: "2026-08-10",
					time: 540,
					durationMinutes: 60,
					notes: null,
					noShowNote: null,
					status: "SCHEDULED",
					type: "ONLINE",
					createdAt: "2026-08-01T00:00:00.000Z",
					updatedAt: "2026-08-01T00:00:00.000Z",
				},
			],
			pagination: {
				total: 1,
				hasNext: true,
				nextCursor: "next-confirmation-page",
			},
		});
		expect(awaitingConfirmationTutorId).toBe("tutor-1");
		expect(awaitingConfirmationQuery).toEqual({
			limit: 2,
			cursor: "v1.Ab-_9.Cd-_9",
		});
	});

	test("defaults and validates confirmation pagination before calling the service", async () => {
		awaitingConfirmationCalls = 0;
		awaitingConfirmationQuery = undefined;

		const defaultPage = await app.request(
			"http://api.test/v1/schedules/awaiting-confirmation",
			{ headers: { Authorization: "Bearer test-session" } },
		);

		expect(defaultPage.status).toBe(200);
		expect(awaitingConfirmationQuery).toEqual({ limit: 10 });

		for (const path of [
			"/v1/schedules/awaiting-confirmation?limit=0",
			"/v1/schedules/awaiting-confirmation?limit=51",
			"/v1/schedules/awaiting-confirmation?limit=1.5",
		]) {
			const response = await app.request(`http://api.test${path}`, {
				headers: { Authorization: "Bearer test-session" },
			});
			expect(response.status).toBe(400);
			expect(await response.json()).not.toEqual({
				errorCode: "INVALID_AWAITING_CONFIRMATION_CURSOR",
				message: "The confirmation cursor is invalid",
			});
		}

		const malformedCursor = await app.request(
			"http://api.test/v1/schedules/awaiting-confirmation?cursor=not%2Ba%2Bcursor",
			{ headers: { Authorization: "Bearer test-session" } },
		);
		expect(malformedCursor.status).toBe(400);
		expect(await malformedCursor.json()).toEqual({
			errorCode: "INVALID_AWAITING_CONFIRMATION_CURSOR",
			message: "The confirmation cursor is invalid",
		});

		expect(awaitingConfirmationCalls).toBe(1);
	});

	test("requires authentication before listing confirmation candidates", async () => {
		awaitingConfirmationCalls = 0;

		const response = await app.request(
			"http://api.test/v1/schedules/awaiting-confirmation",
		);

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			errorCode: "UNAUTHORIZED",
			message: "Authentication required",
		});
		expect(awaitingConfirmationCalls).toBe(0);
	});

	test("serializes ONLINE type in an authenticated detail response", async () => {
		const response = await app.request(
			"http://api.test/v1/schedules/schedule-online",
			{
				headers: { Authorization: "Bearer test-session" },
			},
		);

		expect(response.status).toBe(200);
		expect((await response.json()) as { type: string }).toEqual(
			expect.objectContaining({ type: "ONLINE" }),
		);
		expect(detailScheduleId).toBe("schedule-online");
		expect(detailTutorId).toBe("tutor-1");
	});

	test("requires a no-show deduction choice and passes a trimmed note for both transitions", async () => {
		noShowCalls = [];
		const missingChoice = await app.request(
			"http://api.test/v1/schedules/schedule-online/no-show",
			{
				method: "PATCH",
				headers: {
					Authorization: "Bearer test-session",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ note: "Absent" }),
			},
		);
		expect(missingChoice.status).toBe(400);
		expect(noShowCalls).toEqual([]);

		for (const deductHours of [true, false]) {
			const response = await app.request(
				"http://api.test/v1/schedules/schedule-online/no-show",
				{
					method: "PATCH",
					headers: {
						Authorization: "Bearer test-session",
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ deductHours, note: "  Absent  " }),
				},
			);
			expect(response.status).toBe(200);
		}

		expect(noShowCalls).toEqual([
			{
				id: "schedule-online",
				tutorId: "tutor-1",
				data: { deductHours: true, note: "Absent" },
			},
			{
				id: "schedule-online",
				tutorId: "tutor-1",
				data: { deductHours: false, note: "Absent" },
			},
		]);
	});

	test("rejects status transitions through the generic update route", async () => {
		detailScheduleId = undefined;
		const response = await app.request(
			"http://api.test/v1/schedules/schedule-online",
			{
				method: "PUT",
				headers: {
					Authorization: "Bearer test-session",
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ status: "COMPLETED" }),
			},
		);

		expect(response.status).toBe(400);
		expect(detailScheduleId).toBeUndefined();
	});

	test("passes ownership context to dedicated complete and restore actions", async () => {
		completeCalls = [];
		restoreCalls = [];

		const complete = await app.request(
			"http://api.test/v1/schedules/schedule-online/complete",
			{ method: "PATCH", headers: { Authorization: "Bearer test-session" } },
		);
		const restore = await app.request(
			"http://api.test/v1/schedules/schedule-online/restore",
			{ method: "PATCH", headers: { Authorization: "Bearer test-session" } },
		);

		expect(complete.status).toBe(200);
		expect(restore.status).toBe(200);
		expect(completeCalls).toEqual([["schedule-online", "tutor-1"]]);
		expect(restoreCalls).toEqual([["schedule-online", "tutor-1"]]);
	});
});
