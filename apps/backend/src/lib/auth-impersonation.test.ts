import { describe, expect, mock, test } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import { memoryAdapter } from "better-auth/adapters/memory";
import { splitSetCookieHeader } from "better-auth/cookies";
import { makeSignature } from "better-auth/crypto";
import { createAppConfig } from "./app-config";
import {
	createAuthImpersonationStartHandler,
	IMPERSONATE_USER_PATH,
} from "./auth-impersonation";

const secret = "test-secret-with-at-least-thirty-two-characters";
const adminOrigin = "https://admin.example.com";
const baseUrl = "http://localhost:5174";

const database: Record<string, Array<Record<string, unknown>>> = {
	account: [],
	session: [],
	user: [],
	verification: [],
};

mock.module("better-auth/adapters/prisma", () => ({
	prismaAdapter: () => memoryAdapter(database),
}));

const { createAuth } = await import("./auth-factory");

function resetDatabase() {
	for (const records of Object.values(database)) {
		records.length = 0;
	}
}

function getDatabaseTable(name: "session" | "user") {
	const records = database[name];
	if (!records) throw new Error(`Expected Better Auth ${name} memory table`);
	return records;
}

function createUser(id: string, role: string) {
	const now = new Date();
	return {
		banned: false,
		banExpires: null,
		banReason: null,
		createdAt: now,
		email: `${id}@example.com`,
		emailVerified: true,
		id,
		image: null,
		name: id,
		role,
		updatedAt: now,
	};
}

function getSetCookies(response: Response) {
	const headers = response.headers as Headers & {
		getSetCookie?: () => string[];
	};
	return (
		headers.getSetCookie?.() ??
		splitSetCookieHeader(response.headers.get("Set-Cookie") ?? "")
	);
}

function cookieHeader(setCookies: string[]) {
	const cookies = new Map<string, string>();

	for (const setCookie of setCookies) {
		const [pair] = setCookie.split(";", 1);
		if (!pair) continue;
		const separator = pair.indexOf("=");
		if (separator < 1) continue;
		const name = pair.slice(0, separator);
		if (/(^|;)\s*max-age=0(;|$)/i.test(setCookie)) {
			cookies.delete(name);
			continue;
		}
		cookies.set(name, pair.slice(separator + 1));
	}

	return [...cookies.entries()]
		.map(([name, value]) => `${name}=${value}`)
		.join("; ");
}

async function sessionCookie(token: string) {
	return `better-auth.session_token=${token}.${await makeSignature(token, secret)}`;
}

type LockedUser = {
	banned: boolean | null;
	id: string;
	role: string | null;
};

type SessionRecord = {
	id: string;
	impersonatedBy?: string | null;
	userId: string;
};

type NativeStartHandler = (
	request: Request,
	sessions: SessionRecord[],
) => Promise<Response>;

type SessionFindManyArgs = {
	select: { id: true };
	where: { impersonatedBy: string; userId: string };
};

type SessionDeleteManyArgs = {
	where: {
		id: { in: string[] };
		impersonatedBy: string;
		userId: string;
	};
};

function createStartRequest(
	body: string,
	headers: Record<string, string> = {},
) {
	return new Request(`${baseUrl}${IMPERSONATE_USER_PATH}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Origin: adminOrigin,
			...headers,
		},
		body,
	});
}

function createNativeStartResponse(
	session: SessionRecord,
	responseBody: unknown = {
		session,
		user: { id: session.userId },
	},
) {
	return new Response(JSON.stringify(responseBody), {
		headers: { "Content-Type": "application/json" },
	});
}

function createWrapperHarness({
	authSession = {
		user: { id: "admin-1", role: "admin" },
		session: { id: "admin-session-1" },
	},
	hasTutor = true,
	handler = async () => {
		throw new Error("Native start should not have been invoked");
	},
	lockedUser = { banned: false, id: "target-1", role: "user" },
	sessions = [],
	postNativeSessionFindManyError,
	transactionError,
}: {
	authSession?: unknown;
	hasTutor?: boolean;
	handler?: NativeStartHandler;
	lockedUser?: LockedUser | null;
	postNativeSessionFindManyError?: Error;
	sessions?: SessionRecord[];
	transactionError?: Error;
} = {}) {
	const deleteManyCalls: SessionDeleteManyArgs[] = [];
	const nativeRequests: Request[] = [];
	const rawQueries: Array<{ sql: string; values: unknown[] }> = [];
	const sessionFindManyCalls: SessionFindManyArgs[] = [];
	const transactionSessions = [...sessions];
	const rootDeleteManyCalls: SessionDeleteManyArgs[] = [];
	let transactionCount = 0;

	const transaction = {
		$queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
			const sql = strings.join("?");
			rawQueries.push({ sql, values });
			if (sql.includes('FROM "user"')) {
				return lockedUser ? [lockedUser] : [];
			}
			if (sql.includes('FROM "tutors"')) {
				return hasTutor ? [{ id: "tutor-1" }] : [];
			}
			throw new Error(`Unexpected transactional query: ${sql}`);
		},
		session: {
			findMany: async (args: SessionFindManyArgs) => {
				sessionFindManyCalls.push(args);
				if (
					postNativeSessionFindManyError &&
					sessionFindManyCalls.length === 2
				) {
					throw postNativeSessionFindManyError;
				}
				return transactionSessions
					.filter(
						(session) =>
							session.impersonatedBy === args.where.impersonatedBy &&
							session.userId === args.where.userId,
					)
					.map((session) => ({ id: session.id }));
			},
			deleteMany: async (args: SessionDeleteManyArgs) => {
				deleteManyCalls.push(args);
				let count = 0;
				for (
					let index = transactionSessions.length - 1;
					index >= 0;
					index -= 1
				) {
					const session = transactionSessions[index];
					if (!session) continue;
					if (
						args.where.id.in.includes(session.id) &&
						session.impersonatedBy === args.where.impersonatedBy &&
						session.userId === args.where.userId
					) {
						transactionSessions.splice(index, 1);
						count += 1;
					}
				}
				return { count };
			},
		},
	};

	const start = createAuthImpersonationStartHandler({
		auth: {
			api: { getSession: async () => authSession },
			handler: async (request: Request) => {
				nativeRequests.push(request);
				return handler(request, transactionSessions);
			},
		} as never,
		adminOrigin,
		prisma: {
			$transaction: async (
				callback: (tx: typeof transaction) => Promise<unknown>,
			) => {
				transactionCount += 1;
				const result = await callback(transaction);
				if (transactionError) throw transactionError;
				return result;
			},
			session: {
				deleteMany: async (args: SessionDeleteManyArgs) => {
					rootDeleteManyCalls.push(args);
					let count = 0;
					for (
						let index = transactionSessions.length - 1;
						index >= 0;
						index -= 1
					) {
						const session = transactionSessions[index];
						if (!session) continue;
						if (
							args.where.id.in.includes(session.id) &&
							session.impersonatedBy === args.where.impersonatedBy &&
							session.userId === args.where.userId
						) {
							transactionSessions.splice(index, 1);
							count += 1;
						}
					}
					return { count };
				},
			},
		} as unknown as PrismaClient,
	});

	return {
		deleteManyCalls,
		nativeRequests,
		rawQueries,
		rootDeleteManyCalls,
		sessionFindManyCalls,
		sessions: transactionSessions,
		start,
		transactionCount: () => transactionCount,
	};
}

describe("native Better Auth impersonation session transition", () => {
	test("creates a 3600-second impersonation session and restores the signed admin session", async () => {
		resetDatabase();
		const admin = createUser("admin-1", "admin");
		const target = createUser("target-1", "user");
		const now = new Date();
		getDatabaseTable("user").push(admin, target);
		getDatabaseTable("session").push({
			createdAt: now,
			expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
			id: "admin-session-1",
			impersonatedBy: null,
			ipAddress: null,
			token: "admin-session-token",
			updatedAt: now,
			userAgent: null,
			userId: admin.id,
		});

		const auth = createAuth(
			createAppConfig({
				ADMIN_FRONTEND_URL: adminOrigin,
				BETTER_AUTH_SECRET: secret,
				BETTER_AUTH_URL: baseUrl,
				LOG_LEVEL: "silent",
				RESEND_API_KEY: "test-resend-key",
			}),
			{} as never,
		);
		const startedAt = Date.now();
		const start = await auth.handler(
			new Request(`${baseUrl}/api/auth/admin/impersonate-user`, {
				method: "POST",
				headers: {
					Cookie: await sessionCookie("admin-session-token"),
					"Content-Type": "application/json",
					Origin: adminOrigin,
				},
				body: JSON.stringify({ userId: target.id }),
			}),
		);

		expect(start.status).toBe(200);
		const started = (await start.json()) as {
			session: { id: string; impersonatedBy?: string; userId: string };
			user: { id: string };
		};
		expect(started.user.id).toBe(target.id);
		expect(started.session.userId).toBe(target.id);
		expect(started.session.impersonatedBy).toBe(admin.id);

		const impersonationSession = getDatabaseTable("session").find(
			(session) => session.id === started.session.id,
		);
		if (!impersonationSession) {
			throw new Error(
				"Expected Better Auth to persist the impersonation session",
			);
		}
		expect(impersonationSession.impersonatedBy).toBe(admin.id);
		const expiresAt = new Date(
			String(impersonationSession.expiresAt),
		).getTime();
		expect(expiresAt).toBeGreaterThanOrEqual(startedAt + 3_595_000);
		expect(expiresAt).toBeLessThanOrEqual(startedAt + 3_605_000);
		expect(
			getDatabaseTable("session").some(
				(session) => session.id === "admin-session-1",
			),
		).toBe(true);

		const startCookies = cookieHeader(getSetCookies(start));
		expect(startCookies).toContain("better-auth.session_token=");
		expect(startCookies).toContain("better-auth.admin_session=");

		const stop = await auth.handler(
			new Request(`${baseUrl}/api/auth/admin/stop-impersonating`, {
				method: "POST",
				headers: { Cookie: startCookies, Origin: adminOrigin },
			}),
		);

		expect(stop.status).toBe(200);
		const stopped = (await stop.json()) as {
			session: { id: string };
			user: { id: string };
		};
		expect(stopped.session.id).toBe("admin-session-1");
		expect(stopped.user.id).toBe(admin.id);
		expect(
			getDatabaseTable("session").some(
				(session) => session.id === started.session.id,
			),
		).toBe(false);

		const restoredCookies = cookieHeader(getSetCookies(stop));
		expect(restoredCookies).toContain("better-auth.session_token=");
		expect(restoredCookies).not.toContain("better-auth.admin_session=");
		const restored = await auth.api.getSession({
			headers: new Headers({ Cookie: restoredCookies }),
		});
		expect(restored?.session.id).toBe("admin-session-1");
		expect(restored?.user.id).toBe(admin.id);
	});
});

describe("transactional impersonation start wrapper", () => {
	test("requires authentication, an exact admin role, and the exact admin origin before a transaction", async () => {
		const unauthenticated = createWrapperHarness({ authSession: null });
		const unauthenticatedResult = await unauthenticated.start(
			createStartRequest(JSON.stringify({ userId: "target-1" })),
		);
		expect(unauthenticatedResult.response.status).toBe(401);
		expect(await unauthenticatedResult.response.json()).toEqual({
			errorCode: "UNAUTHORIZED",
			message: "Authentication required",
		});
		expect(unauthenticated.transactionCount()).toBe(0);

		for (const role of ["user", "admin,user", "super-admin"]) {
			const ineligibleActor = createWrapperHarness({
				authSession: {
					user: { id: "actor-1", role },
					session: { id: "actor-session-1" },
				},
			});
			const result = await ineligibleActor.start(
				createStartRequest(JSON.stringify({ userId: "target-1" })),
			);

			expect(result.response.status).toBe(403);
			expect(await result.response.json()).toEqual({
				errorCode: "ADMIN_REQUIRED",
				message: "Administrator access required",
			});
			expect(result.actorUserId).toBeUndefined();
			expect(ineligibleActor.transactionCount()).toBe(0);
		}

		const malformedActor = createWrapperHarness({
			authSession: {
				user: { id: 42, role: "admin" },
				session: { id: "actor-session-1" },
			},
		});
		const malformedActorResult = await malformedActor.start(
			createStartRequest(JSON.stringify({ userId: "target-1" })),
		);
		expect(malformedActorResult.response.status).toBe(401);
		expect(malformedActor.transactionCount()).toBe(0);

		const wrongOrigin = createWrapperHarness();
		const wrongOriginResult = await wrongOrigin.start(
			createStartRequest(JSON.stringify({ userId: "target-1" }), {
				Origin: `${adminOrigin}/`,
			}),
		);
		expect(wrongOriginResult.response.status).toBe(403);
		expect(await wrongOriginResult.response.json()).toEqual({
			errorCode: "ADMIN_ORIGIN_REQUIRED",
			message: "Invalid request origin",
		});
		expect(wrongOriginResult.actorUserId).toBe("admin-1");
		expect(wrongOrigin.transactionCount()).toBe(0);
	});

	test("hides malformed target payloads before querying or invoking Better Auth", async () => {
		const wrapper = createWrapperHarness();
		const invalidRequests = [
			createStartRequest("not-json"),
			createStartRequest(JSON.stringify({})),
			createStartRequest(JSON.stringify({ userId: 42 })),
			createStartRequest(JSON.stringify({ userId: "" })),
			createStartRequest(JSON.stringify({ userId: "x".repeat(513) })),
			createStartRequest(JSON.stringify({ userId: "target-1" }), {
				"Content-Length": "not-a-number",
			}),
		];

		for (const request of invalidRequests) {
			const result = await wrapper.start(request);
			expect(result.response.status).toBe(404);
			expect(await result.response.json()).toEqual({
				errorCode: "USER_NOT_FOUND",
				message: "User not found",
			});
			expect(result.actorUserId).toBe("admin-1");
		}

		expect(wrapper.transactionCount()).toBe(0);
		expect(wrapper.nativeRequests).toEqual([]);
		expect(wrapper.rawQueries).toEqual([]);
	});

	test("hides every ineligible target after locking it and its Tutor row", async () => {
		const scenarios: Array<{
			hasTutor: boolean;
			lockedUser: LockedUser | null;
			name: string;
			expectedQueryCount: number;
		}> = [
			{
				expectedQueryCount: 1,
				hasTutor: false,
				lockedUser: null,
				name: "missing user",
			},
			{
				expectedQueryCount: 2,
				hasTutor: true,
				lockedUser: { banned: false, id: "target-1", role: "admin" },
				name: "administrator target",
			},
			{
				expectedQueryCount: 2,
				hasTutor: true,
				lockedUser: { banned: false, id: "target-1", role: "super-admin" },
				name: "privileged target",
			},
			{
				expectedQueryCount: 2,
				hasTutor: true,
				lockedUser: { banned: true, id: "target-1", role: "user" },
				name: "deactivated user",
			},
			{
				expectedQueryCount: 2,
				hasTutor: false,
				lockedUser: { banned: false, id: "target-1", role: "user" },
				name: "user without Tutor row",
			},
		];

		for (const scenario of scenarios) {
			const wrapper = createWrapperHarness({
				hasTutor: scenario.hasTutor,
				lockedUser: scenario.lockedUser,
			});
			const result = await wrapper.start(
				createStartRequest(JSON.stringify({ userId: "target-1" })),
			);

			expect(result.response.status, scenario.name).toBe(404);
			expect(await result.response.json(), scenario.name).toEqual({
				errorCode: "USER_NOT_FOUND",
				message: "User not found",
			});
			expect(wrapper.transactionCount(), scenario.name).toBe(1);
			expect(wrapper.rawQueries, scenario.name).toHaveLength(
				scenario.expectedQueryCount,
			);
			for (const query of wrapper.rawQueries) {
				expect(query.sql, scenario.name).toContain("FOR NO KEY UPDATE");
			}
			expect(wrapper.nativeRequests, scenario.name).toEqual([]);
			expect(wrapper.sessionFindManyCalls, scenario.name).toEqual([]);
		}
	});

	test("accepts an active exact-role user with a Tutor row and preserves the native response", async () => {
		let nativeRequestBody: string | undefined;
		const wrapper = createWrapperHarness({
			sessions: [
				{
					id: "existing-impersonation-session",
					impersonatedBy: "admin-1",
					userId: "target-1",
				},
				{
					id: "unrelated-impersonation-session",
					impersonatedBy: "another-admin",
					userId: "target-1",
				},
			],
			handler: async (request, sessions) => {
				nativeRequestBody = await request.clone().text();
				const session = {
					id: "new-impersonation-session",
					impersonatedBy: "admin-1",
					userId: "target-1",
				};
				sessions.push(session);
				return createNativeStartResponse(session);
			},
		});
		const body = JSON.stringify({ userId: "target-1" });
		const result = await wrapper.start(createStartRequest(body));

		expect(result.response.status).toBe(200);
		expect(await result.response.json()).toEqual({
			session: {
				id: "new-impersonation-session",
				impersonatedBy: "admin-1",
				userId: "target-1",
			},
			user: { id: "target-1" },
		});
		expect(result).toMatchObject({
			actorUserId: "admin-1",
			impersonationSessionId: "new-impersonation-session",
			targetUserId: "target-1",
		});
		expect(nativeRequestBody).toBe(body);
		expect(wrapper.rawQueries).toHaveLength(2);
		expect(wrapper.rawQueries.map((query) => query.values)).toEqual([
			["target-1"],
			["target-1"],
		]);
		expect(wrapper.sessionFindManyCalls).toEqual([
			{
				select: { id: true },
				where: { impersonatedBy: "admin-1", userId: "target-1" },
			},
			{
				select: { id: true },
				where: { impersonatedBy: "admin-1", userId: "target-1" },
			},
		]);
		expect(wrapper.deleteManyCalls).toEqual([]);
	});

	test("cleans only the validated session when the outer transaction rejects", async () => {
		const wrapper = createWrapperHarness({
			sessions: [
				{
					id: "existing-impersonation-session",
					impersonatedBy: "admin-1",
					userId: "target-1",
				},
			],
			transactionError: new Error("transaction commit failed"),
			handler: async (_request, sessions) => {
				const nativeSession = {
					id: "new-validated-session",
					impersonatedBy: "admin-1",
					userId: "target-1",
				};
				sessions.push(
					nativeSession,
					{
						id: "new-concurrent-session",
						impersonatedBy: "admin-1",
						userId: "target-1",
					},
					{
						id: "new-other-actor-session",
						impersonatedBy: "another-admin",
						userId: "target-1",
					},
				);
				return createNativeStartResponse(nativeSession);
			},
		});

		const result = await wrapper.start(
			createStartRequest(JSON.stringify({ userId: "target-1" })),
		);

		expect(result.response.status).toBe(500);
		expect(await result.response.json()).toEqual({
			errorCode: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
		});
		expect(wrapper.deleteManyCalls).toEqual([]);
		expect(wrapper.rootDeleteManyCalls).toEqual([
			{
				where: {
					id: { in: ["new-validated-session"] },
					impersonatedBy: "admin-1",
					userId: "target-1",
				},
			},
		]);
		expect(wrapper.sessions).toEqual([
			{
				id: "existing-impersonation-session",
				impersonatedBy: "admin-1",
				userId: "target-1",
			},
			{
				id: "new-concurrent-session",
				impersonatedBy: "admin-1",
				userId: "target-1",
			},
			{
				id: "new-other-actor-session",
				impersonatedBy: "another-admin",
				userId: "target-1",
			},
		]);
	});

	test("cleans the response candidate when post-native session lookup fails", async () => {
		const wrapper = createWrapperHarness({
			postNativeSessionFindManyError: new Error(
				"post-native session lookup failed",
			),
			sessions: [
				{
					id: "existing-impersonation-session",
					impersonatedBy: "admin-1",
					userId: "target-1",
				},
			],
			handler: async (_request, sessions) => {
				const nativeSession = {
					id: "new-response-session",
					impersonatedBy: "admin-1",
					userId: "target-1",
				};
				sessions.push(
					nativeSession,
					{
						id: "new-concurrent-session",
						impersonatedBy: "admin-1",
						userId: "target-1",
					},
					{
						id: "new-other-actor-session",
						impersonatedBy: "another-admin",
						userId: "target-1",
					},
				);
				return createNativeStartResponse(nativeSession);
			},
		});

		const result = await wrapper.start(
			createStartRequest(JSON.stringify({ userId: "target-1" })),
		);

		expect(result.response.status).toBe(500);
		expect(await result.response.json()).toEqual({
			errorCode: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
		});
		expect(wrapper.deleteManyCalls).toEqual([]);
		expect(wrapper.rootDeleteManyCalls).toEqual([
			{
				where: {
					id: { in: ["new-response-session"] },
					impersonatedBy: "admin-1",
					userId: "target-1",
				},
			},
		]);
		expect(wrapper.sessions).toEqual([
			{
				id: "existing-impersonation-session",
				impersonatedBy: "admin-1",
				userId: "target-1",
			},
			{
				id: "new-concurrent-session",
				impersonatedBy: "admin-1",
				userId: "target-1",
			},
			{
				id: "new-other-actor-session",
				impersonatedBy: "another-admin",
				userId: "target-1",
			},
		]);
	});

	test("removes only the newly created actor-target session when native postconditions fail", async () => {
		const wrapper = createWrapperHarness({
			sessions: [
				{
					id: "existing-impersonation-session",
					impersonatedBy: "admin-1",
					userId: "target-1",
				},
			],
			handler: async (_request, sessions) => {
				sessions.push(
					{
						id: "new-actor-target-session",
						impersonatedBy: "admin-1",
						userId: "target-1",
					},
					{
						id: "new-actor-other-target-session",
						impersonatedBy: "admin-1",
						userId: "other-target",
					},
					{
						id: "new-other-actor-target-session",
						impersonatedBy: "another-admin",
						userId: "target-1",
					},
				);
				return createNativeStartResponse(
					{
						id: "new-actor-target-session",
						impersonatedBy: "admin-1",
						userId: "target-1",
					},
					{
						session: {
							id: "new-actor-target-session",
							impersonatedBy: "another-admin",
							userId: "target-1",
						},
						user: { id: "target-1" },
					},
				);
			},
		});
		const result = await wrapper.start(
			createStartRequest(JSON.stringify({ userId: "target-1" })),
		);

		expect(result.response.status).toBe(500);
		expect(await result.response.json()).toEqual({
			errorCode: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
		});
		expect(result).toMatchObject({ actorUserId: "admin-1" });
		expect(result.impersonationSessionId).toBeUndefined();
		expect(result.targetUserId).toBeUndefined();
		expect(wrapper.deleteManyCalls).toEqual([
			{
				where: {
					id: { in: ["new-actor-target-session"] },
					impersonatedBy: "admin-1",
					userId: "target-1",
				},
			},
		]);
		expect(wrapper.sessions).toEqual([
			{
				id: "existing-impersonation-session",
				impersonatedBy: "admin-1",
				userId: "target-1",
			},
			{
				id: "new-actor-other-target-session",
				impersonatedBy: "admin-1",
				userId: "other-target",
			},
			{
				id: "new-other-actor-target-session",
				impersonatedBy: "another-admin",
				userId: "target-1",
			},
		]);
	});

	test("removes only the new actor-target session when the native handler throws", async () => {
		const wrapper = createWrapperHarness({
			handler: async (_request, sessions) => {
				sessions.push(
					{
						id: "new-actor-target-session",
						impersonatedBy: "admin-1",
						userId: "target-1",
					},
					{
						id: "unrelated-session",
						impersonatedBy: "another-admin",
						userId: "target-1",
					},
				);
				throw new Error("native start failed after creating a session");
			},
		});
		const result = await wrapper.start(
			createStartRequest(JSON.stringify({ userId: "target-1" })),
		);

		expect(result.response.status).toBe(500);
		expect(await result.response.json()).toEqual({
			errorCode: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
		});
		expect(wrapper.deleteManyCalls).toEqual([
			{
				where: {
					id: { in: ["new-actor-target-session"] },
					impersonatedBy: "admin-1",
					userId: "target-1",
				},
			},
		]);
		expect(wrapper.sessions).toEqual([
			{
				id: "unrelated-session",
				impersonatedBy: "another-admin",
				userId: "target-1",
			},
		]);
	});
});
