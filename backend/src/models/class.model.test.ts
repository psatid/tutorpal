import { describe, expect, test } from "bun:test";
import { ClassModel } from "./class.model";

const createdAt = new Date("2026-06-28T10:00:00.000Z");
const updatedAt = new Date("2026-06-28T10:30:00.000Z");

const prismaClass = {
	id: "class-1",
	tutorId: "tutor-1",
	name: "Algebra",
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
	test("converts a standalone Prisma class record into a model", () => {
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

	test("keeps student enrollment optional in the class DTO", () => {
		const classModel = ClassModel.fromClassPrisma({
			...prismaClass,
			students: [],
		});

		expect(classModel.toClassDTO().students).toEqual([]);
		expect(classModel.toClassDTO().remainingHours).toBe(12.5);
	});

	test("serializes a standalone class without course context", () => {
		const classModel = ClassModel.fromClassPrisma(prismaClass, 7.5);

		expect(classModel.toClassDTO()).toEqual({
			id: "class-1",
			tutorId: "tutor-1",
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

	test("serializes latest recurring schedule summaries without course context", () => {
		const classModel = ClassModel.fromClassPrisma(
			{
				...prismaClass,
				recurringSchedules: [
					{
						id: "recurring-1",
						classId: "class-1",
						startDate: new Date("2026-07-01T00:00:00.000Z"),
						notes: "Weekly practice",
						type: "ONLINE",
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
			startDate: "2026-07-01",
			notes: "Weekly practice",
			type: "ONLINE",
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
});
