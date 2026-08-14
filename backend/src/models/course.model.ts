import { DateTime } from "../lib/date-time";
import type {
	CourseDetailDTO,
	CourseDTO,
	CoursePricingMode,
} from "../types/course.types";

type DecimalLike = { toNumber(): number };

type CourseModelProps = {
	id: string;
	tutorId: string;
	name: string;
	defaultTotalHours: number;
	pricingMode: CoursePricingMode;
	priceAmount: number | null;
	createdAt: Date;
	updatedAt: Date;
};

export class CourseModel {
	constructor(private readonly props: CourseModelProps) {}

	get id() {
		return this.props.id;
	}
	get tutorId() {
		return this.props.tutorId;
	}
	get name() {
		return this.props.name;
	}
	get defaultTotalHours() {
		return this.props.defaultTotalHours;
	}
	static fromPrisma(course: {
		id: string;
		tutorId: string;
		name: string;
		defaultTotalHours: DecimalLike | number;
		pricingMode: "HOURLY_RATE" | "FIXED_PRICE";
		priceAmount: DecimalLike | number | null;
		createdAt: Date;
		updatedAt: Date;
	}): CourseModel {
		return new CourseModel({
			id: course.id,
			tutorId: course.tutorId,
			name: course.name,
			defaultTotalHours:
				typeof course.defaultTotalHours === "number"
					? course.defaultTotalHours
					: course.defaultTotalHours.toNumber(),
			pricingMode:
				course.pricingMode === "HOURLY_RATE" ? "hourly_rate" : "fixed_price",
			priceAmount:
				course.priceAmount === null
					? null
					: typeof course.priceAmount === "number"
						? course.priceAmount
						: course.priceAmount.toNumber(),
			createdAt: course.createdAt,
			updatedAt: course.updatedAt,
		});
	}

	toCourseDTO(): CourseDTO {
		return {
			id: this.props.id,
			tutorId: this.props.tutorId,
			name: this.props.name,
			defaultTotalHours: this.props.defaultTotalHours,
			pricingMode: this.props.pricingMode,
			priceAmount: this.props.priceAmount,
			createdAt: DateTime.from(this.props.createdAt).toISOString(),
			updatedAt: DateTime.from(this.props.updatedAt).toISOString(),
		};
	}

	toCourseDetailDTO(
		recordedHours: number,
		recordedRevenue: number,
	): CourseDetailDTO {
		return {
			...this.toCourseDTO(),
			recordedHours,
			recordedRevenue,
		};
	}
}
