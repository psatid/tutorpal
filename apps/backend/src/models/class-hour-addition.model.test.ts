import { describe, expect, test } from "bun:test";
import { MAX_CLASS_HOURS, MAX_CLASS_SECONDS } from "../lib/class-hour-addition";
import {
	ClassHourAdditionLimitError,
	ClassHourAdditionModel,
	ClassHourAdditionRequestConflictError,
	ClassHourAdditionValidationError,
} from "./class-hour-addition.model";

describe("ClassHourAdditionModel", () => {
	test("serializes immutable course snapshots independently from a live course", () => {
		const addition = ClassHourAdditionModel.fromPrisma({
			id: "addition-1",
			classId: "class-1",
			source: "COURSE",
			secondsAdded: 45_000n,
			revenueAmount: { toNumber: () => 8_500 },
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
			revenueAmount: 8_500,
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
			secondsAdded: 4_500n,
			revenueAmount: null,
			sourceCourseId: null,
			sourceCourseName: null,
			requestId: "fa7445e8-0649-4776-89f3-2ffdd09619a4",
			createdAt: new Date("2026-08-11T03:00:00.000Z"),
		});

		expect(addition.toClassHourAdditionDTO()).toMatchObject({
			source: "custom",
			revenueAmount: null,
			sourceCourseId: null,
			sourceCourseName: null,
		});
	});

	test("preserves zero revenue distinctly from a legacy null value", () => {
		const addition = ClassHourAdditionModel.fromPrisma({
			id: "addition-3",
			classId: "class-1",
			source: "CUSTOM",
			secondsAdded: 3_600n,
			revenueAmount: 0,
			sourceCourseId: null,
			sourceCourseName: null,
			requestId: "a9f85cd7-44f7-4b43-9c11-08a0c2742965",
			createdAt: new Date("2026-08-11T03:00:00.000Z"),
		});

		expect(addition.toClassHourAdditionDTO().revenueAmount).toBe(0);
	});

	test("normalizes custom additions into exact ledger seconds before creating a draft", () => {
		const request = ClassHourAdditionModel.prepare({
			source: "custom",
			hours: 0.1 + 0.2,
			revenueAmount: 0.1 + 0.2,
			requestId: "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c",
		});

		const draft = request.toDraft();
		expect(draft.secondsAdded).toBe(1_080n);
		expect(draft.revenueAmount).toBe(0.3);
		expect(draft.sourceCourseId).toBeNull();
		expect(draft.sourceCourseName).toBeNull();

		const minimumDraft = ClassHourAdditionModel.prepare({
			source: "custom",
			hours: 0.01,
			requestId: "fa7445e8-0649-4776-89f3-2ffdd09619a4",
		}).toDraft();
		expect(minimumDraft.secondsAdded).toBe(36n);

		const maximumDraft = ClassHourAdditionModel.prepare({
			source: "custom",
			hours: MAX_CLASS_HOURS,
			requestId: "a9f85cd7-44f7-4b43-9c11-08a0c2742965",
		}).toDraft();
		expect(maximumDraft.secondsAdded).toBe(MAX_CLASS_SECONDS);
	});

	test("rejects invalid custom hours, revenue, and course snapshots", () => {
		expect(() =>
			ClassHourAdditionModel.prepare({
				source: "custom",
				hours: 0.001,
				requestId: "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c",
			}),
		).toThrow(ClassHourAdditionValidationError);
		expect(() =>
			ClassHourAdditionModel.prepare({
				source: "custom",
				hours: 1,
				revenueAmount: 0.001,
				requestId: "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c",
			}),
		).toThrow(ClassHourAdditionValidationError);

		const courseRequest = ClassHourAdditionModel.prepare({
			source: "course",
			courseId: "course-1",
			requestId: "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c",
		});
		expect(() =>
			courseRequest.toDraft({
				id: "course-2",
				name: "Mathematics",
				defaultTotalSeconds: 3_600n,
			}),
		).toThrow("Course snapshot is required for a course hour addition");
		expect(() =>
			courseRequest.toDraft({
				id: "course-1",
				name: "Mathematics",
				defaultTotalSeconds: 0n,
			}),
		).toThrow(ClassHourAdditionValidationError);
		expect(() =>
			courseRequest.toDraft({
				id: "course-1",
				name: "Mathematics",
				defaultTotalSeconds: MAX_CLASS_SECONDS + 36n,
			}),
		).toThrow(ClassHourAdditionLimitError);
	});

	test("matches custom replays by normalized seconds and keeps null revenue distinct from zero", () => {
		const request = ClassHourAdditionModel.prepare({
			source: "custom",
			hours: 0.1 + 0.2,
			requestId: "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c",
		});
		const nullRevenueRecord = {
			id: "addition-4",
			classId: "class-1",
			source: "CUSTOM" as const,
			secondsAdded: 1_080n,
			revenueAmount: null,
			sourceCourseId: null,
			sourceCourseName: null,
			requestId: "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c",
			createdAt: new Date("2026-08-11T03:00:00.000Z"),
		};
		const nullRevenueAddition =
			ClassHourAdditionModel.fromPrisma(nullRevenueRecord);
		const zeroRevenueAddition = ClassHourAdditionModel.fromPrisma({
			...nullRevenueRecord,
			revenueAmount: 0,
		});

		expect(request.matches(nullRevenueAddition)).toBe(true);
		expect(request.matches(zeroRevenueAddition)).toBe(false);
		expect(() => request.assertMatches(zeroRevenueAddition)).toThrow(
			ClassHourAdditionRequestConflictError,
		);
	});

	test("matches course replays by source course and revenue while drafting a ledger snapshot", () => {
		const request = ClassHourAdditionModel.prepare({
			source: "course",
			courseId: "course-1",
			revenueAmount: 0.1 + 0.2,
			requestId: "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c",
		});
		const existing = ClassHourAdditionModel.fromPrisma({
			id: "addition-5",
			classId: "class-1",
			source: "COURSE",
			secondsAdded: 3_600n,
			revenueAmount: 0.3,
			sourceCourseId: "course-1",
			sourceCourseName: "Original Mathematics",
			requestId: "0cfd69ef-6b4b-4a57-9f4a-c5ac83c2494c",
			createdAt: new Date("2026-08-11T03:00:00.000Z"),
		});

		expect(request.matches(existing)).toBe(true);
		expect(
			request.toDraft({
				id: "course-1",
				name: "Renamed Mathematics",
				defaultTotalSeconds: 7_200n,
			}),
		).toMatchObject({
			source: "course",
			secondsAdded: 7_200n,
			revenueAmount: 0.3,
			sourceCourseId: "course-1",
			sourceCourseName: "Renamed Mathematics",
		});
	});
});
