import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/db";
import type { ILineRepository } from "../types";

export class LineRepository implements ILineRepository {
	async createToken(
		studentId: string,
	): Promise<{ token: string; expiresAt: Date }> {
		const token = uuidv4();
		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

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
		if (record.expiresAt < new Date()) return null;
		return record;
	}

	async markTokenUsed(tokenId: string): Promise<void> {
		await prisma.lineLinkToken.update({
			where: { id: tokenId },
			data: { usedAt: new Date() },
		});
	}

	async linkStudentLineUser(
		studentId: string,
		lineUserId: string,
	): Promise<void> {
		await prisma.student.update({
			where: { id: studentId },
			data: { lineUserId },
		});
	}

	async unlinkStudentLineUser(studentId: string): Promise<void> {
		await prisma.student.update({
			where: { id: studentId },
			data: { lineUserId: null },
		});
	}
}

export const lineRepository = new LineRepository();
