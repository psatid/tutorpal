import { describe, expect, test } from "bun:test";
import { createAppConfig, parseBooleanFlag } from "./app-config";

describe("application configuration", () => {
	test("defaults public signup to disabled", () => {
		const config = createAppConfig({ LOG_LEVEL: "info" });

		expect(config.PUBLIC_SIGNUP_ENABLED).toBe(false);
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

	test("parses the explicit public signup flag", () => {
		expect(parseBooleanFlag("true")).toBe(true);
		expect(parseBooleanFlag("false")).toBe(false);
	});

	test("rejects ambiguous public signup values", () => {
		expect(() => parseBooleanFlag("1")).toThrow('Expected "true" or "false"');
	});
});
