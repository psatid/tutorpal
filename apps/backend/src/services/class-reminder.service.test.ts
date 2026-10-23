import { describe, expect, test } from "bun:test";
import type { ClassReminderRepository } from "../repositories/class-reminder.repository";
import { ClassReminderService } from "./class-reminder.service";

describe("ClassReminderService", () => {
	test("cancels a claimed delivery when revalidation finds a stale enrollment or class", async () => {
		let discoveredAt: Date | undefined;
		let cancelledId: string | undefined;
		const repository = {
			discover: async (now: Date) => {
				discoveredAt = now;
			},
			claim: async () => [
				{
					id: "delivery-1",
					scheduleId: "schedule-1",
					studentId: "student-1",
					scheduledStartAt: new Date("2026-07-01T03:00:00.000Z"),
					leaseExpiresAt: new Date("2026-07-01T02:02:00.000Z"),
					retryKey: "retry-key",
					attemptCount: 1,
					recipientLineUserId: "line-user-id",
					message: "message",
					lineConnectionId: "connection-1",
				},
			],
			revalidate: async () => null,
			markCancelled: async (id: string) => {
				cancelledId = id;
			},
		} as unknown as ClassReminderRepository;
		const now = new Date("2026-07-01T02:00:00.000Z");

		await new ClassReminderService(repository).poll(now);

		expect(discoveredAt).toBe(now);
		expect(cancelledId).toBe("delivery-1");
	});

	test("cancels when the class starts between revalidation and provider send", async () => {
		let cancelledId: string | undefined;
		let sent = false;
		const startsAt = new Date("2026-07-01T02:00:01.000Z");
		const repository = {
			discover: async () => {},
			claim: async () => [
				{
					id: "delivery-1",
					scheduleId: "schedule-1",
					studentId: "student-1",
					scheduledStartAt: startsAt,
					leaseExpiresAt: new Date("2026-07-01T02:02:00.000Z"),
					retryKey: "retry-key",
					attemptCount: 1,
					recipientLineUserId: "line-user-id",
					message: "message",
					lineConnectionId: "connection-1",
				},
			],
			revalidate: async () => ({
				startsAt,
				schedule: {
					class: { tutor: { lineConnection: { id: "connection-1" } } },
				},
			}),
			markCancelled: async (id: string) => {
				cancelledId = id;
			},
			markSent: async () => {
				sent = true;
			},
		} as unknown as ClassReminderRepository;
		const clockValues = [
			new Date("2026-07-01T02:00:00.000Z"),
			new Date("2026-07-01T02:00:02.000Z"),
		];
		const clock = () => {
			const value = clockValues.shift();
			if (!value) throw new Error("Test clock exhausted");
			return value;
		};

		await new ClassReminderService(repository, clock).poll(
			new Date("2026-07-01T01:00:00.000Z"),
		);

		expect(cancelledId).toBe("delivery-1");
		expect(sent).toBe(false);
	});
});
