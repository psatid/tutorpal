import { describe, expect, test } from "bun:test";
import {
	ClassListQuerySchema,
	CreateClassSchema,
	UpdateClassSchema,
} from "./class.schema";

describe("class request contracts", () => {
	test("accepts a course-linked class with course defaults", () => {
		const result = CreateClassSchema.safeParse({
			courseId: "course-1",
			studentIds: ["student-1"],
		});
		expect(result.success).toBe(true);
	});

	test("requires name and hours for a custom class", () => {
		const result = CreateClassSchema.safeParse({
			courseId: null,
			studentIds: ["student-1"],
		});
		expect(result.success).toBe(false);
	});

	test("rejects empty and duplicate enrollments", () => {
		expect(
			CreateClassSchema.safeParse({
				courseId: "course-1",
				studentIds: [],
			}).success,
		).toBe(false);
		expect(
			CreateClassSchema.safeParse({
				courseId: "course-1",
				studentIds: ["student-1", "student-1"],
			}).success,
		).toBe(false);
	});

	test("does not expose course association in class updates", () => {
		const result = UpdateClassSchema.parse({
			courseId: "another-course",
			name: "Updated name",
		});
		expect(result).toEqual({ name: "Updated name" });
	});

	test("accepts class type filters and rejects ambiguous course filters", () => {
		expect(
			ClassListQuerySchema.safeParse({ classType: "custom" }).success,
		).toBe(true);
		expect(
			ClassListQuerySchema.safeParse({ classType: "course-linked" }).success,
		).toBe(true);
		expect(
			ClassListQuerySchema.safeParse({
				courseId: "course-1",
				classType: "custom",
			}).success,
		).toBe(false);
	});
});
