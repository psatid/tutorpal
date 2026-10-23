import { describe, expect, test } from "bun:test";
import { createApp } from "./app";
import { createAppConfig } from "./lib/app-config";

const config = createAppConfig({
	ADMIN_FRONTEND_URL: "https://admin.example.com",
	BETTER_AUTH_SECRET: "test-secret-with-at-least-thirty-two-characters",
	LOG_LEVEL: "silent",
	RESEND_API_KEY: "test-resend-key",
});

function createStopTestApp(handler: (request: Request) => Promise<Response>) {
	return createApp({
		auth: {
			api: {
				getSession: async () => ({
					user: { id: "target-1", role: "user" },
					session: {
						id: "impersonation-session-1",
						impersonatedBy: "admin-1",
					},
				}),
			},
			handler,
		} as never,
		config,
		prisma: {} as never,
		routes: {} as never,
	});
}

describe("stop impersonation response normalization", () => {
	test("replaces only Better Auth's unavailable-admin-session failure", async () => {
		const app = createStopTestApp(
			async () =>
				new Response(
					JSON.stringify({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to find admin session",
					}),
					{
						status: 500,
						headers: {
							"Content-Type": "application/json",
							"Set-Cookie": "native-cookie",
						},
					},
				),
		);

		const response = await app.request(
			"https://api.example/api/auth/admin/stop-impersonating",
			{ method: "POST" },
		);

		expect(response.status).toBe(500);
		expect(response.headers.has("Set-Cookie")).toBe(false);
		expect(await response.json()).toEqual({
			errorCode: "IMPERSONATION_ADMIN_SESSION_UNAVAILABLE",
			message:
				"The original administrator session is no longer available. Please sign in again.",
		});
	});

	test("preserves unknown failures and successful native stop responses", async () => {
		const unknownFailureApp = createStopTestApp(
			async () =>
				new Response(
					JSON.stringify({
						code: "INTERNAL_SERVER_ERROR",
						message: "Database temporarily unavailable",
					}),
					{
						status: 500,
						headers: {
							"Content-Type": "application/json",
							"Set-Cookie": "retry-cookie",
							"X-Retryable": "true",
						},
					},
				),
		);
		const unknownFailure = await unknownFailureApp.request(
			"https://api.example/api/auth/admin/stop-impersonating",
			{ method: "POST" },
		);

		expect(unknownFailure.status).toBe(500);
		expect(unknownFailure.headers.get("Set-Cookie")).toBe("retry-cookie");
		expect(unknownFailure.headers.get("X-Retryable")).toBe("true");
		expect(await unknownFailure.json()).toEqual({
			code: "INTERNAL_SERVER_ERROR",
			message: "Database temporarily unavailable",
		});

		const successfulStopApp = createStopTestApp(
			async () =>
				new Response(JSON.stringify({ session: { id: "admin-session-1" } }), {
					headers: {
						"Content-Type": "application/json",
						"Set-Cookie": "restored-cookie",
					},
				}),
		);
		const successfulStop = await successfulStopApp.request(
			"https://api.example/api/auth/admin/stop-impersonating",
			{ method: "POST" },
		);

		expect(successfulStop.status).toBe(200);
		expect(successfulStop.headers.get("Set-Cookie")).toBe("restored-cookie");
		expect(await successfulStop.json()).toEqual({
			session: { id: "admin-session-1" },
		});
	});
});
