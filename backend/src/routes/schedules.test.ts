import { describe, expect, mock, test } from "bun:test";
import { Hono } from "hono";
import { ScheduleModel } from "../models/schedule.model";
import type { AppEnv } from "../types/hono-env";

const onlineSchedule = ScheduleModel.fromSchedulePrisma({
	id: "schedule-online",
	classId: "class-1",
	date: new Date("2026-08-10T00:00:00.000Z"),
	time: 540,
	durationMinutes: 60,
	notes: null,
	status: "SCHEDULED",
	type: "ONLINE",
	createdAt: new Date("2026-08-01T00:00:00.000Z"),
	updatedAt: new Date("2026-08-01T00:00:00.000Z"),
	class: {
		name: "Algebra",
		course: null,
		students: [],
	},
});

let listTutorId: string | undefined;
let detailTutorId: string | undefined;
let detailScheduleId: string | undefined;

mock.module("../repositories", () => ({
	classRepository: {},
	scheduleRepository: {
		findAll: async (tutorId: string) => {
			listTutorId = tutorId;
			return [onlineSchedule];
		},
		findById: async (id: string, tutorId?: string) => {
			detailScheduleId = id;
			detailTutorId = tutorId;
			return onlineSchedule;
		},
	},
}));

mock.module("../lib/auth", () => ({
	auth: {
		api: {
			getSession: async ({ headers }: { headers: Headers }) => {
				if (headers.get("Authorization") !== "Bearer test-session") {
					return null;
				}

				return {
					user: { id: "user-1" },
					session: { id: "session-1" },
				};
			},
		},
	},
}));

mock.module("../lib/db", () => ({
	prisma: {
		tutor: {
			findUnique: async () => ({ id: "tutor-1" }),
		},
	},
}));

const { default: scheduleRoutes } = await import("./schedules");
const app = new Hono<AppEnv>().route("/v1/schedules", scheduleRoutes);

describe("schedule routes", () => {
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
});
