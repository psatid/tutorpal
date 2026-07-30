import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import type { Logger } from "pino";
import { AppError } from "../lib/error";
import { errorHandler } from "./error-handler";
import { createRequestLogger } from "./request-logger";

type LogEntry = {
	args: unknown[];
	level: "error" | "info" | "warn";
};

class UncloneableResponse extends Response {
	override clone = (): Response => {
		throw new Error("response cloning failed");
	};
}

function createCaptureLogger(
	options: {
		onLog?: (entry: LogEntry) => void;
		throwOn?: LogEntry["level"];
	} = {},
) {
	const entries: LogEntry[] = [];
	const record = (entry: LogEntry) => {
		entries.push(entry);
		options.onLog?.(entry);
	};
	const logger = {
		error: (...args: unknown[]) => {
			if (options.throwOn === "error") throw new Error("logger failed");
			record({ args, level: "error" });
		},
		info: (...args: unknown[]) => {
			if (options.throwOn === "info") throw new Error("logger failed");
			record({ args, level: "info" });
		},
		warn: (...args: unknown[]) => {
			if (options.throwOn === "warn") throw new Error("logger failed");
			record({ args, level: "warn" });
		},
	};

	return { entries, logger: logger as unknown as Logger };
}

function createApp(logger: Logger, configure: (app: Hono) => void): Hono {
	const app = new Hono();
	app.use(createRequestLogger(logger));
	app.onError(errorHandler);
	configure(app);
	return app;
}

function data(entry: LogEntry): Record<string, unknown> {
	return entry.args[0] as Record<string, unknown>;
}

describe("createRequestLogger", () => {
	test("logs one info completion event for success and redirects without response data", async () => {
		const capture = createCaptureLogger();
		const app = createApp(capture.logger, (routes) => {
			routes.get("/ok", (c) => c.json({ ok: true }));
			routes.get("/redirect", (c) => c.redirect("/ok", 302));
		});

		await app.request("http://api.test/ok?token=query-secret");
		await app.request("http://api.test/redirect");

		expect(capture.entries).toHaveLength(2);
		for (const entry of capture.entries) {
			expect(entry.level).toBe("info");
			expect(data(entry)).toMatchObject({
				event: "http.request.completed",
				method: "GET",
			});
			expect(data(entry)).not.toHaveProperty("response");
			expect(data(entry).durationMs).toEqual(expect.any(Number));
			expect(data(entry).durationMs as number).toBeGreaterThanOrEqual(0);
		}
		expect(data(capture.entries[0] as LogEntry)).toMatchObject({
			pathname: "/ok",
			status: 200,
		});
		expect(data(capture.entries[1] as LogEntry)).toMatchObject({
			pathname: "/redirect",
			status: 302,
		});
	});

	test("logs AppError responses at warn without an error object and preserves the body", async () => {
		const capture = createCaptureLogger();
		const app = createApp(capture.logger, (routes) => {
			routes.get("/invalid", () => {
				throw AppError.badRequest("INVALID_INPUT", "Invalid input");
			});
		});

		const response = await app.request("http://api.test/invalid");

		expect(await response.json()).toEqual({
			errorCode: "INVALID_INPUT",
			message: "Invalid input",
		});
		expect(capture.entries).toHaveLength(1);
		expect(capture.entries[0]).toMatchObject({ level: "warn" });
		expect(data(capture.entries[0] as LogEntry)).toEqual(
			expect.objectContaining({
				event: "http.request.failed",
				pathname: "/invalid",
				response: { errorCode: "INVALID_INPUT", message: "Invalid input" },
				status: 400,
			}),
		);
		expect(data(capture.entries[0] as LogEntry)).not.toHaveProperty("err");
	});

	test("logs unexpected errors once with the generic response and original error", async () => {
		const capture = createCaptureLogger();
		const error = new Error("database unavailable");
		const app = createApp(capture.logger, (routes) => {
			routes.get("/unexpected", () => {
				throw error;
			});
		});

		const response = await app.request("http://api.test/unexpected");

		expect(await response.json()).toEqual({
			errorCode: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
		});
		expect(capture.entries).toHaveLength(1);
		expect(capture.entries[0]).toMatchObject({ level: "error" });
		expect(data(capture.entries[0] as LogEntry)).toMatchObject({
			event: "http.request.failed",
			err: error,
			response: {
				errorCode: "INTERNAL_ERROR",
				message: "An unexpected error occurred",
			},
			status: 500,
		});
	});

	test("logs an unexpected error from a direct root handler", async () => {
		const capture = createCaptureLogger();
		const error = new Error("root handler failed");
		const app = createApp(capture.logger, (routes) => {
			routes.get("/root-unexpected", () => {
				throw error;
			});
		});

		const response = await app.request("http://api.test/root-unexpected");

		expect(await response.json()).toEqual({
			errorCode: "INTERNAL_ERROR",
			message: "An unexpected error occurred",
		});
		expect(capture.entries).toHaveLength(1);
		expect(data(capture.entries[0] as LogEntry)).toMatchObject({
			err: error,
			status: 500,
		});
	});

	test("captures text and oversized error responses without consuming them", async () => {
		const capture = createCaptureLogger();
		const oversizedBody = "x".repeat(8 * 1024 + 1);
		const app = createApp(capture.logger, (routes) => {
			routes.get("/missing", (c) => c.text("Not found", 404));
			routes.get("/oversized", (c) => c.text(oversizedBody, 500));
		});

		const missing = await app.request("http://api.test/missing");
		expect(await missing.text()).toBe("Not found");
		const oversized = await app.request("http://api.test/oversized");
		expect(await oversized.text()).toBe(oversizedBody);

		expect(data(capture.entries[0] as LogEntry)).toMatchObject({
			response: { body: "Not found", contentType: "text/plain; charset=UTF-8" },
			status: 404,
		});
		expect(data(capture.entries[1] as LogEntry)).toMatchObject({
			response: {
				contentType: "text/plain; charset=UTF-8",
				size: oversizedBody.length,
				truncated: true,
			},
			status: 500,
		});
	});

	test("bounds unknown-length streams and records declared response sizes", async () => {
		let chunksRead = 0;
		let chunksReadWhenLogged = 0;
		const capture = createCaptureLogger({
			onLog: () => {
				if (chunksReadWhenLogged === 0) {
					chunksReadWhenLogged = chunksRead;
				}
			},
		});
		const oversizedStream = new ReadableStream<Uint8Array>({
			pull(controller) {
				chunksRead += 1;
				controller.enqueue(new TextEncoder().encode("x".repeat(4 * 1024 + 1)));
				if (chunksRead === 100) controller.close();
			},
		});
		const app = createApp(capture.logger, (routes) => {
			routes.get(
				"/stream",
				() =>
					new Response(oversizedStream, {
						status: 500,
						headers: { "content-type": "text/plain" },
					}),
			);
			routes.get(
				"/declared-size",
				() =>
					new Response("small body", {
						status: 400,
						headers: {
							"content-length": "9000",
							"content-type": "text/plain",
						},
					}),
			);
		});

		const streamResponse = await app.request("http://api.test/stream");
		expect(await streamResponse.text()).toHaveLength(100 * (4 * 1024 + 1));
		const declaredResponse = await app.request("http://api.test/declared-size");
		expect(await declaredResponse.text()).toBe("small body");

		expect(chunksReadWhenLogged).toBeLessThan(100);
		expect(data(capture.entries[0] as LogEntry)).toMatchObject({
			response: {
				observedBytes: 2 * (4 * 1024 + 1),
				size: 2 * (4 * 1024 + 1),
				sizeIsLowerBound: true,
				truncated: true,
			},
		});
		expect(data(capture.entries[1] as LogEntry)).toMatchObject({
			response: {
				contentType: "text/plain",
				size: 9000,
				truncated: true,
			},
		});
		expect(data(capture.entries[1] as LogEntry).response).not.toHaveProperty(
			"sizeIsLowerBound",
		);
	});

	test("parses structured JSON error media types", async () => {
		const capture = createCaptureLogger();
		const app = createApp(capture.logger, (routes) => {
			routes.get("/problem", (c) =>
				c.body(
					JSON.stringify({ password: "redacted", title: "Invalid" }),
					400,
					{
						"content-type": "application/problem+json",
					},
				),
			);
		});

		await app.request("http://api.test/problem");

		expect(data(capture.entries[0] as LogEntry)).toMatchObject({
			response: { password: "redacted", title: "Invalid" },
		});
	});

	test("excludes only the exact health endpoint and cannot change responses when logging fails", async () => {
		const healthCapture = createCaptureLogger();
		const healthApp = createApp(healthCapture.logger, (routes) => {
			routes.get("/v1/health", (c) => c.text("healthy"));
			routes.get("/v1/health/extra", (c) => c.text("not health"));
		});

		await healthApp.request("http://api.test/v1/health");
		await healthApp.request("http://api.test/v1/health/extra");
		expect(healthCapture.entries).toHaveLength(1);
		expect(data(healthCapture.entries[0] as LogEntry)).toMatchObject({
			pathname: "/v1/health/extra",
		});

		const failingCapture = createCaptureLogger({ throwOn: "warn" });
		const failingApp = createApp(failingCapture.logger, (routes) => {
			routes.get("/response", (c) => c.text("still readable", 400));
		});
		const response = await failingApp.request("http://api.test/response");
		expect(response.status).toBe(400);
		expect(await response.text()).toBe("still readable");
	});

	test("logs unavailable response metadata when extraction fails", async () => {
		const capture = createCaptureLogger();
		const app = createApp(capture.logger, (routes) => {
			routes.get(
				"/uncloneable",
				() => new UncloneableResponse("still readable", { status: 400 }),
			);
		});

		const response = await app.request("http://api.test/uncloneable");

		expect(response.status).toBe(400);
		expect(await response.text()).toBe("still readable");
		expect(capture.entries).toHaveLength(1);
		expect(data(capture.entries[0] as LogEntry)).toMatchObject({
			response: { unavailable: true },
			status: 400,
		});
	});
});
