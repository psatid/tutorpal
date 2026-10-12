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
