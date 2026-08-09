import { z } from "zod";

const classNameError = "Enter a class name.";
const classHoursError = "Enter hours greater than zero.";

const classHoursSchema = z.union(
	[
		z
			.number({ error: classHoursError })
			.finite(classHoursError)
			.min(0.25, classHoursError),
		z
			.string()
			.refine(
				(value) =>
					value.trim() !== "" &&
					Number.isFinite(Number(value)) &&
					Number(value) >= 0.25,
				classHoursError,
			)
			.transform(Number),
	],
	{ error: classHoursError },
);

// Mutable API payload for existing-class updates.
export const classSchema = z.object({
	name: z.string(),
	totalHours: z
		.number()
		.finite(classHoursError)
		.min(0.25, classHoursError),
	studentIds: z.array(z.string()).min(1, "Select at least one student"),
});

export type ClassFormData = z.infer<typeof classSchema>;

export const classFormSchema = classSchema
	.extend({
		courseId: z.string(),
		name: z.string().trim(),
		totalHours: classHoursSchema,
	})
	.superRefine((data, ctx) => {
		if (data.courseId === "__custom__" && data.name.length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["name"],
				message: classNameError,
			});
		}
	});

export type ClassFormInput = z.input<typeof classFormSchema>;
export type ClassFormValues = z.output<typeof classFormSchema>;
