import { describe, expect, test } from "bun:test";
import { CourseModel } from "../models/course.model";
import type { ICourseRepository } from "../types/course.types";
import { CourseService } from "./course.service";

function course(classCount: number) {
	return CourseModel.fromPrisma({
		id: "course-1",
		tutorId: "tutor-1",
		name: "Mathematics",
		defaultTotalHours: 20,
		createdAt: new Date("2026-07-19T00:00:00.000Z"),
		updatedAt: new Date("2026-07-19T00:00:00.000Z"),
		_count: { classes: classCount },
	});
}

describe("CourseService", () => {
	test("blocks deletion when the course still has classes", async () => {
		let deleted = false;
		const repository = {
			findById: async () => course(2),
			delete: async () => {
				deleted = true;
			},
		} as unknown as ICourseRepository;
		const service = new CourseService(repository);

		await expect(
			service.deleteCourse("course-1", "tutor-1"),
		).rejects.toMatchObject({
			errorCode: "COURSE_IN_USE",
			status: 409,
		});
		expect(deleted).toBe(false);
	});

	test("deletes an unused tutor-owned course", async () => {
		let deleted = false;
		const repository = {
			findById: async () => course(0),
			delete: async () => {
				deleted = true;
			},
		} as unknown as ICourseRepository;
		const service = new CourseService(repository);

		await service.deleteCourse("course-1", "tutor-1");
		expect(deleted).toBe(true);
	});
});
