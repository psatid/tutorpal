import { createClassReminderService } from "./app-dependencies";
import { createPrismaClient } from "./lib/cloudflare-prisma";
import { decodeLineCredentialEncryptionKey } from "./lib/line-credentials";

type HyperdriveBinding = {
	connectionString: string;
};

type CloudflareReminderEnv = {
	HYPERDRIVE_CACHE_DISABLED: HyperdriveBinding;
	LINE_CREDENTIALS_ENCRYPTION_KEY?: string;
};

type CloudflareExecutionContext = {
	waitUntil(promise: Promise<unknown>): void;
};

type ScheduledController = {
	scheduledTime: number;
};

function createReminderWorkerConfig(env: CloudflareReminderEnv) {
	const connectionString = env.HYPERDRIVE_CACHE_DISABLED?.connectionString;
	if (!connectionString) {
		throw new Error(
			"Missing required Cloudflare Worker binding: HYPERDRIVE_CACHE_DISABLED",
		);
	}

	const encryptionKey = env.LINE_CREDENTIALS_ENCRYPTION_KEY;
	if (typeof encryptionKey !== "string" || encryptionKey.trim() === "") {
		throw new Error(
			"Missing required Cloudflare Worker configuration: LINE_CREDENTIALS_ENCRYPTION_KEY",
		);
	}
	decodeLineCredentialEncryptionKey(encryptionKey);

	return {
		DATABASE_URL: connectionString,
		LINE_CREDENTIALS_ENCRYPTION_KEY: encryptionKey,
	};
}

export async function scheduled(
	controller: ScheduledController,
	env: CloudflareReminderEnv,
	ctx: CloudflareExecutionContext,
): Promise<void> {
	const config = createReminderWorkerConfig(env);
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

export default { scheduled };
