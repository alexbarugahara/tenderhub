import { prisma } from "@/lib/db/prisma";

export async function getVendorApplications(vendorId: string) {
  if (!vendorId?.trim()) {
    throw new Error("Vendor ID is required.");
  }

  const vendor = await prisma.vendor.findUnique({
    where: {
      id: vendorId.trim(),
    },
    include: {
      country: true,
      documents: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
    },
  });

  if (!vendor) {
    throw new Error("Vendor not found.");
  }

  const application = await prisma.vendorApplication.findUnique({
    where: {
      userId: vendor.userId,
    },
    include: {
      country: true,
      requirementSet: true,
      requirements: {
        include: {
          requirement: true,
          evidence: {
            include: {
              reviewedBy: true,
            },
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
        orderBy: [
          {
            required: "desc",
          },
          {
            name: "asc",
          },
        ],
      },
      evidence: {
        orderBy: {
          uploadedAt: "desc",
        },
      },
      actions: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!application) {
    return {
      vendor: {
        id: vendor.id,
        companyName: vendor.companyName,
        legalName: vendor.legalName,
        description: vendor.description,
        email: vendor.email,
        phone: vendor.phone,
        website: vendor.website,
        address: vendor.address,
        registrationNumber: vendor.registrationNumber,
        taxNumber: vendor.taxNumber,
        businessType: vendor.businessType,
        numberOfEmployees: vendor.numberOfEmployees,
        yearsOperating: vendor.yearsOperating,
        operatingLocations: vendor.operatingLocations,
        portfolioDescription: vendor.portfolioDescription,
        verifiedAt: vendor.verifiedAt,
        country: vendor.country,
      },

      application: null,

      documents: vendor.documents,

      requirements: [],

      evidence: [],

      summary: {
        totalRequirements: 0,
        requiredRequirements: 0,
        satisfiedRequired: 0,
        pendingRequired: 0,
        rejectedRequired: 0,
        needsInformationRequired: 0,
        underReviewRequired: 0,
        submittedRequired: 0,
        completionPercentage: 0,
        profileComplete: Boolean(
          vendor.companyName &&
            vendor.email &&
            vendor.registrationNumber &&
            vendor.taxNumber,
        ),
        readyForReview: false,
        approved: Boolean(vendor.verifiedAt),
        applicationStatus: null,
      },
    };
  }

  const requirements = application.requirements.map(
    (applicationRequirement) => ({
      id: applicationRequirement.id,
      requirementId: applicationRequirement.requirementId,
      code: applicationRequirement.code,
      name: applicationRequirement.name,
      description: applicationRequirement.description,
      category: applicationRequirement.category,
      required: applicationRequirement.required,
      status: applicationRequirement.status,
      notes: applicationRequirement.notes,
      reviewedAt: applicationRequirement.reviewedAt,
      validityDays:
        applicationRequirement.requirement.validityDays,
      allowedDocumentCategories:
        applicationRequirement.requirement
          .allowedDocumentCategories,

      evidence: applicationRequirement.evidence,
    }),
  );

  const requiredRequirements = requirements.filter(
    (requirement) => requirement.required,
  );

  const satisfiedRequired =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status === "SATISFIED" ||
        requirement.status === "NOT_APPLICABLE",
    );

  const pendingRequired =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status === "OUTSTANDING" ||
        requirement.status === "SUBMITTED" ||
        requirement.status === "UNDER_REVIEW",
    );

  const rejectedRequired =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status === "REJECTED",
    );

  const needsInformationRequired =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status === "NEEDS_INFORMATION",
    );

  const underReviewRequired =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status === "UNDER_REVIEW",
    );

  const submittedRequired =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status === "SUBMITTED",
    );

  const completionPercentage =
    requiredRequirements.length === 0
      ? 0
      : Math.round(
          (satisfiedRequired.length /
            requiredRequirements.length) *
            100,
        );

  const profileComplete = Boolean(
    application.companyName &&
      application.email &&
      application.registrationNumber &&
      application.taxNumber,
  );

  const readyForReview =
    profileComplete &&
    requiredRequirements.length > 0 &&
    requiredRequirements.every(
      (requirement) =>
        requirement.status === "SATISFIED" ||
        requirement.status === "NOT_APPLICABLE",
    );

  const approved =
    application.status === "APPROVED" ||
    Boolean(vendor.verifiedAt);

  return {
    vendor: {
      id: vendor.id,
      companyName: vendor.companyName,
      legalName: vendor.legalName,
      description: vendor.description,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website,
      address: vendor.address,
      registrationNumber: vendor.registrationNumber,
      taxNumber: vendor.taxNumber,
      businessType: vendor.businessType,
      numberOfEmployees: vendor.numberOfEmployees,
      yearsOperating: vendor.yearsOperating,
      operatingLocations: vendor.operatingLocations,
      portfolioDescription: vendor.portfolioDescription,
      verifiedAt: vendor.verifiedAt,
      country: vendor.country,
    },

    application: {
      id: application.id,
      userId: application.userId,
      requirementSetId: application.requirementSetId,
      requirementSet: application.requirementSet,
      status: application.status,
      companyName: application.companyName,
      legalName: application.legalName,
      description: application.description,
      email: application.email,
      phone: application.phone,
      website: application.website,
      address: application.address,
      registrationNumber:
        application.registrationNumber,
      taxNumber: application.taxNumber,
      countryId: application.countryId,
      businessType: application.businessType,
      numberOfEmployees:
        application.numberOfEmployees,
      yearsOperating: application.yearsOperating,
      operatingLocations:
        application.operatingLocations,
      portfolioDescription:
        application.portfolioDescription,
      submittedAt: application.submittedAt,
      reviewedAt: application.reviewedAt,
      approvedAt: application.approvedAt,
      rejectedAt: application.rejectedAt,
      adminNotes: application.adminNotes,
      rejectionReason:
        application.rejectionReason,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    },

    documents: vendor.documents,

    requirements,

    evidence: application.evidence,

    actions: application.actions,

    summary: {
      totalRequirements: requirements.length,
      requiredRequirements:
        requiredRequirements.length,
      satisfiedRequired:
        satisfiedRequired.length,
      pendingRequired:
        pendingRequired.length,
      rejectedRequired:
        rejectedRequired.length,
      needsInformationRequired:
        needsInformationRequired.length,
      underReviewRequired:
        underReviewRequired.length,
      submittedRequired:
        submittedRequired.length,
      completionPercentage,
      profileComplete,
      readyForReview,
      approved,
      applicationStatus: application.status,
    },
  };
}

/**
 * Returns the current vendor onboarding status.
 *
 * NOT_STARTED
 * IN_PROGRESS
 * READY_FOR_REVIEW
 * APPROVED
 */
export async function getVendorApplicationStatus(
  vendorId: string,
) {
  const application =
    await getVendorApplications(vendorId);

  if (application.summary.approved) {
    return "APPROVED" as const;
  }

  if (application.summary.readyForReview) {
    return "READY_FOR_REVIEW" as const;
  }

  const hasActivity =
    application.application !== null ||
    application.documents.length > 0 ||
    application.requirements.length > 0 ||
    application.evidence.length > 0;

  if (hasActivity) {
    return "IN_PROGRESS" as const;
  }

  return "NOT_STARTED" as const;
}