const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true
    }
  });

  console.log("");
  console.log("========================================");
  console.log("       TENDERHUB USER ACCOUNTS");
  console.log("========================================");
  console.log("");

  for (let i = 0; i < users.length; i++) {
    const u = users[i];

    console.log(`${i + 1}. ${u.name || "(no name)"}`);
    console.log(`   Email:  ${u.email}`);
    console.log(`   Role:   ${u.role}`);
    console.log(`   Status: ${u.status}`);
    console.log(`   ID:     ${u.id}`);
    console.log("----------------------------------------");
  }

  console.log("");
  console.log(`Total users: ${users.length}`);
  console.log("");
}

main()
  .catch((error) => {
    console.error("DATABASE ERROR:");
    console.error(error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
