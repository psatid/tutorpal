import type { GetV1Courses200DataItem } from "@/api/generated/models/getV1Courses200DataItem";
import type { GetV1CoursesById200 } from "@/api/generated/models/getV1CoursesById200";
import { calculateCourseRevenue } from "@/lib/course-pricing";
import { DateTime } from "@/lib/date-time";
import type { CoursePricingMode } from "@/types/course";

type CourseDetails = {
	id: string;
	name: string;
	defaultTotalHours: number;
	pricingMode: CoursePricingMode;
	priceAmount: number | null;
	recordedHours: number | null;
	recordedRevenue: number | null;
	createdAt: string;
	updatedAt: string;
};

export class Course {
	constructor(private readonly data: CourseDetails) {}

	static fromListItem(response: GetV1Courses200DataItem): Course {
		return new Course(toCourseDetails(response));
	}

	static fromGetCourseByIdResponse(response: GetV1CoursesById200): Course {
		return new Course(toCourseDetails(response));
	}

	getId() {
		return this.data.id;
	}

	getName() {
		return this.data.name;
	}

	getDefaultTotalHours() {
		return this.data.defaultTotalHours;
	}

	getDefaultRevenue() {
		return calculateCourseRevenue(
			this.data.defaultTotalHours,
			this.data.pricingMode,
			this.data.priceAmount,
		);
	}

	getPricingData() {
		return {
			pricingMode: this.data.pricingMode,
			priceAmount: this.data.priceAmount,
			formattedPriceAmount:
				this.data.priceAmount === null
					? null
					: DateTime.formatThaiBaht(this.data.priceAmount),
		};
	}

	getListItemData() {
		return {
			id: this.getId(),
			name: this.getName(),
			formattedDefaultTotalHours: DateTime.formatDurationHours(
				this.getDefaultTotalHours(),
			),
			...this.getPricingData(),
		};
	}

	getDetailSummaryData() {
		return {
			formattedDefaultTotalHours: DateTime.formatDurationHours(
				this.getDefaultTotalHours(),
			),
			formattedRecordedHours:
				this.data.recordedHours === null
					? null
					: DateTime.formatDurationHours(this.data.recordedHours),
			formattedRecordedRevenue:
				this.data.recordedRevenue === null
					? null
					: DateTime.formatThaiBaht(this.data.recordedRevenue),
			...this.getPricingData(),
		};
	}

	getFormData() {
		return {
			id: this.getId(),
			name: this.getName(),
			defaultTotalHours: this.getDefaultTotalHours(),
			pricingMode: this.data.pricingMode,
			priceAmount: this.data.priceAmount ?? "",
		};
	}
}

function toCourseDetails(
	response: GetV1Courses200DataItem | GetV1CoursesById200,
): CourseDetails {
	return {
		id: response.id,
		name: response.name,
		defaultTotalHours: response.defaultTotalHours,
		pricingMode: response.pricingMode,
		priceAmount: response.priceAmount,
		recordedHours:
			"recordedHours" in response ? response.recordedHours : null,
		recordedRevenue:
			"recordedRevenue" in response ? response.recordedRevenue : null,
		createdAt: response.createdAt,
		updatedAt: response.updatedAt,
	};
}
