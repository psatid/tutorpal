import { describe, expect, test } from "bun:test";
import { MAX_CLASS_SECONDS } from "../lib/class-hour-addition";
import { ClassModel } from "./class.model";
import {
	ClassHourAdditionLimitError,
	ClassHourAdditionModel,
} from "./class-hour-addition.model";
import { ClassHourBalance } from "./class-hour-balance.model";

const createdAt = new Date("2026-06-28T10:00:00.000Z");
const updatedAt = new Date("2026-06-28T10:30:00.000Z");

const prismaClass = {
	id: "class-1",
	tutorId: "tutor-1",
	name: "Algebra",
	totalSeconds: 45_000n,
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

const hourBalance = ClassHourBalance.fromSeconds({
	totalSeconds: prismaClass.totalSeconds,
	scheduledSeconds: 8_100n,
	completedSeconds: 8_100n,
	noShowSeconds: 1_800n,
	usedSeconds: 6_300n,
});

describe("ClassModel", () => {
	test("converts a standalone Prisma class record into a model", () => {
		const classModel = ClassModel.fromClassPrisma(prismaClass, hourBalance);

		expect(classModel.id).toBe("class-1");
		expect(classModel.tutorId).toBe("tutor-1");
		expect(classModel.name).toBe("Algebra");
		expect(classModel.displayName).toBe("Algebra");
		expect(classModel.totalHours).toBe(12.5);
		expect(classModel.remainingHours).toBe(7.5);
		expect(classModel.scheduledHours).toBe(2.25);
		expect(classModel.usedHours).toBe(1.75);
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
		expect(classModel.toClassDTO().scheduledHours).toBe(0);
		expect(classModel.toClassDTO().usedHours).toBe(0);
	});

	test("serializes a standalone class without course context", () => {
		const classModel = ClassModel.fromClassPrisma(prismaClass, hourBalance);

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
			scheduledHours: 2.25,
			usedHours: 1.75,
			recurringSchedule: undefined,
		});
	});

	test("adds recorded revenue only to the class detail DTO", () => {
		const classModel = ClassModel.fromClassPrisma(prismaClass, hourBalance);

		expect(classModel.toClassDTO()).not.toHaveProperty("recordedRevenue");
		expect(classModel.toClassDetailDTO(1_250)).toMatchObject({
			id: "class-1",
			scheduledHours: 2.25,
			usedHours: 1.75,
			recordedRevenue: 1_250,
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
								durationSeconds: 5_400n,
							},
						],
					},
				],
			},
			hourBalance,
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

	test("produces a guarded hour-addition plan at the class total boundary", () => {
		const addition = ClassHourAdditionModel.prepare({
			source: "custom",
			hours: 0.01,
			requestId: "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c",
		}).toDraft();
		const classAtLimit = ClassModel.fromClassPrisma({
			...prismaClass,
			totalSeconds: MAX_CLASS_SECONDS - 36n,
		});

		const plan = classAtLimit.planHourAddition(addition);
		expect(plan.incrementSeconds).toBe(36n);
		expect(plan.maximumCurrentTotalSeconds).toBe(MAX_CLASS_SECONDS - 36n);

		const fullClass = ClassModel.fromClassPrisma({
			...prismaClass,
			totalSeconds: MAX_CLASS_SECONDS,
		});
		expect(() => fullClass.planHourAddition(addition)).toThrow(
			ClassHourAdditionLimitError,
		);
	});
});
