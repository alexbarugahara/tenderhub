const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const projectRoot = path.resolve(__dirname, "..");

const migrationName = "20261005190000_vendor_onboarding_architecture_safe";

const migrationsDir = path.join(projectRoot, "prisma", "migrations");
const migrationDir = path.join(migrationsDir, migrationName);
const migrationFile = path.join(migrationDir, "migration.sql");

console.log("");
console.log("==============================================");
console.log("TENDERHUB VENDOR ONBOARDING MIGRATION");
console.log("==============================================");
console.log("");
console.log("Project:");
console.log(projectRoot);
console.log("");

/**
 * Generate the Prisma schema diff.
 *
 * The datasource is read directly from prisma/schema.prisma.
 * No DATABASE_URL is passed through cmd.exe.
 */
function generatePrismaDiff() {
  console.log("Generating Prisma schema diff...");
  console.log("");

  try {
    const output = execFileSync(
      process.env.ComSpec || "cmd.exe",
      [
        "/d",
        "/s",
        "/c",
        "npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script",
      ],
      {
        cwd: projectRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 50 * 1024 * 1024,
      }
    );

    console.log(output);

    return output;
  } catch (error) {
    console.error("");
    console.error("Prisma migrate diff failed.");
    console.error("");

    if (error.stdout) {
      console.error(error.stdout.toString());
    }

    if (error.stderr) {
      console.error(error.stderr.toString());
    }

    process.exit(1);
  }
}

/**
 * Remove destructive operations which would delete legacy
 * vendor verification data.
 *
 * These patterns deliberately tolerate:
 *
 * - spaces
 * - newlines
 * - trailing commas
 * - trailing semicolons
 *
 * The legacy tables and Vendor.verificationProfileId are
 * intentionally retained during this migration.
 */
function applySafetyFilter(sql) {
  console.log("Applying safety filter...");
  console.log("");

  let diffSql = sql;

  const destructivePatterns = [
    // ----------------------------------------------------------
    // Legacy verification tables
    // ----------------------------------------------------------

    /DROP TABLE\s+"VendorCompliance"\s*;?/gi,

    /DROP TABLE\s+"VendorComplianceRequirement"\s*;?/gi,

    /DROP TABLE\s+"VendorVerificationProfile"\s*;?/gi,

    /DROP TABLE\s+"VendorVerificationProfileRequirement"\s*;?/gi,

    // ----------------------------------------------------------
    // Legacy Vendor verificationProfile relation
    // ----------------------------------------------------------

    /ALTER TABLE\s+"Vendor"\s+DROP CONSTRAINT\s+"Vendor_verificationProfileId_fkey"\s*[,;]?/gi,

    /ALTER TABLE\s+"Vendor"\s+DROP COLUMN\s+"verificationProfileId"\s*[,;]?/gi,

    // ----------------------------------------------------------
    // Legacy index
    // ----------------------------------------------------------

    /DROP INDEX\s+"Vendor_verificationProfileId_idx"\s*;?/gi,

    // ----------------------------------------------------------
    // Legacy ComplianceStatus enum
    // ----------------------------------------------------------

    /DROP TYPE\s+"ComplianceStatus"\s*;?/gi,

    // ----------------------------------------------------------
    // Legacy table indexes
    // ----------------------------------------------------------

    /DROP INDEX\s+"VendorCompliance[^"]*"\s*;?/gi,

    /DROP INDEX\s+"VendorComplianceRequirement[^"]*"\s*;?/gi,

    /DROP INDEX\s+"VendorVerificationProfile[^"]*"\s*;?/gi,

    /DROP INDEX\s+"VendorVerificationProfileRequirement[^"]*"\s*;?/gi,

    // ----------------------------------------------------------
    // Legacy foreign keys
    // ----------------------------------------------------------

    /ALTER TABLE\s+"VendorCompliance"\s+DROP CONSTRAINT[^;]+[;,]/gi,

    /ALTER TABLE\s+"VendorComplianceRequirement"\s+DROP CONSTRAINT[^;]+[;,]/gi,

    /ALTER TABLE\s+"VendorVerificationProfile"\s+DROP CONSTRAINT[^;]+[;,]/gi,

    /ALTER TABLE\s+"VendorVerificationProfileRequirement"\s+DROP CONSTRAINT[^;]+[;,]/gi,
  ];

  for (const pattern of destructivePatterns) {
    diffSql = diffSql.replace(pattern, "");
  }

  /**
   * Prisma can leave empty comment markers such as:
   *
   * -- DropForeignKey
   *
   * after the safety filter removes the actual statement.
   *
   * Remove those orphaned comments for a cleaner migration.
   */
  diffSql = diffSql.replace(
    /^\s*-- DropForeignKey\s*$/gim,
    ""
  );

  diffSql = diffSql.replace(
    /^\s*-- DropIndex\s*$/gim,
    ""
  );

  diffSql = diffSql.replace(
    /^\s*-- DropTable\s*$/gim,
    ""
  );

  diffSql = diffSql.replace(
    /^\s*-- DropEnum\s*$/gim,
    ""
  );

  return diffSql;
}

/**
 * Verify that no dangerous legacy DROP operations remain.
 */
function verifyNoDestructiveStatements(sql) {
  const forbiddenPatterns = [
    /DROP TABLE\s+"VendorCompliance"/i,

    /DROP TABLE\s+"VendorComplianceRequirement"/i,

    /DROP TABLE\s+"VendorVerificationProfile"/i,

    /DROP TABLE\s+"VendorVerificationProfileRequirement"/i,

    /ALTER TABLE\s+"Vendor"\s+DROP CONSTRAINT\s+"Vendor_verificationProfileId_fkey"/i,

    /ALTER TABLE\s+"Vendor"\s+DROP COLUMN\s+"verificationProfileId"/i,

    /DROP INDEX\s+"Vendor_verificationProfileId_idx"/i,

    /DROP TYPE\s+"ComplianceStatus"/i,
  ];

  const remaining = forbiddenPatterns.filter((pattern) =>
    pattern.test(sql)
  );

  if (remaining.length > 0) {
    console.error("");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("SAFETY CHECK FAILED");
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error("");

    console.error(
      "One or more destructive legacy operations remain in the migration."
    );

    console.error("");

    console.error("The migration file will NOT be created.");

    console.error("");

    for (const pattern of remaining) {
      console.error(`Remaining pattern: ${pattern}`);
    }

    console.error("");

    process.exit(1);
  }

  console.log("Safety check passed.");
  console.log("");
}

/**
 * Data migration.
 *
 * This converts the existing legacy vendor verification
 * architecture into the new vendor onboarding architecture.
 *
 * IMPORTANT:
 *
 * - Legacy tables remain intact.
 * - Vendor.verificationProfileId remains intact.
 * - Existing vendor verification state is NOT changed.
 * - Existing evidence is NOT fabricated.
 * - Existing compliance statuses are migrated.
 * - Existing vendors receive DRAFT applications.
 */
function getDataMigrationSql() {
  return `
-- ============================================================
-- TENDERHUB VENDOR ONBOARDING DATA MIGRATION
-- ============================================================

-- Legacy verification tables are intentionally preserved.

-- This migration converts:
--
-- VendorComplianceRequirement
--        ->
-- VendorRequirement
--
-- VendorVerificationProfile
--        ->
-- VendorRequirementSet
--
-- VendorVerificationProfileRequirement
--        ->
-- VendorRequirementSetRequirement
--
-- Vendor
--        ->
-- Vendor + VendorApplication
--
-- VendorCompliance
--        ->
-- VendorApplicationRequirement
--
-- No existing vendor is automatically approved.
-- No evidence is fabricated.
-- Existing Vendor.verifiedAt values are preserved.
-- ============================================================


-- ------------------------------------------------------------
-- SAFETY ASSERTION
--
-- Existing VendorCompliance records must not reference
-- documents because no evidence records can safely be created
-- without knowing the actual document metadata.
-- ------------------------------------------------------------

DO $$
BEGIN

  IF EXISTS (
    SELECT 1
    FROM "VendorCompliance"
    WHERE "documentId" IS NOT NULL
  ) THEN

    RAISE EXCEPTION
      'Migration stopped: VendorCompliance contains documentId values. Evidence must be migrated explicitly before deployment.';

  END IF;

END $$;


-- ------------------------------------------------------------
-- COPY LEGACY VENDOR REQUIREMENTS
-- ------------------------------------------------------------

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
ON CONFLICT ("id") DO NOTHING;


-- ------------------------------------------------------------
-- COPY LEGACY VERIFICATION PROFILES
-- INTO NEW REQUIREMENT SETS
-- ------------------------------------------------------------

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
ON CONFLICT ("id") DO NOTHING;


-- ------------------------------------------------------------
-- COPY PROFILE -> REQUIREMENT MAPPINGS
-- ------------------------------------------------------------

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
ON CONFLICT ("id") DO NOTHING;


-- ------------------------------------------------------------
-- LINK EXISTING VENDORS TO THEIR NEW REQUIREMENT SETS
--
-- The legacy verificationProfileId column is deliberately
-- preserved in the database.
-- ------------------------------------------------------------

UPDATE "Vendor" v

SET "requirementSetId" = v."verificationProfileId"

WHERE v."verificationProfileId" IS NOT NULL

  AND EXISTS (
    SELECT 1
    FROM "VendorRequirementSet" rs
    WHERE rs."id" = v."verificationProfileId"
  );


-- ------------------------------------------------------------
-- CREATE DRAFT VENDOR APPLICATIONS
--
-- Only vendors with a valid requirement set are migrated.
--
-- Existing vendors are NOT automatically approved.
--
-- Existing Vendor.verifiedAt values are left completely
-- untouched.
-- ------------------------------------------------------------

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
  'DRAFT'::"VendorApplicationStatus",
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
  NOW()
FROM "Vendor" v

WHERE NOT EXISTS (
  SELECT 1
  FROM "VendorApplication" va
  WHERE va."userId" = v."userId"
)

AND v."requirementSetId" IS NOT NULL;


-- ------------------------------------------------------------
-- CONVERT LEGACY COMPLIANCE STATUSES
--
-- PENDING
--     ->
-- OUTSTANDING
--
-- COMPLIANT
--     ->
-- SATISFIED
--
-- NON_COMPLIANT
--     ->
-- REJECTED
--
-- EXPIRED
--     ->
-- OUTSTANDING
--
-- EXPIRING
--     ->
-- OUTSTANDING
--
-- NOT_APPLICABLE
--     ->
-- NOT_APPLICABLE
-- ------------------------------------------------------------

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
  "notes",
  "reviewedAt",
  "reviewedById",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy_' || va."id" || '_' || vr."id",
  va."id",
  vr."id",
  vr."code",
  vr."name",
  vr."description",
  vr."category",
  COALESCE(vs."required", vr."required"),

  CASE

    WHEN vc."status" = 'COMPLIANT'::"ComplianceStatus"
      THEN 'SATISFIED'::"VendorApplicationRequirementStatus"

    WHEN vc."status" = 'NON_COMPLIANT'::"ComplianceStatus"
      THEN 'REJECTED'::"VendorApplicationRequirementStatus"

    WHEN vc."status" = 'NOT_APPLICABLE'::"ComplianceStatus"
      THEN 'NOT_APPLICABLE'::"VendorApplicationRequirementStatus"

    ELSE
      'OUTSTANDING'::"VendorApplicationRequirementStatus"

  END,

  vc."notes",
  vc."checkedAt",
  NULL,
  COALESCE(vc."createdAt", NOW()),
  NOW()

FROM "VendorApplication" va

JOIN "Vendor" v
  ON v."userId" = va."userId"

JOIN "VendorRequirementSetRequirement" vs
  ON vs."requirementSetId" = v."requirementSetId"

JOIN "VendorRequirement" vr
  ON vr."id" = vs."requirementId"

LEFT JOIN "VendorCompliance" vc
  ON vc."vendorId" = v."id"
  AND vc."requirementId" = vr."id"

WHERE va."id" = 'legacy_' || v."id"

ON CONFLICT ("applicationId", "requirementId") DO NOTHING;


-- ============================================================
-- VALIDATION
-- ============================================================

DO $$
DECLARE

  requirement_count INTEGER;

  requirement_set_count INTEGER;

  mapping_count INTEGER;

  application_count INTEGER;

  application_requirement_count INTEGER;

BEGIN

  -- ----------------------------------------------------------
  -- Vendor requirements
  -- ----------------------------------------------------------

  SELECT COUNT(*)
  INTO requirement_count
  FROM "VendorRequirement";


  IF requirement_count < 13 THEN

    RAISE EXCEPTION
      'Migration validation failed: expected at least 13 VendorRequirement records, found %',
      requirement_count;

  END IF;


  -- ----------------------------------------------------------
  -- Requirement sets
  -- ----------------------------------------------------------

  SELECT COUNT(*)
  INTO requirement_set_count
  FROM "VendorRequirementSet";


  IF requirement_set_count < 11 THEN

    RAISE EXCEPTION
      'Migration validation failed: expected at least 11 VendorRequirementSet records, found %',
      requirement_set_count;

  END IF;


  -- ----------------------------------------------------------
  -- Requirement mappings
  -- ----------------------------------------------------------

  SELECT COUNT(*)
  INTO mapping_count
  FROM "VendorRequirementSetRequirement";


  IF mapping_count < 61 THEN

    RAISE EXCEPTION
      'Migration validation failed: expected at least 61 VendorRequirementSetRequirement records, found %',
      mapping_count;

  END IF;


  -- ----------------------------------------------------------
  -- Vendor applications
  -- ----------------------------------------------------------

  SELECT COUNT(*)
  INTO application_count
  FROM "VendorApplication";


  IF application_count < 1 THEN

    RAISE EXCEPTION
      'Migration validation failed: expected at least 1 VendorApplication record, found %',
      application_count;

  END IF;


  -- ----------------------------------------------------------
  -- Application requirements
  -- ----------------------------------------------------------

  SELECT COUNT(*)
  INTO application_requirement_count
  FROM "VendorApplicationRequirement";


  IF application_requirement_count < 5 THEN

    RAISE EXCEPTION
      'Migration validation failed: expected at least 5 VendorApplicationRequirement records, found %',
      application_requirement_count;

  END IF;


  -- ----------------------------------------------------------
  -- Success
  -- ----------------------------------------------------------

  RAISE NOTICE
    'Vendor onboarding migration validation passed: requirements=%, sets=%, mappings=%, applications=%, application_requirements=%',

    requirement_count,
    requirement_set_count,
    mapping_count,
    application_count,
    application_requirement_count;

END $$;


-- ============================================================
-- END TENDERHUB VENDOR ONBOARDING DATA MIGRATION
-- ============================================================
`;
}

/**
 * Main
 */
function main() {
  const rawDiff = generatePrismaDiff();

  let safeDiff = applySafetyFilter(rawDiff);

  verifyNoDestructiveStatements(safeDiff);

  const dataMigrationSql = getDataMigrationSql();

  safeDiff = safeDiff.trim();

  const finalMigration = `
-- ============================================================
-- TENDERHUB
-- Vendor Onboarding Architecture
-- SAFE DATA-PRESERVING MIGRATION
-- ============================================================

-- Prisma-generated schema changes

${safeDiff}


-- ============================================================
-- Data preservation / migration
-- ============================================================

${dataMigrationSql}
`.trimStart();

  /**
   * Never overwrite an existing migration automatically.
   */
  if (fs.existsSync(migrationDir)) {
    console.error("");
    console.error("Migration directory already exists:");
    console.error("");
    console.error(migrationDir);
    console.error("");

    console.error("Remove it first with:");
    console.error("");

    console.error(
      `Remove-Item ".\\prisma\\migrations\\${migrationName}" -Recurse -Force`
    );

    console.error("");

    process.exit(1);
  }

  fs.mkdirSync(migrationDir, {
    recursive: true,
  });

  fs.writeFileSync(
    migrationFile,
    finalMigration,
    "utf8"
  );

  console.log("Safety filter applied.");
  console.log("");

  console.log("==============================================");
  console.log("MIGRATION CREATED");
  console.log("==============================================");
  console.log("");

  console.log("Migration file:");
  console.log(migrationFile);
  console.log("");

  console.log("DATABASE STATUS:");
  console.log("NO DATABASE CHANGES HAVE BEEN APPLIED.");
  console.log("");

  console.log(
    "Legacy Vendor verification tables and Vendor.verificationProfileId are preserved."
  );

  console.log(
    "Existing Vendor.verifiedAt values are preserved."
  );

  console.log("");

  console.log("Next step:");
  console.log("Inspect the generated migration.sql before deployment.");
  console.log("");

  console.log("Run:");
  console.log("");

  console.log(
    `Get-Content ".\\prisma\\migrations\\${migrationName}\\migration.sql" | Select-String "DROP TABLE|DROP COLUMN|DROP TYPE|DROP CONSTRAINT|DROP INDEX"`
  );

  console.log("");
}

main();