import { z } from "zod";
import type { TFunction } from "i18next";
import { createOptionalMoneyAmountSchema } from "@/types/money";

const MAX_CUSTOM_HOURS = 99_999_999.99;

function hasAtMostTwoDecimalPlaces(hours: number) {
	const scaledHours = hours * 100;
	return (
		Math.abs(scaledHours - Math.round(scaledHours)) <=
		Number.EPSILON * Math.max(1, Math.abs(scaledHours)) * 4
	);
}

export function createClassHourAdditionFormSchema(t: TFunction) {
	const customHoursRangeError = t("classes:hourAdditions.validation.range");
	const customHoursPrecisionError = t("classes:hourAdditions.validation.precision");
	const revenueRangeError = t("classes:hourAdditions.validation.revenueRange");
	const revenuePrecisionError = t(
		"classes:hourAdditions.validation.revenuePrecision",
	);
	const customHoursSchema = z
		.coerce
		.number({ error: customHoursRangeError })
		.finite(customHoursRangeError)
		.min(0.01, customHoursRangeError)
		.max(MAX_CUSTOM_HOURS, customHoursRangeError)
		.refine(hasAtMostTwoDecimalPlaces, customHoursPrecisionError);

	return z.discriminatedUnion("source", [
		z.object({
			source: z.literal("course"),
			courseId: z.string().min(1, t("classes:hourAdditions.validation.course")),
			hours: z.union([z.string(), z.number()]).optional(),
			revenueAmount: createOptionalMoneyAmountSchema({
				precisionError: revenuePrecisionError,
				rangeError: revenueRangeError,
			}),
		}),
		z.object({
			source: z.literal("custom"),
			courseId: z.string().optional(),
			hours: customHoursSchema,
			revenueAmount: createOptionalMoneyAmountSchema({
				precisionError: revenuePrecisionError,
				rangeError: revenueRangeError,
			}),
		}),
	]);
}

export type ClassHourAdditionFormInput = z.input<
	ReturnType<typeof createClassHourAdditionFormSchema>
>;
export type ClassHourAdditionFormValues = z.output<
	ReturnType<typeof createClassHourAdditionFormSchema>
>;
