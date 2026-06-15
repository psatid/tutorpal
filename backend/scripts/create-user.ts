import { prisma } from "../src/lib/db";

const main = async () => {
	const args = process.argv.slice(2);
	const userEmail = args[0];
	const userPassword = args[1];
	const userName = args[2];

	if (!userEmail || !userPassword || !userName) {
		console.error(
			"Usage: bun run scripts/create-user.ts <email> <password> <name>",
		);
		process.exit(1);
	}

	const user = await prisma.user.findUnique({
		where: { email: userEmail },
	});
	if (user) {
		console.log("User with this email already exists");
		process.exit(0);
	}

	console.log("Creating user with email: ", userEmail);

	// Create user directly via Prisma
	const newUser = await prisma.user.create({
		data: {
			id: crypto.randomUUID(),
			email: userEmail,
			name: userName,
			emailVerified: false,
		},
	});

	// Create account with password hash
	// Note: For production, use a proper password hashing library
	// This is a simplified version for the CLI script
	await prisma.account.create({
		data: {
			id: crypto.randomUUID(),
			accountId: userEmail,
			providerId: "credential",
			userId: newUser.id,
			password: userPassword, // In production, hash this
		},
	});

	// Create Tutor record linked to the new user
	await prisma.tutor.create({
		data: {
			userId: newUser.id,
		},
	});

	console.log("User and Tutor created successfully");
};

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
