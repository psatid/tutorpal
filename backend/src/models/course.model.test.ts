import { describe, expect, test } from "bun:test";
import { CourseModel } from "./course.model";

describe("CourseModel", () => {
	test("serializes defaults and class count", () => {
		const createdAt = new Date("2026-07-19T00:00:00.000Z");
		const course = CourseModel.fromPrisma({
			id: "course-1",
			tutorId: "tutor-1",
			name: "Mathematics",
			defaultTotalHours: { toNumber: () => 20 },
			createdAt,
			updatedAt: createdAt,
			_count: { classes: 3 },
		});
		expect(course.toCourseDTO()).toEqual({
			id: "course-1",
			tutorId: "tutor-1",
			name: "Mathematics",
			defaultTotalHours: 20,
			classCount: 3,
			createdAt: "2026-07-19T00:00:00.000Z",
			updatedAt: "2026-07-19T00:00:00.000Z",
		});
	});
});
