import type { PrismaClient } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { DateTime } from "../lib/date-time";
import { prisma as defaultPrisma } from "../lib/db";
import type { ILineRepository, StoredLineConnection } from "../types";

export class LineRepository implements ILineRepository {
	constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

	async createToken(
		studentId: string,
		connectionId: string,
	): Promise<{ token: string; expiresAt: Date }> {
		const token = uuidv4();
		const expiresAt = DateTime.now().addHours(24).toDate();

		await this.prisma.lineLinkToken.create({
			data: { studentId, connectionId, token, expiresAt },
		});

		return { token, expiresAt };
	}

	async findValidToken(token: string) {
		const record = await this.prisma.lineLinkToken.findUnique({
			where: { token },
		});
		if (!record) return null;
		if (record.usedAt) return null;
		if (DateTime.from(record.expiresAt).isBefore(DateTime.now())) return null;
		return record;
	}

	async markTokenUsed(tokenId: string): Promise<void> {
		await this.prisma.lineLinkToken.update({
			where: { id: tokenId },
			data: { usedAt: DateTime.now().toDate() },
		});
	}

	async findConnectionByTutorId(
		tutorId: string,
	): Promise<StoredLineConnection | null> {
		return this.prisma.tutorLineConnection.findUnique({ where: { tutorId } });
	}

	async findConnectionById(id: string): Promise<StoredLineConnection | null> {
		return this.prisma.tutorLineConnection.findUnique({ where: { id } });
	}

	async upsertConnection(
		data: Omit<StoredLineConnection, "id" | "lastVerifiedAt">,
	): Promise<StoredLineConnection> {
		return this.prisma.tutorLineConnection.upsert({
			where: { tutorId: data.tutorId },
			create: data,
			update: {
				messagingAccessTokenEncrypted: data.messagingAccessTokenEncrypted,
				loginChannelId: data.loginChannelId,
				loginChannelSecretEncrypted: data.loginChannelSecretEncrypted,
				accountName: data.accountName,
				accountBasicId: data.accountBasicId,
				botUserId: data.botUserId,
				testRecipientLineUserId: data.testRecipientLineUserId,
				lastVerifiedAt: DateTime.now().toDate(),
			},
		});
	}

	async createTestRecipientToken(
		connectionId: string,
	): Promise<{ token: string; expiresAt: Date }> {
		const token = uuidv4();
		const expiresAt = DateTime.now().addHours(1).toDate();
		await this.prisma.lineTestRecipientToken.create({
			data: { connectionId, token, expiresAt },
		});
		return { token, expiresAt };
	}

	async findValidTestRecipientToken(token: string) {
		const record = await this.prisma.lineTestRecipientToken.findUnique({
			where: { token },
		});
		if (
			!record ||
			record.usedAt ||
			DateTime.from(record.expiresAt).isBefore(DateTime.now())
		) {
			return null;
		}
		return record;
	}

	async markTestRecipientTokenUsed(tokenId: string): Promise<void> {
		await this.prisma.lineTestRecipientToken.update({
			where: { id: tokenId },
			data: { usedAt: DateTime.now().toDate() },
		});
	}

	async setTestRecipient(
		connectionId: string,
		lineUserId: string,
	): Promise<void> {
		await this.prisma.tutorLineConnection.update({
			where: { id: connectionId },
			data: { testRecipientLineUserId: lineUserId },
		});
	}
}

export const lineRepository = new LineRepository();
