import { describe, expect, test } from "bun:test";
import {
	ClassHourBalance,
	isCapacityReservingScheduleStatus,
} from "./class-hour-balance.model";

describe("ClassHourBalance", () => {
	test("reserves each concrete capacity status while exposing scheduled and used hours separately", () => {
		const balance = ClassHourBalance.fromSeconds({
			totalSeconds: 36_000n,
			scheduledSeconds: 5_400n,
			completedSeconds: 7_200n,
			noShowSeconds: 1_800n,
			usedSeconds: 7_200n,
		});

		expect(balance.reservedSeconds).toBe(14_400n);
		expect(balance.remainingSeconds).toBe(21_600n);
		expect(balance.totalHours).toBe(10);
		expect(balance.remainingHours).toBe(6);
		expect(balance.scheduledHours).toBe(1.5);
		expect(balance.usedHours).toBe(2);
		expect(balance.canReserve(21_600n)).toBe(true);
		expect(balance.canReserve(21_601n)).toBe(false);
	});

	test("keeps historical over-allocation as a negative remaining balance", () => {
		const balance = ClassHourBalance.fromReservedSeconds({
			totalSeconds: 3_600n,
			reservedSeconds: 5_400n,
			usedSeconds: 1_800n,
		});

		expect(balance.remainingSeconds).toBe(-1_800n);
		expect(balance.remainingHours).toBe(-0.5);
		expect(balance.scheduledHours).toBe(0);
		expect(balance.usedHours).toBe(0.5);
	});

	test("recognizes only concrete capacity-reserving schedule statuses", () => {
		expect(isCapacityReservingScheduleStatus("SCHEDULED")).toBe(true);
		expect(isCapacityReservingScheduleStatus("COMPLETED")).toBe(true);
		expect(isCapacityReservingScheduleStatus("NO_SHOW")).toBe(true);
		expect(isCapacityReservingScheduleStatus("CANCELLED")).toBe(false);
	});
});
