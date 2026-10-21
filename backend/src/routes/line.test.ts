import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { LineService } from "../services/line.service";
import type { AppEnv } from "../types/hono-env";
import type { ILineRepository } from "../types/line.types";
import { createLineRoutes } from "./line";

type CallbackStateKind = "student" | "test-recipient" | "unknown";
type CallbackResult =
	| { kind: "student"; success: true; displayName: string }
	| { kind: "test-recipient" };

type CallbackService = {
	classifyCallbackState(state: string): Promise<CallbackStateKind>;
	handleCallback(code: string, state: string): Promise<CallbackResult>;
};

function createCallbackApp(lineService: CallbackService) {
	const app = new Hono<AppEnv>();
	app.route(
		"/v1/line",
		createLineRoutes({
			requireAuth: async (_c, next) => next(),
			lineService: lineService as never,
			getFrontendUrl: () => "https://app.example.com",
		}),
	);
	return app;
}

function createKnownButInvalidCallbackService({
	hasStudentToken = false,
	hasTestRecipientToken = false,
}: {
	hasStudentToken?: boolean;
	hasTestRecipientToken?: boolean;
}) {
	const calls: string[] = [];
	const repository = {
		hasToken: async () => {
			calls.push("hasToken");
			return hasStudentToken;
		},
		hasTestRecipientToken: async () => {
			calls.push("hasTestRecipientToken");
			return hasTestRecipientToken;
		},
		findValidToken: async () => {
			calls.push("findValidToken");
			return null;
		},
		findValidTestRecipientToken: async () => {
			calls.push("findValidTestRecipientToken");
			return null;
		},
	} as unknown as ILineRepository;

	return {
		calls,
		lineService: new LineService(repository, {} as never),
	};
}

async function withoutExpectedErrorLog<T>(work: () => Promise<T>) {
	const originalConsoleError = console.error;
	console.error = () => {};
	try {
		return await work();
	} finally {
		console.error = originalConsoleError;
	}
}

describe("LINE callback route", () => {
	test("preserves the student-link success redirect and encodes the display name", async () => {
		const response = await createCallbackApp({
			classifyCallbackState: async () => "student",
			handleCallback: async () => ({
				kind: "student",
				success: true,
				displayName: "Lin & Kai",
			}),
		}).request(
			"https://api.example.com/v1/line/callback?code=provider-code&state=student-token",
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://app.example.com/line-link?success=true&name=Lin%20%26%20Kai",
		);
	});

	test("redirects a successful test-recipient callback to its connected state", async () => {
		const response = await createCallbackApp({
			classifyCallbackState: async () => "test-recipient",
			handleCallback: async () => ({ kind: "test-recipient" }),
		}).request(
			"https://api.example.com/v1/line/callback?code=provider-code&state=test-token",
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://app.example.com/settings/line?testRecipient=connected",
		);
	});

	test.each([
		[
			"an OAuth error without a code",
			"https://api.example.com/v1/line/callback?error=ACCESS_DENIED&state=test-token",
		],
		[
			"an OAuth error with a code",
			"https://api.example.com/v1/line/callback?code=provider-code&error=ACCESS_DENIED&state=test-token",
		],
		[
			"a missing authorization code",
			"https://api.example.com/v1/line/callback?state=test-token",
		],
	])("routes a known test-recipient callback with %s to LINE settings without handling it", async (_scenario, callbackUrl) => {
		let callbackCalls = 0;
		const response = await createCallbackApp({
			classifyCallbackState: async () => "test-recipient",
			handleCallback: async () => {
				callbackCalls += 1;
				return { kind: "test-recipient" };
			},
		}).request(callbackUrl);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://app.example.com/settings/line?testRecipient=error",
		);
		expect(callbackCalls).toBe(0);
	});

	test.each([
		[
			"an OAuth error",
			"https://api.example.com/v1/line/callback?error=ACCESS_DENIED&state=student-token",
			"https://app.example.com/line-link?error=link_failed",
		],
		[
			"a missing authorization code",
			"https://api.example.com/v1/line/callback?state=student-token",
			"https://app.example.com/line-link?error=missing_params",
		],
	])("routes a known student callback with %s without handling it", async (_scenario, callbackUrl, expectedLocation) => {
		let callbackCalls = 0;
		const response = await createCallbackApp({
			classifyCallbackState: async () => "student",
			handleCallback: async () => {
				callbackCalls += 1;
				return {
					kind: "student",
					success: true,
					displayName: "Lin",
				};
			},
		}).request(callbackUrl);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(expectedLocation);
		expect(callbackCalls).toBe(0);
	});

	test.each([
		[
			"an OAuth error",
			"https://api.example.com/v1/line/callback?error=ACCESS_DENIED&state=unknown-token",
			"https://app.example.com/line-link?error=link_failed",
		],
		[
			"a missing authorization code",
			"https://api.example.com/v1/line/callback?state=unknown-token",
			"https://app.example.com/line-link?error=missing_params",
		],
	])("routes an unknown callback with %s without handling it", async (_scenario, callbackUrl, expectedLocation) => {
		let callbackCalls = 0;
		const response = await createCallbackApp({
			classifyCallbackState: async () => "unknown",
			handleCallback: async () => {
				callbackCalls += 1;
				return { kind: "test-recipient" };
			},
		}).request(callbackUrl);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(expectedLocation);
		expect(callbackCalls).toBe(0);
	});

	test.each([
		"expired",
		"already used",
	])("routes a known %s test-recipient token failure to LINE settings", async () => {
		const { calls, lineService } = createKnownButInvalidCallbackService({
			hasTestRecipientToken: true,
		});

		const response = await withoutExpectedErrorLog(() =>
			createCallbackApp(lineService).request(
				"https://api.example.com/v1/line/callback?code=provider-code&state=test-token",
			),
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://app.example.com/settings/line?testRecipient=error",
		);
		expect(calls).toEqual([
			"hasToken",
			"hasTestRecipientToken",
			"findValidToken",
			"findValidTestRecipientToken",
		]);
	});

	test("gives a student callback state precedence when token values collide", async () => {
		const { calls, lineService } = createKnownButInvalidCallbackService({
			hasStudentToken: true,
			hasTestRecipientToken: true,
		});

		const response = await withoutExpectedErrorLog(() =>
			createCallbackApp(lineService).request(
				"https://api.example.com/v1/line/callback?code=provider-code&state=shared-token",
			),
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://app.example.com/line-link?error=link_failed",
		);
		expect(calls).toEqual([
			"hasToken",
			"findValidToken",
			"findValidTestRecipientToken",
		]);
	});

	test("keeps unknown callback state failures on the student-link error route", async () => {
		const { calls, lineService } = createKnownButInvalidCallbackService({});

		const response = await withoutExpectedErrorLog(() =>
			createCallbackApp(lineService).request(
				"https://api.example.com/v1/line/callback?code=provider-code&state=unknown-token",
			),
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://app.example.com/line-link?error=link_failed",
		);
		expect(calls).toEqual([
			"hasToken",
			"hasTestRecipientToken",
			"findValidToken",
			"findValidTestRecipientToken",
		]);
	});

	test("returns the existing missing-parameters redirect before classifying state", async () => {
		let classifyCalls = 0;
		let callbackCalls = 0;
		const response = await createCallbackApp({
			classifyCallbackState: async () => {
				classifyCalls += 1;
				return "unknown";
			},
			handleCallback: async () => {
				callbackCalls += 1;
				return { kind: "test-recipient" };
			},
		}).request("https://api.example.com/v1/line/callback?code=provider-code");

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://app.example.com/line-link?error=missing_params",
		);
		expect(classifyCalls).toBe(0);
		expect(callbackCalls).toBe(0);
	});

	test("treats a classification failure as unknown before a code callback", async () => {
		let callbackCalls = 0;
		const response = await withoutExpectedErrorLog(() =>
			createCallbackApp({
				classifyCallbackState: async () => {
					throw new Error("database unavailable");
				},
				handleCallback: async () => {
					callbackCalls += 1;
					return {
						kind: "student",
						success: true,
						displayName: "Lin",
					};
				},
			}).request(
				"https://api.example.com/v1/line/callback?code=provider-code&state=test-token",
			),
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://app.example.com/line-link?success=true&name=Lin",
		);
		expect(callbackCalls).toBe(1);
	});

	test("does not call the handler without a code when classification fails", async () => {
		let callbackCalls = 0;
		const response = await withoutExpectedErrorLog(() =>
			createCallbackApp({
				classifyCallbackState: async () => {
					throw new Error("database unavailable");
				},
				handleCallback: async () => {
					callbackCalls += 1;
					return { kind: "test-recipient" };
				},
			}).request("https://api.example.com/v1/line/callback?state=test-token"),
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://app.example.com/line-link?error=missing_params",
		);
		expect(callbackCalls).toBe(0);
	});

	test("does not call the handler for an OAuth error when classification fails", async () => {
		let callbackCalls = 0;
		const response = await withoutExpectedErrorLog(() =>
			createCallbackApp({
				classifyCallbackState: async () => {
					throw new Error("database unavailable");
				},
				handleCallback: async () => {
					callbackCalls += 1;
					return { kind: "test-recipient" };
				},
			}).request(
				"https://api.example.com/v1/line/callback?error=ACCESS_DENIED&state=test-token",
			),
		);

		expect(response.status).toBe(302);
		expect(response.headers.get("Location")).toBe(
			"https://app.example.com/line-link?error=link_failed",
		);
		expect(callbackCalls).toBe(0);
	});
});
