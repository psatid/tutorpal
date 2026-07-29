import { describe, expect, test } from "bun:test";
import type { ScheduleModel } from "../models/schedule.model";
import type { IScheduleRepository } from "../types";
import { ScheduleService } from "./schedule.service";

describe("ScheduleService ownership", () => {
	test("does not expose a schedule owned by another tutor", async () => {
		const repository = {
			findById: async () => null,
		} as unknown as IScheduleRepository;

		await expect(
			new ScheduleService(repository).getScheduleById("schedule-1", "tutor-2"),
		).rejects.toMatchObject({
			errorCode: "SCHEDULE_NOT_FOUND",
			status: 404,
		});
	});

	test("does not delete a schedule owned by another tutor", async () => {
		let deleted = false;
		const repository = {
			findById: async () => null,
			delete: async () => {
				deleted = true;
			},
		} as unknown as IScheduleRepository;

		await expect(
			new ScheduleService(repository).deleteSchedule("schedule-1", "tutor-2"),
		).rejects.toMatchObject({ errorCode: "SCHEDULE_NOT_FOUND", status: 404 });
		expect(deleted).toBe(false);
	});

	test("completes only after tutor-scoped lookup succeeds", async () => {
		let completed = false;
		const schedule = { id: "schedule-1" } as ScheduleModel;
		const repository = {
			findById: async (_id: string, tutorId: string) =>
				tutorId === "tutor-1" ? schedule : null,
			completeSchedule: async () => {
				completed = true;
				return schedule;
			},
		} as unknown as IScheduleRepository;
		const service = new ScheduleService(repository);

		await expect(
			service.completeSchedule("schedule-1", "tutor-2"),
		).rejects.toMatchObject({ errorCode: "SCHEDULE_NOT_FOUND", status: 404 });
		expect(completed).toBe(false);
	});
});
