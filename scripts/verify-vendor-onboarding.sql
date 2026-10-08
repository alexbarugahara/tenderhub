-- ============================================================
-- TENDERHUB
-- VERIFY VENDOR ONBOARDING MIGRATION
-- ============================================================

-- ------------------------------------------------------------
-- 1. COUNT NEW ONBOARDING RECORDS
-- ------------------------------------------------------------

SELECT
    (SELECT COUNT(*) FROM "VendorRequirement")
        AS vendor_requirements,

    (SELECT COUNT(*) FROM "VendorRequirementSet")
        AS requirement_sets,

    (SELECT COUNT(*) FROM "VendorRequirementSetRequirement")
        AS requirement_mappings,

    (SELECT COUNT(*) FROM "VendorApplication")
        AS vendor_applications,

    (SELECT COUNT(*) FROM "VendorApplicationRequirement")
        AS application_requirements,

    (SELECT COUNT(*) FROM "VendorApplicationEvidence")
        AS application_evidence,

    (SELECT COUNT(*) FROM "VendorVerificationAction")
        AS verification_actions;


-- ------------------------------------------------------------
-- 2. VERIFY EXISTING VENDOR
-- ------------------------------------------------------------

SELECT
    v."id",
    v."companyName",
    v."legalName",
    v."verifiedAt",
    v."verificationProfileId",
    v."requirementSetId",
    va."id" AS "applicationId",
    va."status" AS "applicationStatus",
    va."companyName" AS "applicationCompanyName"
FROM "Vendor" v
LEFT JOIN "VendorApplication" va
    ON va."userId" = v."userId"
WHERE v."companyName" = 'Demo Technology Solutions';


-- ------------------------------------------------------------
-- 3. VERIFY APPLICATION REQUIREMENTS
-- ------------------------------------------------------------

SELECT
    va."companyName" AS "vendor",
    vr."code",
    vr."name",
    vr."category",
    var."required",
    var."status",
    var."notes"
FROM "VendorApplicationRequirement" var
JOIN "VendorApplication" va
    ON va."id" = var."applicationId"
JOIN "VendorRequirement" vr
    ON vr."id" = var."requirementId"
WHERE va."companyName" = 'Demo Technology Solutions'
ORDER BY vr."code";


-- ------------------------------------------------------------
-- 4. VERIFY LEGACY TABLES STILL EXIST
-- ------------------------------------------------------------

SELECT
    'VendorCompliance' AS legacy_table,
    COUNT(*) AS record_count
FROM "VendorCompliance"

UNION ALL

SELECT
    'VendorComplianceRequirement',
    COUNT(*)
FROM "VendorComplianceRequirement"

UNION ALL

SELECT
    'VendorVerificationProfile',
    COUNT(*)
FROM "VendorVerificationProfile"

UNION ALL

SELECT
    'VendorVerificationProfileRequirement',
    COUNT(*)
FROM "VendorVerificationProfileRequirement";


-- ------------------------------------------------------------
-- 5. VERIFY NO VENDOR WAS AUTOMATICALLY APPROVED
-- ------------------------------------------------------------

SELECT
    COUNT(*) AS verified_vendor_count
FROM "Vendor"
WHERE "verifiedAt" IS NOT NULL;


-- ------------------------------------------------------------
-- 6. VERIFY APPLICATION STATUS DISTRIBUTION
-- ------------------------------------------------------------

SELECT
    "status",
    COUNT(*) AS count
FROM "VendorApplication"
GROUP BY "status"
ORDER BY "status";


-- ------------------------------------------------------------
-- 7. VERIFY APPLICATION REQUIREMENT STATUS DISTRIBUTION
-- ------------------------------------------------------------

SELECT
    "status",
    COUNT(*) AS count
FROM "VendorApplicationRequirement"
GROUP BY "status"
ORDER BY "status";


-- ============================================================
-- END VERIFICATION
-- ============================================================