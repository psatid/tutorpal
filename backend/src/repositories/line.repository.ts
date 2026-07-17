import { v4 as uuidv4 } from "uuid";
import { DateTime } from "../lib/date-time";
import { prisma } from "../lib/db";
import type { ILineRepository } from "../types";

export class LineRepository implements ILineRepository {
	async createToken(
		studentId: string,
	): Promise<{ token: string; expiresAt: Date }> {
		const token = uuidv4();
		const expiresAt = DateTime.now().addHours(24).toDate();

		await prisma.lineLinkToken.create({
			data: { studentId, token, expiresAt },
		});

		return { token, expiresAt };
	}

	async findValidToken(token: string) {
		const record = await prisma.lineLinkToken.findUnique({
			where: { token },
		});
		if (!record) return null;
		if (record.usedAt) return null;
		if (DateTime.from(record.expiresAt).isBefore(DateTime.now())) return null;
		return record;
	}

	async markTokenUsed(tokenId: string): Promise<void> {
		await prisma.lineLinkToken.update({
			where: { id: tokenId },
			data: { usedAt: DateTime.now().toDate() },
		});
	}
}

export const lineRepository = new LineRepository();
