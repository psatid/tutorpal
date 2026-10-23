import { describe, expect, test } from "bun:test";
import { Hono, type MiddlewareHandler } from "hono";
import { AppError } from "../lib/error";
import { errorHandler } from "../middleware/error-handler";
import { CourseModel } from "../models/course.model";
import { CourseService } from "../services/course.service";
import type { AppEnv } from "../types/hono-env";
import { createCourseRoutes } from "./courses";

const createdAt = new Date("2026-08-13T00:00:00.000Z");
const courseModel = CourseModel.fromPrisma({
	id: "course-1",
	tutorId: "tutor-1",
	name: "Mathematics",
	defaultTotalSeconds: 72_000n,
	pricingMode: "HOURLY_RATE",
	priceAmount: 850,
	createdAt,
	updatedAt: createdAt,
});

let createData: unknown;
let detailOwnership: unknown;
let detailResult: {
	course: CourseModel;
	recordedHours: number;
	recordedRevenue: number;
} | null = {
	course: courseModel,
	recordedHours: 20,
	recordedRevenue: 1_700,
};

const requireAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
	if (c.req.header("Authorization") !== "Bearer test-session") {
		throw AppError.unauthorized("UNAUTHORIZED", "Authentication required");
	}

	c.set("tutorId", "tutor-1");
	await next();
};

const courseService = new CourseService({
	create: async (data: unknown) => {
		createData = data;
		return courseModel;
	},
	findDetailById: async (id: string, tutorId: string) => {
		detailOwnership = { id, tutorId };
		return detailResult;
	},
} as never);

const app = new Hono<AppEnv>();
app.onError(errorHandler);
app.route("/v1/courses", createCourseRoutes({ requireAuth, courseService }));

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

describe("course routes", () => {
	test("creates a priced course with the approved API field names", async () => {
		const response = await request("/v1/courses", "POST", {
			name: "  Mathematics  ",
			defaultTotalHours: 20,
			pricingMode: "hourly_rate",
			priceAmount: 850,
		});

		expect(response.status).toBe(201);
		expect(createData).toEqual({
			name: "Mathematics",
			defaultTotalHours: 20,
			pricingMode: "hourly_rate",
			priceAmount: 850,
			tutorId: "tutor-1",
		});
		expect(await response.json()).toEqual(courseModel.toCourseDTO());
	});

	test("allows missing or null course prices and rejects invalid prices", async () => {
		const missingPriceResponse = await request("/v1/courses", "POST", {
			name: "Unpriced mathematics",
			defaultTotalHours: 20,
			pricingMode: "hourly_rate",
		});
		expect(missingPriceResponse.status).toBe(201);
		expect(createData).toEqual({
			name: "Unpriced mathematics",
			defaultTotalHours: 20,
			pricingMode: "hourly_rate",
			tutorId: "tutor-1",
		});

		const nullPriceResponse = await request("/v1/courses", "POST", {
			name: "Unpriced mathematics",
			defaultTotalHours: 20,
			pricingMode: "hourly_rate",
			priceAmount: null,
		});
		expect(nullPriceResponse.status).toBe(201);
		expect(createData).toMatchObject({ priceAmount: null });

		expect(
			(
				await request("/v1/courses", "POST", {
					name: "Mathematics",
					defaultTotalHours: 20,
					pricingMode: "hourly_rate",
					priceAmount: -0.01,
				})
			).status,
		).toBe(400);
	});

	test("returns recorded hours and revenue only on the course detail route", async () => {
		const response = await request("/v1/courses/course-1");

		expect(response.status).toBe(200);
		expect(detailOwnership).toEqual({ id: "course-1", tutorId: "tutor-1" });
		expect(await response.json()).toEqual(
			courseModel.toCourseDetailDTO(20, 1_700),
		);
	});

	test("returns the standard not-found response for missing or foreign-owned detail", async () => {
		const originalDetailResult = detailResult;
		detailResult = null;

		try {
			const response = await request("/v1/courses/foreign-course");

			expect(response.status).toBe(404);
			expect(detailOwnership).toEqual({
				id: "foreign-course",
				tutorId: "tutor-1",
			});
			expect(await response.json()).toEqual({
				errorCode: "COURSE_NOT_FOUND",
				message: "Course not found",
			});
		} finally {
			detailResult = originalDetailResult;
		}
	});

	test("requires authentication before loading course detail", async () => {
		const response = await app.request("http://api.test/v1/courses/course-1");

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({
			errorCode: "UNAUTHORIZED",
			message: "Authentication required",
		});
	});
});
