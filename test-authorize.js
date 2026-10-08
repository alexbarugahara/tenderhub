const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@tenderhub.com";
  const password = "Admin@2026!";

  console.log("Testing authorize logic...");
  console.log("Email:", email);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log("RESULT: USER NOT FOUND");
    return;
  }

  console.log("User found:", user.email);
  console.log("Role:", user.role);
  console.log("Status:", user.status);
  console.log("Has password:", Boolean(user.password));

  if (!user.password) {
    console.log("RESULT: NO PASSWORD");
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  console.log("Password match:", passwordMatch);

  if (!passwordMatch) {
    console.log("RESULT: PASSWORD REJECTED");
    return;
  }

  console.log("RESULT: AUTHORIZE SHOULD SUCCEED");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
