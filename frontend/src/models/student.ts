import type { GetV1Students200DataItem } from "@/api/generated/models/getV1Students200DataItem";
import type { GetV1StudentsById200 } from "@/api/generated/models/getV1StudentsById200";
import type { GetV1StudentsById200ClassesItem } from "@/api/generated/models/getV1StudentsById200ClassesItem";
import { DateTime } from "@/lib/date-time";

export type StudentLineLinkStatus =
	| "linked"
	| "needs_relink"
	| "not_linked";

type StudentDetails = {
	id: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
	lineLinkStatus: StudentLineLinkStatus;
	classes: StudentEnrollmentClass[];
};

type StudentEnrollmentClassDetails = {
	id: string;
	displayName: string;
	courseName: string | null;
	totalHours: number;
	remainingHours?: number;
};

export class StudentEnrollmentClass {
	constructor(private readonly data: StudentEnrollmentClassDetails) {}

	static fromResponse(
		response: GetV1StudentsById200ClassesItem,
	): StudentEnrollmentClass {
		return new StudentEnrollmentClass({
			id: response.id,
			displayName: response.displayName,
			courseName: response.course?.name ?? null,
			totalHours: response.totalHours,
			remainingHours: response.remainingHours,
		});
	}

	getId() {
		return this.data.id;
	}

	getDisplayName() {
		return this.data.displayName;
	}

	getCourseName() {
		return this.data.courseName;
	}

	getHoursData() {
		return {
			totalHours: this.data.totalHours,
			remainingHours: this.data.remainingHours,
			formattedTotalHours: DateTime.formatDurationHours(this.data.totalHours),
			formattedRemainingHours:
				this.data.remainingHours === undefined
					? undefined
					: DateTime.formatDurationHours(this.data.remainingHours),
		};
	}
}

export class Student {
	constructor(private readonly data: StudentDetails) {}

	static fromListItem(response: GetV1Students200DataItem): Student {
		return new Student({
			id: response.id,
			name: response.name,
			phoneNumber: response.phoneNumber,
			grade: response.grade,
			lineLinkStatus: response.lineLinkStatus,
			classes: [],
		});
	}

	static fromGetStudentByIdResponse(response: GetV1StudentsById200): Student {
		return new Student({
			id: response.id,
			name: response.name,
			phoneNumber: response.phoneNumber,
			grade: response.grade,
			lineLinkStatus: response.lineLinkStatus,
			classes: response.classes.map(StudentEnrollmentClass.fromResponse),
		});
	}

	getId() {
		return this.data.id;
	}

	getName() {
		return this.data.name;
	}

	getPhoneNumber() {
		return this.data.phoneNumber;
	}

	getGrade() {
		return this.data.grade;
	}

	getInitials() {
		return this.data.name
			.split(" ")
			.filter(Boolean)
			.map((part) => part[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	}

	isLineLinked() {
		return this.data.lineLinkStatus === "linked";
	}

	needsLineRelink() {
		return this.data.lineLinkStatus === "needs_relink";
	}

	getListItemData() {
		return {
			id: this.getId(),
			name: this.getName(),
			phoneNumber: this.getPhoneNumber(),
			grade: this.getGrade(),
			initials: this.getInitials(),
			isLineLinked: this.isLineLinked(),
			needsLineRelink: this.needsLineRelink(),
		};
	}

	getDetailsHeaderData() {
		return this.getListItemData();
	}

	getFormData() {
		return {
			id: this.getId(),
			name: this.getName(),
			phoneNumber: this.getPhoneNumber(),
			grade: this.getGrade(),
		};
	}

	getClasses() {
		return this.data.classes;
	}
}
