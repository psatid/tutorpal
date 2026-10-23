import { describe, expect, test } from "bun:test";

const { getApiErrorCode } = await import("./api-client.ts?error-code-test");

describe("getApiErrorCode", () => {
	test("returns a valid backend error code", () => {
		expect(
			getApiErrorCode({
				isAxiosError: true,
				response: { data: { errorCode: "USER_EMAIL_EXISTS" } },
			}),
		).toBe("USER_EMAIL_EXISTS");
	});

	test("returns undefined for malformed Axios response data", () => {
		for (const data of [null, undefined, "error", 400, false, [], {}]) {
			expect(
				getApiErrorCode({ isAxiosError: true, response: { data } }),
			).toBeUndefined();
		}

		expect(
			getApiErrorCode({
				isAxiosError: true,
				response: { data: { errorCode: 400 } },
			}),
		).toBeUndefined();
	});

	test("returns undefined for network and non-Axios errors", () => {
		expect(getApiErrorCode({ isAxiosError: true })).toBeUndefined();
		expect(getApiErrorCode({ isAxiosError: true, response: null })).toBeUndefined();
		expect(
			getApiErrorCode({ response: { data: { errorCode: "USER_NOT_FOUND" } } }),
		).toBeUndefined();
	});
});
