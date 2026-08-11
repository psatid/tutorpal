import { z } from "zod";

const MAX_CUSTOM_HOURS = 99_999_999.99;
const customHoursRangeError =
	"Enter hours from 0.01 to 99,999,999.99.";
const customHoursPrecisionError =
	"Enter hours with no more than two decimal places.";

function hasAtMostTwoDecimalPlaces(hours: number) {
	const scaledHours = hours * 100;
	return (
		Math.abs(scaledHours - Math.round(scaledHours)) <=
		Number.EPSILON * Math.max(1, Math.abs(scaledHours)) * 4
	);
}

const customHoursSchema = z
	.coerce
	.number({ error: customHoursRangeError })
	.finite(customHoursRangeError)
	.min(0.01, customHoursRangeError)
	.max(MAX_CUSTOM_HOURS, customHoursRangeError)
	.refine(
		hasAtMostTwoDecimalPlaces,
		customHoursPrecisionError,
	);

export const classHourAdditionFormSchema = z.discriminatedUnion("source", [
	z.object({
		source: z.literal("course"),
		courseId: z.string().min(1, "Choose a course."),
		hours: z.union([z.string(), z.number()]).optional(),
	}),
	z.object({
		source: z.literal("custom"),
		courseId: z.string().optional(),
		hours: customHoursSchema,
	}),
]);

export type ClassHourAdditionFormInput = z.input<
	typeof classHourAdditionFormSchema
>;
export type ClassHourAdditionFormValues = z.output<
	typeof classHourAdditionFormSchema
>;
