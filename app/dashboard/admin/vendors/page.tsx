import VendorManagement, {
  type ManagedVendor,
} from "@/components/admin/Vendors/VendorManagement";
import { prisma } from "@/lib/db/prisma";

function getOnboardingStatus(
  application:
    | {
        id: string;
        status:
          | "DRAFT"
          | "SUBMITTED"
          | "UNDER_REVIEW"
          | "NEEDS_INFORMATION"
          | "APPROVED"
          | "REJECTED"
          | "WITHDRAWN";
        requirements: Array<{
          required: boolean;
          status:
            | "OUTSTANDING"
            | "SUBMITTED"
            | "UNDER_REVIEW"
            | "SATISFIED"
            | "REJECTED"
            | "NEEDS_INFORMATION"
            | "NOT_APPLICABLE";
        }>;
      }
    | null,
  verifiedAt: Date | null,
): ManagedVendor["onboardingStatus"] {
  if (application?.status === "APPROVED" || verifiedAt) {
    return "APPROVED";
  }

  if (application?.status === "SUBMITTED") {
    return "READY_FOR_REVIEW";
  }

  if (application?.status === "UNDER_REVIEW") {
    return "READY_FOR_REVIEW";
  }

  if (
    application?.status === "DRAFT" ||
    application?.status === "NEEDS_INFORMATION" ||
    application?.status === "REJECTED"
  ) {
    return "IN_PROGRESS";
  }

  if (application?.status === "WITHDRAWN") {
    return "NOT_STARTED";
  }

  if (application) {
    return "IN_PROGRESS";
  }

  return "NOT_STARTED";
}

export default async function AdminVendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      userId: true,
      companyName: true,
      legalName: true,
      email: true,
      phone: true,
      website: true,
      address: true,
      registrationNumber: true,
      taxNumber: true,
      countryId: true,
      businessType: true,
      numberOfEmployees: true,
      yearsOperating: true,
      operatingLocations: true,
      portfolioDescription: true,
      verifiedAt: true,
      createdAt: true,
      updatedAt: true,
    },
  });

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
            id: true,
            userId: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
            approvedAt: true,
            rejectedAt: true,
            requirements: {
              select: {
                required: true,
                status: true,
              },
            },
          },
        })
      : [];

  const applicationByUserId = new Map(
    applications.map((application) => [application.userId, application]),
  );

  const managedVendors: ManagedVendor[] = vendors.map((vendor) => {
    const application = applicationByUserId.get(vendor.userId) ?? null;

    const requirements = application?.requirements ?? [];

    const totalRequirements = requirements.length;

    const requiredRequirements = requirements.filter(
      (requirement) => requirement.required,
    ).length;

    const compliantRequirements = requirements.filter(
      (requirement) =>
        requirement.status === "SATISFIED" ||
        requirement.status === "NOT_APPLICABLE",
    ).length;

    const pendingRequirements = requirements.filter(
      (requirement) =>
        requirement.status === "OUTSTANDING" ||
        requirement.status === "SUBMITTED" ||
        requirement.status === "UNDER_REVIEW" ||
        requirement.status === "NEEDS_INFORMATION",
    ).length;

    const nonCompliantRequirements = requirements.filter(
      (requirement) => requirement.status === "REJECTED",
    ).length;

    const completionPercentage =
      requiredRequirements > 0
        ? Math.round(
            (requirements.filter(
              (requirement) =>
                requirement.required &&
                (requirement.status === "SATISFIED" ||
                  requirement.status === "NOT_APPLICABLE"),
            ).length /
              requiredRequirements) *
              100,
          )
        : application
          ? 100
          : 0;

    const onboardingStatus = getOnboardingStatus(
      application,
      vendor.verifiedAt,
    );

    const profileComplete = Boolean(
      vendor.companyName &&
        vendor.email &&
        vendor.phone &&
        vendor.registrationNumber &&
        vendor.taxNumber &&
        vendor.businessType,
    );

    const readyForReview =
      application?.status === "SUBMITTED" ||
      application?.status === "UNDER_REVIEW";

    return {
      id: vendor.id,
      companyName: vendor.companyName,
      legalName: vendor.legalName,
      email: vendor.email,
      phone: vendor.phone,
      website: vendor.website,
      address: vendor.address,
      registrationNumber: vendor.registrationNumber,
      taxNumber: vendor.taxNumber,
      countryId: vendor.countryId,
      businessType: vendor.businessType,
      numberOfEmployees: vendor.numberOfEmployees,
      yearsOperating: vendor.yearsOperating,
      operatingLocations: vendor.operatingLocations,
      portfolioDescription: vendor.portfolioDescription,
      verifiedAt: vendor.verifiedAt,
      createdAt: vendor.createdAt,
      updatedAt: vendor.updatedAt,

      onboardingStatus,
      applicationId: application?.id ?? null,

      totalRequirements,
      requiredRequirements,
      compliantRequirements,
      pendingRequirements,
      nonCompliantRequirements,

      completionPercentage,
      profileComplete,
      readyForReview,
    };
  });

  return <VendorManagement vendors={managedVendors} />;
}