import { prisma } from "@/lib/db/prisma";

/**
 * TenderHub vendor onboarding requirements.
 *
 * These are platform-level requirements that determine what a vendor
 * must provide before the vendor can be approved.
 *
 * Procurement-specific requirements are NOT handled here.
 */

export async function getVendorOnboardingRequirements() {
  return prisma.vendorRequirement.findMany({
    where: {
      active: true,
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

export async function getAllVendorOnboardingRequirements() {
  return prisma.vendorRequirement.findMany({
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

export async function getVendorOnboardingRequirement(
  requirementId: string,
) {
  if (!requirementId?.trim()) {
    throw new Error("Vendor onboarding requirement ID is required.");
  }

  return prisma.vendorRequirement.findUnique({
    where: {
      id: requirementId.trim(),
    },
  });
}

export async function getRequiredVendorOnboardingRequirements() {
  return prisma.vendorRequirement.findMany({
    where: {
      active: true,
      required: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getVendorOnboardingRequirementSummary() {
  const requirements = await prisma.vendorRequirement.findMany({
    where: {
      active: true,
    },
    select: {
      id: true,
      required: true,
      allowedDocumentCategories: true,
    },
  });

  return {
    total: requirements.length,

    required: requirements.filter(
      (requirement) => requirement.required,
    ).length,

    optional: requirements.filter(
      (requirement) => !requirement.required,
    ).length,

    evidenceBased: requirements.filter(
      (requirement) =>
        requirement.allowedDocumentCategories.length > 0,
    ).length,
  };
}