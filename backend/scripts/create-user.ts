import { prisma } from "../src/lib/db";
import { auth } from "../src/lib/auth";

const main = async () => {
  const args = process.argv.slice(2);
  const userEmail = args[0];
  const userPassword = args[1];
  const userName = args[2];

  if (!userEmail || !userPassword || !userName) {
    console.error(
      "Usage: bun run scripts/create-user.ts <email> <password> <name>"
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

  await auth.api.createUser({
    body: {
      email: userEmail, // required
      password: userPassword, // required
      name: userName, // required
      role: "user",
    },
  });

  console.log("User created successfully");
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
