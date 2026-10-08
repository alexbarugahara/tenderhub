import { prisma } from "@/lib/db/prisma";

/**
 * TenderHub vendor onboarding requirement helpers.
 *
 * VendorRequirement is the master definition.
 * VendorRequirementSet determines which requirements apply to a vendor.
 * VendorApplicationRequirement is the application-specific snapshot/status.
 */

/**
 * Get active requirements in a vendor requirement set.
 */
export async function getRequirementsForVendorRequirementSet(
  requirementSetId: string,
) {
  if (!requirementSetId?.trim()) {
    throw new Error("Vendor requirement set ID is required.");
  }

  return prisma.vendorRequirementSetRequirement.findMany({
    where: {
      requirementSetId: requirementSetId.trim(),
      active: true,
    },
    include: {
      requirement: true,
    },
    orderBy: [
      {
        required: "desc",
      },
      {
        requirement: {
          name: "asc",
        },
      },
    ],
  });
}

/**
 * Get the active requirements assigned to an application.
 */
export async function getApplicationRequirements(
  applicationId: string,
) {
  if (!applicationId?.trim()) {
    throw new Error("Vendor application ID is required.");
  }

  return prisma.vendorApplicationRequirement.findMany({
    where: {
      applicationId: applicationId.trim(),
    },
    include: {
      requirement: true,
      evidence: true,
    },
    orderBy: [
      {
        required: "desc",
      },
      {
        name: "asc",
      },
    ],
  });
}

/**
 * Get a single application requirement.
 */
export async function getApplicationRequirement(
  applicationRequirementId: string,
) {
  if (!applicationRequirementId?.trim()) {
    throw new Error("Application requirement ID is required.");
  }

  return prisma.vendorApplicationRequirement.findUnique({
    where: {
      id: applicationRequirementId.trim(),
    },
    include: {
      requirement: true,
      evidence: true,
      application: true,
    },
  });
}

/**
 * Calculate the current onboarding progress for an application.
 *
 * This is based on VendorApplicationRequirement records rather than
 * the retired VendorCompliance model.
 */
export async function getVendorApplicationRequirementSummary(
  applicationId: string,
) {
  const requirements = await prisma.vendorApplicationRequirement.findMany({
    where: {
      applicationId,
    },
    select: {
      id: true,
      required: true,
      status: true,
    },
  });

  const required = requirements.filter(
    (requirement) => requirement.required,
  );

  const optional = requirements.filter(
    (requirement) => !requirement.required,
  );

  const satisfied = requirements.filter(
    (requirement) =>
      requirement.status === "SATISFIED" ||
      requirement.status === "NOT_APPLICABLE",
  );

  const requiredSatisfied = required.filter(
    (requirement) =>
      requirement.status === "SATISFIED" ||
      requirement.status === "NOT_APPLICABLE",
  );

  const outstanding = required.filter(
    (requirement) =>
      requirement.status !== "SATISFIED" &&
      requirement.status !== "NOT_APPLICABLE",
  );

  const rejected = requirements.filter(
    (requirement) => requirement.status === "REJECTED",
  );

  const needsInformation = requirements.filter(
    (requirement) =>
      requirement.status === "NEEDS_INFORMATION",
  );

  const underReview = requirements.filter(
    (requirement) =>
      requirement.status === "UNDER_REVIEW",
  );

  const submitted = requirements.filter(
    (requirement) =>
      requirement.status === "SUBMITTED",
  );

  const total = requirements.length;

  return {
    total,
    required: required.length,
    optional: optional.length,

    satisfied: satisfied.length,
    requiredSatisfied: requiredSatisfied.length,

    outstanding: outstanding.length,
    rejected: rejected.length,
    needsInformation: needsInformation.length,
    underReview: underReview.length,
    submitted: submitted.length,

    completionPercentage:
      required.length === 0
        ? 100
        : Math.round(
            (requiredSatisfied.length / required.length) * 100,
          ),

    readyForApproval:
      required.length > 0 &&
      outstanding.length === 0 &&
      rejected.length === 0 &&
      needsInformation.length === 0,
  };
}

/**
 * Return a simple requirement status map for an application.
 */
export async function getVendorApplicationRequirementStatusMap(
  applicationId: string,
) {
  const requirements = await prisma.vendorApplicationRequirement.findMany({
    where: {
      applicationId,
    },
    select: {
      requirementId: true,
      status: true,
    },
  });

  return Object.fromEntries(
    requirements.map((requirement) => [
      requirement.requirementId,
      requirement.status,
    ]),
  );
}