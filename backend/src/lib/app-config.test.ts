import { describe, expect, test } from "bun:test";
import { createAppConfig, parseBooleanFlag } from "./app-config";

describe("application configuration", () => {
	test("defaults public signup to disabled", () => {
		expect(createAppConfig({ LOG_LEVEL: "info" }).PUBLIC_SIGNUP_ENABLED).toBe(
			false,
		);
	});

	test("parses the explicit public signup flag", () => {
		expect(parseBooleanFlag("true")).toBe(true);
		expect(parseBooleanFlag("false")).toBe(false);
	});

	test("rejects ambiguous public signup values", () => {
		expect(() => parseBooleanFlag("1")).toThrow('Expected "true" or "false"');
	});
});
