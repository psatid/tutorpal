import type { GetV1ClassesByIdHourAdditions200DataItem } from "@/api/generated/models/getV1ClassesByIdHourAdditions200DataItem";
import type { PostV1ClassesByIdHourAdditions200Addition } from "@/api/generated/models/postV1ClassesByIdHourAdditions200Addition";
import { DateTime } from "@/lib/date-time";

type ClassHourAdditionDetails = {
	id: string;
	classId: string;
	source: "course" | "custom";
	hours: number;
	sourceCourseId: string | null;
	sourceCourseName: string | null;
	requestId: string;
	createdAt: string;
};

export class ClassHourAddition {
	constructor(private readonly data: ClassHourAdditionDetails) {}

	static fromResponse(
		response:
			| GetV1ClassesByIdHourAdditions200DataItem
			| PostV1ClassesByIdHourAdditions200Addition,
	): ClassHourAddition {
		return new ClassHourAddition({
			id: response.id,
			classId: response.classId,
			source: response.source,
			hours: response.hours,
			sourceCourseId: response.sourceCourseId,
			sourceCourseName: response.sourceCourseName,
			requestId: response.requestId,
			createdAt: response.createdAt,
		});
	}

	getId() {
		return this.data.id;
	}

	getListItemData() {
		return {
			id: this.data.id,
			source: this.data.source,
			sourceCourseName: this.data.sourceCourseName,
			formattedHours: DateTime.formatDurationHours(this.data.hours),
			formattedCreatedAt: DateTime.from(this.data.createdAt).format("PPp"),
		};
	}
}
