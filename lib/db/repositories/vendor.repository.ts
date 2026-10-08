import { prisma } from "@/lib/db/prisma";

import type { Prisma } from "@prisma/client";

type VendorOnboardingStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "APPROVED";

type VendorOnboardingSummary = {
  onboardingStatus: VendorOnboardingStatus;
  totalRequirements: number;
  requiredRequirements: number;
  compliantRequirements: number;
  pendingRequirements: number;
  nonCompliantRequirements: number;
  expiredRequirements: number;
  expiringRequirements: number;
  completionPercentage: number;
  profileComplete: boolean;
  readyForReview: boolean;
};

type VendorRequirementRecord = {
  id: string;
  required: boolean;
};

type VendorApplicationRequirementRecord = {
  status:
    | "OUTSTANDING"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "SATISFIED"
    | "REJECTED"
    | "NEEDS_INFORMATION"
    | "NOT_APPLICABLE";
  requirementId: string;
  required: boolean;
};

function calculateVendorOnboarding(
  vendor: {
    verifiedAt: Date | null;
    companyName: string | null;
    email: string | null;
    registrationNumber: string | null;
    taxNumber: string | null;
  },
  activeRequirements: VendorRequirementRecord[],
  applicationRequirements: VendorApplicationRequirementRecord[],
): VendorOnboardingSummary {
  /*
   * TenderHub activation requires these core vendor profile fields.
   */
  const profileComplete =
    Boolean(vendor.companyName?.trim()) &&
    Boolean(vendor.email?.trim()) &&
    Boolean(vendor.registrationNumber?.trim()) &&
    Boolean(vendor.taxNumber?.trim());

  const requiredRequirements = activeRequirements.filter(
    (requirement) => requirement.required,
  );

  const totalRequirements = activeRequirements.length;

  const requirementById = new Map(
    applicationRequirements.map((record) => [
      record.requirementId,
      record.status,
    ]),
  );

  let compliantRequirements = 0;
  let pendingRequirements = 0;
  let nonCompliantRequirements = 0;
  let expiredRequirements = 0;
  let expiringRequirements = 0;

  for (const requirement of activeRequirements) {
    const status = requirementById.get(requirement.id);

    switch (status) {
      case "SATISFIED":
      case "NOT_APPLICABLE":
        compliantRequirements += 1;
        break;

      case "REJECTED":
      case "NEEDS_INFORMATION":
        nonCompliantRequirements += 1;
        break;

      case "SUBMITTED":
      case "UNDER_REVIEW":
      case "OUTSTANDING":
      default:
        pendingRequirements += 1;
        break;
    }
  }

  /*
   * A required requirement is satisfied when it is SATISFIED
   * or explicitly marked NOT_APPLICABLE.
   */
  const satisfiedRequiredRequirements =
    requiredRequirements.filter((requirement) => {
      const status = requirementById.get(requirement.id);

      return (
        status === "SATISFIED" ||
        status === "NOT_APPLICABLE"
      );
    }).length;

  const completionPercentage =
    requiredRequirements.length === 0
      ? profileComplete
        ? 100
        : 0
      : Math.round(
          (satisfiedRequiredRequirements /
            requiredRequirements.length) *
            100,
        );

  const readyForReview =
    profileComplete &&
    requiredRequirements.every((requirement) => {
      const status = requirementById.get(requirement.id);

      return (
        status === "SATISFIED" ||
        status === "NOT_APPLICABLE"
      );
    });

  /*
   * verifiedAt remains the final activation marker.
   */
  let onboardingStatus: VendorOnboardingStatus;

  if (vendor.verifiedAt) {
    onboardingStatus = "APPROVED";
  } else if (readyForReview) {
    onboardingStatus = "READY_FOR_REVIEW";
  } else {
    const hasApplicationActivity =
      applicationRequirements.length > 0;

    const hasProfileActivity =
      Boolean(vendor.companyName?.trim()) ||
      Boolean(vendor.email?.trim()) ||
      Boolean(vendor.registrationNumber?.trim()) ||
      Boolean(vendor.taxNumber?.trim());

    onboardingStatus =
      hasApplicationActivity || hasProfileActivity
        ? "IN_PROGRESS"
        : "NOT_STARTED";
  }

  return {
    onboardingStatus,
    totalRequirements,
    requiredRequirements: requiredRequirements.length,
    compliantRequirements,
    pendingRequirements,
    nonCompliantRequirements,
    expiredRequirements,
    expiringRequirements,
    completionPercentage,
    profileComplete,
    readyForReview,
  };
}

export async function findVendorById(id: string) {
  return prisma.vendor.findUnique({
    where: { id },
  });
}

export async function findVendorByUserId(userId: string) {
  return prisma.vendor.findUnique({
    where: { userId },
  });
}

export async function findVendorWithDetails(id: string) {
  return prisma.vendor.findUnique({
    where: { id },
    include: {
      user: true,
      country: true,
      classifications: {
        include: {
          classification: true,
        },
      },
      documents: true,
      certifications: true,
      bids: true,
      contracts: true,
      awards: true,
      teamMembers: true,
      savedSolicitations: {
        include: {
          solicitation: true,
        },
      },
    },
  });
}

export async function createVendor(
  data: Prisma.VendorCreateInput,
) {
  return prisma.vendor.create({
    data,
  });
}

export async function updateVendor(
  id: string,
  data: Prisma.VendorUpdateInput,
) {
  return prisma.vendor.update({
    where: { id },
    data,
  });
}

/**
 * Legacy compatibility function.
 *
 * New vendor onboarding should preferably use:
 * activateVendor()
 * from lib/vendor-onboarding/activation.ts
 *
 * This function is retained so existing callers do not break.
 */
export async function verifyVendor(id: string) {
  return prisma.vendor.update({
    where: { id },
    data: {
      verifiedAt: new Date(),
    },
  });
}

export async function deleteVendor(id: string) {
  return prisma.vendor.delete({
    where: { id },
  });
}

export async function listVendors(params?: {
  search?: string;
  countryId?: string;
  skip?: number;
  take?: number;
}) {
  const {
    search,
    countryId,
    skip = 0,
    take = 50,
  } = params ?? {};

  const where: Prisma.VendorWhereInput = {
    ...(countryId ? { countryId } : {}),
    ...(search
      ? {
          OR: [
            {
              companyName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              legalName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              registrationNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              taxNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  /*
   * Load active TenderHub vendor requirements.
   */
  const activeRequirements =
    await prisma.vendorRequirement.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        required: true,
      },
    });

  /*
   * Load vendors and their latest/current application
   * requirement records.
   */
  const vendors = await prisma.vendor.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
    include: {
      user: true,
    },
  });

  /*
   * Get application requirements separately because Vendor
   * does not directly own a complianceRecords relation.
   */
  const userIds = vendors.map((vendor) => vendor.userId);

  const applications =
    userIds.length > 0
      ? await prisma.vendorApplication.findMany({
          where: {
            userId: {
              in: userIds,
            },
          },
          select: {
            userId: true,
            requirements: {
              where: {
                requirement: {
                  active: true,
                },
              },
              select: {
                status: true,
                requirementId: true,
                required: true,
              },
            },
          },
        })
      : [];

  const applicationByUserId = new Map(
    applications.map((application) => [
      application.userId,
      application,
    ]),
  );

  return vendors.map((vendor) => {
    const application =
      applicationByUserId.get(vendor.userId);

    const onboarding = calculateVendorOnboarding(
      {
        verifiedAt: vendor.verifiedAt,
        companyName: vendor.companyName,
        email: vendor.email,
        registrationNumber: vendor.registrationNumber,
        taxNumber: vendor.taxNumber,
      },
      activeRequirements,
      application?.requirements ?? [],
    );

    return {
      ...vendor,
      ...onboarding,
    };
  });
}

export async function countVendors(params?: {
  search?: string;
  countryId?: string;
}) {
  const { search, countryId } = params ?? {};

  const where: Prisma.VendorWhereInput = {
    ...(countryId ? { countryId } : {}),
    ...(search
      ? {
          OR: [
            {
              companyName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              legalName: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              registrationNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              taxNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.vendor.count({
    where,
  });
}

export async function addVendorTeamMember(
  data: Prisma.VendorTeamMemberCreateInput,
) {
  return prisma.vendorTeamMember.create({
    data,
  });
}

export async function updateVendorTeamMember(
  id: string,
  data: Prisma.VendorTeamMemberUpdateInput,
) {
  return prisma.vendorTeamMember.update({
    where: { id },
    data,
  });
}

export async function removeVendorTeamMember(id: string) {
  return prisma.vendorTeamMember.delete({
    where: { id },
  });
}

export async function addVendorDocument(
  data: Prisma.VendorDocumentCreateInput,
) {
  return prisma.vendorDocument.create({
    data,
  });
}

export async function updateVendorDocument(
  id: string,
  data: Prisma.VendorDocumentUpdateInput,
) {
  return prisma.vendorDocument.update({
    where: { id },
    data,
  });
}

export async function removeVendorDocument(id: string) {
  return prisma.vendorDocument.delete({
    where: { id },
  });
}

export async function addVendorCertification(
  data: Prisma.VendorCertificationCreateInput,
) {
  return prisma.vendorCertification.create({
    data,
  });
}

export async function updateVendorCertification(
  id: string,
  data: Prisma.VendorCertificationUpdateInput,
) {
  return prisma.vendorCertification.update({
    where: { id },
    data,
  });
}

export async function removeVendorCertification(id: string) {
  return prisma.vendorCertification.delete({
    where: { id },
  });
}

export async function addVendorClassification(
  data: Prisma.VendorClassificationCreateInput,
) {
  return prisma.vendorClassification.create({
    data,
  });
}

export async function removeVendorClassification(id: string) {
  return prisma.vendorClassification.delete({
    where: { id },
  });
}