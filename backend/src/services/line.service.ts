import { DateTime } from "../lib/date-time";
import { AppError } from "../lib/error";
import {
	createLineClient,
	type LineBotInfo,
	type LineClient,
} from "../lib/line";
import {
	createLineCredentialCipher,
	type LineCredentialCipher,
} from "../lib/line-credentials";
import { getLocalAppConfig } from "../lib/local-config";
import type {
	ILineRepository,
	IStudentRepository,
	SaveLineConnectionDTO,
	StoredLineConnection,
} from "../types";

export type LineServiceRuntimeDependencies = {
	frontendUrl: string;
	lineClient: LineClient;
	credentialCipher: LineCredentialCipher;
};

function createLocalLineServiceRuntimeDependencies(): LineServiceRuntimeDependencies {
	const config = getLocalAppConfig();

	return {
		frontendUrl: config.FRONTEND_URL,
		lineClient: createLineClient(config),
		credentialCipher: createLineCredentialCipher(
			config.LINE_CREDENTIALS_ENCRYPTION_KEY,
		),
	};
}

export class LineService {
	private runtimeDependencies: LineServiceRuntimeDependencies | undefined;

	constructor(
		private readonly repository: ILineRepository,
		private readonly studentRepository: IStudentRepository,
		runtimeDependencies?: LineServiceRuntimeDependencies,
	) {
		this.runtimeDependencies = runtimeDependencies;
	}

	private getRuntimeDependencies() {
		this.runtimeDependencies ??= createLocalLineServiceRuntimeDependencies();
		return this.runtimeDependencies;
	}

	private credentials(connection: StoredLineConnection) {
		const { credentialCipher } = this.getRuntimeDependencies();

		return {
			messagingAccessToken: credentialCipher.decrypt(
				connection.messagingAccessTokenEncrypted,
			),
			login: {
				channelId: connection.loginChannelId,
				channelSecret: credentialCipher.decrypt(
					connection.loginChannelSecretEncrypted,
				),
			},
		};
	}

	async getConnectionStatus(tutorId: string) {
		const connection = await this.repository.findConnectionByTutorId(tutorId);
		if (!connection) {
			return { configured: false, testRecipientConnected: false };
		}
		return {
			configured: true,
			accountName: connection.accountName,
			accountBasicId: connection.accountBasicId,
			lastVerifiedAt: DateTime.from(connection.lastVerifiedAt).toISOString(),
			testRecipientConnected: Boolean(connection.testRecipientLineUserId),
		};
	}

	async saveConnection(tutorId: string, input: SaveLineConnectionDTO) {
		let bot: LineBotInfo;
		try {
			bot = await this.getRuntimeDependencies().lineClient.getLineBotInfo(
				input.messagingAccessToken,
			);
		} catch {
			throw AppError.badRequest(
				"LINE_CREDENTIALS_INVALID",
				"We couldn't verify that channel access token. Check it and try again.",
			);
		}

		const existing = await this.repository.findConnectionByTutorId(tutorId);
		if (existing && existing.botUserId !== bot.userId) {
			await this.studentRepository.invalidateLineLinks(tutorId, existing.id);
		}

		const { credentialCipher } = this.getRuntimeDependencies();
		const connection = await this.repository.upsertConnection({
			tutorId,
			messagingAccessTokenEncrypted: credentialCipher.encrypt(
				input.messagingAccessToken,
			),
			loginChannelId: input.loginChannelId,
			loginChannelSecretEncrypted: credentialCipher.encrypt(
				input.loginChannelSecret,
			),
			accountName: bot.displayName,
			accountBasicId: bot.basicId,
			botUserId: bot.userId,
			testRecipientLineUserId:
				existing?.botUserId === bot.userId
					? existing.testRecipientLineUserId
					: null,
		});

		return {
			configured: true,
			accountName: connection.accountName,
			accountBasicId: connection.accountBasicId,
			lastVerifiedAt: DateTime.from(connection.lastVerifiedAt).toISOString(),
			testRecipientConnected: Boolean(connection.testRecipientLineUserId),
		};
	}

	async generateLinkToken(studentId: string, tutorId: string) {
		const connection = await this.repository.findConnectionByTutorId(tutorId);
		if (!connection) {
			throw AppError.badRequest(
				"LINE_CONNECTION_REQUIRED",
				"Connect your LINE Official Account in Settings before linking a student.",
			);
		}
		const student = await this.studentRepository.findById(studentId, tutorId);
		if (!student) {
			throw AppError.notFound("STUDENT_NOT_FOUND", "Student not found");
		}
		if (student.lineConnectionId === connection.id && student.isLineLinked()) {
			throw AppError.conflict(
				"LINE_ALREADY_LINKED",
				"Student already has a LINE account linked",
			);
		}

		const { token, expiresAt } = await this.repository.createToken(
			studentId,
			connection.id,
		);
		const linkUrl = `${this.getRuntimeDependencies().frontendUrl}/line-link?token=${token}`;

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

		const connection = await this.repository.findConnectionById(
			record.connectionId,
		);
		if (!connection) {
			throw AppError.badRequest(
				"LINE_CONNECTION_REQUIRED",
				"This LINE connection is no longer available.",
			);
		}
		const authUrl = this.getRuntimeDependencies().lineClient.buildLineAuthUrl(
			token,
			connection.loginChannelId,
		);
		return { authUrl };
	}

	async handleCallback(code: string, state: string) {
		const record = await this.repository.findValidToken(state);
		if (!record) {
			await this.handleTestRecipientCallback(code, state);
			return { kind: "test-recipient" as const };
		}

		const connection = await this.repository.findConnectionById(
			record.connectionId,
		);
		if (!connection) {
			throw AppError.badRequest(
				"LINE_CONNECTION_REQUIRED",
				"This LINE connection is no longer available.",
			);
		}
		const credentials = this.credentials(connection);
		const { lineClient } = this.getRuntimeDependencies();
		const tokenResponse = await lineClient.exchangeCodeForToken(
			code,
			credentials.login,
		);
		const profile = await lineClient.getLineProfile(tokenResponse.access_token);

		await this.studentRepository.linkLineUser(
			record.studentId,
			profile.userId,
			connection.id,
		);
		await this.repository.markTokenUsed(record.id);

		const student = await this.studentRepository.findByIdForLineLink(
			record.studentId,
		);

		if (student && profile.userId) {
			try {
				await lineClient.sendLinePushMessage(
					profile.userId,
					[
						{
							type: "text",
							text: `Hello ${student.name}! Your LINE account has been successfully linked to TutorPal.`,
						},
					],
					credentials.messagingAccessToken,
				);
			} catch (error) {
				console.error("Failed to send welcome message:", error);
			}
		}

		return {
			kind: "student" as const,
			success: true,
			displayName: profile.displayName,
		};
	}

	async sendTestMessage(studentId: string, tutorId: string) {
		const connection = await this.repository.findConnectionByTutorId(tutorId);
		if (!connection) {
			throw AppError.badRequest(
				"LINE_CONNECTION_REQUIRED",
				"Connect your LINE Official Account in Settings first.",
			);
		}
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
		if (student.lineConnectionId !== connection.id) {
			throw AppError.badRequest(
				"LINE_RELINK_REQUIRED",
				"This student needs to reconnect their LINE account to your current Official Account.",
			);
		}
		const lineUserId = student.lineUserId;
		if (!lineUserId) {
			throw AppError.badRequest(
				"LINE_NOT_LINKED",
				"Student does not have a LINE account linked",
			);
		}

		const credentials = this.credentials(connection);
		await this.getRuntimeDependencies().lineClient.sendLinePushMessage(
			lineUserId,
			[
				{
					type: "text",
					text: `Hello ${student.name}! This is a test message from TutorPal. Your LINE account is successfully linked.`,
				},
			],
			credentials.messagingAccessToken,
		);

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

	async startTestRecipientAuthorization(tutorId: string) {
		const connection = await this.repository.findConnectionByTutorId(tutorId);
		if (!connection) {
			throw AppError.badRequest(
				"LINE_CONNECTION_REQUIRED",
				"Save your LINE connection before adding a test account.",
			);
		}
		const { token } = await this.repository.createTestRecipientToken(
			connection.id,
		);
		return {
			authUrl: this.getRuntimeDependencies().lineClient.buildLineAuthUrl(
				token,
				connection.loginChannelId,
			),
		};
	}

	async handleTestRecipientCallback(code: string, state: string) {
		const record = await this.repository.findValidTestRecipientToken(state);
		if (!record) {
			throw AppError.badRequest(
				"INVALID_TOKEN",
				"This test account link is invalid or expired.",
			);
		}
		const connection = await this.repository.findConnectionById(
			record.connectionId,
		);
		if (!connection) {
			throw AppError.badRequest(
				"LINE_CONNECTION_REQUIRED",
				"This LINE connection is no longer available.",
			);
		}
		const credentials = this.credentials(connection);
		const { lineClient } = this.getRuntimeDependencies();
		const tokenResponse = await lineClient.exchangeCodeForToken(
			code,
			credentials.login,
		);
		const profile = await lineClient.getLineProfile(tokenResponse.access_token);
		try {
			await lineClient.validateLineRecipient(
				profile.userId,
				credentials.messagingAccessToken,
			);
		} catch {
			throw AppError.badRequest(
				"LINE_TEST_ACCOUNT_NOT_FRIEND",
				"Add your LINE Official Account as a friend, then try connecting your test account again.",
			);
		}
		await this.repository.setTestRecipient(connection.id, profile.userId);
		await this.repository.markTestRecipientTokenUsed(record.id);
		return { success: true };
	}

	async sendConnectionTestMessage(tutorId: string) {
		const connection = await this.repository.findConnectionByTutorId(tutorId);
		if (!connection?.testRecipientLineUserId) {
			throw AppError.badRequest(
				"LINE_TEST_RECIPIENT_REQUIRED",
				"Connect your personal LINE account before sending a test message.",
			);
		}
		const credentials = this.credentials(connection);
		await this.getRuntimeDependencies().lineClient.sendLinePushMessage(
			connection.testRecipientLineUserId,
			[
				{
					type: "text",
					text: "TutorPal is connected to your LINE Official Account.",
				},
			],
			credentials.messagingAccessToken,
		);
		return { sent: true };
	}
}
