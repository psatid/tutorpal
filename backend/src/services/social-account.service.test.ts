import { describe, expect, test } from "bun:test";
import { createAppConfig } from "../lib/app-config";
import type { AppError } from "../lib/error";
import { getLineEnrollmentIdentifier } from "../repositories/social-account.repository";
import type {
	EligibleTutorUser,
	ISocialAccountRepository,
	StoredLineEnrollmentState,
} from "../types";
import { SocialAccountService } from "./social-account.service";

const user: EligibleTutorUser = {
	id: "user-1",
	email: "tutor@example.com",
	role: "user",
	banned: false,
	tutor: { id: "tutor-1" },
};

function createRepository(overrides: Partial<ISocialAccountRepository> = {}) {
	return {
		findEligibleTutorUser: async () => user,
		createLineEnrollmentState: async () => {},
		consumeLineEnrollmentState: async () => null,
		createLineAccount: async () => "created" as const,
		...overrides,
	} satisfies ISocialAccountRepository;
}

function createService(
	repository: ISocialAccountRepository,
	credentials: Record<string, string> = {},
) {
	return new SocialAccountService(
		repository,
		createAppConfig({
			BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
			BETTER_AUTH_URL: "https://api.example.com/api/auth",
			LINE_LOGIN_CHANNEL_ID: "line-channel-id",
			LINE_LOGIN_CHANNEL_SECRET: "line-channel-secret",
			LOG_LEVEL: "silent",
			...credentials,
		}),
	);
}

function fetchMock(
	originalFetch: typeof fetch,
	implementation: (
		input: Parameters<typeof fetch>[0],
		init?: Parameters<typeof fetch>[1],
	) => Promise<Response>,
): typeof fetch {
	return Object.assign(implementation, {
		preconnect: originalFetch.preconnect,
	}) as typeof fetch;
}

function lineState(
	value: Partial<{ userId: string; codeVerifier: string; nonce: string }> = {},
) {
	return JSON.stringify({
		userId: "user-1",
		codeVerifier: "v".repeat(43),
		nonce: "n".repeat(43),
		...value,
	});
}

function storedState(value = lineState()): StoredLineEnrollmentState {
	return {
		identifier: getLineEnrollmentIdentifier("user-1"),
		value,
	};
}

async function sha256Base64Url(value: string) {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(value),
	);
	return btoa(String.fromCharCode(...new Uint8Array(digest)))
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "");
}

describe("SocialAccountService.startLineEnrollment", () => {
	test("creates a bound one-time state and secure LINE authorization URL", async () => {
		let stored:
			| {
					state: string;
					identifier: string;
					value: string;
					expiresAt: Date;
			  }
			| undefined;
		const service = createService(
			createRepository({
				createLineEnrollmentState: async (input) => {
					stored = input;
				},
			}),
		);

		const before = Date.now();
		const { authorizationUrl } = await service.startLineEnrollment({
			userId: "user-1",
			impersonatedBy: null,
		});
		const after = Date.now();
		const url = new URL(authorizationUrl);
		const state = JSON.parse(stored?.value ?? "null") as {
			userId: string;
			codeVerifier: string;
			nonce: string;
		};

		expect(url.origin + url.pathname).toBe(
			"https://access.line.me/oauth2/v2.1/authorize",
		);
		expect(url.searchParams).toEqual(
			new URLSearchParams({
				response_type: "code",
				client_id: "line-channel-id",
				redirect_uri:
					"https://api.example.com/v1/auth/social-accounts/line/callback",
				scope: "openid profile email",
				state: stored?.state ?? "",
				code_challenge: await sha256Base64Url(state.codeVerifier),
				code_challenge_method: "S256",
				nonce: state.nonce,
			}),
		);
		expect(stored).toMatchObject({
			identifier: getLineEnrollmentIdentifier("user-1"),
		});
		expect(state.userId).toBe("user-1");
		expect(state.codeVerifier).toHaveLength(43);
		expect(state.nonce).toHaveLength(43);
		expect(stored?.expiresAt.getTime()).toBeGreaterThanOrEqual(
			before + 10 * 60_000 - 5_000,
		);
		expect(stored?.expiresAt.getTime()).toBeLessThanOrEqual(
			after + 10 * 60_000 + 5_000,
		);
	});

	test.each([
		[
			"unavailable",
			createRepository(),
			{ LINE_LOGIN_CHANNEL_ID: "", LINE_LOGIN_CHANNEL_SECRET: "" },
			null,
			"LINE_SOCIAL_LOGIN_UNAVAILABLE",
		],
		[
			"impersonated",
			createRepository(),
			{},
			"admin-1",
			"IMPERSONATION_NOT_ALLOWED",
		],
		[
			"admin",
			createRepository({
				findEligibleTutorUser: async () => ({ ...user, role: "admin" }),
			}),
			{},
			null,
			"SOCIAL_ACCOUNT_ENROLLMENT_FORBIDDEN",
		],
		[
			"non-tutor",
			createRepository({
				findEligibleTutorUser: async () => ({ ...user, tutor: null }),
			}),
			{},
			null,
			"SOCIAL_ACCOUNT_ENROLLMENT_FORBIDDEN",
		],
		[
			"banned",
			createRepository({
				findEligibleTutorUser: async () => ({ ...user, banned: true }),
			}),
			{},
			null,
			"SOCIAL_ACCOUNT_ENROLLMENT_FORBIDDEN",
		],
	] as const)("rejects %s enrollment", async (_case, repository, credentials, impersonatedBy, errorCode) => {
		await expect(
			createService(repository, credentials).startLineEnrollment({
				userId: "user-1",
				impersonatedBy,
			}),
		).rejects.toMatchObject({ errorCode } satisfies Partial<AppError>);
	});
});

describe("SocialAccountService.completeLineEnrollment", () => {
	test("rejects missing or malformed callback input before provider calls", async () => {
		let consumed = 0;
		const repository = createRepository({
			consumeLineEnrollmentState: async () => {
				consumed += 1;
				return null;
			},
		});
		const service = createService(repository);

		for (const input of [
			{},
			{ code: "code" },
			{ state: "state" },
			{ code: "c".repeat(8_193), state: "state" },
		]) {
			await expect(service.completeLineEnrollment(input)).rejects.toMatchObject(
				{
					errorCode: "LINE_ENROLLMENT_INVALID",
				} satisfies Partial<AppError>,
			);
		}
		expect(consumed).toBe(0);
	});

	test.each([
		["expired or replayed", null],
		["malformed", storedState("not-json")],
		[
			"bound to another user",
			{
				...storedState(),
				identifier: getLineEnrollmentIdentifier("another-user"),
			},
		],
	] as const)("rejects %s consumed state", async (_case, consumedState) => {
		const service = createService(
			createRepository({
				consumeLineEnrollmentState: async () => consumedState,
			}),
		);

		await expect(
			service.completeLineEnrollment({ code: "code", state: "state" }),
		).rejects.toMatchObject({
			errorCode: "LINE_ENROLLMENT_INVALID",
		} satisfies Partial<AppError>);
	});

	test("exchanges the code server-side, verifies the ID token, and creates a token-free account", async () => {
		const calls: Array<{ url: string; body: URLSearchParams }> = [];
		let accountInput: { userId: string; accountId: string } | undefined;
		const originalFetch = globalThis.fetch;
		globalThis.fetch = fetchMock(originalFetch, async (input, init) => {
			calls.push({
				url: String(input),
				body: new URLSearchParams(String(init?.body)),
			});
			if (calls.length === 1) {
				return Response.json({ id_token: "line-id-token" });
			}
			return Response.json({
				iss: "https://access.line.me",
				aud: "line-channel-id",
				nonce: "n".repeat(43),
				exp: Math.floor(Date.now() / 1_000) + 3_600,
				sub: "line-subject",
				email: " TUTOR@example.com ",
			});
		});

		try {
			await createService(
				createRepository({
					consumeLineEnrollmentState: async () => storedState(),
					createLineAccount: async (userId, accountId) => {
						accountInput = { userId, accountId };
						return "created";
					},
				}),
			).completeLineEnrollment({ code: "authorization-code", state: "state" });
		} finally {
			globalThis.fetch = originalFetch;
		}

		expect(calls).toHaveLength(2);
		expect(calls[0]).toEqual({
			url: "https://api.line.me/oauth2/v2.1/token",
			body: new URLSearchParams({
				grant_type: "authorization_code",
				code: "authorization-code",
				redirect_uri:
					"https://api.example.com/v1/auth/social-accounts/line/callback",
				client_id: "line-channel-id",
				client_secret: "line-channel-secret",
				code_verifier: "v".repeat(43),
			}),
		});
		expect(calls[1]).toEqual({
			url: "https://api.line.me/oauth2/v2.1/verify",
			body: new URLSearchParams({
				id_token: "line-id-token",
				client_id: "line-channel-id",
				nonce: "n".repeat(43),
			}),
		});
		expect(accountInput).toEqual({
			userId: "user-1",
			accountId: "line-subject",
		});
	});

	test.each([
		["issuer", { iss: "https://attacker.example" }],
		["audience", { aud: "another-channel" }],
		["nonce", { nonce: "unexpected" }],
		["expired token", { exp: Math.floor(Date.now() / 1_000) - 1 }],
		["missing subject", { sub: "" }],
		["missing email", { email: "" }],
	] as const)("rejects an ID-token verify response with invalid %s", async (_case, invalidClaim) => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = fetchMock(originalFetch, async (_input, init) => {
			if (String(init?.body).includes("grant_type=authorization_code")) {
				return Response.json({ id_token: "line-id-token" });
			}
			return Response.json({
				iss: "https://access.line.me",
				aud: "line-channel-id",
				nonce: "n".repeat(43),
				exp: Math.floor(Date.now() / 1_000) + 3_600,
				sub: "line-subject",
				email: "tutor@example.com",
				...invalidClaim,
			});
		});

		try {
			await expect(
				createService(
					createRepository({
						consumeLineEnrollmentState: async () => storedState(),
					}),
				).completeLineEnrollment({ code: "code", state: "state" }),
			).rejects.toMatchObject({
				errorCode: "LINE_ENROLLMENT_INVALID",
			} satisfies Partial<AppError>);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test("rejects mismatched email and preserves idempotency versus cross-user conflicts", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = fetchMock(originalFetch, async (_input, init) => {
			if (String(init?.body).includes("grant_type=authorization_code")) {
				return Response.json({ id_token: "line-id-token" });
			}
			return Response.json({
				iss: "https://access.line.me",
				aud: "line-channel-id",
				nonce: "n".repeat(43),
				exp: Math.floor(Date.now() / 1_000) + 3_600,
				sub: "line-subject",
				email: "tutor@example.com",
			});
		});

		try {
			await expect(
				createService(
					createRepository({
						consumeLineEnrollmentState: async () => storedState(),
						findEligibleTutorUser: async () => ({
							...user,
							email: "other@example.com",
						}),
					}),
				).completeLineEnrollment({ code: "code", state: "state" }),
			).rejects.toMatchObject({
				errorCode: "LINE_ENROLLMENT_INVALID",
			} satisfies Partial<AppError>);

			await expect(
				createService(
					createRepository({
						consumeLineEnrollmentState: async () => storedState(),
						createLineAccount: async () => "already-linked",
					}),
				).completeLineEnrollment({ code: "code", state: "state" }),
			).resolves.toBeUndefined();

			await expect(
				createService(
					createRepository({
						consumeLineEnrollmentState: async () => storedState(),
						createLineAccount: async () => "linked-to-another-user",
					}),
				).completeLineEnrollment({ code: "code", state: "state" }),
			).rejects.toMatchObject({
				errorCode: "LINE_SOCIAL_ACCOUNT_CONFLICT",
				status: 409,
			} satisfies Partial<AppError>);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
