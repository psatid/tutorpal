import { z } from "zod";
import type { TFunction } from "i18next";
import { createOptionalMoneyAmountSchema } from "@/types/money";

export const COURSE_PRICING_MODES = ["hourly_rate", "fixed_price"] as const;
export type CoursePricingMode = (typeof COURSE_PRICING_MODES)[number];

export function createCourseSchema(t: TFunction) {
	const courseNameError = t("courses:validation.courseName");
	const courseHoursError = t("courses:validation.hours");
	const priceRangeError = t("courses:validation.priceRange");
	const pricePrecisionError = t("courses:validation.pricePrecision");
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
		pricingMode: z.enum(COURSE_PRICING_MODES),
		priceAmount: createOptionalMoneyAmountSchema({
			precisionError: pricePrecisionError,
			rangeError: priceRangeError,
		}),
	});
}

export type CourseFormInput = z.input<ReturnType<typeof createCourseSchema>>;
export type CourseFormData = z.output<ReturnType<typeof createCourseSchema>>;
