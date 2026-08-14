import { describe, expect, test } from "bun:test";
import {
	ClassHourAdditionListQuerySchema,
	ClassListQuerySchema,
	CreateClassHourAdditionSchema,
	CreateClassSchema,
	UpdateClassSchema,
} from "./class.schema";

describe("class request contracts", () => {
	test("creates a standalone class with no students and a trimmed name", () => {
		const result = CreateClassSchema.parse({ name: "  Jane  " });
		expect(result).toEqual({ name: "Jane" });
	});

	test("rejects blank names, duplicate students, and removed course fields", () => {
		expect(CreateClassSchema.safeParse({ name: "  " }).success).toBe(false);
		expect(
			CreateClassSchema.safeParse({
				name: "Algebra",
				studentIds: ["student-1", "student-1"],
			}).success,
		).toBe(false);
		expect(
			CreateClassSchema.safeParse({
				name: "Algebra",
				courseId: "course-1",
			}).success,
		).toBe(false);
	});

	test("allows an explicit empty enrollment list when editing a class", () => {
		expect(UpdateClassSchema.parse({ studentIds: [] })).toEqual({
			studentIds: [],
		});
		expect(UpdateClassSchema.safeParse({ totalHours: 10 }).success).toBe(false);
	});

	test("accepts exactly one hour-addition source with a UUID request ID", () => {
		const requestId = "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c";
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "course",
				courseId: "course-1",
				revenueAmount: 850,
				requestId,
			}).success,
		).toBe(true);
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "custom",
				hours: 2.25,
				revenueAmount: 850,
				requestId,
			}).success,
		).toBe(true);
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "custom",
				hours: 1.1,
				revenueAmount: 0,
				requestId,
			}).success,
		).toBe(true);
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "course",
				courseId: "course-1",
				requestId,
			}).success,
		).toBe(true);
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "custom",
				hours: 1.1,
				revenueAmount: null,
				requestId,
			}).success,
		).toBe(true);
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "custom",
				hours: 2,
				courseId: "course-1",
				revenueAmount: 850,
				requestId,
			}).success,
		).toBe(false);
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "custom",
				hours: 1.234,
				revenueAmount: 850,
				requestId,
			}).success,
		).toBe(false);
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "custom",
				hours: 0,
				revenueAmount: 850,
				requestId,
			}).success,
		).toBe(false);
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "custom",
				hours: 1e-18,
				revenueAmount: 850,
				requestId,
			}).success,
		).toBe(false);
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "custom",
				hours: 0.01,
				revenueAmount: 850,
				requestId,
			}).success,
		).toBe(true);
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "custom",
				hours: 99_999_999.99,
				revenueAmount: 850,
				requestId,
			}).success,
		).toBe(true);
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "custom",
				hours: 100_000_000,
				revenueAmount: 850,
				requestId,
			}).success,
		).toBe(false);
		for (const revenueAmount of [
			-0.01,
			1.234,
			10_000_000_000,
			Number.POSITIVE_INFINITY,
			Number.NaN,
		]) {
			expect(
				CreateClassHourAdditionSchema.safeParse({
					source: "custom",
					hours: 1,
					revenueAmount,
					requestId,
				}).success,
			).toBe(false);
		}
		expect(
			CreateClassHourAdditionSchema.safeParse({
				source: "custom",
				hours: 1,
				requestId,
			}).success,
		).toBe(true);
	});

	test("uses the agreed class and hour-history pagination defaults", () => {
		expect(ClassListQuerySchema.parse({})).toMatchObject({
			page: 1,
			limit: 10,
		});
		expect(ClassHourAdditionListQuerySchema.parse({})).toEqual({
			page: 1,
			limit: 20,
		});
	});
});
