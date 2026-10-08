import {
  ComplianceCategory,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

/**
 * TenderHub vendor onboarding repository.
 *
 * Legacy VendorCompliance / VendorComplianceRequirement records
 * have been retired.
 *
 * Current architecture:
 *
 * VendorRequirement
 *   ↓
 * VendorRequirementSet
 *   ↓
 * VendorApplication
 *   ↓
 * VendorApplicationRequirement
 *   ↓
 * VendorApplicationEvidence
 */

/* -------------------------------------------------------------------------- */
/* Vendor requirements                                                        */
/* -------------------------------------------------------------------------- */

export async function findComplianceRequirementById(
  id: string,
) {
  return prisma.vendorRequirement.findUnique({
    where: { id },
  });
}

export async function findComplianceRequirementWithDetails(
  id: string,
) {
  return prisma.vendorRequirement.findUnique({
    where: { id },
    include: {
      requirementSets: {
        include: {
          requirementSet: true,
        },
      },
      applicationRequirements: {
        include: {
          application: true,
          evidence: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function createComplianceRequirement(
  data: Prisma.VendorRequirementCreateInput,
) {
  return prisma.vendorRequirement.create({
    data,
  });
}

export async function updateComplianceRequirement(
  id: string,
  data: Prisma.VendorRequirementUpdateInput,
) {
  return prisma.vendorRequirement.update({
    where: { id },
    data,
  });
}

export async function deleteComplianceRequirement(
  id: string,
) {
  return prisma.vendorRequirement.delete({
    where: { id },
  });
}

export async function listComplianceRequirements({
  category,
  skip = 0,
  take = 20,
}: {
  category?: ComplianceCategory;
  skip?: number;
  take?: number;
}) {
  return prisma.vendorRequirement.findMany({
    where: {
      ...(category ? { category } : {}),
    },
    include: {
      requirementSets: {
        include: {
          requirementSet: true,
        },
      },
      applicationRequirements: {
        include: {
          application: true,
          evidence: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

export async function countComplianceRequirements({
  category,
}: {
  category?: ComplianceCategory;
}) {
  return prisma.vendorRequirement.count({
    where: {
      ...(category ? { category } : {}),
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Application requirements                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Finds an application requirement by its ID.
 *
 * This replaces the old VendorCompliance lookup.
 */
export async function findVendorComplianceById(
  id: string,
) {
  return prisma.vendorApplicationRequirement.findUnique({
    where: { id },
    include: {
      application: true,
      requirement: true,
      evidence: true,
    },
  });
}

export async function findVendorComplianceWithDetails(
  id: string,
) {
  return prisma.vendorApplicationRequirement.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          user: true,
          country: true,
        },
      },
      requirement: true,
      evidence: true,
      reviewedBy: true,
    },
  });
}

/**
 * Finds an application requirement using the application and
 * requirement IDs.
 *
 * The new schema uses applicationId rather than vendorId.
 */
export async function findVendorComplianceByVendorAndRequirement(
  vendorId: string,
  requirementId: string,
) {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id: vendorId,
    },
    select: {
      userId: true,
    },
  });

  if (!vendor) {
    return null;
  }

  const application =
    await prisma.vendorApplication.findUnique({
      where: {
        userId: vendor.userId,
      },
      select: {
        id: true,
      },
    });

  if (!application) {
    return null;
  }

  return prisma.vendorApplicationRequirement.findUnique({
    where: {
      applicationId_requirementId: {
        applicationId: application.id,
        requirementId,
      },
    },
    include: {
      application: true,
      requirement: true,
      evidence: true,
    },
  });
}

/**
 * Creates an application requirement.
 *
 * This function keeps the legacy export name so existing callers
 * do not immediately need to be rewritten.
 */
export async function createVendorCompliance(
  data: Prisma.VendorApplicationRequirementCreateInput,
) {
  return prisma.vendorApplicationRequirement.create({
    data,
    include: {
      application: true,
      requirement: true,
      evidence: true,
    },
  });
}

/**
 * Upserts an application requirement.
 */
export async function upsertVendorCompliance(
  data: Prisma.VendorApplicationRequirementCreateInput,
) {
  const applicationId =
    data.application?.connect?.id;

  const requirementId =
    data.requirement?.connect?.id;

  if (!applicationId || !requirementId) {
    throw new Error(
      "Application ID and requirement ID are required to upsert vendor compliance.",
    );
  }

  return prisma.vendorApplicationRequirement.upsert({
    where: {
      applicationId_requirementId: {
        applicationId,
        requirementId,
      },
    },
    update: {
      status: data.status,
      notes: data.notes,
    },
    create: data,
    include: {
      application: true,
      requirement: true,
      evidence: true,
    },
  });
}

export async function updateVendorCompliance(
  id: string,
  data: Prisma.VendorApplicationRequirementUpdateInput,
) {
  return prisma.vendorApplicationRequirement.update({
    where: { id },
    data,
    include: {
      application: true,
      requirement: true,
      evidence: true,
    },
  });
}

/**
 * Updates an application requirement's status.
 *
 * The old ComplianceStatus enum no longer exists.
 */
export async function updateVendorComplianceStatus(
  id: string,
  status: Prisma.VendorApplicationRequirementUpdateInput["status"],
) {
  return prisma.vendorApplicationRequirement.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
    },
    include: {
      application: true,
      requirement: true,
      evidence: true,
    },
  });
}

export async function deleteVendorCompliance(
  id: string,
) {
  return prisma.vendorApplicationRequirement.delete({
    where: { id },
  });
}

/* -------------------------------------------------------------------------- */
/* Application requirement listing                                             */
/* -------------------------------------------------------------------------- */

export async function listVendorCompliance({
  vendorId,
  requirementId,
  status,
  category,
  skip = 0,
  take = 20,
}: {
  vendorId?: string;
  requirementId?: string;
  status?: Prisma.VendorApplicationRequirementWhereInput["status"];
  category?: ComplianceCategory;
  skip?: number;
  take?: number;
}) {
  const vendorUserId = vendorId
    ? (
        await prisma.vendor.findUnique({
          where: {
            id: vendorId,
          },
          select: {
            userId: true,
          },
        })
      )?.userId
    : undefined;

  const applicationId = vendorUserId
    ? (
        await prisma.vendorApplication.findUnique({
          where: {
            userId: vendorUserId,
          },
          select: {
            id: true,
          },
        })
      )?.id
    : undefined;

  const where: Prisma.VendorApplicationRequirementWhereInput =
    {
      ...(applicationId
        ? {
            applicationId,
          }
        : {}),
      ...(requirementId
        ? {
            requirementId,
          }
        : {}),
      ...(status
        ? {
            status,
          }
        : {}),
      ...(category
        ? {
            category,
          }
        : {}),
    };

  return prisma.vendorApplicationRequirement.findMany({
    where,
    include: {
      application: {
        include: {
          user: true,
        },
      },
      requirement: true,
      evidence: true,
      reviewedBy: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

export async function countVendorCompliance({
  vendorId,
  requirementId,
  status,
  category,
}: {
  vendorId?: string;
  requirementId?: string;
  status?: Prisma.VendorApplicationRequirementWhereInput["status"];
  category?: ComplianceCategory;
}) {
  const vendorUserId = vendorId
    ? (
        await prisma.vendor.findUnique({
          where: {
            id: vendorId,
          },
          select: {
            userId: true,
          },
        })
      )?.userId
    : undefined;

  const applicationId = vendorUserId
    ? (
        await prisma.vendorApplication.findUnique({
          where: {
            userId: vendorUserId,
          },
          select: {
            id: true,
          },
        })
      )?.id
    : undefined;

  const where: Prisma.VendorApplicationRequirementWhereInput =
    {
      ...(applicationId
        ? {
            applicationId,
          }
        : {}),
      ...(requirementId
        ? {
            requirementId,
          }
        : {}),
      ...(status
        ? {
            status,
          }
        : {}),
      ...(category
        ? {
            category,
          }
        : {}),
    };

  return prisma.vendorApplicationRequirement.count({
    where,
  });
}