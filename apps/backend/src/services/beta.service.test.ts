import { describe, expect, test } from "bun:test";
import { type AppConfigInput, createAppConfig } from "../lib/app-config";
import { BetaService } from "./beta.service";

const marketingOrigin = "https://marketing.example.com";
const turnstileUrl =
	"https://challenges.cloudflare.com/turnstile/v0/siteverify";
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

function validRequest() {
	return {
		name: "Ada Lovelace",
		email: "ada@example.com",
		subject: "Mathematics",
		studentCountRange: "6-15" as const,
		hasLineOfficialAccount: true,
		turnstileToken: "turnstile-token",
	};
}

function confirmedDiscordResponse() {
	return new Response(JSON.stringify({ id: "123456789012345678" }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}

describe("BetaService", () => {
	test("exposes only the public beta request configuration", () => {
		const service = new BetaService(createConfig());

		expect(service.getPublicConfig()).toEqual({
			betaEnabled: true,
			requestAvailable: true,
			turnstileSiteKey: "site-key",
		});
		expect(JSON.stringify(service.getPublicConfig())).not.toContain(
			"turnstile-secret",
		);
		expect(JSON.stringify(service.getPublicConfig())).not.toContain(discordUrl);
	});

	test("marks requests unavailable when beta is off or an integration value is missing", () => {
		expect(
			new BetaService(
				createConfig({ BETA_ENABLED: "false" }),
			).getPublicConfig(),
		).toEqual({
			betaEnabled: false,
			requestAvailable: false,
			turnstileSiteKey: "site-key",
		});

		for (const input of [
			{ TURNSTILE_SITE_KEY: "" },
			{ TURNSTILE_SECRET_KEY: "" },
			{ DISCORD_BETA_WEBHOOK_URL: "" },
			{ DISCORD_BETA_WEBHOOK_URL: "http://discord.example/webhook" },
		]) {
			expect(
				new BetaService(createConfig(input)).getPublicConfig().requestAvailable,
			).toBe(false);
		}
	});

	test("does not contact external services when beta is disabled or unavailable", async () => {
		let calls = 0;
		const fetchFn = (async () => {
			calls += 1;
			return confirmedDiscordResponse();
		}) as typeof fetch;

		for (const config of [
			createConfig({ BETA_ENABLED: "false" }),
			createConfig({ TURNSTILE_SECRET_KEY: "" }),
		]) {
			await expect(
				new BetaService(config, fetchFn).submitRequest(validRequest()),
			).rejects.toMatchObject({
				errorCode:
					config.BETA_ENABLED === false
						? "BETA_REQUESTS_DISABLED"
						: "BETA_REQUESTS_UNAVAILABLE",
				status: config.BETA_ENABLED === false ? 404 : 503,
			});
		}
		expect(calls).toBe(0);
	});

	test("verifies the expected token action and exact marketing hostname before posting a bounded Discord payload", async () => {
		const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
		const fetchFn = (async (input: RequestInfo | URL, init?: RequestInit) => {
			calls.push({ input, init });
			if (String(input) === turnstileUrl) {
				return new Response(
					JSON.stringify({
						success: true,
						action: "beta_demo_request",
						hostname: "marketing.example.com",
					}),
				);
			}
			return confirmedDiscordResponse();
		}) as typeof fetch;
		const request = {
			...validRequest(),
			name: "@everyone *Ada*",
			email: "ADA@EXAMPLE.COM",
		};

		await expect(
			new BetaService(createConfig(), fetchFn).submitRequest(
				request,
				" 2001:db8::1 ",
			),
		).resolves.toEqual({ status: "accepted" });

		expect(calls).toHaveLength(2);
		expect(String(calls[0]?.input)).toBe(turnstileUrl);
		expect(calls[0]?.init?.method).toBe("POST");
		const verificationBody = new URLSearchParams(String(calls[0]?.init?.body));
		expect(Object.fromEntries(verificationBody)).toEqual({
			secret: "turnstile-secret",
			response: "turnstile-token",
			remoteip: "2001:db8::1",
		});

		const webhookUrl = new URL(String(calls[1]?.input));
		expect(webhookUrl.origin + webhookUrl.pathname).toBe(discordUrl);
		expect(webhookUrl.searchParams.get("wait")).toBe("true");
		const payload = JSON.parse(String(calls[1]?.init?.body));
		expect(payload.allowed_mentions).toEqual({ parse: [] });
		expect(payload.embeds[0].fields).toEqual([
			{ name: "Name", value: "@everyone \\*Ada\\*" },
			{ name: "Email", value: "ADA@EXAMPLE\\.COM" },
			{ name: "Subject", value: "Mathematics" },
			{ name: "Students", value: "6\\-15" },
			{ name: "LINE Official Account", value: "Yes" },
		]);
		expect(JSON.stringify(payload)).not.toContain("turnstile-token");
	});

	test.each([
		[
			"rejected token",
			{
				success: false,
				action: "beta_demo_request",
				hostname: "marketing.example.com",
			},
		],
		[
			"wrong action",
			{ success: true, action: "login", hostname: "marketing.example.com" },
		],
		[
			"wrong hostname",
			{
				success: true,
				action: "beta_demo_request",
				hostname: "other.example.com",
			},
		],
		["malformed response", {}],
	])("rejects a %s Turnstile result", async (_description, verification) => {
		let calls = 0;
		const fetchFn = (async () => {
			calls += 1;
			return new Response(JSON.stringify(verification));
		}) as typeof fetch;

		await expect(
			new BetaService(createConfig(), fetchFn).submitRequest(validRequest()),
		).rejects.toMatchObject({
			errorCode: "TURNSTILE_VERIFICATION_FAILED",
			status: 400,
		});
		expect(calls).toBe(1);
	});

	test("returns service unavailable for Turnstile transport, HTTP, and JSON failures", async () => {
		for (const result of [
			new Response("unavailable", { status: 503 }),
			new Response("not json"),
			new Error("network unavailable"),
		]) {
			const fetchFn = (async () => {
				if (result instanceof Error) throw result;
				return result;
			}) as typeof fetch;
			await expect(
				new BetaService(createConfig(), fetchFn).submitRequest(validRequest()),
			).rejects.toMatchObject({
				errorCode: "BETA_REQUESTS_UNAVAILABLE",
				status: 503,
			});
		}
	});

	test("requires Discord's confirmed response and maps delivery failures to bad gateway", async () => {
		for (const result of [
			new Response("failure", { status: 500 }),
			new Response("not json"),
			new Response(JSON.stringify({ id: "not-a-discord-id" })),
			new Error("webhook unavailable"),
		]) {
			let call = 0;
			const fetchFn = (async () => {
				call += 1;
				if (call === 1) {
					return new Response(
						JSON.stringify({
							success: true,
							action: "beta_demo_request",
							hostname: "marketing.example.com",
						}),
					);
				}
				if (result instanceof Error) throw result;
				return result;
			}) as typeof fetch;

			await expect(
				new BetaService(createConfig(), fetchFn).submitRequest(validRequest()),
			).rejects.toMatchObject({
				errorCode: "BETA_NOTIFICATION_FAILED",
				status: 502,
			});
		}
	});
});
