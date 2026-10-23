import { describe, expect, test } from "bun:test";
import {
	hoursToSeconds,
	minutesToSeconds,
	secondsToHours,
	secondsToMinutes,
} from "./teaching-time";

describe("teaching-time conversions", () => {
	test("keeps hundredths of an hour as exact seconds", () => {
		expect(hoursToSeconds(0.01)).toBe(36n);
		expect(hoursToSeconds(1.5)).toBe(5_400n);
		expect(secondsToHours(36n)).toBe(0.01);
		expect(secondsToHours(5_400n)).toBe(1.5);
	});

	test("converts whole-minute schedule durations without a floating-point round trip", () => {
		expect(minutesToSeconds(30)).toBe(1_800n);
		expect(secondsToMinutes(1_800n)).toBe(30);
	});
});
