import { MAX_CLASS_SECONDS } from "../lib/class-hour-addition";
import { DateTime } from "../lib/date-time";
import { secondsToMinutes } from "../lib/teaching-time";
import type {
	ClassDetailDTO,
	ClassDTO,
	StudentInClassDTO,
} from "../types/class.types";
import type { RecurringScheduleDTO } from "../types/schedule.types";
import type {
	ClassHourAdditionDraft,
	ClassHourAdditionRequest,
} from "./class-hour-addition.model";
import { ClassHourAdditionLimitError } from "./class-hour-addition.model";
import { ClassHourBalance } from "./class-hour-balance.model";

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
	students: StudentInClassDTO[];
	createdAt: Date;
	updatedAt: Date;
	hourBalance: ClassHourBalance;
	recurringSchedule?: RecurringScheduleDTO | null;
};

export type ClassHourAdditionPlan = Readonly<{
	classId: string;
	request: ClassHourAdditionRequest;
	draft: ClassHourAdditionDraft;
	incrementSeconds: bigint;
	maximumCurrentTotalSeconds: bigint;
}>;

export class ClassModel {
	readonly id: string;
	readonly tutorId: string;
	readonly name: string;
	readonly displayName: string;
	readonly students: StudentInClassDTO[];
	readonly createdAt: Date;
	readonly updatedAt: Date;
	readonly hourBalance: ClassHourBalance;
	readonly recurringSchedule?: RecurringScheduleDTO | null;

	constructor(props: ClassModelProps) {
		this.id = props.id;
		this.tutorId = props.tutorId;
		this.name = props.name;
		this.students = props.students;
		this.displayName = props.name;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
		this.hourBalance = props.hourBalance;
		this.recurringSchedule = props.recurringSchedule;
	}

	get totalSeconds(): bigint {
		return this.hourBalance.totalSeconds;
	}

	get totalHours(): number {
		return this.hourBalance.totalHours;
	}

	get remainingHours(): number {
		return this.hourBalance.remainingHours;
	}

	get scheduledHours(): number {
		return this.hourBalance.scheduledHours;
	}

	get usedHours(): number {
		return this.hourBalance.usedHours;
	}

	static fromClassPrisma(
		classData: ClassPrismaRecord,
		hourBalance = ClassHourBalance.fromSeconds({
			totalSeconds: classData.totalSeconds,
		}),
	): ClassModel {
		const students = classData.students.map((enrollment) => enrollment.student);
		return new ClassModel({
			id: classData.id,
			tutorId: classData.tutorId,
			name: classData.name,
			students,
			createdAt: classData.createdAt,
			updatedAt: classData.updatedAt,
			hourBalance,
			recurringSchedule: toLatestRecurringScheduleDTO(
				classData,
				classData.name,
			),
		});
	}

	planHourAddition(draft: ClassHourAdditionDraft): ClassHourAdditionPlan {
		if (this.totalSeconds + draft.secondsAdded > MAX_CLASS_SECONDS) {
			throw new ClassHourAdditionLimitError(
				"Adding these hours would exceed the class total hour limit",
			);
		}

		return Object.freeze({
			classId: this.id,
			request: draft.request,
			draft,
			incrementSeconds: draft.secondsAdded,
			maximumCurrentTotalSeconds: MAX_CLASS_SECONDS - draft.secondsAdded,
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
