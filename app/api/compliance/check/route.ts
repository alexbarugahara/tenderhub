import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

function getRequirementResult(
  status:
    | "OUTSTANDING"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "SATISFIED"
    | "REJECTED"
    | "NEEDS_INFORMATION"
    | "NOT_APPLICABLE",
  required: boolean,
  evidenceCount: number,
  acceptedEvidenceCount: number,
  rejectedEvidenceCount: number,
) {
  if (status === "NOT_APPLICABLE") {
    return {
      status,
      compliant: true,
      reason: "Requirement is not applicable",
    };
  }

  if (status === "SATISFIED") {
    return {
      status,
      compliant: true,
      reason: "Requirement is satisfied",
    };
  }

  if (acceptedEvidenceCount > 0 && status !== "REJECTED") {
    return {
      status,
      compliant: true,
      reason: "Accepted evidence has been received",
    };
  }

  if (status === "REJECTED") {
    return {
      status,
      compliant: false,
      reason:
        rejectedEvidenceCount > 0
          ? "Submitted evidence was rejected"
          : "Requirement was rejected",
    };
  }

  if (status === "NEEDS_INFORMATION") {
    return {
      status,
      compliant: false,
      reason: "Additional information is required",
    };
  }

  if (status === "UNDER_REVIEW") {
    return {
      status,
      compliant: false,
      reason: "Requirement is under review",
    };
  }

  if (status === "SUBMITTED") {
    return {
      status,
      compliant: false,
      reason: "Requirement has been submitted and is awaiting review",
    };
  }

  if (evidenceCount > 0) {
    return {
      status,
      compliant: false,
      reason: "Evidence has been submitted and is awaiting verification",
    };
  }

  return {
    status,
    compliant: !required,
    reason: required
      ? "Required requirement is outstanding"
      : "Optional requirement is outstanding",
  };
}

async function getVendorApplication(vendorId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: {
      id: vendorId,
    },
    select: {
      id: true,
      userId: true,
      companyName: true,
    },
  });

  if (!vendor) {
    return null;
  }

  const application = await prisma.vendorApplication.findUnique({
    where: {
      userId: vendor.userId,
    },
  });

  return {
    vendor,
    application,
  };
}

async function checkVendorAccess(
  user: {
    id: string;
    role?: string | null;
  },
  vendorId: string,
) {
  const role = user.role as UserRole;

  if (role === UserRole.ADMIN) {
    return true;
  }

  if (role === UserRole.VENDOR) {
    const vendor = await prisma.vendor.findUnique({
      where: {
        id: vendorId,
      },
      select: {
        userId: true,
      },
    });

    return !!vendor && vendor.userId === user.id;
  }

  if (role === UserRole.ORGANIZATION) {
    const memberships = await prisma.organizationMember.findMany({
      where: {
        userId: user.id,
      },
      select: {
        organizationId: true,
      },
    });

    const organizationIds = memberships.map(
      (membership) => membership.organizationId,
    );

    if (organizationIds.length === 0) {
      return false;
    }

    const vendorAccess = await prisma.vendor.findFirst({
      where: {
        id: vendorId,
        bids: {
          some: {
            solicitation: {
              organizationId: {
                in: organizationIds,
              },
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    return !!vendorAccess;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    const role = user.role as UserRole;

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.ORGANIZATION &&
      role !== UserRole.VENDOR
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to perform compliance checks",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const vendorId =
      typeof body.vendorId === "string"
        ? body.vendorId.trim()
        : "";

    const requirementId =
      typeof body.requirementId === "string"
        ? body.requirementId.trim()
        : "";

    if (!vendorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor ID is required",
        },
        { status: 400 },
      );
    }

    const hasAccess = await checkVendorAccess(user, vendorId);

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to this vendor",
        },
        { status: 403 },
      );
    }

    const vendorApplication = await getVendorApplication(vendorId);

    if (!vendorApplication) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor not found",
        },
        { status: 404 },
      );
    }

    const { vendor, application } = vendorApplication;

    /*
     * A VendorApplication is the authoritative onboarding record.
     *
     * A Vendor may exist without an application for legacy/demo records.
     * In that case there is no application-level compliance record to check.
     */
    if (!application) {
      return NextResponse.json({
        success: true,
        data: {
          vendorId: vendor.id,
          vendorName: vendor.companyName,
          overallCompliant: false,
          requiredRequirementsCount: 0,
          requiredCompliantCount: 0,
          complianceRate: 0,
          requirements: [],
          applicationStatus: null,
          message:
            "This vendor does not have a vendor onboarding application.",
        },
      });
    }

    if (requirementId) {
      const requirement = await prisma.vendorRequirement.findUnique({
        where: {
          id: requirementId,
        },
      });

      if (!requirement) {
        return NextResponse.json(
          {
            success: false,
            error: "Vendor onboarding requirement not found",
          },
          { status: 404 },
        );
      }

      const applicationRequirement =
        await prisma.vendorApplicationRequirement.findUnique({
          where: {
            applicationId_requirementId: {
              applicationId: application.id,
              requirementId: requirement.id,
            },
          },
          include: {
            requirement: true,
            evidence: {
              orderBy: {
                uploadedAt: "desc",
              },
            },
          },
        });

      if (!applicationRequirement) {
        return NextResponse.json({
          success: true,
          data: {
            vendorId: vendor.id,
            vendorName: vendor.companyName,
            requirementId: requirement.id,
            requirement: {
              id: requirement.id,
              code: requirement.code,
              name: requirement.name,
              category: requirement.category,
              required: requirement.required,
            },
            status: "OUTSTANDING",
            compliant: !requirement.required,
            reason: requirement.required
              ? "Required requirement has not been submitted"
              : "Optional requirement has not been submitted",
            evidenceCount: 0,
            acceptedEvidenceCount: 0,
            rejectedEvidenceCount: 0,
          },
        });
      }

      const evidence = applicationRequirement.evidence;

      const acceptedEvidenceCount = evidence.filter(
        (item) => item.status === "ACCEPTED",
      ).length;

      const rejectedEvidenceCount = evidence.filter(
        (item) => item.status === "REJECTED",
      ).length;

      const result = getRequirementResult(
        applicationRequirement.status,
        applicationRequirement.required,
        evidence.length,
        acceptedEvidenceCount,
        rejectedEvidenceCount,
      );

      return NextResponse.json({
        success: true,
        data: {
          id: applicationRequirement.id,
          vendorId: vendor.id,
          vendorName: vendor.companyName,
          applicationId: application.id,
          requirementId: applicationRequirement.requirementId,
          requirement: {
            id: applicationRequirement.requirement.id,
            code: applicationRequirement.requirement.code,
            name: applicationRequirement.requirement.name,
            category: applicationRequirement.requirement.category,
            required: applicationRequirement.required,
          },
          status: result.status,
          compliant: result.compliant,
          reason: result.reason,
          evidenceCount: evidence.length,
          acceptedEvidenceCount,
          rejectedEvidenceCount,
          reviewedAt: applicationRequirement.reviewedAt,
          notes: applicationRequirement.notes,
          applicationStatus: application.status,
        },
      });
    }

    const requirements = await prisma.vendorRequirement.findMany({
      where: {
        active: true,
      },
      orderBy: [
        {
          required: "desc",
        },
        {
          category: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    const applicationRequirements =
      await prisma.vendorApplicationRequirement.findMany({
        where: {
          applicationId: application.id,
        },
        include: {
          requirement: true,
          evidence: {
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
      });

    const applicationRequirementsByRequirement = new Map(
      applicationRequirements.map((item) => [
        item.requirementId,
        item,
      ]),
    );

    const results = requirements.map((requirement) => {
      const applicationRequirement =
        applicationRequirementsByRequirement.get(requirement.id);

      if (!applicationRequirement) {
        return {
          id: null,
          vendorId: vendor.id,
          applicationId: application.id,
          requirementId: requirement.id,
          requirement: {
            id: requirement.id,
            code: requirement.code,
            name: requirement.name,
            category: requirement.category,
            required: requirement.required,
          },
          status: "OUTSTANDING" as const,
          compliant: !requirement.required,
          reason: requirement.required
            ? "Required requirement has not been submitted"
            : "Optional requirement has not been submitted",
          evidenceCount: 0,
          acceptedEvidenceCount: 0,
          rejectedEvidenceCount: 0,
          reviewedAt: null,
          notes: null,
        };
      }

      const evidence = applicationRequirement.evidence;

      const acceptedEvidenceCount = evidence.filter(
        (item) => item.status === "ACCEPTED",
      ).length;

      const rejectedEvidenceCount = evidence.filter(
        (item) => item.status === "REJECTED",
      ).length;

      const result = getRequirementResult(
        applicationRequirement.status,
        applicationRequirement.required,
        evidence.length,
        acceptedEvidenceCount,
        rejectedEvidenceCount,
      );

      return {
        id: applicationRequirement.id,
        vendorId: vendor.id,
        applicationId: application.id,
        requirementId: applicationRequirement.requirementId,
        requirement: {
          id: requirement.id,
          code: requirement.code,
          name: requirement.name,
          category: requirement.category,
          required: applicationRequirement.required,
        },
        status: result.status,
        compliant: result.compliant,
        reason: result.reason,
        evidenceCount: evidence.length,
        acceptedEvidenceCount,
        rejectedEvidenceCount,
        reviewedAt: applicationRequirement.reviewedAt,
        notes: applicationRequirement.notes,
      };
    });

    const requiredRequirements = results.filter(
      (item) => item.requirement.required,
    );

    const requiredCompliant = requiredRequirements.filter(
      (item) => item.compliant,
    );

    const overallCompliant =
      requiredRequirements.length > 0 &&
      requiredRequirements.length === requiredCompliant.length;

    const requiredRequirementsCount =
      requiredRequirements.length;

    const requiredCompliantCount =
      requiredCompliant.length;

    return NextResponse.json({
      success: true,
      data: {
        vendorId: vendor.id,
        vendorName: vendor.companyName,
        applicationId: application.id,
        applicationStatus: application.status,
        overallCompliant,
        requiredRequirementsCount,
        requiredCompliantCount,
        complianceRate:
          requiredRequirementsCount === 0
            ? 0
            : Number(
                (
                  (requiredCompliantCount /
                    requiredRequirementsCount) *
                  100
                ).toFixed(2),
              ),
        requirements: results,
      },
    });
  } catch (error) {
    console.error(
      "POST /api/compliance/check error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to perform compliance check",
      },
      { status: 500 },
    );
  }
}