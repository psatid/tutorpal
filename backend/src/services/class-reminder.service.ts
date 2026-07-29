import { LinePushError, sendLinePushMessage } from "../lib/line";
import { decryptLineCredential } from "../lib/line-credentials";
import {
	type ClassReminderRepository,
	classReminderRepository,
} from "../repositories/class-reminder.repository";

const RETRY_MINUTES = [1, 2, 4, 8];

export class ClassReminderService {
	constructor(
		private readonly repository: ClassReminderRepository = classReminderRepository,
		private readonly clock: () => Date = () => new Date(),
	) {}

	async poll(now = new Date()) {
		await this.repository.discover(now);
		const deliveries = await this.repository.claim(now, 50);
		for (let offset = 0; offset < deliveries.length; offset += 5) {
			await Promise.all(
				deliveries
					.slice(offset, offset + 5)
					.map((delivery) => this.send(delivery)),
			);
		}
	}

	private async send(
		delivery: Awaited<ReturnType<ClassReminderRepository["claim"]>>[number],
	) {
		const revalidationNow = this.clock();
		const current = await this.repository.revalidate(delivery, revalidationNow);
		if (!current?.schedule.class.tutor.lineConnection) {
			await this.repository.markCancelled(delivery.id, delivery.leaseExpiresAt);
			return;
		}
		const sendNow = this.clock();
		if (current.startsAt <= sendNow || delivery.scheduledStartAt <= sendNow) {
			await this.repository.markCancelled(delivery.id, delivery.leaseExpiresAt);
			return;
		}
		try {
			const providerRequestId = await sendLinePushMessage(
				delivery.recipientLineUserId,
				[{ type: "text", text: delivery.message }],
				decryptLineCredential(
					current.schedule.class.tutor.lineConnection
						.messagingAccessTokenEncrypted,
				),
				delivery.retryKey,
			);
			await this.repository.markSent(
				delivery.id,
				delivery.leaseExpiresAt,
				providerRequestId,
			);
		} catch (error) {
			const failedAt = this.clock();
			const attempt = delivery.attemptCount;
			const retry = Boolean(
				error instanceof LinePushError &&
					(error.kind === "timeout" ||
						error.kind === "network" ||
						error.kind === "server") &&
					attempt <= RETRY_MINUTES.length &&
					current.startsAt > failedAt &&
					delivery.scheduledStartAt > failedAt,
			);
			const delay = RETRY_MINUTES[attempt - 1];
			await this.repository.markFailure(
				delivery.id,
				delivery.leaseExpiresAt,
				retry,
				retry && delay ? new Date(failedAt.getTime() + delay * 60_000) : null,
				error instanceof LinePushError ? error.kind : "unknown",
				error instanceof LinePushError ? error.providerRequestId : undefined,
			);
		}
	}
}
