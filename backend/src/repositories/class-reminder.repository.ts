import type { PrismaClient } from "@prisma/client";
import { DateTime } from "../lib/date-time";
import { prisma as defaultPrisma } from "../lib/db";

export type ClaimedReminder = {
	id: string;
	scheduleId: string;
	studentId: string;
	scheduledStartAt: Date;
	leaseExpiresAt: Date;
	retryKey: string;
	attemptCount: number;
	recipientLineUserId: string;
	message: string;
	lineConnectionId: string;
};

export class ClassReminderRepository {
	constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

	async discover(now: Date): Promise<void> {
		const windowEnd = new Date(now.getTime() + 60 * 60 * 1000);
		const dates = [
			DateTime.from(now).toBangkokDateAndMinutes().date,
			DateTime.from(windowEnd).toBangkokDateAndMinutes().date,
		];
		const schedules = await this.prisma.schedule.findMany({
			where: {
				status: "SCHEDULED",
				date: {
					in: dates.map((date) => DateTime.fromDateOnlyString(date).toDate()),
				},
			},
			include: {
				class: {
					include: {
						tutor: { include: { lineConnection: true } },
						students: { include: { student: true } },
					},
				},
			},
		});
		for (const schedule of schedules) {
			const startsAt = this.scheduleStartsAt(schedule.date, schedule.time);
			if (
				startsAt <= now ||
				startsAt > windowEnd ||
				!schedule.class.tutor.lineConnection
			)
				continue;
			const connection = schedule.class.tutor.lineConnection;
			for (const enrollment of schedule.class.students) {
				const student = enrollment.student;
				if (!student.lineUserId || student.lineConnectionId !== connection.id)
					continue;
				const end = new Date(
					startsAt.getTime() + schedule.durationMinutes * 60_000,
				);
				const message = `Class reminder\n\nHi ${student.name}, your ${schedule.class.name} class starts in 1 hour.\n\nDate: ${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok", dateStyle: "medium" }).format(startsAt)}\nTime: ${new Intl.DateTimeFormat("en", { timeZone: "Asia/Bangkok", timeStyle: "short" }).format(startsAt)}–${new Intl.DateTimeFormat("en", { timeZone: "Asia/Bangkok", timeStyle: "short" }).format(end)}\nTime zone: Asia/Bangkok`;
				await this.prisma.classReminderDelivery.upsert({
					where: {
						scheduleId_studentId_scheduledStartAt: {
							scheduleId: schedule.id,
							studentId: student.id,
							scheduledStartAt: startsAt,
						},
					},
					create: {
						scheduleId: schedule.id,
						studentId: student.id,
						scheduledStartAt: startsAt,
						dueAt: new Date(startsAt.getTime() - 60 * 60 * 1000),
						retryKey: crypto.randomUUID(),
						recipientLineUserId: student.lineUserId,
						lineConnectionId: connection.id,
						message,
					},
					update: {},
				});
			}
		}
	}

	private scheduleStartsAt(date: Date, time: number): Date {
		return DateTime.fromBangkokDateAndMinutes(
			DateTime.from(date).toDateOnlyString(),
			time,
		).toDate();
	}

	async claim(now: Date, limit = 50): Promise<ClaimedReminder[]> {
		const leaseExpiresAt = new Date(now.getTime() + 120_000);
		return this.prisma.$queryRaw<ClaimedReminder[]>`
			WITH candidates AS (
				SELECT id FROM class_reminder_deliveries
				WHERE (status = 'PENDING' AND (("dueAt" <= ${now} AND "nextAttemptAt" IS NULL) OR "nextAttemptAt" <= ${now}))
					OR (status = 'PROCESSING' AND "leaseExpiresAt" <= ${now})
				ORDER BY "dueAt" ASC
				LIMIT ${limit}
				FOR UPDATE SKIP LOCKED
			)
			UPDATE class_reminder_deliveries AS delivery
			SET status = 'PROCESSING', "leaseExpiresAt" = ${leaseExpiresAt}, "attemptCount" = delivery."attemptCount" + 1, "updatedAt" = CURRENT_TIMESTAMP
			FROM candidates
			WHERE delivery.id = candidates.id
			RETURNING delivery.id, delivery."scheduleId", delivery."studentId", delivery."scheduledStartAt", delivery."leaseExpiresAt", delivery."retryKey", delivery."attemptCount", delivery."recipientLineUserId", delivery.message, delivery."lineConnectionId"
		`;
	}

	async revalidate(delivery: ClaimedReminder, now: Date) {
		const current = await this.prisma.classReminderDelivery.findFirst({
			where: {
				id: delivery.id,
				status: "PROCESSING",
				leaseExpiresAt: delivery.leaseExpiresAt,
				schedule: {
					status: "SCHEDULED",
					class: {
						students: { some: { studentId: delivery.studentId } },
						tutor: { lineConnection: { id: delivery.lineConnectionId } },
					},
				},
				student: {
					lineUserId: delivery.recipientLineUserId,
					lineConnectionId: delivery.lineConnectionId,
				},
			},
			include: {
				schedule: {
					include: {
						class: {
							include: { tutor: { include: { lineConnection: true } } },
						},
					},
				},
			},
		});
		if (!current) return null;
		const startsAt = this.scheduleStartsAt(
			current.schedule.date,
			current.schedule.time,
		);
		return startsAt.getTime() === delivery.scheduledStartAt.getTime() &&
			startsAt > now
			? { ...current, startsAt }
			: null;
	}

	async markSent(id: string, leaseExpiresAt: Date, providerRequestId?: string) {
		return this.prisma.classReminderDelivery.updateMany({
			where: { id, status: "PROCESSING", leaseExpiresAt },
			data: {
				status: "SENT",
				sentAt: new Date(),
				leaseExpiresAt: null,
				providerRequestId,
			},
		});
	}
	async markCancelled(id: string, leaseExpiresAt: Date) {
		return this.prisma.classReminderDelivery.updateMany({
			where: { id, status: "PROCESSING", leaseExpiresAt },
			data: { status: "CANCELLED", leaseExpiresAt: null },
		});
	}
	async markFailure(
		id: string,
		leaseExpiresAt: Date,
		retry: boolean,
		nextAttemptAt: Date | null,
		code: string,
		providerRequestId?: string,
	) {
		return this.prisma.classReminderDelivery.updateMany({
			where: { id, status: "PROCESSING", leaseExpiresAt },
			data: {
				status: retry ? "PENDING" : "FAILED",
				nextAttemptAt,
				leaseExpiresAt: null,
				lastErrorCode: code,
				providerRequestId,
			},
		});
	}
}

export const classReminderRepository = new ClassReminderRepository();
