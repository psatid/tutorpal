import { describe, expect, test } from "bun:test";
import { createLogger } from "./logger";

type LoggerProcessResult = {
	exitCode: number;
	stderr: string;
	stdout: string;
};

async function runLoggerProcess(
	script: string,
	environment: Record<string, string | undefined> = {},
): Promise<LoggerProcessResult> {
	const env = { ...process.env };

	for (const [name, value] of Object.entries(environment)) {
		if (value === undefined) {
			delete env[name];
		} else {
			env[name] = value;
		}
	}

	const childProcess = Bun.spawn([process.execPath, "--eval", script], {
		cwd: `${import.meta.dir}/../..`,
		env,
		stderr: "pipe",
		stdout: "pipe",
	});
	const [stdout, stderr, exitCode] = await Promise.all([
		new Response(childProcess.stdout).text(),
		new Response(childProcess.stderr).text(),
		childProcess.exited,
	]);

	return { exitCode, stderr, stdout };
}

function parseLogLines(stdout: string): Array<Record<string, unknown>> {
	return stdout
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("createLogger", () => {
	test("binds the service, component, and environment without a global logger", () => {
		const logger = createLogger("test-component");

		expect(logger.bindings()).toEqual({
			service: "tutorpal-backend",
			component: "test-component",
			environment: process.env.NODE_ENV ?? "development",
		});
	});

	test("emits ISO timestamps, serializes errors, and removes sensitive fields", async () => {
		const result = await runLoggerProcess(
			[
				'import { createLogger } from "./src/lib/logger";',
				'const logger = createLogger("test-component");',
				'logger.info({ authorization: "Bearer secret", nested: { password: "password-secret", accessToken: "access-secret" }, lineChannelSecret: "line-secret", "set-cookie": "cookie-secret", a: { b: { password: "deep-password-secret" } }, a2: { b: { c: { authorization: "deep-authorization-secret" } } }, request: { body: { users: [{ token: "array-token-secret" }] } }, err: new Error("test failure") }, "logger test");',
				"logger.flush();",
			].join(" "),
			{ LOG_LEVEL: "info", NODE_ENV: "test" },
		);

		expect(result.exitCode).toBe(0);
		const [entry] = parseLogLines(result.stdout);
		if (!entry || typeof entry.time !== "string") {
			throw new Error("Expected a log entry with an ISO timestamp.");
		}

		expect(entry).toMatchObject({
			level: 30,
			service: "tutorpal-backend",
			component: "test-component",
			environment: "test",
			msg: "logger test",
			err: {
				type: "Error",
				message: "test failure",
			},
		});
		expect(new Date(entry.time).toISOString()).toBe(entry.time);
		expect(entry).not.toHaveProperty("authorization");
		expect(entry).not.toHaveProperty("lineChannelSecret");
		expect(entry).not.toHaveProperty("set-cookie");
		expect(entry.nested).toEqual({});
		expect(entry.a).toEqual({ b: {} });
		expect(entry.a2).toEqual({ b: { c: {} } });
		expect(entry.request).toEqual({ body: { users: [{}] } });
		expect(result.stdout).not.toContain("secret");
	});

	test("sanitizes sensitive enumerable Error metadata without mutating the Error", async () => {
		const result = await runLoggerProcess(
			[
				'import { createLogger } from "./src/lib/logger";',
				'const logger = createLogger("test-component");',
				'const cause = new Error("provider cause");',
				'const error = Object.assign(new Error("provider failed"), { cause, details: { provider: { response: { token: "error-token-secret" } } } });',
				'logger.error({ err: error }, "error metadata test");',
				'if (error.details.provider.response.token !== "error-token-secret" || error.cause !== cause) throw new Error("logger mutated error metadata");',
				"logger.flush();",
			].join(" "),
			{ LOG_LEVEL: "error" },
		);

		expect(result.exitCode).toBe(0);
		const [entry] = parseLogLines(result.stdout);
		expect(entry).toMatchObject({
			msg: "error metadata test",
			err: {
				type: "Error",
			},
		});
		expect(entry?.err).toHaveProperty(
			"message",
			expect.stringContaining("provider failed"),
		);
		expect(entry?.err).toHaveProperty("stack");
		expect(entry?.err).toHaveProperty(
			"stack",
			expect.stringContaining("provider cause"),
		);
		expect(entry?.err).not.toHaveProperty("details.provider.response.token");
		expect(result.stdout).not.toContain("error-token-secret");
	});

	test("sanitizes sensitive fields at arbitrary depth without mutating the caller object", async () => {
		const result = await runLoggerProcess(
			[
				'import { createLogger } from "./src/lib/logger";',
				'const logger = createLogger("test-component");',
				'const payload = { root: { one: { two: { three: { four: { five: { six: { password: "beyond-six-secret" } } } } } } }, request: { body: { users: [{ token: "array-token-secret" }] } } };',
				'logger.info(payload, "deep logger test");',
				'if (payload.root.one.two.three.four.five.six.password !== "beyond-six-secret" || payload.request.body.users[0].token !== "array-token-secret") throw new Error("logger mutated caller payload");',
				"logger.flush();",
			].join(" "),
			{ LOG_LEVEL: "info" },
		);

		expect(result.exitCode).toBe(0);
		const [entry] = parseLogLines(result.stdout);
		expect(entry?.root).toEqual({
			one: { two: { three: { four: { five: { six: {} } } } } },
		});
		expect(entry?.request).toEqual({ body: { users: [{}] } });
		expect(result.stdout).not.toContain("beyond-six-secret");
		expect(result.stdout).not.toContain("array-token-secret");
	});

	test("logs cyclic objects without exposing sensitive fields", async () => {
		const result = await runLoggerProcess(
			[
				'import { createLogger } from "./src/lib/logger";',
				'const logger = createLogger("test-component");',
				'const cyclic = { details: { token: "cyclic-token-secret" } }; cyclic.self = cyclic;',
				'logger.info({ cyclic }, "cyclic logger test");',
				"logger.flush();",
			].join(" "),
			{ LOG_LEVEL: "info" },
		);

		expect(result.exitCode).toBe(0);
		const [entry] = parseLogLines(result.stdout);
		expect(entry).toMatchObject({ msg: "cyclic logger test" });
		expect(entry?.cyclic).toHaveProperty("details");
		expect(entry?.cyclic).not.toHaveProperty("details.token");
		expect(result.stdout).not.toContain("cyclic-token-secret");
	});

	test("filters messages below the configured level", async () => {
		const result = await runLoggerProcess(
			[
				'import { createLogger } from "./src/lib/logger";',
				'const logger = createLogger("test-component");',
				'logger.info("hidden");',
				'logger.warn("visible");',
				"logger.flush();",
			].join(" "),
			{ LOG_LEVEL: "warn" },
		);

		expect(result.exitCode).toBe(0);
		expect(parseLogLines(result.stdout)).toHaveLength(1);
		expect(parseLogLines(result.stdout)[0]).toMatchObject({
			level: 40,
			msg: "visible",
		});
	});

	test("defaults LOG_LEVEL by environment and rejects invalid values", async () => {
		const script =
			'import { ENV } from "./src/lib/env"; console.log(ENV.LOG_LEVEL);';
		const development = await runLoggerProcess(script, {
			LOG_LEVEL: undefined,
			NODE_ENV: "development",
		});
		const production = await runLoggerProcess(script, {
			LOG_LEVEL: undefined,
			NODE_ENV: "production",
		});
		const invalid = await runLoggerProcess(script, { LOG_LEVEL: "verbose" });

		expect(development).toMatchObject({ exitCode: 0, stdout: "debug\n" });
		expect(production).toMatchObject({ exitCode: 0, stdout: "info\n" });
		expect(invalid.exitCode).not.toBe(0);
		expect(invalid.stderr).toContain('Invalid LOG_LEVEL "verbose"');
	});
});
