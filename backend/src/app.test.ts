import { describe, expect, mock, test } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import { createAppConfig } from "./lib/app-config";

const adminOrigin = "https://admin.example.com";
const impersonateUserPath = "/api/auth/admin/impersonate-user";

type LogLevel = "error" | "info" | "warn";
type LogEntry = { data: Record<string, unknown>; level: LogLevel };
type LockedUser = { banned: boolean | null; id: string; role: string | null };
type TransactionSession = {
	id: string;
	impersonatedBy?: string;
	userId: string;
};

type CaptureLogger = {
	entries: LogEntry[];
	logger: unknown;
};

type NativeHandler = (
	request: Request,
	sessions: TransactionSession[],
) => Promise<Response>;

let currentLogger: unknown;

mock.module("./lib/logger", () => ({
	createLogger: () => currentLogger,
}));

const { createApp } = await import("./app");

function createCaptureLogger(throwOn?: LogLevel): CaptureLogger {
	const entries: LogEntry[] = [];
	const log = (level: LogLevel) => (data: Record<string, unknown>) => {
		entries.push({ data, level });
		if (throwOn === level) throw new Error("logger unavailable");
	};

	return {
		entries,
		logger: {
			error: log("error"),
			info: log("info"),
			warn: log("warn"),
		},
	};
}

function nativeStartResponse(
	session: TransactionSession,
	headers: Record<string, string> = {
		"Content-Type": "application/json; charset=utf-8",
	},
) {
	return new Response(
		JSON.stringify({ session, user: { id: session.userId } }),
		{ headers },
	);
}

function createTestApp({
	getSession,
	lockedUser = { banned: false, id: "target-1", role: "user" },
	hasTutor = true,
	sessions = [],
	handler,
}: {
	getSession: () => Promise<unknown>;
	lockedUser?: LockedUser | null;
	hasTutor?: boolean;
	sessions?: TransactionSession[];
	handler?: NativeHandler;
}) {
	const handlerCalls: Request[] = [];
	const rawQueries: Array<{ sql: string; values: unknown[] }> = [];
	const sessionFindManyCalls: unknown[] = [];
	const deleteManyCalls: unknown[] = [];
	const transactionSessions = [...sessions];
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
			findMany: async (args: {
				where: { impersonatedBy: string; userId: string };
			}) => {
				sessionFindManyCalls.push(args);
				return transactionSessions
					.filter(
						(session) =>
							session.impersonatedBy === args.where.impersonatedBy &&
							session.userId === args.where.userId,
					)
					.map((session) => ({ id: session.id }));
			},
			deleteMany: async (args: {
				where: {
					id: { in: string[] };
					impersonatedBy: string;
					userId: string;
				};
			}) => {
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

	const nativeHandler: NativeHandler =
		handler ??
		(async (_request, currentSessions) => {
			const session = {
				id: "impersonation-session-1",
				impersonatedBy: "admin-1",
				userId: "target-1",
			};
			currentSessions.push(session);
			return nativeStartResponse(session);
		});
	const app = createApp({
		auth: {
			api: { getSession },
			handler: async (request: Request) => {
				handlerCalls.push(request);
				return nativeHandler(request, transactionSessions);
			},
		} as never,
		config: createAppConfig({
			ADMIN_FRONTEND_URL: adminOrigin,
			BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
			LOG_LEVEL: "silent",
			RESEND_API_KEY: "test-resend-key",
		}),
		prisma: {
			$transaction: async (
				callback: (tx: typeof transaction) => Promise<unknown>,
			) => {
				transactionCount += 1;
				return callback(transaction);
			},
			user: { findFirst: async () => ({ id: "target-1" }) },
		} as unknown as PrismaClient,
		routes: {} as never,
	});

	return {
		app,
		deleteManyCalls,
		handlerCalls,
		rawQueries,
		sessionFindManyCalls,
		sessions: transactionSessions,
		transactionCount: () => transactionCount,
	};
}

function auditEntries(entries: LogEntry[]) {
	return entries.filter(({ data }) =>
		String(data.event).startsWith("auth.impersonation."),
	);
}

describe("impersonation application behavior", () => {
	test("delegates the exact canonical POST through the wrapper and audits wrapper result IDs", async () => {
		const capture = createCaptureLogger();
		currentLogger = capture.logger;
		let nativeRequestBody: string | undefined;
		const start = createTestApp({
			getSession: async () => ({
				user: { id: "admin-1", role: "admin" },
				session: { id: "admin-session-1" },
			}),
			handler: async (request, sessions) => {
				nativeRequestBody = await request.clone().text();
				const session = {
					id: "native-impersonation-session-1",
					impersonatedBy: "admin-1",
					userId: "target-1",
				};
				sessions.push(session);
				return nativeStartResponse(session, {
					"Content-Type": "application/json; charset=utf-8",
					"Set-Cookie": "better-auth.session_token=native-session",
				});
			},
		});
		const requestBody = JSON.stringify({
			actorUserId: "body-actor-id",
			impersonationSessionId: "body-session-id",
			password: "body-password-secret",
			targetUserId: "body-target-id",
			token: "body-token-secret",
			userId: "target-1",
		});
		const response = await start.app.request(
			`https://api.example${impersonateUserPath}`,
			{
				method: "POST",
				headers: {
					Authorization: "Bearer authorization-secret",
					Cookie: "better-auth.session_token=cookie-secret",
					"Content-Type": "application/json",
					Origin: adminOrigin,
				},
				body: requestBody,
			},
		);

		expect(response.status).toBe(200);
		expect(response.headers.get("Set-Cookie")).toBe(
			"better-auth.session_token=native-session",
		);
		expect(await response.json()).toEqual({
			session: {
				id: "native-impersonation-session-1",
				impersonatedBy: "admin-1",
				userId: "target-1",
			},
			user: { id: "target-1" },
		});
		expect(start.handlerCalls).toHaveLength(1);
		expect(nativeRequestBody).toBe(requestBody);
		expect(start.transactionCount()).toBe(1);
		expect(start.rawQueries).toHaveLength(2);
		expect(start.rawQueries.map((query) => query.values)).toEqual([
			["target-1"],
			["target-1"],
		]);
		for (const query of start.rawQueries) {
			expect(query.sql).toContain("FOR NO KEY UPDATE");
		}
		expect(start.sessionFindManyCalls).toEqual([
			{
				select: { id: true },
				where: { impersonatedBy: "admin-1", userId: "target-1" },
			},
			{
				select: { id: true },
				where: { impersonatedBy: "admin-1", userId: "target-1" },
			},
		]);
		expect(start.deleteManyCalls).toEqual([]);
		expect(auditEntries(capture.entries)).toEqual([
			{
				data: {
					actorUserId: "admin-1",
					event: "auth.impersonation.started",
					impersonationSessionId: "native-impersonation-session-1",
					origin: adminOrigin,
					status: 200,
					targetUserId: "target-1",
				},
				level: "info",
			},
		]);
		const logs = JSON.stringify(capture.entries);
		for (const secret of [
			"authorization-secret",
			"cookie-secret",
			"body-password-secret",
			"body-token-secret",
			"body-actor-id",
			"body-session-id",
			"body-target-id",
		]) {
			expect(logs).not.toContain(secret);
		}
	});

	test("hides malformed, trailing, and method start variants without native delegation", async () => {
		const capture = createCaptureLogger();
		currentLogger = capture.logger;
		const start = createTestApp({
			getSession: async () => ({
				user: { id: "admin-1", role: "admin" },
				session: { id: "admin-session-1" },
			}),
		});
		const hiddenJsonRequests = [
			new Request(`https://api.example${impersonateUserPath}`, {
				method: "GET",
			}),
			new Request(`https://api.example${impersonateUserPath}/`, {
				method: "POST",
			}),
			new Request(`https://api.example${impersonateUserPath}/unexpected`, {
				method: "POST",
			}),
			new Request(`https://api.example${impersonateUserPath}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Origin: adminOrigin,
				},
				body: JSON.stringify({ userId: 42 }),
			}),
		];

		for (const request of hiddenJsonRequests) {
			const response = await start.app.fetch(request);
			expect(response.status).toBe(404);
			expect(await response.json()).toEqual({
				errorCode: "USER_NOT_FOUND",
				message: "User not found",
			});
		}

		const unsupportedMethod = await start.app.request(
			`https://api.example${impersonateUserPath}`,
			{ method: "PUT" },
		);
		expect(unsupportedMethod.status).toBe(404);
		expect(start.handlerCalls).toEqual([]);
		expect(start.transactionCount()).toBe(0);
	});

	test("logs hidden start failures without taking audit IDs from the request body", async () => {
		const capture = createCaptureLogger();
		currentLogger = capture.logger;
		const start = createTestApp({
			getSession: async () => ({
				user: { id: "admin-1", role: "admin" },
				session: { id: "admin-session-1" },
			}),
			lockedUser: null,
		});
		const response = await start.app.request(
			`https://api.example${impersonateUserPath}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json", Origin: adminOrigin },
				body: JSON.stringify({
					actorUserId: "body-actor-id",
					impersonationSessionId: "body-session-id",
					targetUserId: "body-target-id",
					userId: "missing-user",
				}),
			},
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			errorCode: "USER_NOT_FOUND",
			message: "User not found",
		});
		expect(start.handlerCalls).toEqual([]);
		expect(auditEntries(capture.entries)).toEqual([
			{
				data: {
					action: "start",
					actorUserId: "admin-1",
					event: "auth.impersonation.failed",
					impersonationSessionId: undefined,
					origin: adminOrigin,
					reasonCode: "USER_NOT_FOUND",
					status: 404,
					targetUserId: undefined,
				},
				level: "warn",
			},
		]);
		const logs = JSON.stringify(capture.entries);
		for (const id of ["body-actor-id", "body-session-id", "body-target-id"]) {
			expect(logs).not.toContain(id);
		}
	});

	test("emits an audit failure when the start wrapper cannot read the actor session", async () => {
		const capture = createCaptureLogger();
		currentLogger = capture.logger;
		const start = createTestApp({
			getSession: async () => {
				throw new Error("session store unavailable");
			},
		});
		const response = await start.app.request(
			`https://api.example${impersonateUserPath}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json", Origin: adminOrigin },
				body: JSON.stringify({ userId: "target-1" }),
			},
		);

		expect(response.status).toBe(500);
		expect(await response.json()).toEqual({
			errorCode: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
		});
		expect(start.transactionCount()).toBe(0);
		expect(auditEntries(capture.entries)).toEqual([
			{
				data: {
					action: "start",
					actorUserId: undefined,
					event: "auth.impersonation.failed",
					impersonationSessionId: undefined,
					origin: adminOrigin,
					reasonCode: "INTERNAL_ERROR",
					status: 500,
					targetUserId: undefined,
				},
				level: "error",
			},
		]);
	});

	test("preserves wrapper responses when lifecycle logging fails", async () => {
		const successfulCapture = createCaptureLogger("info");
		currentLogger = successfulCapture.logger;
		const successfulApp = createTestApp({
			getSession: async () => ({
				user: { id: "admin-1", role: "admin" },
				session: { id: "admin-session-1" },
			}),
		});
		const success = await successfulApp.app.request(
			`https://api.example${impersonateUserPath}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json", Origin: adminOrigin },
				body: JSON.stringify({ userId: "target-1" }),
			},
		);
		expect(success.status).toBe(200);
		expect(await success.json()).toMatchObject({
			session: { id: "impersonation-session-1" },
			user: { id: "target-1" },
		});

		const failingCapture = createCaptureLogger("warn");
		currentLogger = failingCapture.logger;
		const failingApp = createTestApp({
			getSession: async () => ({
				user: { id: "admin-1", role: "admin" },
				session: { id: "admin-session-1" },
			}),
			lockedUser: null,
		});
		const failure = await failingApp.app.request(
			`https://api.example${impersonateUserPath}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json", Origin: adminOrigin },
				body: JSON.stringify({ userId: "missing-user" }),
			},
		);
		expect(failure.status).toBe(404);
		expect(await failure.json()).toEqual({
			errorCode: "USER_NOT_FOUND",
			message: "User not found",
		});
	});

	test("leaves native stop available while blocking only impersonated sign-out", async () => {
		const stopCapture = createCaptureLogger();
		currentLogger = stopCapture.logger;
		const stopApp = createTestApp({
			getSession: async () => ({
				user: { id: "target-1", role: "user" },
				session: {
					id: "impersonation-session-1",
					impersonatedBy: "admin-1",
				},
			}),
			handler: async () =>
				new Response(JSON.stringify({ session: { id: "admin-session-1" } }), {
					headers: {
						"Content-Type": "application/json",
						"Set-Cookie": "better-auth.session_token=restored-session",
					},
				}),
		});
		const stopResponse = await stopApp.app.request(
			"https://api.example/api/auth/admin/stop-impersonating",
			{ method: "POST", headers: { Origin: adminOrigin } },
		);
		expect(stopResponse.status).toBe(200);
		expect(stopResponse.headers.get("Set-Cookie")).toBe(
			"better-auth.session_token=restored-session",
		);
		expect(stopApp.handlerCalls).toHaveLength(1);
		expect(auditEntries(stopCapture.entries)).toEqual([
			{
				data: {
					actorUserId: "admin-1",
					event: "auth.impersonation.stopped",
					impersonationSessionId: "impersonation-session-1",
					origin: adminOrigin,
					status: 200,
					targetUserId: "target-1",
				},
				level: "info",
			},
		]);

		const blockedCapture = createCaptureLogger();
		currentLogger = blockedCapture.logger;
		const blockedApp = createTestApp({
			getSession: async () => ({
				user: { id: "target-1", role: "user" },
				session: { id: "impersonation-session-1", impersonatedBy: "admin-1" },
			}),
		});
		const blocked = await blockedApp.app.request(
			"https://api.example/api/auth/sign-out",
			{ method: "POST" },
		);
		expect(blocked.status).toBe(403);
		expect(await blocked.json()).toEqual({
			errorCode: "IMPERSONATION_STOP_REQUIRED",
			message: "Stop impersonation before signing out",
		});
		expect(blockedApp.handlerCalls).toEqual([]);

		const normalCapture = createCaptureLogger();
		currentLogger = normalCapture.logger;
		const normalApp = createTestApp({
			getSession: async () => ({
				user: { id: "user-1", role: "user" },
				session: { id: "user-session-1" },
			}),
			handler: async () =>
				new Response(JSON.stringify({ success: true }), {
					headers: { "Content-Type": "application/json" },
				}),
		});
		const normal = await normalApp.app.request(
			"https://api.example/api/auth/sign-out",
			{ method: "POST" },
		);
		expect(normal.status).toBe(200);
		expect(await normal.json()).toEqual({ success: true });
		expect(normalApp.handlerCalls).toHaveLength(1);
	});
});
