import { describe, expect, test } from "bun:test";
import { ClassHourAdditionModel } from "./class-hour-addition.model";

describe("ClassHourAdditionModel", () => {
	test("serializes immutable course snapshots independently from a live course", () => {
		const addition = ClassHourAdditionModel.fromPrisma({
			id: "addition-1",
			classId: "class-1",
			source: "COURSE",
			hours: { toNumber: () => 12.5 },
			sourceCourseId: "course-1",
			sourceCourseName: "Mathematics",
			requestId: "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c",
			createdAt: new Date("2026-08-11T03:00:00.000Z"),
		});

		expect(addition.toClassHourAdditionDTO()).toEqual({
			id: "addition-1",
			classId: "class-1",
			source: "course",
			hours: 12.5,
			sourceCourseId: "course-1",
			sourceCourseName: "Mathematics",
			requestId: "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c",
			createdAt: "2026-08-11T03:00:00.000Z",
		});
	});

	test("keeps custom additions free of course context", () => {
		const addition = ClassHourAdditionModel.fromPrisma({
			id: "addition-2",
			classId: "class-1",
			source: "CUSTOM",
			hours: 1.25,
			sourceCourseId: null,
			sourceCourseName: null,
			requestId: "fa7445e8-0649-4776-89f3-2ffdd09619a4",
			createdAt: new Date("2026-08-11T03:00:00.000Z"),
		});

		expect(addition.toClassHourAdditionDTO()).toMatchObject({
			source: "custom",
			sourceCourseId: null,
			sourceCourseName: null,
		});
	});
});
