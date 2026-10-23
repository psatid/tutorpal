import { describe, expect, it } from "vitest";
import { getOverlappingRecurringScheduleItemIndexes } from "@/types/schedule";

describe("getOverlappingRecurringScheduleItemIndexes", () => {
	it("detects an interval that crosses into the next weekday", () => {
		expect(
			[...getOverlappingRecurringScheduleItemIndexes([
				{ weekday: "MONDAY", time: "23:30", durationMinutes: 60 },
				{ weekday: "TUESDAY", time: "00:00", durationMinutes: 60 },
			])],
		).toEqual([0, 1]);
	});

	it("detects the Sunday-to-Monday weekly wrap", () => {
		expect(
			[...getOverlappingRecurringScheduleItemIndexes([
				{ weekday: "SUNDAY", time: "23:30", durationMinutes: 60 },
				{ weekday: "MONDAY", time: "00:00", durationMinutes: 60 },
			])],
		).toEqual([0, 1]);
	});

	it("allows intervals that only touch across a weekday boundary", () => {
		expect(
			getOverlappingRecurringScheduleItemIndexes([
				{ weekday: "MONDAY", time: "23:00", durationMinutes: 60 },
				{ weekday: "TUESDAY", time: "00:00", durationMinutes: 60 },
			]),
		).toEqual(new Set());
	});

	it("detects an interval that overlaps its own next weekly occurrence", () => {
		expect(
			[...getOverlappingRecurringScheduleItemIndexes([
				{ weekday: "MONDAY", time: "09:00", durationMinutes: 10_081 },
			])],
		).toEqual([0]);
	});

	it("allows an interval that ends exactly at its next weekly occurrence", () => {
		expect(
			getOverlappingRecurringScheduleItemIndexes([
				{ weekday: "MONDAY", time: "09:00", durationMinutes: 10_080 },
			]),
		).toEqual(new Set());
	});

	it("marks both intervals when either duration exceeds a weekly cycle", () => {
		expect(
			[...getOverlappingRecurringScheduleItemIndexes([
				{ weekday: "MONDAY", time: "09:00", durationMinutes: 20_160 },
				{ weekday: "WEDNESDAY", time: "09:00", durationMinutes: 60 },
			])],
		).toEqual([0, 1]);
	});
});
