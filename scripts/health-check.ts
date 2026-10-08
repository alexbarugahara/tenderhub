import { PrismaClient, ClassificationType } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type PSCRecord = {
  code: string;
  name: string;
  description?: string;
  parentCode?: string;
};

function loadData(): PSCRecord[] {
  const filePath = process.argv[2];

  if (!filePath) {
    throw new Error(
      "Usage: npx tsx scripts/import-psc.ts <path-to-psc-json>",
    );
  }

  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`PSC file not found: ${resolvedPath}`);
  }

  const raw = fs.readFileSync(resolvedPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("PSC JSON must contain an array.");
  }

  return parsed;
}

async function main() {
  const records = loadData();

  console.log(`Importing ${records.length} PSC records...`);

  let created = 0;
  let updated = 0;

  for (const record of records) {
    if (!record.code || !record.name) {
      console.warn("Skipping invalid PSC record:", record);
      continue;
    }

    let parentId: string | null = null;

    if (record.parentCode) {
      const parent = await prisma.classification.findUnique({
        where: {
          type_code: {
            type: ClassificationType.PSC,
            code: record.parentCode,
          },
        },
      });

      parentId = parent?.id ?? null;
    }

    const existing = await prisma.classification.findUnique({
      where: {
        type_code: {
          type: ClassificationType.PSC,
          code: record.code,
        },
      },
    });

    if (existing) {
      await prisma.classification.update({
        where: {
          id: existing.id,
        },
        data: {
          name: record.name,
          description: record.description ?? null,
          parentId,
        },
      });

      updated++;
    } else {
      await prisma.classification.create({
        data: {
          code: record.code,
          name: record.name,
          description: record.description ?? null,
          type: ClassificationType.PSC,
          parentId,
        },
      });

      created++;
    }
  }

  console.log("");
  console.log("PSC import completed.");
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
  console.log(`Total processed: ${records.length}`);
}

main()
  .catch((error) => {
    console.error("PSC import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });