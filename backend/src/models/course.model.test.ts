import { describe, expect, test } from "bun:test";
import { CourseModel } from "./course.model";

describe("CourseModel", () => {
	test("serializes priced reusable hour defaults without class counts", () => {
		const createdAt = new Date("2026-07-19T00:00:00.000Z");
		const course = CourseModel.fromPrisma({
			id: "course-1",
			tutorId: "tutor-1",
			name: "Mathematics",
			defaultTotalHours: { toNumber: () => 20 },
			pricingMode: "HOURLY_RATE",
			priceAmount: { toNumber: () => 850 },
			createdAt,
			updatedAt: createdAt,
		});
		expect(course.toCourseDTO()).toEqual({
			id: "course-1",
			tutorId: "tutor-1",
			name: "Mathematics",
			defaultTotalHours: 20,
			pricingMode: "hourly_rate",
			priceAmount: 850,
			createdAt: "2026-07-19T00:00:00.000Z",
			updatedAt: "2026-07-19T00:00:00.000Z",
		});
	});

	test("serializes detail hours and revenue independently from the course price", () => {
		const createdAt = new Date("2026-07-19T00:00:00.000Z");
		const course = CourseModel.fromPrisma({
			id: "course-1",
			tutorId: "tutor-1",
			name: "Mathematics",
			defaultTotalHours: 20,
			pricingMode: "FIXED_PRICE",
			priceAmount: null,
			createdAt,
			updatedAt: createdAt,
		});

		expect(course.toCourseDetailDTO(20, 1_700)).toMatchObject({
			pricingMode: "fixed_price",
			priceAmount: null,
			recordedHours: 20,
			recordedRevenue: 1_700,
		});
	});
});
