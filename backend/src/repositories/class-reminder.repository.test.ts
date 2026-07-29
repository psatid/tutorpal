import { describe, expect, test } from "bun:test";
import { prisma } from "../lib/db";
import { ClassReminderRepository } from "./class-reminder.repository";

type UpdateManyArgs = Parameters<
	typeof prisma.classReminderDelivery.updateMany
>[0];

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
});
