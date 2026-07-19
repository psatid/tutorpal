import { describe, expect, test } from "bun:test";
import { ClassModel } from "./class.model";

const createdAt = new Date("2026-06-28T10:00:00.000Z");
const updatedAt = new Date("2026-06-28T10:30:00.000Z");

const prismaClass = {
	id: "class-1",
	tutorId: "tutor-1",
	name: "Algebra",
	course: {
		id: "course-1",
		name: "Mathematics",
		defaultTotalHours: { toNumber: () => 20 },
	},
	totalHours: {
		toNumber: () => 12.5,
	},
	createdAt,
	updatedAt,
	students: [
		{
			student: {
				id: "student-1",
				name: "Jane Student",
				phoneNumber: "0812345678",
				grade: 9,
			},
		},
	],
};

describe("ClassModel", () => {
	test("converts a Prisma class record into a model", () => {
		const classModel = ClassModel.fromClassPrisma(prismaClass, 7.5);

		expect(classModel.id).toBe("class-1");
		expect(classModel.tutorId).toBe("tutor-1");
		expect(classModel.name).toBe("Algebra");
		expect(classModel.displayName).toBe("Algebra");
		expect(classModel.totalHours).toBe(12.5);
		expect(classModel.remainingHours).toBe(7.5);
		expect(classModel.createdAt).toBe(createdAt);
		expect(classModel.updatedAt).toBe(updatedAt);
	});

	test("converts enrolled students into the existing DTO shape", () => {
		const classModel = ClassModel.fromClassPrisma(prismaClass, 7.5);

		expect(classModel.toClassDTO().students).toEqual([
			{
				id: "student-1",
				name: "Jane Student",
				phoneNumber: "0812345678",
				grade: 9,
			},
		]);
	});

	test("preserves remaining hours and serializes the existing class DTO shape", () => {
		const classModel = ClassModel.fromClassPrisma(prismaClass, 7.5);

		expect(classModel.toClassDTO()).toEqual({
			id: "class-1",
			tutorId: "tutor-1",
			course: { id: "course-1", name: "Mathematics", defaultTotalHours: 20 },
			name: "Algebra",
			displayName: "Algebra",
			totalHours: 12.5,
			students: [
				{
					id: "student-1",
					name: "Jane Student",
					phoneNumber: "0812345678",
					grade: 9,
				},
			],
			createdAt: "2026-06-28T10:00:00.000Z",
			updatedAt: "2026-06-28T10:30:00.000Z",
			remainingHours: 7.5,
			recurringSchedule: undefined,
		});
	});

	test("serializes latest recurring schedule summaries", () => {
		const classModel = ClassModel.fromClassPrisma(
			{
				...prismaClass,
				recurringSchedules: [
					{
						id: "recurring-1",
						classId: "class-1",
						startDate: new Date("2026-07-01T00:00:00.000Z"),
						notes: "Weekly practice",
						createdAt,
						updatedAt,
						scheduleItems: [
							{
								id: "item-1",
								weekday: "MONDAY",
								time: 540,
								durationMinutes: 90,
							},
						],
					},
				],
			},
			7.5,
		);

		expect(classModel.toClassDTO().recurringSchedule).toEqual({
			id: "recurring-1",
			classId: "class-1",
			className: "Algebra",
			courseName: "Mathematics",
			startDate: "2026-07-01",
			notes: "Weekly practice",
			createdAt: "2026-06-28T10:00:00.000Z",
			updatedAt: "2026-06-28T10:30:00.000Z",
			scheduleItems: [
				{
					id: "item-1",
					weekday: "MONDAY",
					time: 540,
					durationMinutes: 90,
				},
			],
		});
	});

	test("derives a class name from students when a linked class has no custom name", () => {
		const classModel = ClassModel.fromClassPrisma({
			...prismaClass,
			name: null,
			students: [
				prismaClass.students[0] ?? {
					student: {
						id: "student-1",
						name: "Aom",
						phoneNumber: null,
						grade: 9,
					},
				},
				{
					student: {
						id: "student-2",
						name: "Beam",
						phoneNumber: null,
						grade: 9,
					},
				},
			],
		});
		expect(classModel.displayName).toBe("Jane Student & Beam");
	});
});
