import { DateTime } from "../lib/date-time";
import type { ClassDTO, StudentInClassDTO } from "../types/class.types";
import type { RecurringScheduleDTO } from "../types/schedule.types";

type DecimalLike = {
	toNumber(): number;
};

type HoursValue = DecimalLike | number;

type ClassPrismaRecord = {
	id: string;
	tutorId: string;
	name: string;
	totalHours: HoursValue;
	createdAt: Date;
	updatedAt: Date;
	students: ClassEnrollmentPrismaRecord[];
	recurringSchedules?: RecurringSchedulePrismaRecord[];
};

type ClassEnrollmentPrismaRecord = {
	student: {
		id: string;
		name: string;
		phoneNumber: string | null;
		grade: number;
	};
};

type RecurringSchedulePrismaRecord = {
	id: string;
	classId: string;
	startDate: Date;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
	scheduleItems: RecurringScheduleItemPrismaRecord[];
};

type RecurringScheduleItemPrismaRecord = {
	id: string;
	weekday: RecurringScheduleDTO["scheduleItems"][number]["weekday"];
	time: number;
	durationMinutes: number;
};

export type StudentInClass = {
	id: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
};

type ClassModelProps = {
	id: string;
	tutorId: string;
	name: string;
	totalHours: number;
	students: StudentInClass[];
	createdAt: Date;
	updatedAt: Date;
	remainingHours?: number;
	recurringSchedule?: RecurringScheduleDTO | null;
};

export class ClassModel {
	readonly id: string;
	readonly tutorId: string;
	readonly name: string;
	readonly totalHours: number;
	readonly students: StudentInClass[];
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly remainingHours?: number;
	readonly recurringSchedule?: RecurringScheduleDTO | null;

	constructor(props: ClassModelProps) {
		this.id = props.id;
		this.tutorId = props.tutorId;
		this.name = props.name;
		this.totalHours = props.totalHours;
		this.students = props.students;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.remainingHours = props.remainingHours;
		this.recurringSchedule = props.recurringSchedule;
	}

	static fromClassPrisma(
		classData: ClassPrismaRecord,
		remainingHours?: number,
	): ClassModel {
		return new ClassModel({
			id: classData.id,
			tutorId: classData.tutorId,
			name: classData.name,
			totalHours: toHoursNumber(classData.totalHours),
			students: classData.students.map(toStudentInClass),
			createdAt: classData.createdAt,
			updatedAt: classData.updatedAt,
			remainingHours,
			recurringSchedule: toLatestRecurringScheduleDTO(classData),
		});
	}

	toClassDTO(): ClassDTO {
		return {
			id: this.id,
			tutorId: this.tutorId,
			name: this.name,
			totalHours: this.totalHours,
			students: this.students.map(toStudentInClassDTO),
			createdAt: DateTime.from(this.createdAt).toISOString(),
			updatedAt: DateTime.from(this.updatedAt).toISOString(),
			remainingHours: this.remainingHours,
			recurringSchedule: this.recurringSchedule,
		};
	}
}

function toHoursNumber(value: HoursValue): number {
	return typeof value === "number" ? value : value.toNumber();
}

function toStudentInClass(
	enrollment: ClassEnrollmentPrismaRecord,
): StudentInClass {
	return {
		id: enrollment.student.id,
		name: enrollment.student.name,
		phoneNumber: enrollment.student.phoneNumber,
		grade: enrollment.student.grade,
	};
}

function toStudentInClassDTO(student: StudentInClass): StudentInClassDTO {
	return {
		id: student.id,
		name: student.name,
		phoneNumber: student.phoneNumber,
		grade: student.grade,
	};
}

function toLatestRecurringScheduleDTO(
	classData: ClassPrismaRecord,
): RecurringScheduleDTO | null | undefined {
	if (!classData.recurringSchedules) {
		return undefined;
	}

	const recurringSchedule = classData.recurringSchedules[0];
	if (!recurringSchedule) {
		return null;
	}

	return {
		id: recurringSchedule.id,
		classId: recurringSchedule.classId,
		className: classData.name,
		startDate: DateTime.from(recurringSchedule.startDate).toDateOnlyString(),
		notes: recurringSchedule.notes,
		createdAt: DateTime.from(recurringSchedule.createdAt).toISOString(),
		updatedAt: DateTime.from(recurringSchedule.updatedAt).toISOString(),
		scheduleItems: recurringSchedule.scheduleItems.map((item) => ({
			id: item.id,
			weekday: item.weekday,
			time: item.time,
			durationMinutes: item.durationMinutes,
		})),
	};
}
