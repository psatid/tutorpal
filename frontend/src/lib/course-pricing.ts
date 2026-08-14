import type { CoursePricingMode } from "@/types/course";

export function calculateCourseRevenue(
	defaultTotalHours: number,
	pricingMode: CoursePricingMode,
	priceAmount: number | null,
) {
	if (priceAmount === null) return null;

	const amount =
		pricingMode === "hourly_rate"
			? priceAmount * defaultTotalHours
			: priceAmount;

	return Math.round((amount + Number.EPSILON) * 100) / 100;
}
