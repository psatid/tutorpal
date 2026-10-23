import { describe, expect, it } from "vitest";
import type { GetV1ClassesById200 } from "@/api/generated/models/getV1ClassesById200";
import { Class } from "@/models/class";

function makeClass(
	overrides: Partial<GetV1ClassesById200> = {},
): Class {
	return Class.fromGetClassByIdResponse({
		createdAt: "2026-10-12T00:00:00.000Z",
		displayName: "Algebra 1",
		id: "class-1",
		name: "Algebra 1",
		recordedRevenue: 0,
		remainingHours: 0,
		scheduledHours: 0,
		students: [],
		totalHours: 10,
		updatedAt: "2026-10-12T00:00:00.000Z",
		usedHours: 0,
		...overrides,
	});
}

describe("Class hour accounting", () => {
	it("keeps a fully scheduled class distinct from an exhausted class", () => {
		const classData = makeClass({
			remainingHours: 0,
			scheduledHours: 10,
			usedHours: 0,
		});

		expect(classData.getBalanceState()).toBe("all-scheduled");
		expect(classData.getBalanceState()).not.toBe("exhausted");
		expect(classData.hasNoAvailableHours()).toBe(true);
		expect(classData.getHoursData()).toMatchObject({
			remainingHours: 0,
			scheduledHours: 10,
			usedHours: 0,
			formattedRemainingHours: "0",
			formattedScheduledHours: "10",
			formattedUsedHours: "0",
		});
	});

	it("marks an active ten-hour deduction as exhausted", () => {
		const classData = makeClass({
			remainingHours: 0,
			scheduledHours: 0,
			usedHours: 10,
		});

		expect(classData.getBalanceState()).toBe("exhausted");
		expect(classData.hasNoAvailableHours()).toBe(true);
	});

	it("shows a zero-hour class as no-hours even when no availability remains", () => {
		const classData = makeClass({
			remainingHours: 0,
			scheduledHours: 0,
			totalHours: 0,
			usedHours: 0,
		});

		expect(classData.getBalanceState()).toBe("no-hours");
		expect(classData.hasNoAvailableHours()).toBe(true);
	});
});

describe("Class student enrollment selection", () => {
	it("toggles a single student enrollment", () => {
		const selected = Class.getStudentEnrollmentToggleDecision([], ["student-1"]);
		const deselected = Class.getStudentEnrollmentToggleDecision(
			selected.nextStudentIds,
			["student-1"],
		);

		expect(selected).toEqual({
			kind: "select",
			nextStudentIds: ["student-1"],
		});
		expect(deselected).toEqual({
			kind: "deselect",
			nextStudentIds: [],
		});
	});

	it("appends missing bulk candidates in candidate order while preserving hidden IDs", () => {
		expect(
			Class.getStudentEnrollmentToggleDecision(
				["hidden-student", "already-selected"],
				["already-selected", "student-b", "student-a"],
			),
		).toEqual({
			kind: "select",
			nextStudentIds: [
				"hidden-student",
				"already-selected",
				"student-b",
				"student-a",
			],
		});
	});

	it("deselects only visible candidates and leaves hidden IDs selected", () => {
		expect(
			Class.getStudentEnrollmentToggleDecision(
				["hidden-before", "student-a", "student-b", "hidden-after"],
				["student-b", "student-a"],
			),
		).toEqual({
			kind: "deselect",
			nextStudentIds: ["hidden-before", "hidden-after"],
		});
	});

	it("normalizes duplicate IDs while retaining stable current and candidate order", () => {
		expect(
			Class.getStudentEnrollmentToggleDecision(
				["hidden-student", "already-selected", "hidden-student"],
				["student-b", "already-selected", "student-b", "student-a"],
			),
		).toEqual({
			kind: "select",
			nextStudentIds: [
				"hidden-student",
				"already-selected",
				"student-b",
				"student-a",
			],
		});
	});

	it("does not mutate frozen inputs while normalizing a selection", () => {
		const currentStudentIds = Object.freeze([
			"hidden-student",
			"hidden-student",
			"student-a",
		]);
		const candidateStudentIds = Object.freeze(["student-b", "student-b"]);

		const decision = Class.getStudentEnrollmentToggleDecision(
			currentStudentIds,
			candidateStudentIds,
		);

		expect(decision).toEqual({
			kind: "select",
			nextStudentIds: ["hidden-student", "student-a", "student-b"],
		});
		expect(decision.nextStudentIds).not.toBe(currentStudentIds);
		expect(currentStudentIds).toEqual([
			"hidden-student",
			"hidden-student",
			"student-a",
		]);
		expect(candidateStudentIds).toEqual(["student-b", "student-b"]);
	});

	it("returns a fresh normalized result for empty candidates", () => {
		const currentStudentIds = ["hidden-student", "hidden-student", "student-a"];

		const decision = Class.getStudentEnrollmentToggleDecision(
			currentStudentIds,
			[],
		);

		expect(decision).toEqual({
			kind: "unchanged",
			nextStudentIds: ["hidden-student", "student-a"],
		});
		expect(decision.nextStudentIds).not.toBe(currentStudentIds);
	});
});
