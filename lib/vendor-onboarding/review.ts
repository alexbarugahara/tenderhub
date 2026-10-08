import { prisma } from "@/lib/db/prisma";

type ReviewDecision =
  | "SATISFIED"
  | "REJECTED"
  | "NEEDS_INFORMATION"
  | "NOT_APPLICABLE"
  | "UNDER_REVIEW";

type ReviewOptions = {
  applicationRequirementId: string;
  decision: ReviewDecision;
  notes?: string;
};

export async function reviewVendorRequirement({
  applicationRequirementId,
  decision,
  notes,
}: ReviewOptions) {
  if (!applicationRequirementId?.trim()) {
    throw new Error(
      "Vendor application requirement ID is required.",
    );
  }

  const applicationRequirement =
    await prisma.vendorApplicationRequirement.findUnique({
      where: {
        id: applicationRequirementId.trim(),
      },
      include: {
        requirement: true,
        evidence: true,
        application: true,
      },
    });

  if (!applicationRequirement) {
    throw new Error(
      "Vendor application requirement not found.",
    );
  }

  if (!applicationRequirement.requirement.active) {
    throw new Error(
      "Cannot review an inactive vendor requirement.",
    );
  }

  if (
    decision === "SATISFIED" &&
    applicationRequirement.required &&
    applicationRequirement.evidence.length === 0 &&
    applicationRequirement.requirement
      .allowedDocumentCategories.length > 0
  ) {
    throw new Error(
      "Supporting evidence is required before this requirement can be marked satisfied.",
    );
  }

  const updated =
    await prisma.vendorApplicationRequirement.update({
      where: {
        id: applicationRequirement.id,
      },
      data: {
        status: decision,
        notes: notes?.trim() || null,
        reviewedAt: new Date(),
      },
      include: {
        requirement: true,
        evidence: true,
        application: true,
      },
    });

  return updated;
}

export async function getVendorReviewSummary(
  applicationId: string,
) {
  if (!applicationId?.trim()) {
    throw new Error(
      "Vendor application ID is required.",
    );
  }

  const records =
    await prisma.vendorApplicationRequirement.findMany({
      where: {
        applicationId: applicationId.trim(),
      },
      include: {
        requirement: true,
        evidence: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  const required = records.filter(
    (record) => record.required,
  );

  const satisfied = required.filter(
    (record) =>
      record.status === "SATISFIED",
  );

  const notApplicable = required.filter(
    (record) =>
      record.status === "NOT_APPLICABLE",
  );

  const rejected = required.filter(
    (record) =>
      record.status === "REJECTED",
  );

  const needsInformation = required.filter(
    (record) =>
      record.status === "NEEDS_INFORMATION",
  );

  const underReview = required.filter(
    (record) =>
      record.status === "UNDER_REVIEW",
  );

  const submitted = required.filter(
    (record) =>
      record.status === "SUBMITTED",
  );

  const outstanding = required.filter(
    (record) =>
      record.status === "OUTSTANDING",
  );

  const completed =
    satisfied.length +
    notApplicable.length;

  const readyForApproval =
    required.length > 0 &&
    completed === required.length &&
    rejected.length === 0 &&
    needsInformation.length === 0 &&
    underReview.length === 0 &&
    submitted.length === 0 &&
    outstanding.length === 0;

  return {
    total: records.length,

    required: required.length,

    satisfied: satisfied.length,

    notApplicable: notApplicable.length,

    rejected: rejected.length,

    needsInformation: needsInformation.length,

    underReview: underReview.length,

    submitted: submitted.length,

    outstanding: outstanding.length,

    completionPercentage:
      required.length === 0
        ? 0
        : Math.round(
            (completed / required.length) * 100,
          ),

    readyForApproval,
  };
}