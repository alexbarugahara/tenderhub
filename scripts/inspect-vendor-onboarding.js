const { execFileSync } = require("child_process");

const sql = `
SELECT
    (SELECT COUNT(*) FROM "VendorRequirement") AS vendor_requirements,
    (SELECT COUNT(*) FROM "VendorRequirementSet") AS requirement_sets,
    (SELECT COUNT(*) FROM "VendorRequirementSetRequirement") AS requirement_mappings,
    (SELECT COUNT(*) FROM "VendorApplication") AS vendor_applications,
    (SELECT COUNT(*) FROM "VendorApplicationRequirement") AS application_requirements,
    (SELECT COUNT(*) FROM "VendorApplicationEvidence") AS application_evidence,
    (SELECT COUNT(*) FROM "VendorVerificationAction") AS verification_actions;

SELECT
    v."companyName",
    v."verifiedAt",
    v."verificationProfileId",
    v."requirementSetId",
    va."id" AS "applicationId",
    va."status" AS "applicationStatus"
FROM "Vendor" v
LEFT JOIN "VendorApplication" va
    ON va."userId" = v."userId"
WHERE v."companyName" = 'Demo Technology Solutions';

SELECT
    vr."code",
    var."status",
    var."required"
FROM "VendorApplicationRequirement" var
JOIN "VendorApplication" va
    ON va."id" = var."applicationId"
JOIN "VendorRequirement" vr
    ON vr."id" = var."requirementId"
WHERE va."companyName" = 'Demo Technology Solutions'
ORDER BY vr."code";
`;

try {
  const result = execFileSync(
    "cmd.exe",
    [
      "/d",
      "/s",
      "/c",
      `npx prisma db execute --schema ".\\prisma\\schema.prisma" --stdin`,
    ],
    {
      input: sql,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }
  );

  console.log(result);
} catch (error) {
  console.error(error.stdout?.toString() || "");
  console.error(error.stderr?.toString() || "");
  process.exit(1);
}