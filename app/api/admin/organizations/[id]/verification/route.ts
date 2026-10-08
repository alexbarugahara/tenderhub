import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { ensureOrganizationVerification } from "@/lib/organization-verification/organization-verification";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        }
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden",
        },
        {
          status: 403,
        }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Organization ID is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * First confirm that the organization exists.
     */
    const organizationExists =
      await prisma.organization.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
        },
      });

    if (!organizationExists) {
      return NextResponse.json(
        {
          error: "Organization not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Ensure that the organization has a verification record
     * and that all currently active master requirements have
     * corresponding verification checks.
     */
    await ensureOrganizationVerification(id);

    /*
     * Load the complete organization verification view.
     */
    const organization =
      await prisma.organization.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          name: true,
          legalName: true,
          email: true,
          phone: true,
          website: true,
          address: true,
          organizationType: true,
          registrationNumber: true,
          taxNumber: true,

          country: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          verification: {
            select: {
              id: true,
              organizationId: true,
              status: true,
              submittedAt: true,
              reviewedAt: true,
              reviewedById: true,
              rejectionReason: true,
              adminNotes: true,
              createdAt: true,
              updatedAt: true,

              checks: {
                orderBy: [
                  {
                    required: "desc",
                  },
                  {
                    createdAt: "asc",
                  },
                ],

                select: {
                  id: true,
                  verificationId: true,
                  requirementId: true,
                  code: true,
                  name: true,
                  category: true,
                  description: true,
                  required: true,
                  status: true,
                  documentId: true,
                  checkedAt: true,
                  checkedById: true,
                  notes: true,
                  createdAt: true,
                  updatedAt: true,

                  /*
                   * IMPORTANT:
                   * OrganizationComplianceRequirement does NOT
                   * contain sortOrder in the current Prisma schema.
                   */
                  requirement: {
                    select: {
                      id: true,
                      code: true,
                      name: true,
                      description: true,
                      category: true,
                      required: true,
                      validityDays: true,
                      active: true,
                    },
                  },

                  document: {
                    select: {
                      id: true,
                      name: true,
                      category: true,
                      fileUrl: true,
                      mimeType: true,
                      fileSize: true,
                      status: true,
                      issuedAt: true,
                      expiryDate: true,
                      rejectionReason: true,
                      uploadedAt: true,
                    },
                  },

                  checkedBy: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },

          documents: {
            orderBy: {
              uploadedAt: "desc",
            },

            select: {
              id: true,
              name: true,
              category: true,
              fileUrl: true,
              mimeType: true,
              fileSize: true,
              status: true,
              issuedAt: true,
              expiryDate: true,
              rejectionReason: true,
              uploadedAt: true,
              updatedAt: true,
            },
          },
        },
      });

    if (!organization) {
      return NextResponse.json(
        {
          error: "Organization not found",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * Calculate verification summary information
     * for the admin UI.
     */
    const checks =
      organization.verification?.checks ?? [];

    const requiredChecks =
      checks.filter(
        (check) => check.required
      );

    const passedChecks =
      requiredChecks.filter(
        (check) =>
          check.status === "PASSED" ||
          check.status === "NOT_APPLICABLE"
      );

    const failedChecks =
      requiredChecks.filter(
        (check) =>
          check.status === "FAILED"
      );

    const pendingChecks =
      requiredChecks.filter(
        (check) =>
          check.status === "PENDING" ||
          check.status === "NEEDS_INFORMATION"
      );

    const completionPercentage =
      requiredChecks.length === 0
        ? 0
        : Math.round(
            (passedChecks.length /
              requiredChecks.length) *
              100
          );

    const readyForApproval =
      requiredChecks.length > 0 &&
      failedChecks.length === 0 &&
      pendingChecks.length === 0;

    return NextResponse.json({
      organization,

      verificationSummary: {
        totalChecks: checks.length,
        requiredChecks:
          requiredChecks.length,
        passedChecks:
          passedChecks.length,
        failedChecks:
          failedChecks.length,
        pendingChecks:
          pendingChecks.length,
        completionPercentage,
        readyForApproval,
      },
    });
  } catch (error) {
    console.error(
      "Admin organization verification GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to load organization verification",

        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      }
    );
  }
}