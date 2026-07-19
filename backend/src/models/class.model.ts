import { DateTime } from "../lib/date-time";
import type {
	ClassDTO,
	CourseInClassDTO,
	StudentInClassDTO,
} from "../types/class.types";
import type { RecurringScheduleDTO } from "../types/schedule.types";
import { getClassDisplayName } from "./class-display-name";

type DecimalLike = { toNumber(): number };
type HoursValue = DecimalLike | number;

type ClassPrismaRecord = {
	id: string;
	tutorId: string;
	name: string | null;
	totalHours: HoursValue;
	createdAt: Date;
	updatedAt: Date;
	course: { id: string; name: string; defaultTotalHours: HoursValue } | null;
	students: Array<{ student: StudentInClassDTO }>;
	recurringSchedules?: Array<{
		id: string;
		classId: string;
		startDate: Date;
		notes: string | null;
		createdAt: Date;
		updatedAt: Date;
		scheduleItems: Array<{
			id: string;
			weekday: RecurringScheduleDTO["scheduleItems"][number]["weekday"];
			time: number;
			durationMinutes: number;
		}>;
	}>;
};

type ClassModelProps = {
	id: string;
	tutorId: string;
	course: CourseInClassDTO | null;
	name: string | null;
	totalHours: number;
	students: StudentInClassDTO[];
	createdAt: Date;
	updatedAt: Date;
	remainingHours?: number;
	recurringSchedule?: RecurringScheduleDTO | null;
};

export class ClassModel {
	readonly id: string;
	readonly tutorId: string;
	readonly course: CourseInClassDTO | null;
	readonly name: string | null;
	readonly displayName: string;
	readonly totalHours: number;
	readonly students: StudentInClassDTO[];
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly remainingHours?: number;
	readonly recurringSchedule?: RecurringScheduleDTO | null;

	constructor(props: ClassModelProps) {
		this.id = props.id;
		this.tutorId = props.tutorId;
		this.course = props.course;
		this.name = props.name;
		this.students = props.students;
		this.displayName = getClassDisplayName(
			props.name,
			props.students,
			props.course?.name,
		);
		this.totalHours = props.totalHours;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.remainingHours = props.remainingHours;
		this.recurringSchedule = props.recurringSchedule;
	}

	static fromClassPrisma(
		classData: ClassPrismaRecord,
		remainingHours?: number,
	): ClassModel {
		const students = classData.students.map((enrollment) => enrollment.student);
		const course = classData.course
			? {
					id: classData.course.id,
					name: classData.course.name,
					defaultTotalHours: toHoursNumber(classData.course.defaultTotalHours),
				}
			: null;
		return new ClassModel({
			id: classData.id,
			tutorId: classData.tutorId,
			course,
			name: classData.name,
			totalHours: toHoursNumber(classData.totalHours),
			students,
			createdAt: classData.createdAt,
			updatedAt: classData.updatedAt,
			remainingHours,
			recurringSchedule: toLatestRecurringScheduleDTO(
				classData,
				getClassDisplayName(classData.name, students, course?.name),
			),
		});
	}

	toClassDTO(): ClassDTO {
		return {
			id: this.id,
			tutorId: this.tutorId,
			course: this.course,
			name: this.name,
			displayName: this.displayName,
			totalHours: this.totalHours,
			students: this.students,
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

function toLatestRecurringScheduleDTO(
	classData: ClassPrismaRecord,
	displayName: string,
): RecurringScheduleDTO | null | undefined {
	if (!classData.recurringSchedules) return undefined;
	const recurring = classData.recurringSchedules[0];
	if (!recurring) return null;
	return {
		id: recurring.id,
		classId: recurring.classId,
		className: displayName,
		courseName: classData.course?.name ?? null,
		startDate: DateTime.from(recurring.startDate).toDateOnlyString(),
		notes: recurring.notes,
		createdAt: DateTime.from(recurring.createdAt).toISOString(),
		updatedAt: DateTime.from(recurring.updatedAt).toISOString(),
		scheduleItems: recurring.scheduleItems.map((item) => ({
			id: item.id,
			weekday: item.weekday,
			time: item.time,
			durationMinutes: item.durationMinutes,
		})),
	};
}
