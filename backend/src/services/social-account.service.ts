import type { AppConfig } from "../lib/app-config";
import { DateTime } from "../lib/date-time";
import { AppError } from "../lib/error";
import { getLineEnrollmentIdentifier } from "../repositories/social-account.repository";
import type { EligibleTutorUser, ISocialAccountRepository } from "../types";

const LINE_AUTHORIZATION_ENDPOINT =
	"https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_ENDPOINT = "https://api.line.me/oauth2/v2.1/token";
const LINE_VERIFY_ID_TOKEN_ENDPOINT = "https://api.line.me/oauth2/v2.1/verify";
const LINE_ID_TOKEN_ISSUER = "https://access.line.me";
const LINE_ENROLLMENT_STATE_TTL_MINUTES = 10;
const MAX_CALLBACK_VALUE_LENGTH = 8_192;

type LineEnrollmentState = {
	userId: string;
	codeVerifier: string;
	nonce: string;
};

type LineIdTokenClaims = {
	sub: string;
	email: string;
};

function toBase64Url(bytes: Uint8Array) {
	let binary = "";
	for (const byte of bytes) {
		binary += String.fromCharCode(byte);
	}
	return btoa(binary)
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "");
}

function createRandomValue() {
	return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

async function createPkceChallenge(codeVerifier: string) {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(codeVerifier),
	);
	return toBase64Url(new Uint8Array(digest));
}

function isEligibleTutor(
	user: EligibleTutorUser | null,
): user is EligibleTutorUser {
	return user?.role === "user" && user.banned !== true && user.tutor !== null;
}

function normalizeEmail(email: string) {
	return email.trim().toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEnrollmentState(value: string): LineEnrollmentState | null {
	try {
		const parsed = JSON.parse(value) as unknown;
		if (
			!isRecord(parsed) ||
			typeof parsed.userId !== "string" ||
			typeof parsed.codeVerifier !== "string" ||
			typeof parsed.nonce !== "string" ||
			parsed.userId.length === 0 ||
			parsed.codeVerifier.length < 43 ||
			parsed.nonce.length < 43
		) {
			return null;
		}
		return parsed as LineEnrollmentState;
	} catch {
		return null;
	}
}

function invalidLineEnrollment() {
	return AppError.badRequest(
		"LINE_ENROLLMENT_INVALID",
		"LINE account enrollment could not be completed.",
	);
}

export class SocialAccountService {
	constructor(
		private readonly repository: ISocialAccountRepository,
		private readonly config: AppConfig,
	) {}

	private get callbackUrl() {
		return new URL(
			"/v1/auth/social-accounts/line/callback",
			this.config.BETTER_AUTH_URL,
		).toString();
	}

	async startLineEnrollment(input: {
		userId: string;
		impersonatedBy: unknown;
	}) {
		if (!this.config.SOCIAL_LOGIN.line) {
			throw AppError.notFound(
				"LINE_SOCIAL_LOGIN_UNAVAILABLE",
				"LINE sign-in is not configured.",
			);
		}
		if (input.impersonatedBy !== null && input.impersonatedBy !== undefined) {
			throw AppError.forbidden(
				"IMPERSONATION_NOT_ALLOWED",
				"LINE account enrollment is unavailable while impersonating.",
			);
		}

		const user = await this.repository.findEligibleTutorUser(input.userId);
		if (!isEligibleTutor(user)) {
			throw AppError.forbidden(
				"SOCIAL_ACCOUNT_ENROLLMENT_FORBIDDEN",
				"LINE account enrollment is available to active tutors only.",
			);
		}

		const state = createRandomValue();
		const codeVerifier = createRandomValue();
		const nonce = createRandomValue();
		const codeChallenge = await createPkceChallenge(codeVerifier);

		await this.repository.createLineEnrollmentState({
			state,
			identifier: getLineEnrollmentIdentifier(user.id),
			value: JSON.stringify({ userId: user.id, codeVerifier, nonce }),
			expiresAt: DateTime.now()
				.addMinutes(LINE_ENROLLMENT_STATE_TTL_MINUTES)
				.toDate(),
		});

		const authorizationUrl = new URL(LINE_AUTHORIZATION_ENDPOINT);
		authorizationUrl.search = new URLSearchParams({
			response_type: "code",
			client_id: this.config.LINE_LOGIN_CHANNEL_ID,
			redirect_uri: this.callbackUrl,
			scope: "openid profile email",
			state,
			code_challenge: codeChallenge,
			code_challenge_method: "S256",
			nonce,
		}).toString();

		return { authorizationUrl: authorizationUrl.toString() };
	}

	async completeLineEnrollment(input: { code?: string; state?: string }) {
		if (
			typeof input.code !== "string" ||
			typeof input.state !== "string" ||
			input.code.length === 0 ||
			input.state.length === 0 ||
			input.code.length > MAX_CALLBACK_VALUE_LENGTH ||
			input.state.length > MAX_CALLBACK_VALUE_LENGTH
		) {
			throw invalidLineEnrollment();
		}

		const storedState = await this.repository.consumeLineEnrollmentState(
			input.state,
		);
		const enrollmentState = storedState
			? parseEnrollmentState(storedState.value)
			: null;
		if (
			!storedState ||
			!enrollmentState ||
			storedState.identifier !==
				getLineEnrollmentIdentifier(enrollmentState.userId)
		) {
			throw invalidLineEnrollment();
		}

		const tokenResponse = await this.exchangeLineAuthorizationCode(
			input.code,
			enrollmentState.codeVerifier,
		);
		const lineIdentity = await this.verifyLineIdToken(
			tokenResponse.idToken,
			enrollmentState.nonce,
		);

		const user = await this.repository.findEligibleTutorUser(
			enrollmentState.userId,
		);
		if (
			!isEligibleTutor(user) ||
			normalizeEmail(user.email) === "" ||
			normalizeEmail(user.email) !== normalizeEmail(lineIdentity.email)
		) {
			throw invalidLineEnrollment();
		}

		const accountResult = await this.repository.createLineAccount(
			user.id,
			lineIdentity.sub,
		);
		if (accountResult === "linked-to-another-user") {
			throw AppError.conflict(
				"LINE_SOCIAL_ACCOUNT_CONFLICT",
				"This LINE account is already linked to another TutorPal account.",
			);
		}
	}

	private async exchangeLineAuthorizationCode(
		code: string,
		codeVerifier: string,
	) {
		let response: Response;
		try {
			response = await fetch(LINE_TOKEN_ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					grant_type: "authorization_code",
					code,
					redirect_uri: this.callbackUrl,
					client_id: this.config.LINE_LOGIN_CHANNEL_ID,
					client_secret: this.config.LINE_LOGIN_CHANNEL_SECRET,
					code_verifier: codeVerifier,
				}),
				signal: AbortSignal.timeout(10_000),
			});
		} catch {
			throw AppError.badGateway(
				"LINE_AUTHORIZATION_UNAVAILABLE",
				"LINE account enrollment is temporarily unavailable.",
			);
		}
		if (!response.ok) {
			throw invalidLineEnrollment();
		}

		let body: unknown;
		try {
			body = await response.json();
		} catch {
			throw invalidLineEnrollment();
		}
		if (!isRecord(body) || typeof body.id_token !== "string") {
			throw invalidLineEnrollment();
		}
		return { idToken: body.id_token };
	}

	private async verifyLineIdToken(
		idToken: string,
		expectedNonce: string,
	): Promise<LineIdTokenClaims> {
		let response: Response;
		try {
			response = await fetch(LINE_VERIFY_ID_TOKEN_ENDPOINT, {
				method: "POST",
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: new URLSearchParams({
					id_token: idToken,
					client_id: this.config.LINE_LOGIN_CHANNEL_ID,
					nonce: expectedNonce,
				}),
				signal: AbortSignal.timeout(10_000),
			});
		} catch {
			throw AppError.badGateway(
				"LINE_AUTHORIZATION_UNAVAILABLE",
				"LINE account enrollment is temporarily unavailable.",
			);
		}
		if (!response.ok) {
			throw invalidLineEnrollment();
		}

		let claims: unknown;
		try {
			claims = await response.json();
		} catch {
			throw invalidLineEnrollment();
		}
		if (
			!isRecord(claims) ||
			claims.iss !== LINE_ID_TOKEN_ISSUER ||
			claims.aud !== this.config.LINE_LOGIN_CHANNEL_ID ||
			claims.nonce !== expectedNonce ||
			typeof claims.exp !== "number" ||
			!Number.isSafeInteger(claims.exp) ||
			claims.exp <= Math.floor(DateTime.now().toDate().getTime() / 1_000) ||
			typeof claims.sub !== "string" ||
			claims.sub.trim() === "" ||
			typeof claims.email !== "string" ||
			claims.email.trim() === ""
		) {
			throw invalidLineEnrollment();
		}

		return { sub: claims.sub.trim(), email: claims.email.trim() };
	}
}
