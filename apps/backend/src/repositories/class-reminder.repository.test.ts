import { describe, expect, test } from "bun:test";
import { prisma } from "../lib/db";
import { ClassReminderRepository } from "./class-reminder.repository";

type UpdateManyArgs = Parameters<
	typeof prisma.classReminderDelivery.updateMany
>[0];
type ScheduleFindManyArgs = Parameters<typeof prisma.schedule.findMany>[0];

describe("ClassReminderRepository lease fencing", () => {
	test("does not finalize a delivery reclaimed under a newer lease", async () => {
		const leaseExpiresAt = new Date("2026-07-01T02:02:00.000Z");
		let updateManyArgs: UpdateManyArgs | undefined;
		const delegate = prisma.classReminderDelivery as unknown as {
			updateMany: (args: UpdateManyArgs) => Promise<{ count: number }>;
		};
		const originalUpdateMany = delegate.updateMany;
		delegate.updateMany = async (args) => {
			updateManyArgs = args;
			return { count: 0 };
		};

		try {
			const result = await new ClassReminderRepository().markSent(
				"delivery-1",
				leaseExpiresAt,
				"line-request-1",
			);

			expect(result).toEqual({ count: 0 });
			expect(updateManyArgs?.where).toEqual({
				id: "delivery-1",
				status: "PROCESSING",
				leaseExpiresAt,
			});
		} finally {
			delegate.updateMany = originalUpdateMany;
		}
	});

	test("does not create reminder deliveries for a class without students", async () => {
		const schedules = prisma.schedule as unknown as {
			findMany: (args: ScheduleFindManyArgs) => Promise<unknown[]>;
		};
		const deliveries = prisma.classReminderDelivery as unknown as {
			upsert: (args: unknown) => Promise<unknown>;
		};
		const originalFindMany = schedules.findMany;
		const originalUpsert = deliveries.upsert;
		let deliveryWrites = 0;
		schedules.findMany = async () => [
			{
				id: "schedule-1",
				date: new Date("2026-08-11T00:00:00.000Z"),
				time: 540,
				durationMinutes: 60,
				class: {
					name: "Algebra",
					tutor: { lineConnection: { id: "connection-1" } },
					students: [],
				},
			},
		];
		deliveries.upsert = async () => {
			deliveryWrites += 1;
			return {};
		};

		try {
			await new ClassReminderRepository().discover(
				new Date("2026-08-11T01:00:00.000Z"),
			);
			expect(deliveryWrites).toBe(0);
		} finally {
			schedules.findMany = originalFindMany;
			deliveries.upsert = originalUpsert;
		}
	});
});
