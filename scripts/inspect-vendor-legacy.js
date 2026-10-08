const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("\n==============================================");
  console.log("LEGACY COMPLIANCE STATUS VALUES");
  console.log("==============================================\n");

  const result = await prisma.$queryRawUnsafe(`
    SELECT
      unnest(enum_range(NULL::"ComplianceStatus"))::text AS status
  `);

  console.log(result);

  console.log("\nCurrent VendorCompliance statuses:\n");

  const statuses = await prisma.$queryRawUnsafe(`
    SELECT
      "status",
      COUNT(*)::int AS count
    FROM "VendorCompliance"
    GROUP BY "status"
    ORDER BY "status"
  `);

  console.table(statuses);
}

main()
  .catch((error) => {
    console.error("\nERROR:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });