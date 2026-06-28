import { describe, expect, test } from "bun:test";
import { Student, StudentDetail } from "./student.model";

const createdAt = new Date("2026-06-28T10:00:00.000Z");
const updatedAt = new Date("2026-06-28T10:30:00.000Z");

const prismaStudent = {
	id: "student-1",
	tutorId: "tutor-1",
	name: "Jane Student",
	phoneNumber: "0812345678",
	grade: 9,
	lineUserId: "line-user-1",
	createdAt,
	updatedAt,
};

describe("Student domain model", () => {
	test("converts a Prisma student record into a domain model", () => {
		const student = Student.fromStudentPrisma(prismaStudent);

		expect(student.id).toBe("student-1");
		expect(student.tutorId).toBe("tutor-1");
		expect(student.name).toBe("Jane Student");
		expect(student.phoneNumber).toBe("0812345678");
		expect(student.grade).toBe(9);
		expect(student.lineUserId).toBe("line-user-1");
		expect(student.createdAt).toBe(createdAt);
		expect(student.updatedAt).toBe(updatedAt);
	});

	test("converts a domain model into the existing student DTO shape", () => {
		const student = Student.fromStudentPrisma(prismaStudent);

		expect(student.toStudentDTO()).toEqual({
			id: "student-1",
			tutorId: "tutor-1",
			name: "Jane Student",
			phoneNumber: "0812345678",
			grade: 9,
			lineUserId: "line-user-1",
			createdAt: "2026-06-28T10:00:00.000Z",
			updatedAt: "2026-06-28T10:30:00.000Z",
		});
	});

	test("reports whether a student has a linked LINE account", () => {
		expect(Student.fromStudentPrisma(prismaStudent).isLineLinked()).toBe(true);
		expect(
			Student.fromStudentPrisma({
				...prismaStudent,
				lineUserId: null,
			}).isLineLinked(),
		).toBe(false);
	});
});

describe("StudentDetail domain model", () => {
	test("converts enrolled class summaries into the existing detail DTO shape", () => {
		const student = StudentDetail.fromStudentPrisma(prismaStudent, [
			{
				id: "class-1",
				name: "Algebra",
				totalHours: 12.5,
				remainingHours: 7.5,
			},
		]);

		expect(student.toStudentDetailDTO()).toEqual({
			id: "student-1",
			tutorId: "tutor-1",
			name: "Jane Student",
			phoneNumber: "0812345678",
			grade: 9,
			lineUserId: "line-user-1",
			createdAt: "2026-06-28T10:00:00.000Z",
			updatedAt: "2026-06-28T10:30:00.000Z",
			classes: [
				{
					id: "class-1",
					name: "Algebra",
					totalHours: 12.5,
					remainingHours: 7.5,
				},
			],
		});
	});
});
