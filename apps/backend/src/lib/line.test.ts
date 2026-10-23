import { describe, expect, test } from "bun:test";
import { type LinePushError, sendLinePushMessage } from "./line";

function fetchMock(
	originalFetch: typeof fetch,
	implementation: (
		input: Parameters<typeof fetch>[0],
		init?: Parameters<typeof fetch>[1],
	) => Promise<Response>,
): typeof fetch {
	return Object.assign(implementation, {
		preconnect: originalFetch.preconnect,
	}) as typeof fetch;
}

describe("sendLinePushMessage", () => {
	test("uses the stable retry key and exposes retriable server errors", async () => {
		const originalFetch = globalThis.fetch;
		const request = { retryKey: null as string | null };
		globalThis.fetch = fetchMock(originalFetch, async (_input, init) => {
			request.retryKey = new Headers(init?.headers).get("X-Line-Retry-Key");
			return new Response(null, {
				status: 503,
				headers: { "x-line-request-id": "request-1" },
			});
		});

		try {
			await expect(
				sendLinePushMessage(
					"student-line-id",
					[{ type: "text", text: "reminder" }],
					"channel-token",
					"stable-retry-key",
				),
			).rejects.toMatchObject({
				kind: "server",
				status: 503,
				providerRequestId: "request-1",
			} satisfies Partial<LinePushError>);
			expect(request.retryKey).toBe("stable-retry-key");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test("treats LINE duplicate retry responses as successful delivery", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = fetchMock(
			originalFetch,
			async () =>
				new Response(null, {
					status: 409,
					headers: { "x-line-request-id": "duplicate-request" },
				}),
		);

		try {
			await expect(
				sendLinePushMessage(
					"student-line-id",
					[{ type: "text", text: "reminder" }],
					"channel-token",
					"stable-retry-key",
				),
			).resolves.toBe("duplicate-request");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test("classifies aborted provider requests as retriable timeouts", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = fetchMock(originalFetch, async () => {
			throw new DOMException("aborted", "AbortError");
		});

		try {
			await expect(
				sendLinePushMessage(
					"student-line-id",
					[{ type: "text", text: "reminder" }],
					"channel-token",
				),
			).rejects.toMatchObject({
				kind: "timeout",
			} satisfies Partial<LinePushError>);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	test("classifies AbortSignal TimeoutError responses as retriable timeouts", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = fetchMock(originalFetch, async () => {
			throw new DOMException("timed out", "TimeoutError");
		});

		try {
			await expect(
				sendLinePushMessage(
					"student-line-id",
					[{ type: "text", text: "reminder" }],
					"channel-token",
				),
			).rejects.toMatchObject({
				kind: "timeout",
			} satisfies Partial<LinePushError>);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
