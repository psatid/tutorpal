import { DateTime } from "../lib/date-time";
import type {
	ClassHourAdditionDTO,
	ClassHourAdditionSource,
} from "../types/class.types";

type DecimalLike = { toNumber(): number };

type ClassHourAdditionPrismaRecord = {
	id: string;
	classId: string;
	source: "COURSE" | "CUSTOM";
	hours: DecimalLike | number;
	revenueAmount: DecimalLike | number | null;
	sourceCourseId: string | null;
	sourceCourseName: string | null;
	requestId: string;
	createdAt: Date;
};

export class ClassHourAdditionModel {
	readonly id: string;
	readonly classId: string;
	readonly source: ClassHourAdditionSource;
	readonly hours: number;
	readonly revenueAmount: number | null;
	readonly sourceCourseId: string | null;
	readonly sourceCourseName: string | null;
	readonly requestId: string;
	readonly createdAt: Date;

	constructor(props: {
		id: string;
		classId: string;
		source: ClassHourAdditionSource;
		hours: number;
		revenueAmount: number | null;
		sourceCourseId: string | null;
		sourceCourseName: string | null;
		requestId: string;
		createdAt: Date;
	}) {
		this.id = props.id;
		this.classId = props.classId;
		this.source = props.source;
		this.hours = props.hours;
		this.revenueAmount = props.revenueAmount;
		this.sourceCourseId = props.sourceCourseId;
		this.sourceCourseName = props.sourceCourseName;
		this.requestId = props.requestId;
		this.createdAt = props.createdAt;
	}

	static fromPrisma(
		addition: ClassHourAdditionPrismaRecord,
	): ClassHourAdditionModel {
		return new ClassHourAdditionModel({
			id: addition.id,
			classId: addition.classId,
			source: addition.source === "COURSE" ? "course" : "custom",
			hours:
				typeof addition.hours === "number"
					? addition.hours
					: addition.hours.toNumber(),
			revenueAmount:
				addition.revenueAmount === null
					? null
					: typeof addition.revenueAmount === "number"
						? addition.revenueAmount
						: addition.revenueAmount.toNumber(),
			sourceCourseId: addition.sourceCourseId,
			sourceCourseName: addition.sourceCourseName,
			requestId: addition.requestId,
			createdAt: addition.createdAt,
		});
	}

	toClassHourAdditionDTO(): ClassHourAdditionDTO {
		return {
			id: this.id,
			classId: this.classId,
			source: this.source,
			hours: this.hours,
			revenueAmount: this.revenueAmount,
			sourceCourseId: this.sourceCourseId,
			sourceCourseName: this.sourceCourseName,
			requestId: this.requestId,
			createdAt: DateTime.from(this.createdAt).toISOString(),
		};
	}
}
