import { describe, expect, test } from "bun:test";
import { createAppConfig } from "../lib/app-config";
import type { AppError } from "../lib/error";
import {
	getGoogleEnrollmentIdentifier,
	getLineEnrollmentIdentifier,
} from "../repositories/social-account.repository";
import type {
	EligibleTutorUser,
	ISocialAccountRepository,
	StoredGoogleEnrollmentState,
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
		createGoogleEnrollmentState: async () => {},
		consumeGoogleEnrollmentState: async () => null,
		createGoogleAccount: async () => "created" as const,
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

function googleState(
	value: Partial<{ userId: string; codeVerifier: string; nonce: string }> = {},
) {
	return JSON.stringify({
		userId: "user-1",
		codeVerifier: "v".repeat(43),
		nonce: "n".repeat(43),
		...value,
	});
}

function storedGoogleState(value = googleState()): StoredGoogleEnrollmentState {
	return {
		identifier: getGoogleEnrollmentIdentifier("user-1"),
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

function base64Url(value: ArrayBuffer | Uint8Array | string) {
	const bytes =
		typeof value === "string"
			? new TextEncoder().encode(value)
			: new Uint8Array(value);
	return btoa(String.fromCharCode(...bytes))
		.replaceAll("+", "-")
		.replaceAll("/", "_")
		.replaceAll("=", "");
}

type GoogleSigningKey = {
	privateKey: CryptoKey;
	publicJwk: JsonWebKey;
};

let googleSigningKey: Promise<GoogleSigningKey> | undefined;

async function getGoogleSigningKey(): Promise<GoogleSigningKey> {
	googleSigningKey ??= (async () => {
		const keyPair = await crypto.subtle.generateKey(
			{
				name: "RSASSA-PKCS1-v1_5",
				modulusLength: 2048,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: "SHA-256",
			},
			true,
			["sign", "verify"],
		);
		return {
			privateKey: keyPair.privateKey,
			publicJwk: {
				...(await crypto.subtle.exportKey("jwk", keyPair.publicKey)),
				kid: "google-test-key",
				alg: "RS256",
				use: "sig",
			},
		};
	})();
	return googleSigningKey;
}

async function createGoogleIdToken(overrides: Record<string, unknown> = {}) {
	const key = await getGoogleSigningKey();
	const header = base64Url(
		JSON.stringify({ alg: "RS256", kid: key.publicJwk.kid }),
	);
	const payload = base64Url(
		JSON.stringify({
			iss: "https://accounts.google.com",
			aud: "google-client-id",
			iat: Math.floor(Date.now() / 1_000),
			exp: Math.floor(Date.now() / 1_000) + 3_600,
			nonce: "n".repeat(43),
			sub: "google-subject",
			email: " TUTOR@example.com ",
			email_verified: true,
			...overrides,
		}),
	);
	const input = `${header}.${payload}`;
	const signature = await crypto.subtle.sign(
		"RSASSA-PKCS1-v1_5",
		key.privateKey,
		new TextEncoder().encode(input),
	);
	return `${input}.${base64Url(signature)}`;
}

function mockGoogleNetwork(idToken: string) {
	const originalFetch = globalThis.fetch;
	const requests: Array<{ url: string; init?: RequestInit }> = [];
	globalThis.fetch = fetchMock(originalFetch, async (input, init) => {
		const url = String(input);
		requests.push({ url, init });
		if (url === "https://oauth2.googleapis.com/token") {
			return Response.json({ access_token: "access-token", id_token: idToken });
		}
		if (url === "https://www.googleapis.com/oauth2/v3/certs") {
			return Response.json({ keys: [(await getGoogleSigningKey()).publicJwk] });
		}
		throw new Error(`Unexpected request: ${url}`);
	});
	return {
		requests,
		restore() {
			globalThis.fetch = originalFetch;
		},
	};
}

function mockGoogleTokenResponse(response: Response) {
	const originalFetch = globalThis.fetch;
	globalThis.fetch = fetchMock(originalFetch, async (input) => {
		if (String(input) === "https://oauth2.googleapis.com/token") {
			return response;
		}
		throw new Error(`Unexpected request: ${String(input)}`);
	});
	return () => {
		globalThis.fetch = originalFetch;
	};
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

describe("SocialAccountService.startGoogleEnrollment", () => {
	test("creates a bound one-time state and provider authorization URL with PKCE and nonce", async () => {
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
				createGoogleEnrollmentState: async (input) => {
					stored = input;
				},
			}),
			{
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
			},
		);

		const before = Date.now();
		const { authorizationUrl } = await service.startGoogleEnrollment({
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
			"https://accounts.google.com/o/oauth2/v2/auth",
		);
		expect(url.searchParams).toEqual(
			new URLSearchParams({
				response_type: "code",
				client_id: "google-client-id",
				redirect_uri:
					"https://api.example.com/v1/auth/social-accounts/google/callback",
				scope: "email profile openid",
				state: stored?.state ?? "",
				code_challenge: await sha256Base64Url(state.codeVerifier),
				code_challenge_method: "S256",
				include_granted_scopes: "true",
				nonce: state.nonce,
			}),
		);
		expect(stored).toMatchObject({
			identifier: getGoogleEnrollmentIdentifier("user-1"),
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
			{},
			null,
			"GOOGLE_SOCIAL_LOGIN_UNAVAILABLE",
		],
		[
			"impersonated",
			createRepository(),
			{ GOOGLE_CLIENT_ID: "google-client-id", GOOGLE_CLIENT_SECRET: "secret" },
			"admin-1",
			"IMPERSONATION_NOT_ALLOWED",
		],
		[
			"admin",
			createRepository({
				findEligibleTutorUser: async () => ({ ...user, role: "admin" }),
			}),
			{ GOOGLE_CLIENT_ID: "google-client-id", GOOGLE_CLIENT_SECRET: "secret" },
			null,
			"SOCIAL_ACCOUNT_ENROLLMENT_FORBIDDEN",
		],
		[
			"non-tutor",
			createRepository({
				findEligibleTutorUser: async () => ({ ...user, tutor: null }),
			}),
			{ GOOGLE_CLIENT_ID: "google-client-id", GOOGLE_CLIENT_SECRET: "secret" },
			null,
			"SOCIAL_ACCOUNT_ENROLLMENT_FORBIDDEN",
		],
		[
			"banned",
			createRepository({
				findEligibleTutorUser: async () => ({ ...user, banned: true }),
			}),
			{ GOOGLE_CLIENT_ID: "google-client-id", GOOGLE_CLIENT_SECRET: "secret" },
			null,
			"SOCIAL_ACCOUNT_ENROLLMENT_FORBIDDEN",
		],
	] as const)("rejects %s enrollment", async (_case, repository, credentials, impersonatedBy, errorCode) => {
		await expect(
			createService(repository, credentials).startGoogleEnrollment({
				userId: "user-1",
				impersonatedBy,
			}),
		).rejects.toMatchObject({ errorCode } satisfies Partial<AppError>);
	});
});

describe("SocialAccountService.completeGoogleEnrollment", () => {
	test("rejects missing, oversized, replayed, malformed, and cross-provider state before exchanging a code", async () => {
		let consumed = 0;
		const repository = createRepository({
			consumeGoogleEnrollmentState: async () => {
				consumed += 1;
				return null;
			},
		});
		const service = createService(repository, {
			GOOGLE_CLIENT_ID: "google-client-id",
			GOOGLE_CLIENT_SECRET: "google-client-secret",
		});

		for (const input of [
			{},
			{ code: "code" },
			{ state: "state" },
			{ code: "c".repeat(8_193), state: "state" },
		]) {
			await expect(
				service.completeGoogleEnrollment(input),
			).rejects.toMatchObject({
				errorCode: "GOOGLE_ENROLLMENT_INVALID",
			} satisfies Partial<AppError>);
		}
		expect(consumed).toBe(0);

		for (const consumedState of [
			null,
			storedGoogleState("not-json"),
			{
				...storedGoogleState(),
				identifier: getLineEnrollmentIdentifier("user-1"),
			},
			{
				...storedGoogleState(),
				identifier: getGoogleEnrollmentIdentifier("another-user"),
			},
		]) {
			await expect(
				createService(
					createRepository({
						consumeGoogleEnrollmentState: async () => consumedState,
					}),
					{
						GOOGLE_CLIENT_ID: "google-client-id",
						GOOGLE_CLIENT_SECRET: "google-client-secret",
					},
				).completeGoogleEnrollment({ code: "code", state: "state" }),
			).rejects.toMatchObject({
				errorCode: "GOOGLE_ENROLLMENT_INVALID",
			} satisfies Partial<AppError>);
		}
	});

	test("uses the locked Google provider to exchange a PKCE code, verify a signed ID token, and link no tokens", async () => {
		let accountInput: { userId: string; accountId: string } | undefined;
		const network = mockGoogleNetwork(await createGoogleIdToken());
		try {
			await createService(
				createRepository({
					consumeGoogleEnrollmentState: async () => storedGoogleState(),
					createGoogleAccount: async (userId, accountId) => {
						accountInput = { userId, accountId };
						return "created";
					},
				}),
				{
					GOOGLE_CLIENT_ID: "google-client-id",
					GOOGLE_CLIENT_SECRET: "google-client-secret",
				},
			).completeGoogleEnrollment({
				code: "authorization-code",
				state: "state",
			});
		} finally {
			network.restore();
		}

		expect(network.requests).toHaveLength(2);
		expect(network.requests[0]?.url).toBe(
			"https://oauth2.googleapis.com/token",
		);
		expect(network.requests[0]?.init?.method).toBe("POST");
		expect(
			new URLSearchParams(String(network.requests[0]?.init?.body)),
		).toEqual(
			new URLSearchParams({
				grant_type: "authorization_code",
				code: "authorization-code",
				code_verifier: "v".repeat(43),
				redirect_uri:
					"https://api.example.com/v1/auth/social-accounts/google/callback",
				client_id: "google-client-id",
				client_secret: "google-client-secret",
			}),
		);
		expect(network.requests[1].url).toBe(
			"https://www.googleapis.com/oauth2/v3/certs",
		);
		expect(accountInput).toEqual({
			userId: "user-1",
			accountId: "google-subject",
		});
	});

	test.each([
		[
			"a cancelled authorization code exchange",
			Response.json({ error: "access_denied" }, { status: 400 }),
			"GOOGLE_AUTHORIZATION_UNAVAILABLE",
		],
		[
			"a malformed token response",
			Response.json({ access_token: "access-token" }),
			"GOOGLE_ENROLLMENT_INVALID",
		],
	] as const)("rejects %s", async (_case, tokenResponse, errorCode) => {
		const restore = mockGoogleTokenResponse(tokenResponse);
		try {
			await expect(
				createService(
					createRepository({
						consumeGoogleEnrollmentState: async () => storedGoogleState(),
					}),
					{
						GOOGLE_CLIENT_ID: "google-client-id",
						GOOGLE_CLIENT_SECRET: "google-client-secret",
					},
				).completeGoogleEnrollment({ code: "code", state: "state" }),
			).rejects.toMatchObject({ errorCode } satisfies Partial<AppError>);
		} finally {
			restore();
		}
	});

	test.each([
		[
			"invalid signature",
			async () => {
				const [header, payload, signature] = (
					await createGoogleIdToken()
				).split(".");
				return `${header}.${payload}.${signature.startsWith("a") ? "b" : "a"}${signature.slice(1)}`;
			},
		],
		[
			"issuer",
			async () => createGoogleIdToken({ iss: "https://attacker.example" }),
		],
		["audience", async () => createGoogleIdToken({ aud: "another-client" })],
		[
			"expired token",
			async () =>
				createGoogleIdToken({ exp: Math.floor(Date.now() / 1_000) - 1 }),
		],
		["nonce", async () => createGoogleIdToken({ nonce: "unexpected" })],
	] as const)("rejects a signed Google ID token with invalid %s", async (_case, createToken) => {
		const network = mockGoogleNetwork(await createToken());
		try {
			await expect(
				createService(
					createRepository({
						consumeGoogleEnrollmentState: async () => storedGoogleState(),
					}),
					{
						GOOGLE_CLIENT_ID: "google-client-id",
						GOOGLE_CLIENT_SECRET: "google-client-secret",
					},
				).completeGoogleEnrollment({ code: "code", state: "state" }),
			).rejects.toMatchObject({
				errorCode: "GOOGLE_ENROLLMENT_INVALID",
			} satisfies Partial<AppError>);
		} finally {
			network.restore();
		}
	});

	test("rejects a raw string email_verified value, rechecked ineligible users, and mismatched emails", async () => {
		for (const [identity, currentUser] of [
			[{ email_verified: "false" }, user],
			[{}, { ...user, banned: true }],
			[{}, { ...user, email: "other@example.com" }],
		] as const) {
			const network = mockGoogleNetwork(await createGoogleIdToken(identity));
			let created = false;
			try {
				await expect(
					createService(
						createRepository({
							consumeGoogleEnrollmentState: async () => storedGoogleState(),
							findEligibleTutorUser: async () => currentUser,
							createGoogleAccount: async () => {
								created = true;
								return "created";
							},
						}),
						{
							GOOGLE_CLIENT_ID: "google-client-id",
							GOOGLE_CLIENT_SECRET: "google-client-secret",
						},
					).completeGoogleEnrollment({ code: "code", state: "state" }),
				).rejects.toMatchObject({
					errorCode: "GOOGLE_ENROLLMENT_INVALID",
				} satisfies Partial<AppError>);
			} finally {
				network.restore();
			}
			expect(created).toBeFalse();
		}
	});

	test.each([
		["same-user idempotence", "already-linked", undefined],
		[
			"another-user conflict",
			"linked-to-another-user",
			"GOOGLE_SOCIAL_ACCOUNT_CONFLICT",
		],
	] as const)("preserves %s", async (_case, accountResult, errorCode) => {
		const network = mockGoogleNetwork(await createGoogleIdToken());
		const completion = createService(
			createRepository({
				consumeGoogleEnrollmentState: async () => storedGoogleState(),
				createGoogleAccount: async () => accountResult,
			}),
			{
				GOOGLE_CLIENT_ID: "google-client-id",
				GOOGLE_CLIENT_SECRET: "google-client-secret",
			},
		).completeGoogleEnrollment({ code: "code", state: "state" });
		try {
			if (errorCode) {
				await expect(completion).rejects.toMatchObject({
					errorCode,
					status: 409,
				} satisfies Partial<AppError>);
			} else {
				await expect(completion).resolves.toBeUndefined();
			}
		} finally {
			network.restore();
		}
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
