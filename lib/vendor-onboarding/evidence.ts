import { prisma } from "@/lib/db/prisma";

/**
 * Attach a vendor document as evidence for a vendor application
 * requirement.
 *
 * Evidence belongs to VendorApplicationEvidence because verification
 * is performed against a vendor application, not the permanent
 * Vendor record.
 */
export async function attachVendorEvidence(
  applicationId: string,
  requirementId: string,
  documentId: string,
) {
  const [application, requirement, document] =
    await Promise.all([
      prisma.vendorApplication.findUnique({
        where: {
          id: applicationId,
        },
        select: {
          id: true,
          userId: true,
        },
      }),

      prisma.vendorApplicationRequirement.findUnique({
        where: {
          id: requirementId,
        },
        include: {
          requirement: true,
        },
      }),

      prisma.vendorDocument.findUnique({
        where: {
          id: documentId,
        },
      }),
    ]);

  if (!application) {
    throw new Error(
      "Vendor application not found",
    );
  }

  if (!requirement) {
    throw new Error(
      "Vendor application requirement not found",
    );
  }

  if (!document) {
    throw new Error(
      "Vendor document not found",
    );
  }

  if (!requirement.applicationId) {
    throw new Error(
      "Vendor application requirement is not linked to an application",
    );
  }

  if (
    requirement.applicationId !==
    application.id
  ) {
    throw new Error(
      "Requirement does not belong to this vendor application",
    );
  }

  /*
   * VendorDocument belongs to a Vendor, while the application
   * belongs to the User that owns that Vendor.
   */
  const vendor = await prisma.vendor.findUnique({
    where: {
      userId: application.userId,
    },
    select: {
      id: true,
    },
  });

  if (!vendor) {
    throw new Error(
      "Vendor not found for this application",
    );
  }

  if (document.vendorId !== vendor.id) {
    throw new Error(
      "Document does not belong to this vendor",
    );
  }

  if (!requirement.requirement.active) {
    throw new Error(
      "This vendor onboarding requirement is inactive",
    );
  }

  if (
    requirement.requirement
      .allowedDocumentCategories.length > 0 &&
    !requirement.requirement
      .allowedDocumentCategories.includes(
        document.category,
      )
  ) {
    throw new Error(
      `Document category ${document.category} is not allowed for this requirement`,
    );
  }

  const evidence =
    await prisma.vendorApplicationEvidence.create({
      data: {
        applicationId: application.id,
        requirementId: requirement.id,
        name: document.name,
        category: document.category,
        fileUrl: document.fileUrl,
        mimeType: document.mimeType,
        fileSize: document.fileSize,
        status: "PENDING",
      },
      include: {
        application: true,
        requirement: true,
      },
    });

  /*
   * Evidence has been submitted, so an outstanding requirement
   * can move into the submitted state. Admin review can later
   * move it to SATISFIED, REJECTED, or NEEDS_INFORMATION.
   */
  if (
    requirement.status === "OUTSTANDING"
  ) {
    await prisma.vendorApplicationRequirement.update({
      where: {
        id: requirement.id,
      },
      data: {
        status: "SUBMITTED",
      },
    });
  }

  return evidence;
}

/**
 * Get all documents belonging to the vendor associated with
 * the application.
 */
export async function getVendorEvidence(
  vendorId: string,
) {
  return prisma.vendorDocument.findMany({
    where: {
      vendorId,
    },
    orderBy: {
      uploadedAt: "desc",
    },
  });
}

/**
 * Get all evidence submitted for a particular application
 * requirement.
 */
export async function getVendorRequirementEvidence(
  applicationId: string,
  requirementId: string,
) {
  return prisma.vendorApplicationEvidence.findMany({
    where: {
      applicationId,
      requirementId,
    },
    include: {
      application: true,
      requirement: true,
      reviewedBy: true,
    },
    orderBy: {
      uploadedAt: "desc",
    },
  });
}