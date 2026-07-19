import { z } from "zod";

const courseNameError = "Enter a course name.";
const courseHoursError = "Enter hours greater than zero.";

const courseHoursSchema = z.union(
	[
		z.number({ error: courseHoursError }).finite(courseHoursError).positive(courseHoursError),
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

export const courseSchema = z.object({
	name: z.string().trim().min(1, courseNameError),
	defaultTotalHours: courseHoursSchema,
});

export type CourseFormInput = z.input<typeof courseSchema>;
export type CourseFormData = z.output<typeof courseSchema>;
