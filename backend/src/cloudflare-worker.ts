import { createApp } from "./app";
import {
	createApplicationDependencies,
	createClassReminderService,
} from "./app-dependencies";
import { type AppConfigInput, createAppConfig } from "./lib/app-config";
import { createPrismaClient } from "./lib/cloudflare-prisma";

type HyperdriveBinding = {
	connectionString: string;
};

export type CloudflareEnv = AppConfigInput & {
	HYPERDRIVE_CACHE_DISABLED: HyperdriveBinding;
};

export type CloudflareExecutionContext = {
	waitUntil(promise: Promise<unknown>): void;
};

type ScheduledController = {
	scheduledTime: number;
};

function requiredWorkerValue(
	env: CloudflareEnv,
	key: keyof AppConfigInput,
): string {
	const value = env[key];
	if (typeof value !== "string" || value.trim() === "") {
		throw new Error(`Missing required Cloudflare Worker configuration: ${key}`);
	}
	return value;
}

function createWorkerConfig(env: CloudflareEnv) {
	const connectionString = env.HYPERDRIVE_CACHE_DISABLED?.connectionString;
	if (!connectionString) {
		throw new Error(
			"Missing required Cloudflare Worker binding: HYPERDRIVE_CACHE_DISABLED",
		);
	}

	return createAppConfig({
		CORS_ORIGIN: requiredWorkerValue(env, "CORS_ORIGIN"),
		ADMIN_FRONTEND_URL: requiredWorkerValue(env, "ADMIN_FRONTEND_URL"),
		BETTER_AUTH_URL: requiredWorkerValue(env, "BETTER_AUTH_URL"),
		BETTER_AUTH_SECRET: requiredWorkerValue(env, "BETTER_AUTH_SECRET"),
		ENVIRONMENT: requiredWorkerValue(env, "ENVIRONMENT"),
		LOG_LEVEL: requiredWorkerValue(env, "LOG_LEVEL"),
		RESEND_API_KEY: requiredWorkerValue(env, "RESEND_API_KEY"),
		RESEND_FROM_EMAIL: requiredWorkerValue(env, "RESEND_FROM_EMAIL"),
		LINE_CREDENTIALS_ENCRYPTION_KEY: requiredWorkerValue(
			env,
			"LINE_CREDENTIALS_ENCRYPTION_KEY",
		),
		LINE_LINK_REDIRECT_URL: requiredWorkerValue(env, "LINE_LINK_REDIRECT_URL"),
		FRONTEND_URL: requiredWorkerValue(env, "FRONTEND_URL"),
		EMAIL_VERIFICATION_CALLBACK_URL: requiredWorkerValue(
			env,
			"EMAIL_VERIFICATION_CALLBACK_URL",
		),
		PUBLIC_SIGNUP_ENABLED: env.PUBLIC_SIGNUP_ENABLED,
		DATABASE_URL: connectionString,
	});
}

export async function fetch(
	request: Request,
	env: CloudflareEnv,
	ctx: CloudflareExecutionContext,
): Promise<Response> {
	const config = createWorkerConfig(env);
	const prisma = createPrismaClient(config.DATABASE_URL);

	try {
		return await createApp(createApplicationDependencies(config, prisma)).fetch(
			request,
		);
	} finally {
		ctx.waitUntil(prisma.$disconnect());
	}
}

export async function scheduled(
	controller: ScheduledController,
	env: CloudflareEnv,
	ctx: CloudflareExecutionContext,
): Promise<void> {
	const config = createWorkerConfig(env);
	const prisma = createPrismaClient(config.DATABASE_URL);

	try {
		await createClassReminderService(config, prisma).poll(
			new Date(controller.scheduledTime),
		);
	} catch (error) {
		console.error("Class reminder poll failed", error);
	} finally {
		ctx.waitUntil(prisma.$disconnect());
	}
}

export default { fetch, scheduled };
