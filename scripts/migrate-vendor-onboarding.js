const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const projectRoot = path.resolve(__dirname, "..");
const migrationRoot = path.join(
  projectRoot,
  "prisma",
  "migrations"
);

async function main() {
  console.log("\n==============================================");
  console.log("TENDERHUB VENDOR ONBOARDING MIGRATION");
  console.log("==============================================\n");

  /*
   * IMPORTANT
   * ----------
   * This migration intentionally preserves the old vendor
   * verification tables. They will NOT be dropped.
   */

  console.log("1. Checking existing legacy data...\n");

  const counts = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT COUNT(*) FROM "VendorCompliance")::int
        AS vendor_compliance,
      (SELECT COUNT(*) FROM "VendorComplianceRequirement")::int
        AS vendor_requirements,
      (SELECT COUNT(*) FROM "VendorVerificationProfile")::int
        AS verification_profiles,
      (SELECT COUNT(*) FROM "VendorVerificationProfileRequirement")::int
        AS profile_requirements,
      (SELECT COUNT(*) FROM "Vendor")::int
        AS vendors
  `);

  console.table(counts);

  /*
   * ----------------------------------------------------------
   * STEP 1
   * Generate Prisma's normal schema diff.
   *
   * We use migrate diff only to generate the DDL for the
   * NEW schema. We do NOT let Prisma apply it.
   * ----------------------------------------------------------
   */

  console.log("\n2. Generating Prisma schema diff...\n");

  const diffFile = path.join(
    projectRoot,
    "scripts",
    "vendor-onboarding-generated.sql"
  );

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not available.");
  }

  const diffSql = execFileSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    [
      "prisma",
      "migrate",
      "diff",
      "--from-url",
      databaseUrl,
      "--to-schema-datamodel",
      path.join("prisma", "schema.prisma"),
      "--script",
    ],
    {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
    }
  );

  fs.writeFileSync(diffFile, diffSql, "utf8");

  console.log(`Generated diff saved to:`);
  console.log(diffFile);

  /*
   * ----------------------------------------------------------
   * STEP 2
   * Remove ONLY destructive operations involving the old
   * vendor verification architecture.
   *
   * We deliberately keep these tables:
   *
   * VendorCompliance
   * VendorComplianceRequirement
   * VendorVerificationProfile
   * VendorVerificationProfileRequirement
   *
   * We also keep Vendor.verificationProfileId temporarily.
   * ----------------------------------------------------------
   */

  console.log("\n3. Protecting legacy vendor verification data...\n");

  let safeSql = diffSql;

  const destructivePatterns = [
    /DROP TABLE "VendorCompliance";/g,
    /DROP TABLE "VendorComplianceRequirement";/g,
    /DROP TABLE "VendorVerificationProfile";/g,
    /DROP TABLE "VendorVerificationProfileRequirement";/g,

    /ALTER TABLE "Vendor" DROP COLUMN "verificationProfileId";/g,

    /DROP INDEX "VendorVerificationProfile_code_key";/g,
    /DROP INDEX "VendorVerificationProfile_active_idx";/g,

    /DROP INDEX "VendorVerificationProfileRequirement_profileId_idx";/g,
    /DROP INDEX "VendorVerificationProfileRequirement_requirementId_idx";/g,
    /DROP INDEX "VendorVerificationProfileRequirement_active_idx";/g,
    /DROP INDEX "VendorVerificationProfileRequirement_required_idx";/g,

    /DROP INDEX "VendorComplianceRequirement_code_key";/g,
    /DROP INDEX "VendorComplianceRequirement_category_idx";/g,
    /DROP INDEX "VendorComplianceRequirement_active_idx";/g,
    /DROP INDEX "VendorComplianceRequirement_required_idx";/g,

    /DROP INDEX "VendorCompliance_vendorId_idx";/g,
    /DROP INDEX "VendorCompliance_requirementId_idx";/g,
    /DROP INDEX "VendorCompliance_status_idx";/g,

    /DROP INDEX "Vendor_requirementSetId_idx";/g,
  ];

  for (const pattern of destructivePatterns) {
    safeSql = safeSql.replace(pattern, "");
  }

  /*
   * ----------------------------------------------------------
   * STEP 3
   * Protect the existing vendor verification data even if
   * Prisma generated slightly different formatting.
   * ----------------------------------------------------------
   */

  safeSql = safeSql
    .replace(
      /DROP TABLE IF EXISTS "VendorCompliance";/g,
      ""
    )
    .replace(
      /DROP TABLE IF EXISTS "VendorComplianceRequirement";/g,
      ""
    )
    .replace(
      /DROP TABLE IF EXISTS "VendorVerificationProfile";/g,
      ""
    )
    .replace(
      /DROP TABLE IF EXISTS "VendorVerificationProfileRequirement";/g,
      ""
    );

  /*
   * ----------------------------------------------------------
   * STEP 4
   * Execute the new-schema DDL.
   *
   * We execute the generated DDL first.
   * ----------------------------------------------------------
   */

  console.log("4. Applying non-destructive schema changes...\n");

  await prisma.$transaction(async (tx) => {
    if (safeSql.trim()) {
      await tx.$executeRawUnsafe(safeSql);
    }
  });

  /*
   * ----------------------------------------------------------
   * STEP 5
   * Migrate old requirements into VendorRequirement.
   *
   * We reuse the old IDs.
   * This makes the migration deterministic and preserves
   * existing references.
   * ----------------------------------------------------------
   */

  console.log("5. Migrating requirements...\n");

  await prisma.$executeRawUnsafe(`
    INSERT INTO "VendorRequirement" (
      "id",
      "code",
      "name",
      "description",
      "category",
      "required",
      "validityDays",
      "active",
      "allowedDocumentCategories",
      "createdAt",
      "updatedAt"
    )
    SELECT
      "id",
      "code",
      "name",
      "description",
      "category",
      "required",
      "validityDays",
      "active",
      "allowedDocumentCategories",
      "createdAt",
      "updatedAt"
    FROM "VendorComplianceRequirement"
    ON CONFLICT ("id") DO NOTHING
  `);

  /*
   * ----------------------------------------------------------
   * STEP 6
   * Migrate old verification profiles into requirement sets.
   * ----------------------------------------------------------
   */

  console.log("6. Migrating requirement sets...\n");

  await prisma.$executeRawUnsafe(`
    INSERT INTO "VendorRequirementSet" (
      "id",
      "code",
      "name",
      "description",
      "active",
      "createdAt",
      "updatedAt"
    )
    SELECT
      "id",
      "code",
      "name",
      "description",
      "active",
      "createdAt",
      "updatedAt"
    FROM "VendorVerificationProfile"
    ON CONFLICT ("id") DO NOTHING
  `);

  /*
   * ----------------------------------------------------------
   * STEP 7
   * Migrate profile → requirement relationships.
   * ----------------------------------------------------------
   */

  console.log("7. Migrating requirement-set mappings...\n");

  await prisma.$executeRawUnsafe(`
    INSERT INTO "VendorRequirementSetRequirement" (
      "id",
      "requirementSetId",
      "requirementId",
      "required",
      "active",
      "createdAt",
      "updatedAt"
    )
    SELECT
      "id",
      "profileId",
      "requirementId",
      "required",
      "active",
      "createdAt",
      "updatedAt"
    FROM "VendorVerificationProfileRequirement"
    ON CONFLICT ("id") DO NOTHING
  `);

  /*
   * ----------------------------------------------------------
   * STEP 8
   * Existing vendor:
   *
   * verificationProfileId
   *       ↓
   * requirementSetId
   * ----------------------------------------------------------
   */

  console.log("8. Linking existing vendors to requirement sets...\n");

  await prisma.$executeRawUnsafe(`
    UPDATE "Vendor" v
    SET "requirementSetId" = v."verificationProfileId"
    WHERE v."verificationProfileId" IS NOT NULL
      AND v."requirementSetId" IS NULL
  `);

  /*
   * ----------------------------------------------------------
   * STEP 9
   * Create VendorApplication for existing vendor users.
   *
   * Existing vendor data is copied into the application.
   *
   * Application starts as DRAFT because the old system had
   * no submitted application workflow.
   * ----------------------------------------------------------
   */

  console.log("9. Creating applications for existing vendors...\n");

  await prisma.$executeRawUnsafe(`
    INSERT INTO "VendorApplication" (
      "id",
      "userId",
      "requirementSetId",
      "status",
      "companyName",
      "legalName",
      "description",
      "email",
      "phone",
      "website",
      "address",
      "registrationNumber",
      "taxNumber",
      "countryId",
      "businessType",
      "numberOfEmployees",
      "yearsOperating",
      "operatingLocations",
      "portfolioDescription",
      "createdAt",
      "updatedAt"
    )
    SELECT
      'legacy_' || v."id",
      v."userId",
      v."requirementSetId",
      'DRAFT',
      v."companyName",
      v."legalName",
      v."description",
      v."email",
      v."phone",
      v."website",
      v."address",
      v."registrationNumber",
      v."taxNumber",
      v."countryId",
      v."businessType",
      v."numberOfEmployees",
      v."yearsOperating",
      v."operatingLocations",
      v."portfolioDescription",
      v."createdAt",
      v."updatedAt"
    FROM "Vendor" v
    WHERE NOT EXISTS (
      SELECT 1
      FROM "VendorApplication" a
      WHERE a."userId" = v."userId"
    )
  `);

  /*
   * ----------------------------------------------------------
   * STEP 10
   * Create application requirements from the vendor's
   * assigned requirement set.
   * ----------------------------------------------------------
   */

  console.log("10. Creating application requirements...\n");

  await prisma.$executeRawUnsafe(`
    INSERT INTO "VendorApplicationRequirement" (
      "id",
      "applicationId",
      "requirementId",
      "code",
      "name",
      "description",
      "category",
      "required",
      "status",
      "createdAt",
      "updatedAt"
    )
    SELECT
      'legacy_' || a."id" || '_' || r."id",
      a."id",
      r."id",
      r."code",
      r."name",
      r."description",
      r."category",
      rsr."required",
      CASE
        WHEN c."status" = 'APPROVED'
          THEN 'SATISFIED'::"VendorApplicationRequirementStatus"
        WHEN c."status" = 'REJECTED'
          THEN 'REJECTED'::"VendorApplicationRequirementStatus"
        WHEN c."status" = 'UNDER_REVIEW'
          THEN 'UNDER_REVIEW'::"VendorApplicationRequirementStatus"
        WHEN c."status" = 'NEEDS_INFORMATION'
          THEN 'NEEDS_INFORMATION'::"VendorApplicationRequirementStatus"
        ELSE
          'OUTSTANDING'::"VendorApplicationRequirementStatus"
      END,
      COALESCE(c."createdAt", a."createdAt"),
      COALESCE(c."updatedAt", a."updatedAt")
    FROM "VendorApplication" a
    JOIN "Vendor" v
      ON v."userId" = a."userId"
    JOIN "VendorRequirementSetRequirement" rsr
      ON rsr."requirementSetId" = a."requirementSetId"
     AND rsr."active" = true
    JOIN "VendorRequirement" r
      ON r."id" = rsr."requirementId"
    LEFT JOIN "VendorCompliance" c
      ON c."vendorId" = v."id"
     AND c."requirementId" = r."id"
    WHERE NOT EXISTS (
      SELECT 1
      FROM "VendorApplicationRequirement" ar
      WHERE ar."applicationId" = a."id"
        AND ar."requirementId" = r."id"
    )
  `);

  /*
   * ----------------------------------------------------------
   * STEP 11
   * Preserve old review state as an audit action where
   * possible.
   *
   * Since the old compliance records are PENDING and have
   * no reviewer/check timestamp, we do not fabricate an
   * administrative review action.
   * ----------------------------------------------------------
   */

  /*
   * ----------------------------------------------------------
   * STEP 12
   * Verification.
   * ----------------------------------------------------------
   */

  console.log("\n11. Verifying migration...\n");

  const verification = await prisma.$queryRawUnsafe(`
    SELECT
      (SELECT COUNT(*) FROM "VendorRequirement")::int
        AS new_requirements,

      (SELECT COUNT(*) FROM "VendorRequirementSet")::int
        AS new_requirement_sets,

      (SELECT COUNT(*) FROM "VendorRequirementSetRequirement")::int
        AS new_set_mappings,

      (SELECT COUNT(*) FROM "VendorApplication")::int
        AS applications,

      (SELECT COUNT(*) FROM "VendorApplicationRequirement")::int
        AS application_requirements,

      (SELECT COUNT(*) FROM "Vendor")::int
        AS vendors,

      (SELECT COUNT(*)
       FROM "Vendor"
       WHERE "requirementSetId" IS NOT NULL)::int
        AS vendors_with_requirement_set
  `);

  console.table(verification);

  console.log("\n==============================================");
  console.log("MIGRATION DATA COPY COMPLETE");
  console.log("==============================================");

  console.log(`
IMPORTANT:

The legacy tables have intentionally NOT been deleted.

Preserved tables:
  VendorCompliance
  VendorComplianceRequirement
  VendorVerificationProfile
  VendorVerificationProfileRequirement

The old Vendor.verificationProfileId has also been retained.

This gives us a rollback/reference path while the new
vendor onboarding workflow is tested.
`);

  /*
   * Save the generated diff for inspection.
   */

  const finalSqlFile = path.join(
    migrationRoot,
    "vendor-onboarding-safe-generated.sql"
  );

  fs.writeFileSync(finalSqlFile, safeSql, "utf8");

  console.log(`Generated safe SQL saved to:`);
  console.log(finalSqlFile);
}

main()
  .catch((error) => {
    console.error("\n==============================================");
    console.error("MIGRATION FAILED");
    console.error("==============================================\n");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });