import { prisma } from "../src/lib/db";

const main = async () => {
	const args = process.argv.slice(2);
	const studentId = args[0];

	if (!studentId) {
		console.error("Usage: bun run scripts/unlink-line.ts <studentId>");
		process.exit(1);
	}

	console.log("Looking up student:", studentId);

	const student = await prisma.student.findUnique({
		where: { id: studentId },
	});

	if (!student) {
		console.error("Student not found");
		process.exit(1);
	}

	if (!student.lineUserId) {
		console.log("Student does not have a LINE account linked");
		process.exit(0);
	}

	console.log(
		`Unlinking LINE account for student: ${student.name} (${student.lineUserId})`,
	);

	await prisma.student.update({
		where: { id: studentId },
		data: { lineUserId: null },
	});

	console.log("LINE account unlinked successfully");
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
