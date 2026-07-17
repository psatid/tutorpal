import { DateTime } from "../lib/date-time";
import { ENV } from "../lib/env";
import { AppError } from "../lib/error";
import {
	buildLineAuthUrl,
	exchangeCodeForToken,
	getLineProfile,
	sendLinePushMessage,
} from "../lib/line";
import type { ILineRepository, IStudentRepository } from "../types";

export class LineService {
	constructor(
		private readonly repository: ILineRepository,
		private readonly studentRepository: IStudentRepository,
	) {}

	async generateLinkToken(studentId: string, tutorId: string) {
		const student = await this.studentRepository.findById(studentId, tutorId);
		if (!student) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}
		if (student.isLineLinked()) {
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
			expiresAt: DateTime.from(expiresAt).toISOString(),
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

		await this.studentRepository.linkLineUser(record.studentId, profile.userId);
		await this.repository.markTokenUsed(record.id);

		const student = await this.studentRepository.findByIdForLineLink(
			record.studentId,
		);

		if (student && profile.userId) {
			try {
				await sendLinePushMessage(profile.userId, [
					{
						type: "text",
						text: `Hello ${student.name}! Your LINE account has been successfully linked to TutorPal.`,
					},
				]);
			} catch (error) {
				console.error("Failed to send welcome message:", error);
			}
		}

		return { success: true, displayName: profile.displayName };
	}

	async sendTestMessage(studentId: string, tutorId: string) {
		const student = await this.studentRepository.findById(studentId, tutorId);
		if (!student) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}
		if (!student.isLineLinked()) {
			throw AppError.badRequest(
				"LINE_NOT_LINKED",
				"Student does not have a LINE account linked",
			);
		}
		const lineUserId = student.lineUserId;
		if (!lineUserId) {
			throw AppError.badRequest(
				"LINE_NOT_LINKED",
				"Student does not have a LINE account linked",
			);
		}

		await sendLinePushMessage(lineUserId, [
			{
				type: "text",
				text: `Hello ${student.name}! This is a test message from TutorPal. Your LINE account is successfully linked.`,
			},
		]);

		return { sent: true };
	}

	async unlinkStudent(studentId: string, tutorId: string) {
		const student = await this.studentRepository.findById(studentId, tutorId);
		if (!student) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}
		if (!student.isLineLinked()) {
			throw AppError.badRequest(
				"LINE_NOT_LINKED",
				"Student does not have a LINE account linked",
			);
		}

		await this.studentRepository.unlinkLineUser(studentId);

		return { unlinked: true };
	}
}
