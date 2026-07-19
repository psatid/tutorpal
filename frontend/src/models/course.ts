import type { GetV1Courses200DataItem } from "@/api/generated/models/getV1Courses200DataItem";
import type { GetV1CoursesById200 } from "@/api/generated/models/getV1CoursesById200";
import { DateTime } from "@/lib/date-time";

type CourseDetails = {
	id: string;
	name: string;
	defaultTotalHours: number;
	classCount: number;
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

	getClassCount() {
		return this.data.classCount;
	}

	hasClasses() {
		return this.data.classCount > 0;
	}

	getListItemData() {
		return {
			id: this.getId(),
			name: this.getName(),
			classCount: this.getClassCount(),
			formattedDefaultTotalHours: DateTime.formatDurationHours(
				this.getDefaultTotalHours(),
			),
		};
	}

	getFormData() {
		return {
			id: this.getId(),
			name: this.getName(),
			defaultTotalHours: this.getDefaultTotalHours(),
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
		classCount: response.classCount,
		createdAt: response.createdAt,
		updatedAt: response.updatedAt,
	};
}
