import { DateTime } from "../lib/date-time";
import type {
	ClassInStudentDTO,
	StudentDetailDTO,
	StudentDTO,
} from "../types/student.types";

type StudentPrismaRecord = {
	id: string;
	tutorId: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
	lineUserId: string | null;
	lineConnectionId: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export type ClassInStudent = {
	id: string;
	name: string;
	totalHours: number;
	remainingHours?: number;
};

type StudentProps = {
	id: string;
	tutorId: string;
	name: string;
	phoneNumber: string | null;
	grade: number;
	lineUserId: string | null;
	lineConnectionId: string | null;
	createdAt: Date;
	updatedAt: Date;
};

export class Student {
	readonly id: string;
	readonly tutorId: string;
	readonly name: string;
	readonly phoneNumber: string | null;
	readonly grade: number;
	readonly lineUserId: string | null;
	readonly lineConnectionId: string | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;

	constructor(props: StudentProps) {
		this.id = props.id;
		this.tutorId = props.tutorId;
		this.name = props.name;
		this.phoneNumber = props.phoneNumber;
		this.grade = props.grade;
		this.lineUserId = props.lineUserId;
		this.lineConnectionId = props.lineConnectionId;
		this.createdAt = props.createdAt;
		this.updatedAt = props.updatedAt;
	}

	static fromStudentPrisma(student: StudentPrismaRecord): Student {
		return new Student({
			id: student.id,
			tutorId: student.tutorId,
			name: student.name,
			phoneNumber: student.phoneNumber,
			grade: student.grade,
			lineUserId: student.lineUserId,
			lineConnectionId: student.lineConnectionId,
			createdAt: student.createdAt,
			updatedAt: student.updatedAt,
		});
	}

	isLineLinked(): boolean {
		return Boolean(this.lineUserId && this.lineConnectionId);
	}

	needsLineRelink(): boolean {
		return Boolean(this.lineUserId && !this.lineConnectionId);
	}

	toStudentDTO(): StudentDTO {
		return {
			id: this.id,
			tutorId: this.tutorId,
			name: this.name,
			phoneNumber: this.phoneNumber,
			grade: this.grade,
			lineUserId: this.lineUserId,
			lineConnectionId: this.lineConnectionId,
			lineLinkStatus: this.isLineLinked()
				? "linked"
				: this.needsLineRelink()
					? "needs_relink"
					: "not_linked",
			createdAt: DateTime.from(this.createdAt).toISOString(),
			updatedAt: DateTime.from(this.updatedAt).toISOString(),
		};
	}
}

type StudentDetailProps = StudentProps & {
	classes: ClassInStudent[];
};

export class StudentDetail extends Student {
	readonly classes: ClassInStudent[];

	constructor(props: StudentDetailProps) {
		super(props);
		this.classes = props.classes;
	}

	static fromStudentPrisma(
		student: StudentPrismaRecord,
		classes: ClassInStudent[] = [],
	): StudentDetail {
		return new StudentDetail({
			id: student.id,
			tutorId: student.tutorId,
			name: student.name,
			phoneNumber: student.phoneNumber,
			grade: student.grade,
			lineUserId: student.lineUserId,
			lineConnectionId: student.lineConnectionId,
			createdAt: student.createdAt,
			updatedAt: student.updatedAt,
			classes,
		});
	}

	toStudentDetailDTO(): StudentDetailDTO {
		return {
			...this.toStudentDTO(),
			classes: this.classes.map(toClassInStudentDTO),
		};
	}
}

function toClassInStudentDTO(classData: ClassInStudent): ClassInStudentDTO {
	return {
		id: classData.id,
		name: classData.name,
		totalHours: classData.totalHours,
		remainingHours: classData.remainingHours,
	};
}
