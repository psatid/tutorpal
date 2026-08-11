import { describe, expect, test } from "bun:test";
import type {
	CourseDeleteOutcome,
	ICourseRepository,
} from "../types/course.types";
import { CourseService } from "./course.service";

function repositoryForDelete(outcome: CourseDeleteOutcome) {
	let deleteCalls = 0;
	const repository = {
		delete: async () => {
			deleteCalls += 1;
			return outcome;
		},
	} as unknown as ICourseRepository;

	return { repository, getDeleteCalls: () => deleteCalls };
}

describe("CourseService", () => {
	test("deletes a tutor-owned course even after it has been used as an hour preset", async () => {
		const { repository, getDeleteCalls } = repositoryForDelete("deleted");
		const service = new CourseService(repository);

		await service.deleteCourse("course-1", "tutor-1");
		expect(getDeleteCalls()).toBe(1);
	});

	test("returns the same not-found error for missing and foreign-owned courses", async () => {
		for (const courseId of ["missing-course", "foreign-course"]) {
			const { repository } = repositoryForDelete("not_found");
			const service = new CourseService(repository);

			await expect(
				service.deleteCourse(courseId, "tutor-1"),
			).rejects.toMatchObject({
				errorCode: "COURSE_NOT_FOUND",
				status: 404,
			});
		}
	});
});
