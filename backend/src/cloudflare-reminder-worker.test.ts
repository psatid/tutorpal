import { beforeEach, describe, expect, mock, spyOn, test } from "bun:test";

type FakePrisma = {
	connectionString: string;
	disconnectCalls: number;
	$disconnect(): Promise<void>;
};

const prismaClients: FakePrisma[] = [];
const reminderConfigs: Array<{ LINE_CREDENTIALS_ENCRYPTION_KEY: string }> = [];
const pollTimes: Date[] = [];
let pollError: Error | undefined;
const validEncryptionKey = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

mock.module("./lib/cloudflare-prisma", () => ({
	createPrismaClient(connectionString: string): FakePrisma {
		const client: FakePrisma = {
			connectionString,
			disconnectCalls: 0,
			async $disconnect() {
				client.disconnectCalls += 1;
			},
		};
		prismaClients.push(client);
		return client;
	},
}));

mock.module("./app-dependencies", () => ({
	createClassReminderService(
		config: { LINE_CREDENTIALS_ENCRYPTION_KEY: string },
		_prisma: FakePrisma,
	) {
		reminderConfigs.push(config);
		return {
			async poll(now: Date) {
				pollTimes.push(now);
				if (pollError) throw pollError;
			},
		};
	},
}));

const worker = await import("./cloudflare-reminder-worker");

function createEnv() {
	return {
		HYPERDRIVE_CACHE_DISABLED: {
			connectionString: "postgresql://hyperdrive.example/tutorpal",
		},
		LINE_CREDENTIALS_ENCRYPTION_KEY: validEncryptionKey,
	};
}

function createExecutionContext() {
	const pending: Promise<unknown>[] = [];
	const context = {
		waitUntil(promise: Promise<unknown>) {
			pending.push(promise);
		},
	};

	return { context, pending };
}

beforeEach(() => {
	prismaClients.length = 0;
	reminderConfigs.length = 0;
	pollTimes.length = 0;
	pollError = undefined;
});

describe("Cloudflare reminder worker", () => {
	test("passes the Cron scheduled time to the reminder poll and defers Prisma disconnect", async () => {
		const scheduledAt = Date.parse("2026-08-12T12:34:00.000Z");
		const execution = createExecutionContext();

		await worker.scheduled(
			{ scheduledTime: scheduledAt },
			createEnv(),
			execution.context,
		);

		expect(pollTimes.map((time) => time.getTime())).toEqual([scheduledAt]);
		expect(
			reminderConfigs.map(({ LINE_CREDENTIALS_ENCRYPTION_KEY }) => ({
				LINE_CREDENTIALS_ENCRYPTION_KEY,
			})),
		).toEqual([{ LINE_CREDENTIALS_ENCRYPTION_KEY: validEncryptionKey }]);
		expect(execution.pending).toHaveLength(1);
		await Promise.all(execution.pending);
		expect(prismaClients[0]?.disconnectCalls).toBe(1);
	});

	test("logs and swallows polling errors while still disconnecting Prisma", async () => {
		const execution = createExecutionContext();
		const error = new Error("LINE API unavailable");
		const errorSpy = spyOn(console, "error").mockImplementation(
			() => undefined,
		);
		pollError = error;

		try {
			await expect(
				worker.scheduled(
					{ scheduledTime: Date.parse("2026-08-12T12:34:00.000Z") },
					createEnv(),
					execution.context,
				),
			).resolves.toBeUndefined();

			expect(errorSpy).toHaveBeenCalledWith(
				"Class reminder poll failed",
				error,
			);
			expect(execution.pending).toHaveLength(1);
			await Promise.all(execution.pending);
			expect(prismaClients[0]?.disconnectCalls).toBe(1);
		} finally {
			errorSpy.mockRestore();
		}
	});

	test("fails before creating Prisma when Hyperdrive is missing", async () => {
		const env = createEnv();
		(
			env as {
				HYPERDRIVE_CACHE_DISABLED?: { connectionString: string };
			}
		).HYPERDRIVE_CACHE_DISABLED = undefined;

		await expect(
			worker.scheduled(
				{ scheduledTime: Date.parse("2026-08-12T12:34:00.000Z") },
				env,
				createExecutionContext().context,
			),
		).rejects.toThrow("HYPERDRIVE_CACHE_DISABLED");
		expect(prismaClients).toHaveLength(0);
	});

	test("fails before creating Prisma when the LINE encryption key is missing", async () => {
		const env = createEnv();
		env.LINE_CREDENTIALS_ENCRYPTION_KEY = "";

		await expect(
			worker.scheduled(
				{ scheduledTime: Date.parse("2026-08-12T12:34:00.000Z") },
				env,
				createExecutionContext().context,
			),
		).rejects.toThrow("LINE_CREDENTIALS_ENCRYPTION_KEY");
		expect(prismaClients).toHaveLength(0);
	});

	test("fails before creating Prisma when the LINE encryption key is malformed", async () => {
		const env = createEnv();
		env.LINE_CREDENTIALS_ENCRYPTION_KEY = "not-a-32-byte-key";

		await expect(
			worker.scheduled(
				{ scheduledTime: Date.parse("2026-08-12T12:34:00.000Z") },
				env,
				createExecutionContext().context,
			),
		).rejects.toThrow("LINE credential encryption is not configured");
		expect(prismaClients).toHaveLength(0);
	});
});
