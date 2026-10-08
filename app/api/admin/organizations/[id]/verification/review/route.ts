import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { OrganizationVerificationStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ReviewAction =
  | "START_REVIEW"
  | "REQUEST_INFORMATION"
  | "APPROVE"
  | "REJECT";

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const action = body.action as ReviewAction;

    const rejectionReason =
      typeof body.rejectionReason === "string"
        ? body.rejectionReason.trim()
        : "";

    const adminNotes =
      typeof body.adminNotes === "string"
        ? body.adminNotes.trim()
        : "";

    const validActions: ReviewAction[] = [
      "START_REVIEW",
      "REQUEST_INFORMATION",
      "APPROVE",
      "REJECT",
    ];

    if (!validActions.includes(action)) {
      return NextResponse.json(
        {
          error: "Invalid review action.",
        },
        { status: 400 }
      );
    }

    if (
      action === "REJECT" &&
      !rejectionReason
    ) {
      return NextResponse.json(
        {
          error:
            "A rejection reason is required.",
        },
        { status: 400 }
      );
    }

    if (
      action === "REQUEST_INFORMATION" &&
      !adminNotes
    ) {
      return NextResponse.json(
        {
          error:
            "Please specify the information required from the organization.",
        },
        { status: 400 }
      );
    }

    const organization =
      await prisma.organization.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          name: true,
          verifiedAt: true,
          verification: {
            select: {
              id: true,
              status: true,
              submittedAt: true,
              reviewedAt: true,
              reviewedById: true,
              rejectionReason: true,
              adminNotes: true,
              checks: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  required: true,
                  status: true,
                },
              },
            },
          },
        },
      });

    if (!organization) {
      return NextResponse.json(
        {
          error: "Organization not found.",
        },
        { status: 404 }
      );
    }

    if (!organization.verification) {
      return NextResponse.json(
        {
          error:
            "This organization does not have a verification application.",
        },
        { status: 400 }
      );
    }

    const verification =
      organization.verification;

    if (
      action === "START_REVIEW" &&
      verification.status === "APPROVED"
    ) {
      return NextResponse.json(
        {
          error:
            "An approved organization does not require another review.",
        },
        { status: 400 }
      );
    }

    if (
      action === "APPROVE" &&
      verification.status === "APPROVED"
    ) {
      return NextResponse.json(
        {
          error:
            "This organization is already approved.",
        },
        { status: 400 }
      );
    }

    if (action === "APPROVE") {
      const incompleteRequiredChecks =
        verification.checks.filter(
          (check) =>
            check.required &&
            check.status !== "PASSED" &&
            check.status !== "NOT_APPLICABLE"
        );

      if (incompleteRequiredChecks.length > 0) {
        return NextResponse.json(
          {
            error:
              "All required verification checks must be passed or marked not applicable before approval.",
            incompleteChecks:
              incompleteRequiredChecks.map(
                (check) => ({
                  id: check.id,
                  code: check.code,
                  name: check.name,
                  status: check.status,
                })
              ),
          },
          { status: 400 }
        );
      }
    }

    if (
      action === "REQUEST_INFORMATION" &&
      verification.status === "APPROVED"
    ) {
      return NextResponse.json(
        {
          error:
            "An approved organization cannot be moved to needs information.",
        },
        { status: 400 }
      );
    }

    if (
      action === "REJECT" &&
      verification.status === "APPROVED"
    ) {
      return NextResponse.json(
        {
          error:
            "An approved organization cannot be rejected using this action.",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    if (action === "START_REVIEW") {
      const updatedVerification =
        await prisma.organizationVerification.update({
          where: {
            id: verification.id,
          },
          data: {
            status:
              OrganizationVerificationStatus.UNDER_REVIEW,
            reviewedAt: null,
            reviewedById: null,
          },
          select: {
            id: true,
            organizationId: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
            reviewedById: true,
            rejectionReason: true,
            adminNotes: true,
            updatedAt: true,
          },
        });

      return NextResponse.json({
        success: true,
        verification: updatedVerification,
        message:
          "Organization verification review started.",
      });
    }

    if (action === "REQUEST_INFORMATION") {
      const updatedVerification =
        await prisma.organizationVerification.update({
          where: {
            id: verification.id,
          },
          data: {
            status:
              OrganizationVerificationStatus.NEEDS_INFORMATION,
            reviewedAt: now,
            reviewedById: session.user.id,
            adminNotes,
            rejectionReason: null,
          },
          select: {
            id: true,
            organizationId: true,
            status: true,
            submittedAt: true,
            reviewedAt: true,
            reviewedById: true,
            rejectionReason: true,
            adminNotes: true,
            updatedAt: true,
          },
        });

      return NextResponse.json({
        success: true,
        verification: updatedVerification,
        message:
          "Additional information has been requested from the organization.",
      });
    }

    if (action === "REJECT") {
      const result =
        await prisma.$transaction(async (tx) => {
          const updatedVerification =
            await tx.organizationVerification.update({
              where: {
                id: verification.id,
              },
              data: {
                status:
                  OrganizationVerificationStatus.REJECTED,
                reviewedAt: now,
                reviewedById: session.user.id,
                rejectionReason,
                adminNotes:
                  adminNotes || null,
              },
              select: {
                id: true,
                organizationId: true,
                status: true,
                submittedAt: true,
                reviewedAt: true,
                reviewedById: true,
                rejectionReason: true,
                adminNotes: true,
                updatedAt: true,
              },
            });

          const updatedOrganization =
            await tx.organization.update({
              where: {
                id: organization.id,
              },
              data: {
                verifiedAt: null,
              },
              select: {
                id: true,
                name: true,
                verifiedAt: true,
              },
            });

          return {
            verification:
              updatedVerification,
            organization:
              updatedOrganization,
          };
        });

      return NextResponse.json({
        success: true,
        verification: result.verification,
        organization: result.organization,
        message:
          "Organization verification rejected.",
      });
    }

    if (action === "APPROVE") {
      const result =
        await prisma.$transaction(async (tx) => {
          const updatedVerification =
            await tx.organizationVerification.update({
              where: {
                id: verification.id,
              },
              data: {
                status:
                  OrganizationVerificationStatus.APPROVED,
                reviewedAt: now,
                reviewedById: session.user.id,
                rejectionReason: null,
                adminNotes:
                  adminNotes || null,
              },
              select: {
                id: true,
                organizationId: true,
                status: true,
                submittedAt: true,
                reviewedAt: true,
                reviewedById: true,
                rejectionReason: true,
                adminNotes: true,
                updatedAt: true,
              },
            });

          const updatedOrganization =
            await tx.organization.update({
              where: {
                id: organization.id,
              },
              data: {
                verifiedAt: now,
              },
              select: {
                id: true,
                name: true,
                verifiedAt: true,
              },
            });

          return {
            verification:
              updatedVerification,
            organization:
              updatedOrganization,
          };
        });

      return NextResponse.json({
        success: true,
        verification: result.verification,
        organization: result.organization,
        message:
          "Organization verification approved successfully.",
      });
    }

    return NextResponse.json(
      {
        error: "Unsupported review action.",
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(
      "Admin organization verification review error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update organization verification.",
      },
      { status: 500 }
    );
  }
}