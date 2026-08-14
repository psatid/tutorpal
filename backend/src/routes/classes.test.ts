import { describe, expect, mock, test } from "bun:test";
import { Hono } from "hono";
import { errorHandler } from "../middleware/error-handler";
import { ClassModel } from "../models/class.model";
import { ClassHourAdditionModel } from "../models/class-hour-addition.model";
import type { AppEnv } from "../types/hono-env";

const createdAt = new Date("2026-08-11T03:00:00.000Z");
const requestId = "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c";

const classModel = ClassModel.fromClassPrisma({
	id: "class-1",
	tutorId: "tutor-1",
	name: "Algebra",
	totalHours: 0,
	createdAt,
	updatedAt: createdAt,
	students: [],
});

const customAddition = ClassHourAdditionModel.fromPrisma({
	id: "addition-1",
	classId: "class-1",
	source: "CUSTOM",
	hours: 2.5,
	revenueAmount: 500,
	sourceCourseId: null,
	sourceCourseName: null,
	requestId,
	createdAt,
});

let createData: unknown;
let addHourData: unknown;
let historyParams: unknown;
let addHourOwnership: unknown;
let historyOwnership: unknown;
let detailOwnership: unknown;
let detailResult: { classData: ClassModel; recordedRevenue: number } | null = {
	classData: classModel,
	recordedRevenue: 1_250,
};

mock.module("../repositories", () => ({
	classRepository: {
		create: async (data: unknown) => {
			createData = data;
			return classModel;
		},
		addHourAddition: async (id: string, tutorId: string, data: unknown) => {
			addHourOwnership = { id, tutorId };
			addHourData = data;
			return {
				addition: customAddition,
				totalHours: 2.5,
				remainingHours: 1.5,
			};
		},
		findHourAdditions: async (id: string, tutorId: string, params: unknown) => {
			historyOwnership = { id, tutorId };
			historyParams = params;
			return {
				data: [customAddition],
				pagination: {
					total: 1,
					page: 1,
					limit: 20,
					totalPages: 1,
					hasNext: false,
					hasPrev: false,
				},
			};
		},
		findDetailById: async (id: string, tutorId: string) => {
			detailOwnership = { id, tutorId };
			return detailResult;
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

const { default: classRoutes } = await import("./classes");
const app = new Hono<AppEnv>();
app.onError(errorHandler);
app.route("/v1/classes", classRoutes);

function request(path: string, method = "GET", body?: unknown) {
	return app.request(`http://api.test${path}`, {
		method,
		headers: {
			Authorization: "Bearer test-session",
			...(body === undefined ? {} : { "Content-Type": "application/json" }),
		},
		...(body === undefined ? {} : { body: JSON.stringify(body) }),
	});
}

describe("class routes", () => {
	test("creates a studentless standalone class from only its name", async () => {
		const response = await request("/v1/classes", "POST", {
			name: "  Algebra  ",
		});

		expect(response.status).toBe(201);
		expect(createData).toEqual({
			name: "Algebra",
			tutorId: "tutor-1",
		});
		expect(await response.json()).toEqual(
			expect.objectContaining({
				name: "Algebra",
				totalHours: 0,
				students: [],
			}),
		);
	});

	test("rejects legacy class course and total-hour input", async () => {
		const response = await request("/v1/classes", "POST", {
			name: "Algebra",
			courseId: "course-1",
			totalHours: 8,
		});

		expect(response.status).toBe(400);

		const update = await request("/v1/classes/class-1", "PUT", {
			courseId: "course-1",
			totalHours: 8,
		});
		expect(update.status).toBe(400);
	});

	test("adds immutable custom hours and returns the refreshed balance", async () => {
		const response = await request(
			"/v1/classes/class-1/hour-additions",
			"POST",
			{
				source: "custom",
				hours: 2.5,
				revenueAmount: 500,
				requestId,
			},
		);

		expect(response.status).toBe(200);
		expect(addHourData).toEqual({
			source: "custom",
			hours: 2.5,
			revenueAmount: 500,
			requestId,
		});
		expect(addHourOwnership).toEqual({ id: "class-1", tutorId: "tutor-1" });
		expect(await response.json()).toEqual({
			addition: customAddition.toClassHourAdditionDTO(),
			totalHours: 2.5,
			remainingHours: 1.5,
		});
	});

	test("allows adding hours without recording revenue", async () => {
		const response = await request(
			"/v1/classes/class-1/hour-additions",
			"POST",
			{
				source: "custom",
				hours: 2.5,
				requestId,
			},
		);

		expect(response.status).toBe(200);
		expect(addHourData).toEqual({
			source: "custom",
			hours: 2.5,
			requestId,
		});
	});

	test("returns recorded revenue only from the class detail route", async () => {
		const response = await request("/v1/classes/class-1");

		expect(response.status).toBe(200);
		expect(detailOwnership).toEqual({ id: "class-1", tutorId: "tutor-1" });
		expect(await response.json()).toEqual(
			expect.objectContaining({ recordedRevenue: 1_250 }),
		);
	});

	test("returns the standard not-found response for missing or foreign-owned detail", async () => {
		const originalDetailResult = detailResult;
		detailResult = null;

		try {
			const response = await request("/v1/classes/foreign-class");

			expect(response.status).toBe(404);
			expect(detailOwnership).toEqual({
				id: "foreign-class",
				tutorId: "tutor-1",
			});
			expect(await response.json()).toEqual({
				errorCode: "CLASS_NOT_FOUND",
				message: "Class not found",
			});
		} finally {
			detailResult = originalDetailResult;
		}
	});

	test("rejects malformed hour requests and exposes a read-only history route", async () => {
		const invalid = await request(
			"/v1/classes/class-1/hour-additions",
			"POST",
			{
				source: "CUSTOM",
				hours: 2.5,
				revenueAmount: 500,
				requestId,
			},
		);
		expect(invalid.status).toBe(400);

		const missingRequestId = await request(
			"/v1/classes/class-1/hour-additions",
			"POST",
			{ source: "custom", hours: 2.5, revenueAmount: 500 },
		);
		expect(missingRequestId.status).toBe(400);

		const zeroHours = await request(
			"/v1/classes/class-1/hour-additions",
			"POST",
			{ source: "custom", hours: 0, revenueAmount: 500, requestId },
		);
		expect(zeroHours.status).toBe(400);

		const subCentHours = await request(
			"/v1/classes/class-1/hour-additions",
			"POST",
			{ source: "custom", hours: 1e-18, revenueAmount: 500, requestId },
		);
		expect(subCentHours.status).toBe(400);

		const excessiveHours = await request(
			"/v1/classes/class-1/hour-additions",
			"POST",
			{
				source: "custom",
				hours: 100_000_000,
				revenueAmount: 500,
				requestId,
			},
		);
		expect(excessiveHours.status).toBe(400);

		const history = await request("/v1/classes/class-1/hour-additions");
		expect(history.status).toBe(200);
		expect(historyOwnership).toEqual({ id: "class-1", tutorId: "tutor-1" });
		expect(historyParams).toEqual({ page: 1, limit: 20 });
		expect(await history.json()).toEqual({
			data: [customAddition.toClassHourAdditionDTO()],
			pagination: {
				total: 1,
				page: 1,
				limit: 20,
				totalPages: 1,
				hasNext: false,
				hasPrev: false,
			},
		});

		const update = await request(
			"/v1/classes/class-1/hour-additions",
			"PUT",
			{},
		);
		expect(update.status).toBe(404);
	});
});
