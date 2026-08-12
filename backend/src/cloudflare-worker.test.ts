import { beforeEach, describe, expect, mock, test } from "bun:test";
import type {
	CloudflareEnv,
	CloudflareExecutionContext,
} from "./cloudflare-worker";

type FakePrisma = {
	connectionString: string;
	disconnectCalls: number;
	$disconnect(): Promise<void>;
};

const prismaClients: FakePrisma[] = [];
const applicationConfigs: Array<{ DATABASE_URL: string }> = [];
const pollTimes: Date[] = [];

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
	createApplicationDependencies(
		config: { DATABASE_URL: string },
		prisma: FakePrisma,
	) {
		applicationConfigs.push(config);
		return { config, prisma };
	},
	createClassReminderService() {
		return {
			async poll(now: Date) {
				pollTimes.push(now);
			},
		};
	},
}));

mock.module("./app", () => ({
	createApp() {
		return {
			async fetch() {
				return new Response("ok");
			},
		};
	},
}));

const worker = await import("./cloudflare-worker");

function createEnv(): CloudflareEnv {
	return {
		HYPERDRIVE_CACHE_DISABLED: {
			connectionString: "postgresql://hyperdrive.example/tutorpal",
		},
		CORS_ORIGIN: "https://frontend.example.com",
		BETTER_AUTH_URL: "https://tutorpal-api.example.workers.dev",
		BETTER_AUTH_SECRET: "test-better-auth-secret",
		ENVIRONMENT: "test",
		LOG_LEVEL: "info",
		RESEND_API_KEY: "test-resend-key",
		RESEND_FROM_EMAIL: "TutorPal <test@example.com>",
		LINE_CREDENTIALS_ENCRYPTION_KEY: "test-line-encryption-key",
		LINE_LINK_REDIRECT_URL:
			"https://tutorpal-api.example.workers.dev/v1/line/callback",
		FRONTEND_URL: "https://frontend.example.com",
		EMAIL_VERIFICATION_CALLBACK_URL:
			"https://frontend.example.com/verify-email",
	};
}

function createExecutionContext() {
	const pending: Promise<unknown>[] = [];
	const context: CloudflareExecutionContext = {
		waitUntil(promise) {
			pending.push(promise);
		},
	};

	return { context, pending };
}

beforeEach(() => {
	prismaClients.length = 0;
	applicationConfigs.length = 0;
	pollTimes.length = 0;
});

describe("Cloudflare Worker", () => {
	test("creates and disconnects a fresh Prisma client for every fetch invocation", async () => {
		const first = createExecutionContext();
		const second = createExecutionContext();

		await worker.fetch(
			new Request("https://api.example/v1/health"),
			createEnv(),
			first.context,
		);
		await worker.fetch(
			new Request("https://api.example/v1/health"),
			createEnv(),
			second.context,
		);

		expect(prismaClients).toHaveLength(2);
		expect(prismaClients[0]).not.toBe(prismaClients[1]);
		expect(applicationConfigs.map((config) => config.DATABASE_URL)).toEqual([
			"postgresql://hyperdrive.example/tutorpal",
			"postgresql://hyperdrive.example/tutorpal",
		]);

		await Promise.all([...first.pending, ...second.pending]);
		expect(prismaClients.map((client) => client.disconnectCalls)).toEqual([
			1, 1,
		]);
	});

	test("passes the Cron scheduled time to the reminder poll and disconnects", async () => {
		const scheduledAt = Date.parse("2026-08-12T12:34:00.000Z");
		const execution = createExecutionContext();

		await worker.scheduled(
			{ scheduledTime: scheduledAt },
			createEnv(),
			execution.context,
		);

		expect(pollTimes.map((time) => time.getTime())).toEqual([scheduledAt]);
		await Promise.all(execution.pending);
		expect(prismaClients[0]?.disconnectCalls).toBe(1);
	});

	test("fails before creating Prisma when a required secret is missing", async () => {
		const env = createEnv();
		env.BETTER_AUTH_SECRET = "";

		await expect(
			worker.fetch(
				new Request("https://api.example/v1/health"),
				env,
				createExecutionContext().context,
			),
		).rejects.toThrow("BETTER_AUTH_SECRET");
		expect(prismaClients).toHaveLength(0);
	});
});
