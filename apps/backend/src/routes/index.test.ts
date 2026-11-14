import { describe, expect, test } from "bun:test";
import { createRoutes } from "./index";

describe("route configuration", () => {
	test.each([
		[true, false],
		[false, true],
	])("keeps the legacy publicSignupEnabled wire value as the inverse of beta mode (%s)", async (betaEnabled, publicSignupEnabled) => {
		const routes = createRoutes({
			isBetaEnabled: () => betaEnabled,
			getSocialLogin: () => ({ google: false, line: false }),
		} as never);

		const response = await routes.request("http://api.test/v1/config");
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			publicSignupEnabled,
			socialLogin: { google: false, line: false },
		});
	});
});
