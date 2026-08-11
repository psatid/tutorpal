import type { GetV1Classes200DataItem } from "@/api/generated/models/getV1Classes200DataItem";
import type { GetV1Classes200DataItemStudentsItem } from "@/api/generated/models/getV1Classes200DataItemStudentsItem";
import type { GetV1ClassesById200 } from "@/api/generated/models/getV1ClassesById200";
import type { GetV1ClassesById200StudentsItem } from "@/api/generated/models/getV1ClassesById200StudentsItem";
import { DateTime } from "@/lib/date-time";
import type { RecurringScheduleSummary } from "@/types/schedule";

type ClassStudentDetails = {
	id: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
};

type ClassDetails = {
	id: string;
	name: string;
	displayName: string;
	totalHours: number;
	remainingHours: number;
	students: ClassStudent[];
	recurringSchedule?: RecurringScheduleSummary | null;
};

export class ClassStudent {
	constructor(private readonly data: ClassStudentDetails) {}

	static fromResponse(
		response: GetV1Classes200DataItemStudentsItem | GetV1ClassesById200StudentsItem,
	): ClassStudent {
		return new ClassStudent({
			id: response.id,
			name: response.name,
			phoneNumber: response.phoneNumber,
			grade: response.grade,
		});
	}

	getId() {
		return this.data.id;
	}

	getName() {
		return this.data.name;
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
}

export class Class {
	constructor(private readonly data: ClassDetails) {}

	static fromListItem(response: GetV1Classes200DataItem): Class {
		return new Class(toClassDetails(response));
	}

	static fromGetClassByIdResponse(response: GetV1ClassesById200): Class {
		return new Class(toClassDetails(response));
	}

	getId() {
		return this.data.id;
	}

	getDisplayName() {
		return this.data.displayName;
	}

	getName() {
		return this.data.name;
	}

	getStudents() {
		return this.data.students;
	}

	getHoursData() {
		return {
			totalHours: this.data.totalHours,
			remainingHours: this.data.remainingHours,
			formattedTotalHours: DateTime.formatDurationHours(this.data.totalHours),
			formattedRemainingHours: DateTime.formatDurationHours(
				this.data.remainingHours,
			),
		};
	}

	getBalanceState() {
		if (this.data.totalHours <= 0) return "no-hours" as const;
		if (this.data.remainingHours <= 0) return "exhausted" as const;
		return "available" as const;
	}

	hasNoAvailableHours() {
		return this.data.remainingHours <= 0;
	}

	getListItemData() {
		const hours = this.getHoursData();
		return {
			id: this.getId(),
			displayName: this.getDisplayName(),
			studentNames: this.getStudents().map((student) => student.getName()),
			balanceState: this.getBalanceState(),
			...hours,
		};
	}

	getDetailsHeaderData() {
		return {
			displayName: this.getDisplayName(),
			students: this.getStudents(),
			balanceState: this.getBalanceState(),
			...this.getHoursData(),
		};
	}

	getFormData() {
		return {
			id: this.getId(),
			name: this.data.name,
			studentIds: this.getStudents().map((student) => student.getId()),
		};
	}

	getRecurringSchedule() {
		return this.data.recurringSchedule;
	}
}

function toClassDetails(
	response: GetV1Classes200DataItem | GetV1ClassesById200,
): ClassDetails {
	return {
		id: response.id,
		name: response.name,
		displayName: response.displayName,
		totalHours: response.totalHours,
		remainingHours: response.remainingHours,
		students: response.students.map(ClassStudent.fromResponse),
		recurringSchedule: response.recurringSchedule
			? {
					id: response.recurringSchedule.id,
					startDate: response.recurringSchedule.startDate,
					notes: response.recurringSchedule.notes,
					type: response.recurringSchedule.type,
					scheduleItems: response.recurringSchedule.scheduleItems,
				}
			: null,
	};
}
