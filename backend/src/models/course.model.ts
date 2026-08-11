import { DateTime } from "../lib/date-time";
import type { CourseDTO } from "../types/course.types";

type DecimalLike = { toNumber(): number };

type CourseModelProps = {
	id: string;
	tutorId: string;
	name: string;
	defaultTotalHours: number;
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
			createdAt: DateTime.from(this.props.createdAt).toISOString(),
			updatedAt: DateTime.from(this.props.updatedAt).toISOString(),
		};
	}
}
