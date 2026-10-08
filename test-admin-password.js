const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@tenderhub.com" },
    select: {
      email: true,
      role: true,
      status: true,
      password: true,
    },
  });

  if (!user) {
    console.log("USER NOT FOUND");
    return;
  }

  const matches = await bcrypt.compare("Admin@2026!", user.password || "");

  console.log("Email:", user.email);
  console.log("Role:", user.role);
  console.log("Status:", user.status);
  console.log("Password hash exists:", Boolean(user.password));
  console.log("Password matches:", matches);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
