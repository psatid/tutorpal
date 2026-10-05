import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { AppError } from "../lib/error";
import { errorHandler } from "../middleware/error-handler";
import type { AppEnv } from "../types/hono-env";
import { createRoutes } from "./index";
import { createSocialAccountRoutes } from "./social-accounts";

function createApp({
	startLineEnrollment = async () => ({
		authorizationUrl: "https://access.line.me/authorize?state=state-1",
	}),
	completeLineEnrollment = async () => {},
	logger,
}: {
	startLineEnrollment?: (input: {
		userId: string;
		impersonatedBy: unknown;
	}) => Promise<{ authorizationUrl: string }>;
	completeLineEnrollment?: (input: {
		code?: string;
		state?: string;
	}) => Promise<void>;
	logger?: { warn(data: Record<string, unknown>): void };
} = {}) {
	const app = new Hono<AppEnv>();
	app.route(
		"/v1/auth/social-accounts",
		createSocialAccountRoutes({
			requireAuth: async (c, next) => {
				c.set("user", { id: "user-1" } as never);
				c.set("session", { impersonatedBy: "admin-1" } as never);
				await next();
			},
			socialAccountService: {
				startLineEnrollment,
				completeLineEnrollment,
			} as never,
			getFrontendUrl: () => "https://app.example.com/base/path",
			logger: logger as never,
		}),
	);
	return app;
}

function createAppWithErrorHandler(
	startLineEnrollment: () => Promise<{ authorizationUrl: string }>,
) {
	const app = new Hono<AppEnv>();
	app.onError(errorHandler);
	app.route(
		"/v1/auth/social-accounts",
		createSocialAccountRoutes({
			requireAuth: async (c, next) => {
				c.set("user", { id: "user-1" } as never);
				c.set("session", { impersonatedBy: null } as never);
				await next();
			},
			socialAccountService: { startLineEnrollment } as never,
			getFrontendUrl: () => "https://app.example.com",
		}),
	);
	return app;
}

describe("social account routes", () => {
	test("keeps the existing public LINE messaging route composed alongside social accounts", async () => {
		let token: string | undefined;
		const app = createRoutes({
			lineService: {
				getAuthUrl: async (value: string) => {
					token = value;
					return { authUrl: "https://access.line.me/authorize?state=student" };
				},
			},
			getFrontendUrl: () => "https://app.example.com",
			getSocialLogin: () => ({ google: false, line: true }),
			isPublicSignupEnabled: () => false,
		} as never);

		const response = await app.request(
			"https://api.example.com/v1/line/auth-url?token=student-link-token",
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			authUrl: "https://access.line.me/authorize?state=student",
		});
		expect(token).toBe("student-link-token");
	});

	test("starts enrollment only after auth and forwards the current identity", async () => {
		let received: unknown;
		const response = await createApp({
			startLineEnrollment: async (input) => {
				received = input;
				return {
					authorizationUrl: "https://access.line.me/authorize?state=state-1",
				};
			},
		}).request(
			"https://api.example.com/v1/auth/social-accounts/line/authorization",
			{
				method: "POST",
			},
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			authorizationUrl: "https://access.line.me/authorize?state=state-1",
		});
		expect(received).toEqual({ userId: "user-1", impersonatedBy: "admin-1" });
	});

	test("returns the documented 404 when LINE sign-in is unconfigured", async () => {
		const response = await createAppWithErrorHandler(async () => {
			throw AppError.notFound(
				"LINE_SOCIAL_LOGIN_UNAVAILABLE",
				"LINE sign-in is not configured.",
			);
		}).request(
			"https://api.example.com/v1/auth/social-accounts/line/authorization",
			{ method: "POST" },
		);

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			errorCode: "LINE_SOCIAL_LOGIN_UNAVAILABLE",
			message: "LINE sign-in is not configured.",
		});
	});

	test("redirects callback success and every callback failure to fixed, detail-free URLs", async () => {
		const success = await createApp().request(
			"https://api.example.com/v1/auth/social-accounts/line/callback?code=code&state=state",
		);
		expect(success.status).toBe(302);
		expect(success.headers.get("Location")).toBe(
			"https://app.example.com/settings/account?line=connected",
		);

		const failure = await createApp({
			completeLineEnrollment: async () => {
				throw new Error("provider secret must not be exposed");
			},
		}).request("https://api.example.com/v1/auth/social-accounts/line/callback");
		expect(failure.status).toBe(302);
		expect(failure.headers.get("Location")).toBe(
			"https://app.example.com/settings/account?line=error",
		);
	});

	test("logs only a stable failure reason without changing the fixed redirect", async () => {
		const entries: Record<string, unknown>[] = [];
		const failure = await createApp({
			logger: { warn: (entry) => entries.push(entry) },
			completeLineEnrollment: async () => {
				throw new Error("provider-code=secret; email=tutor@example.com");
			},
		}).request(
			"https://api.example.com/v1/auth/social-accounts/line/callback?code=provider-code&state=state-token",
		);

		expect(failure.status).toBe(302);
		expect(failure.headers.get("Location")).toBe(
			"https://app.example.com/settings/account?line=error",
		);
		expect(entries).toEqual([
			{
				event: "auth.social_account.line_enrollment.failed",
				provider: "line",
				reasonCode: "UNEXPECTED_ERROR",
			},
		]);
		expect(JSON.stringify(entries)).not.toContain("provider-code");
		expect(JSON.stringify(entries)).not.toContain("tutor@example.com");
	});

	test("preserves the fixed error redirect when failure logging throws", async () => {
		const failure = await createApp({
			logger: {
				warn: () => {
					throw new Error("logger unavailable");
				},
			},
			completeLineEnrollment: async () => {
				throw new Error("provider failure");
			},
		}).request(
			"https://api.example.com/v1/auth/social-accounts/line/callback?code=code&state=state",
		);

		expect(failure.status).toBe(302);
		expect(failure.headers.get("Location")).toBe(
			"https://app.example.com/settings/account?line=error",
		);
	});
});
