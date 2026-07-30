import type { MiddlewareHandler } from "hono";
import type { Logger } from "pino";

const HEALTH_PATHNAME = "/v1/health";
const MAX_ERROR_RESPONSE_BYTES = 8 * 1024;

type JsonValue =
	| boolean
	| null
	| number
	| string
	| JsonValue[]
	| { [key: string]: JsonValue };

type CapturedResponse =
	| JsonValue
	| {
			body: string;
			contentType: string;
	  }
	| {
			contentType: string;
			size: number;
			truncated: true;
	  };

type UnavailableResponse = {
	unavailable: true;
};

type BoundedBody =
	| {
			body: Uint8Array;
	  }
	| {
			observedBytes: number;
			size: number;
			sizeIsLowerBound: true;
			truncated: true;
	  };

function isJsonContentType(contentType: string) {
	const mediaType = contentType.split(";", 1)[0]?.trim().toLowerCase();
	return (
		mediaType === "application/json" ||
		(mediaType?.startsWith("application/") && mediaType.endsWith("+json"))
	);
}

function getDeclaredContentLength(response: Response) {
	const contentLength = response.headers.get("content-length")?.trim();
	if (!contentLength || !/^\d+$/.test(contentLength)) {
		return undefined;
	}

	const size = Number(contentLength);
	return Number.isSafeInteger(size) ? size : undefined;
}

async function readBoundedBody(response: Response): Promise<BoundedBody> {
	const reader = response.clone().body?.getReader();
	if (!reader) {
		return { body: new Uint8Array() };
	}

	const chunks: Uint8Array[] = [];
	let capturedBytes = 0;
	let observedBytes = 0;
	let cancellationStarted = false;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}

			observedBytes += value.byteLength;
			const remainingBytes = MAX_ERROR_RESPONSE_BYTES - capturedBytes;
			if (value.byteLength > remainingBytes) {
				if (remainingBytes > 0) {
					chunks.push(value.subarray(0, remainingBytes));
				}

				cancellationStarted = true;
				void reader.cancel().then(
					() => reader.releaseLock(),
					() => reader.releaseLock(),
				);
				return {
					observedBytes,
					size: observedBytes,
					sizeIsLowerBound: true,
					truncated: true,
				};
			}

			chunks.push(value);
			capturedBytes += value.byteLength;
		}
	} finally {
		if (!cancellationStarted) {
			reader.releaseLock();
		}
	}

	const body = new Uint8Array(capturedBytes);
	let offset = 0;
	for (const chunk of chunks) {
		body.set(chunk, offset);
		offset += chunk.byteLength;
	}

	return { body };
}

async function readErrorResponse(
	response: Response,
): Promise<CapturedResponse> {
	const contentType = response.headers.get("content-type") ?? "";
	const declaredSize = getDeclaredContentLength(response);

	if (declaredSize !== undefined && declaredSize > MAX_ERROR_RESPONSE_BYTES) {
		return { contentType, size: declaredSize, truncated: true };
	}

	const boundedBody = await readBoundedBody(response);
	if ("truncated" in boundedBody) {
		return { contentType, ...boundedBody };
	}

	const text = new TextDecoder().decode(boundedBody.body);
	if (isJsonContentType(contentType)) {
		try {
			return JSON.parse(text);
		} catch {
			// Invalid JSON is retained as text for diagnosis.
		}
	}

	return { body: text, contentType };
}

export function createRequestLogger(logger: Logger): MiddlewareHandler {
	return async (c, next) => {
		const startedAt = performance.now();
		const { pathname } = new URL(c.req.url);

		await next();

		if (pathname === HEALTH_PATHNAME) {
			return;
		}

		const durationMs = performance.now() - startedAt;
		const { status } = c.res;
		const logData = {
			durationMs,
			method: c.req.method,
			pathname,
			status,
		};

		if (status < 400) {
			try {
				logger.info({ event: "http.request.completed", ...logData });
			} catch {
				// Logging must never change the HTTP response.
			}
			return;
		}

		let response: CapturedResponse | UnavailableResponse;
		try {
			response = await readErrorResponse(c.res);
		} catch {
			response = { unavailable: true };
		}

		try {
			if (status < 500) {
				logger.warn({
					event: "http.request.failed",
					...logData,
					response,
				});
				return;
			}

			const err = c.get("unexpectedError");
			logger.error({
				event: "http.request.failed",
				...logData,
				...(err instanceof Error ? { err } : {}),
				response,
			});
		} catch {
			// Logging must never change the HTTP response.
		}
	};
}
