import { auth } from "../src/lib/auth";
import { getLocalPrisma } from "../src/lib/db";
import { getLocalAppConfig } from "../src/lib/local-config";

type BootstrapOptions = {
	email?: string;
	name?: string;
	password?: string;
};

function readOption(args: string[], name: string) {
	const prefix = `--${name}=`;
	const inlineValue = args.find((arg) => arg.startsWith(prefix));
	if (inlineValue) {
		return inlineValue.slice(prefix.length);
	}

	const optionIndex = args.indexOf(`--${name}`);
	return optionIndex >= 0 ? args[optionIndex + 1] : undefined;
}

function readOptions(args: string[]): BootstrapOptions {
	return {
		email: readOption(args, "email") ?? process.env.BOOTSTRAP_ADMIN_EMAIL,
		name: readOption(args, "name") ?? process.env.BOOTSTRAP_ADMIN_NAME,
		password:
			readOption(args, "password") ?? process.env.BOOTSTRAP_ADMIN_PASSWORD,
	};
}

function usage() {
	console.error(
		"Usage: bun run bootstrap-admin --email <email> --name <name> [--password <password>]",
	);
	console.error(
		"Password may be provided with BOOTSTRAP_ADMIN_PASSWORD to avoid putting it in shell history.",
	);
}

async function main() {
	const options = readOptions(process.argv.slice(2));
	if (!options.email || !options.name || !options.password) {
		usage();
		process.exit(1);
	}

	const email = options.email.trim().toLowerCase();
	const name = options.name.trim();
	if (!email || !name || options.password.length < 8) {
		throw new Error(
			"Email, name, and a password of at least 8 characters are required.",
		);
	}

	const prisma = getLocalPrisma();
	const existingUser = await prisma.user.findUnique({ where: { email } });
	if (existingUser) {
		throw new Error(
			`A user with ${email} already exists; no changes were made.`,
		);
	}

	const config = getLocalAppConfig();
	const user = await auth.api.createUser({
		body: {
			email,
			name,
			password: options.password,
			role: "admin",
		},
	});

	await auth.api.sendVerificationEmail({
		body: {
			email,
			callbackURL: config.EMAIL_VERIFICATION_CALLBACK_URL,
		},
	});

	console.log(
		`Created admin user ${user.user.email}. A verification email was sent.`,
	);
}

main()
	.then(async () => {
		await getLocalPrisma().$disconnect();
	})
	.catch(async (error) => {
		console.error(error instanceof Error ? error.message : error);
		await getLocalPrisma().$disconnect();
		process.exit(1);
	});
