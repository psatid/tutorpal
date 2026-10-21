import { afterEach, describe, expect, it, vi } from "vitest";
import type { GetV1CoursesById200 } from "@/api/generated/models/getV1CoursesById200";
import { Course } from "@/models/course";

function makeCourseResponse(
	overrides: Partial<GetV1CoursesById200> = {},
): GetV1CoursesById200 {
	return {
		createdAt: "2026-10-01T00:00:00.000Z",
		defaultTotalHours: 0.5,
		id: "course-1",
		name: "Mathematics",
		priceAmount: 2.01,
		pricingMode: "hourly_rate",
		recordedHours: 0,
		recordedRevenue: 0,
		tutorId: "tutor-1",
		updatedAt: "2026-10-01T00:00:00.000Z",
		...overrides,
	};
}

describe("Course default revenue", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("multiplies hourly rates and rounds revenue to cents", () => {
		expect(
			Course.calculateDefaultRevenue(3, "hourly_rate", 125.5),
		).toBe(376.5);
		expect(
			Course.calculateDefaultRevenue(0.5, "hourly_rate", 2.01),
		).toBe(1.01);
	});

	it("uses a fixed price as-is and preserves null and zero prices", () => {
		expect(
			Course.calculateDefaultRevenue(999, "fixed_price", 2.01),
		).toBe(2.01);
		expect(
			Course.calculateDefaultRevenue(4, "hourly_rate", null),
		).toBeNull();
		expect(Course.calculateDefaultRevenue(4, "hourly_rate", 0)).toBe(0);
		expect(Course.calculateDefaultRevenue(0, "fixed_price", 0)).toBe(0);
	});

	it("delegates instance revenue calculation to the model method", () => {
		const calculateDefaultRevenue = vi
			.spyOn(Course, "calculateDefaultRevenue")
			.mockReturnValue(17.25);
		const course = Course.fromGetCourseByIdResponse(makeCourseResponse());

		expect(course.getDefaultRevenue()).toBe(17.25);
		expect(calculateDefaultRevenue).toHaveBeenCalledWith(
			0.5,
			"hourly_rate",
			2.01,
		);
	});
});
