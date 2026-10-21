import type { GetV1Classes200DataItem } from "@/api/generated/models/getV1Classes200DataItem";
import type { GetV1Classes200DataItemStudentsItem } from "@/api/generated/models/getV1Classes200DataItemStudentsItem";
import type { GetV1ClassesById200 } from "@/api/generated/models/getV1ClassesById200";
import type { GetV1ClassesById200StudentsItem } from "@/api/generated/models/getV1ClassesById200StudentsItem";
import { DateTime } from "@/lib/date-time";
import { RecurringSchedule } from "@/models/recurring-schedule";

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
	scheduledHours: number;
	usedHours: number;
	remainingHours: number;
	recordedRevenue: number | null;
	students: ClassStudent[];
	recurringSchedule?: RecurringSchedule | null;
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

	static getStudentEnrollmentToggleDecision(
		currentStudentIds: readonly string[],
		candidateStudentIds: readonly string[],
	): {
		kind: "select" | "deselect" | "unchanged";
		nextStudentIds: string[];
	} {
		const normalizedCurrentStudentIds = [...new Set(currentStudentIds)];
		const normalizedCandidateStudentIds = [...new Set(candidateStudentIds)];

		if (normalizedCandidateStudentIds.length === 0) {
			return {
				kind: "unchanged",
				nextStudentIds: [...normalizedCurrentStudentIds],
			};
		}

		const currentStudentIdSet = new Set(normalizedCurrentStudentIds);
		const candidateStudentIdSet = new Set(normalizedCandidateStudentIds);
		const areAllCandidatesSelected = normalizedCandidateStudentIds.every((id) =>
			currentStudentIdSet.has(id),
		);

		if (areAllCandidatesSelected) {
			return {
				kind: "deselect",
				nextStudentIds: normalizedCurrentStudentIds.filter(
					(id) => !candidateStudentIdSet.has(id),
				),
			};
		}

		return {
			kind: "select",
			nextStudentIds: [
				...normalizedCurrentStudentIds,
				...normalizedCandidateStudentIds.filter(
					(id) => !currentStudentIdSet.has(id),
				),
			],
		};
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
			scheduledHours: this.data.scheduledHours,
			usedHours: this.data.usedHours,
			remainingHours: this.data.remainingHours,
			formattedTotalHours: DateTime.formatDurationHours(this.data.totalHours),
			formattedScheduledHours: DateTime.formatDurationHours(
				this.data.scheduledHours,
			),
			formattedUsedHours: DateTime.formatDurationHours(this.data.usedHours),
			formattedRemainingHours: DateTime.formatDurationHours(
				this.data.remainingHours,
			),
		};
	}

	getBalanceState() {
		if (this.data.totalHours <= 0) return "no-hours" as const;
		if (this.data.usedHours >= this.data.totalHours) {
			return "exhausted" as const;
		}
		if (this.data.remainingHours <= 0) return "all-scheduled" as const;
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
			formattedRecordedRevenue:
				this.data.recordedRevenue === null
					? null
					: DateTime.formatThaiBaht(this.data.recordedRevenue),
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
		scheduledHours: response.scheduledHours,
		usedHours: response.usedHours,
		remainingHours: response.remainingHours,
		recordedRevenue:
			"recordedRevenue" in response ? response.recordedRevenue : null,
		students: response.students.map(ClassStudent.fromResponse),
		recurringSchedule: response.recurringSchedule
			? RecurringSchedule.fromResponse(response.recurringSchedule)
			: null,
	};
}
