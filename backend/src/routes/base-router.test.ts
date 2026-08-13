import { describe, expect, test } from "bun:test";
import { createBaseRoutes } from "./base-router";

describe("base routes", () => {
	test("returns the server-owned public signup flag", async () => {
		const response = await createBaseRoutes(() => false).fetch(
			new Request("http://localhost/config"),
		);

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({ publicSignupEnabled: false });
	});
});
