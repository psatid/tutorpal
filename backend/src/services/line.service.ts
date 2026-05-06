import { prisma } from "../lib/db";
import { ENV } from "../lib/env";
import { AppError } from "../lib/error";
import {
	buildLineAuthUrl,
	exchangeCodeForToken,
	getLineProfile,
	sendLinePushMessage,
} from "../lib/line";
import type { ILineRepository } from "../types";

export class LineService {
	constructor(private readonly repository: ILineRepository) {}

	async generateLinkToken(studentId: string) {
		const student = await prisma.student.findUnique({
			where: { id: studentId },
		});
		if (!student) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}
		if (student.lineUserId) {
			throw AppError.conflict(
				"LINE_ALREADY_LINKED",
				"Student already has a LINE account linked",
			);
		}

		const { token, expiresAt } = await this.repository.createToken(studentId);
		const linkUrl = `${ENV.FRONTEND_URL}/line-link?token=${token}`;

		return {
			token,
			linkUrl,
			expiresAt: expiresAt.toISOString(),
		};
	}

	async getAuthUrl(token: string) {
		const record = await this.repository.findValidToken(token);
		if (!record) {
			throw AppError.badRequest(
				"INVALID_TOKEN",
				"Link token is invalid or expired",
			);
		}

		const state = token;
		const authUrl = buildLineAuthUrl(state);
		return { authUrl };
	}

	async handleCallback(code: string, state: string) {
		const record = await this.repository.findValidToken(state);
		if (!record) {
			throw AppError.badRequest(
				"INVALID_TOKEN",
				"Link token is invalid or expired",
			);
		}

		const tokenResponse = await exchangeCodeForToken(code);
		const profile = await getLineProfile(tokenResponse.access_token);

		await this.repository.linkStudentLineUser(record.studentId, profile.userId);
		await this.repository.markTokenUsed(record.id);

		return { success: true, displayName: profile.displayName };
	}

	async sendTestMessage(studentId: string) {
		const student = await prisma.student.findUnique({
			where: { id: studentId },
		});
		if (!student) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}
		if (!student.lineUserId) {
			throw AppError.badRequest(
				"LINE_NOT_LINKED",
				"Student does not have a LINE account linked",
			);
		}

		await sendLinePushMessage(student.lineUserId, [
			{
				type: "text",
				text: `Hello ${student.name}! This is a test message from TutorPal. Your LINE account is successfully linked.`,
			},
		]);

		return { sent: true };
	}
}
