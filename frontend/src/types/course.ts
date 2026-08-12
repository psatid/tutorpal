import { z } from "zod";
import type { TFunction } from "i18next";

export function createCourseSchema(t: TFunction) {
	const courseNameError = t("courses:validation.courseName");
	const courseHoursError = t("courses:validation.hours");
	const courseHoursSchema = z.union(
		[
			z
				.number({ error: courseHoursError })
				.finite(courseHoursError)
				.positive(courseHoursError),
			z
				.string()
				.refine(
					(value) =>
						value.trim() !== "" &&
						Number.isFinite(Number(value)) &&
						Number(value) > 0,
					courseHoursError,
				)
				.transform(Number),
		],
		{ error: courseHoursError },
	);

	return z.object({
		name: z.string().trim().min(1, courseNameError),
		defaultTotalHours: courseHoursSchema,
	});
}

export type CourseFormInput = z.input<ReturnType<typeof createCourseSchema>>;
export type CourseFormData = z.output<ReturnType<typeof createCourseSchema>>;
