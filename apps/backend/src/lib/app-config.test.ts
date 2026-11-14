import { describe, expect, test } from "bun:test";
import { createAppConfig, parseBooleanFlag } from "./app-config";

describe("application configuration", () => {
	test("defaults beta mode to enabled", () => {
		const config = createAppConfig({ LOG_LEVEL: "info" });

		expect(config.BETA_ENABLED).toBe(true);
		expect(config.MARKETING_ORIGIN).toBe("http://localhost:4321");
		expect(config.TURNSTILE_SITE_KEY).toBe("");
		expect(config.TURNSTILE_SECRET_KEY).toBe("");
		expect(config.DISCORD_BETA_WEBHOOK_URL).toBe("");
		expect(config.SOCIAL_LOGIN).toEqual({ google: false, line: false });
	});

	test("enables each social login only when its credential pair is complete", () => {
		const config = createAppConfig({
			LOG_LEVEL: "silent",
			GOOGLE_CLIENT_ID: "google-client-id",
			GOOGLE_CLIENT_SECRET: "google-client-secret",
			LINE_LOGIN_CHANNEL_ID: "line-channel-id",
			LINE_LOGIN_CHANNEL_SECRET: "line-channel-secret",
		});

		expect(config.SOCIAL_LOGIN).toEqual({ google: true, line: true });
	});

	test.each([
		[
			{ GOOGLE_CLIENT_ID: "google-client-id", GOOGLE_CLIENT_SECRET: "secret" },
			{ google: true, line: false },
		],
		[
			{
				LINE_LOGIN_CHANNEL_ID: "line-channel-id",
				LINE_LOGIN_CHANNEL_SECRET: "secret",
			},
			{ google: false, line: true },
		],
	] as const)("enables only the configured provider", (credentials, socialLogin) => {
		expect(
			createAppConfig({ LOG_LEVEL: "silent", ...credentials }).SOCIAL_LOGIN,
		).toEqual(socialLogin);
	});

	test.each([
		["Google", { GOOGLE_CLIENT_ID: "google-client-id" }],
		["Google", { GOOGLE_CLIENT_SECRET: "google-client-secret" }],
		["LINE Login", { LINE_LOGIN_CHANNEL_ID: "line-channel-id" }],
		["LINE Login", { LINE_LOGIN_CHANNEL_SECRET: "line-channel-secret" }],
	] as const)("rejects incomplete %s OAuth credentials", (provider, credentials) => {
		expect(() =>
			createAppConfig({ LOG_LEVEL: "silent", ...credentials }),
		).toThrow(`Incomplete ${provider} OAuth configuration`);
	});

	test("parses the explicit beta flag", () => {
		expect(parseBooleanFlag("true")).toBe(true);
		expect(parseBooleanFlag("false")).toBe(false);
		expect(
			createAppConfig({ BETA_ENABLED: "false", LOG_LEVEL: "silent" })
				.BETA_ENABLED,
		).toBe(false);
	});

	test("rejects ambiguous beta values", () => {
		expect(() => parseBooleanFlag("1")).toThrow('Expected "true" or "false"');
	});

	test("accepts only an exact HTTP(S) marketing origin", () => {
		expect(
			createAppConfig({
				LOG_LEVEL: "silent",
				MARKETING_ORIGIN: "https://marketing.example.com",
			}).MARKETING_ORIGIN,
		).toBe("https://marketing.example.com");

		for (const origin of [
			"https://marketing.example.com/landing",
			"https://marketing.example.com/",
			"https://user@marketing.example.com",
			"ftp://marketing.example.com",
			"not a url",
		]) {
			expect(() =>
				createAppConfig({ LOG_LEVEL: "silent", MARKETING_ORIGIN: origin }),
			).toThrow("MARKETING_ORIGIN");
		}
	});
});
