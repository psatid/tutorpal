import { describe, expect, test } from "bun:test";
import { MAX_CURRENCY_AMOUNT } from "../lib/money";
import {
	CourseDetailSchema,
	CourseSchema,
	CreateCourseSchema,
	UpdateCourseSchema,
} from "./course.schema";

describe("course request contracts", () => {
	test("requires pricing mode and accepts an optional valid price", () => {
		expect(
			CreateCourseSchema.parse({
				name: "  Mathematics  ",
				defaultTotalHours: 20,
				pricingMode: "hourly_rate",
				priceAmount: 850.5,
			}),
		).toEqual({
			name: "Mathematics",
			defaultTotalHours: 20,
			pricingMode: "hourly_rate",
			priceAmount: 850.5,
		});
		expect(
			CreateCourseSchema.parse({
				name: "Unpriced course",
				defaultTotalHours: 10,
				pricingMode: "fixed_price",
			}),
		).toEqual({
			name: "Unpriced course",
			defaultTotalHours: 10,
			pricingMode: "fixed_price",
		});
		expect(
			CreateCourseSchema.parse({
				name: "Unpriced course",
				defaultTotalHours: 10,
				pricingMode: "fixed_price",
				priceAmount: null,
			}),
		).toMatchObject({ priceAmount: null });

		for (const priceAmount of [
			-0.01,
			1.234,
			MAX_CURRENCY_AMOUNT + 0.01,
			Number.POSITIVE_INFINITY,
			Number.NaN,
		]) {
			expect(
				CreateCourseSchema.safeParse({
					name: "Mathematics",
					defaultTotalHours: 20,
					pricingMode: "hourly_rate",
					priceAmount,
				}).success,
			).toBe(false);
		}

		expect(
			CreateCourseSchema.safeParse({
				name: "Mathematics",
				defaultTotalHours: 20,
				priceAmount: 850,
			}).success,
		).toBe(false);
	});

	test("keeps updates partial and allows clearing a price with null", () => {
		expect(UpdateCourseSchema.parse({ priceAmount: 0 })).toEqual({
			priceAmount: 0,
		});
		expect(UpdateCourseSchema.parse({ priceAmount: null })).toEqual({
			priceAmount: null,
		});
	});

	test("allows legacy courses to return a null price amount", () => {
		expect(
			CourseSchema.safeParse({
				id: "e2218340-6c58-45ee-8eb4-34f33dac91de",
				tutorId: "tutor-1",
				name: "Legacy Mathematics",
				defaultTotalHours: 20,
				pricingMode: "hourly_rate",
				priceAmount: null,
				createdAt: "2026-08-13T00:00:00.000Z",
				updatedAt: "2026-08-13T00:00:00.000Z",
			}).success,
		).toBe(true);
	});

	test("requires recorded hours and revenue on course details", () => {
		const baseCourse = {
			id: "e2218340-6c58-45ee-8eb4-34f33dac91de",
			tutorId: "tutor-1",
			name: "Mathematics",
			defaultTotalHours: 20,
			pricingMode: "hourly_rate" as const,
			priceAmount: 850,
			createdAt: "2026-08-13T00:00:00.000Z",
			updatedAt: "2026-08-13T00:00:00.000Z",
		};

		expect(
			CourseDetailSchema.safeParse({
				...baseCourse,
				recordedHours: 12,
				recordedRevenue: 850,
			}).success,
		).toBe(true);
		expect(
			CourseDetailSchema.safeParse({
				...baseCourse,
				recordedRevenue: 850,
			}).success,
		).toBe(false);
	});
});
