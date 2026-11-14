import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { type AppConfigInput, createAppConfig } from "../lib/app-config";
import { errorHandler } from "../middleware/error-handler";
import { BetaService } from "../services/beta.service";
import { createBetaRoutes } from "./beta";

const marketingOrigin = "https://marketing.example.com";
const discordUrl = "https://discord.com/api/webhooks/123/token";

function createConfig(input: AppConfigInput = {}) {
	return createAppConfig({
		LOG_LEVEL: "silent",
		BETA_ENABLED: "true",
		MARKETING_ORIGIN: marketingOrigin,
		TURNSTILE_SITE_KEY: "site-key",
		TURNSTILE_SECRET_KEY: "turnstile-secret",
		DISCORD_BETA_WEBHOOK_URL: discordUrl,
		...input,
	});
}

function createApp(config: AppConfigInput = {}) {
	const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
	const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
		requests.push({ input, init });
		if (String(input).includes("siteverify")) {
			return new Response(
				JSON.stringify({
					success: true,
					action: "beta_demo_request",
					hostname: "marketing.example.com",
				}),
			);
		}
		return new Response(JSON.stringify({ id: "123456789012345678" }));
	}) as typeof fetch;
	const app = new Hono();
	app.onError(errorHandler);
	app.route(
		"/v1/beta",
		createBetaRoutes({
			betaService: new BetaService(createConfig(config), fetchFn),
			marketingOrigin,
		}),
	);

	return { app, requests };
}

function post(app: Hono, body: unknown, origin = marketingOrigin) {
	return app.request("http://api.test/v1/beta/requests", {
		method: "POST",
		headers: { "Content-Type": "application/json", Origin: origin },
		body: JSON.stringify(body),
	});
}

function validBody() {
	return {
		name: "  Ada Lovelace  ",
		email: " ADA@EXAMPLE.COM ",
		subject: " Mathematics ",
		studentCountRange: "6-15",
		hasLineOfficialAccount: false,
		turnstileToken: "turnstile-token",
	};
}

describe("beta routes", () => {
	test("returns the server-owned beta configuration without secret values", async () => {
		const { app } = createApp();

		const response = await app.request("http://api.test/v1/beta/config");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			betaEnabled: true,
			requestAvailable: true,
			turnstileSiteKey: "site-key",
		});
	});

	test("accepts only a strict valid beta request from the exact marketing origin", async () => {
		const { app, requests } = createApp();

		const response = await post(app, validBody());
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ status: "accepted" });
		expect(requests).toHaveLength(2);
		const webhookPayload = JSON.parse(String(requests[1]?.init?.body));
		expect(webhookPayload.embeds[0].fields).toContainEqual({
			name: "Email",
			value: "ada@example\\.com",
		});
		expect(webhookPayload.embeds[0].fields).toContainEqual({
			name: "Name",
			value: "Ada Lovelace",
		});
	});

	test.each([
		["missing name", { ...validBody(), name: "" }],
		["invalid email", { ...validBody(), email: "invalid" }],
		["invalid student range", { ...validBody(), studentCountRange: "31+" }],
		["missing Turnstile token", { ...validBody(), turnstileToken: "" }],
		["unknown input", { ...validBody(), unexpected: true }],
	])("rejects %s before contacting external services", async (_description, body) => {
		const { app, requests } = createApp();

		const response = await post(app, body);
		expect(response.status).toBe(400);
		expect(requests).toEqual([]);
	});

	test("rejects non-marketing origins before validating or sending the request", async () => {
		const { app, requests } = createApp();

		const response = await post(app, {}, "https://attacker.example.com");
		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({
			errorCode: "BETA_REQUEST_ORIGIN_INVALID",
			message: "Invalid request origin.",
		});
		expect(requests).toEqual([]);
	});

	test("returns not found before body validation when beta requests are disabled", async () => {
		const { app, requests } = createApp({ BETA_ENABLED: "false" });

		const response = await post(app, {});
		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({
			errorCode: "BETA_REQUESTS_DISABLED",
			message: "Beta requests are not available.",
		});
		expect(requests).toEqual([]);
	});

	test("returns service unavailable before body validation when request integrations are incomplete", async () => {
		const { app, requests } = createApp({ TURNSTILE_SECRET_KEY: "" });

		const response = await post(app, {});
		expect(response.status).toBe(503);
		expect(await response.json()).toEqual({
			errorCode: "BETA_REQUESTS_UNAVAILABLE",
			message: "Beta requests are temporarily unavailable.",
		});
		expect(requests).toEqual([]);
	});
});
