import { describe, expect, test } from "bun:test";
import { Hono, type MiddlewareHandler } from "hono";
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

const requireTestAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
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

const app = new Hono<AppEnv>().route(
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
