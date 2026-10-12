import { DateTime } from "../lib/date-time";
import { secondsToHours, secondsToMinutes } from "../lib/teaching-time";
import type {
	ClassDetailDTO,
	ClassDTO,
	StudentInClassDTO,
} from "../types/class.types";
import type { RecurringScheduleDTO } from "../types/schedule.types";

type ClassPrismaRecord = {
	id: string;
	tutorId: string;
	name: string;
	totalSeconds: bigint;
	createdAt: Date;
	updatedAt: Date;
	students: Array<{ student: StudentInClassDTO }>;
	recurringSchedules?: Array<{
		id: string;
		classId: string;
		startDate: Date;
		notes: string | null;
		type: RecurringScheduleDTO["type"];
		createdAt: Date;
		updatedAt: Date;
		scheduleItems: Array<{
			id: string;
			weekday: RecurringScheduleDTO["scheduleItems"][number]["weekday"];
			time: number;
			durationSeconds: bigint;
		}>;
	}>;
};

type ClassModelProps = {
	id: string;
	tutorId: string;
	name: string;
	totalHours: number;
	students: StudentInClassDTO[];
	createdAt: Date;
	updatedAt: Date;
	remainingHours: number;
	scheduledHours: number;
	usedHours: number;
	recurringSchedule?: RecurringScheduleDTO | null;
};

export class ClassModel {
	readonly id: string;
	readonly tutorId: string;
	readonly name: string;
	readonly displayName: string;
	readonly totalHours: number;
	readonly students: StudentInClassDTO[];
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly remainingHours: number;
	readonly scheduledHours: number;
	readonly usedHours: number;
	readonly recurringSchedule?: RecurringScheduleDTO | null;

	constructor(props: ClassModelProps) {
		this.id = props.id;
		this.tutorId = props.tutorId;
		this.name = props.name;
		this.students = props.students;
		this.displayName = props.name;
		this.totalHours = props.totalHours;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.remainingHours = props.remainingHours;
		this.scheduledHours = props.scheduledHours;
		this.usedHours = props.usedHours;
		this.recurringSchedule = props.recurringSchedule;
	}

	static fromClassPrisma(
		classData: ClassPrismaRecord,
		remainingHours = secondsToHours(classData.totalSeconds),
		scheduledHours = 0,
		usedHours = 0,
	): ClassModel {
		const students = classData.students.map((enrollment) => enrollment.student);
		return new ClassModel({
			id: classData.id,
			tutorId: classData.tutorId,
			name: classData.name,
			totalHours: secondsToHours(classData.totalSeconds),
			students,
			createdAt: classData.createdAt,
			updatedAt: classData.updatedAt,
			remainingHours,
			scheduledHours,
			usedHours,
			recurringSchedule: toLatestRecurringScheduleDTO(
				classData,
				classData.name,
			),
		});
	}

	toClassDTO(): ClassDTO {
		return {
			id: this.id,
			tutorId: this.tutorId,
			name: this.name,
			displayName: this.displayName,
			totalHours: this.totalHours,
			students: this.students,
			createdAt: DateTime.from(this.createdAt).toISOString(),
			updatedAt: DateTime.from(this.updatedAt).toISOString(),
			remainingHours: this.remainingHours,
			scheduledHours: this.scheduledHours,
			usedHours: this.usedHours,
			recurringSchedule: this.recurringSchedule,
		};
	}

	toClassDetailDTO(recordedRevenue: number): ClassDetailDTO {
		return {
			...this.toClassDTO(),
			recordedRevenue,
		};
	}
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
		startDate: DateTime.from(recurring.startDate).toDateOnlyString(),
		notes: recurring.notes,
		type: recurring.type,
		createdAt: DateTime.from(recurring.createdAt).toISOString(),
		updatedAt: DateTime.from(recurring.updatedAt).toISOString(),
		scheduleItems: recurring.scheduleItems.map((item) => ({
			id: item.id,
			weekday: item.weekday,
			time: item.time,
			durationMinutes: secondsToMinutes(item.durationSeconds),
		})),
	};
}
