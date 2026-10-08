import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const ALLOWED_DECISIONS = [
  "APPROVE",
  "UNVERIFY",
] as const;

type VerificationDecision =
  (typeof ALLOWED_DECISIONS)[number];

function isVerificationDecision(
  value: unknown,
): value is VerificationDecision {
  return (
    typeof value === "string" &&
    ALLOWED_DECISIONS.includes(
      value as VerificationDecision,
    )
  );
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden." },
        { status: 403 },
      );
    }

    const { id } = await context.params;

    const body = await request.json();

    const decision = body?.decision;

    if (!isVerificationDecision(decision)) {
      return NextResponse.json(
        { error: "Invalid verification decision." },
        { status: 400 },
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
        verifiedAt: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found." },
        { status: 404 },
      );
    }

    /*
     * UNVERIFY
     *
     * This simply removes the vendor's platform
     * verification timestamp.
     */
    if (decision === "UNVERIFY") {
      const updated = await prisma.vendor.update({
        where: {
          id,
        },
        data: {
          verifiedAt: null,
        },
        select: {
          id: true,
          verifiedAt: true,
        },
      });

      return NextResponse.json({
        success: true,
        decision: "UNVERIFIED",
        vendorId: updated.id,
        verifiedAt: null,
      });
    }

    /*
     * APPROVE
     *
     * Resolve the vendor's onboarding application.
     */
    const application =
      await prisma.vendorApplication.findUnique({
        where: {
          userId: vendor.userId,
        },
        include: {
          requirements: {
            include: {
              requirement: true,
            },
            orderBy: {
              name: "asc",
            },
          },
        },
      });

    if (!application) {
      return NextResponse.json(
        {
          error:
            "The vendor cannot be approved because no vendor onboarding application exists.",
        },
        { status: 400 },
      );
    }

    if (application.status === "REJECTED") {
      return NextResponse.json(
        {
          error:
            "The vendor's onboarding application is rejected and cannot be approved.",
        },
        { status: 400 },
      );
    }

    if (application.status === "WITHDRAWN") {
      return NextResponse.json(
        {
          error:
            "The vendor's onboarding application has been withdrawn and cannot be approved.",
        },
        { status: 400 },
      );
    }

    const requiredRequirements =
      application.requirements.filter(
        (requirement) => requirement.required,
      );

    if (requiredRequirements.length === 0) {
      return NextResponse.json(
        {
          error:
            "The vendor cannot be approved because no required onboarding requirements are configured.",
        },
        { status: 400 },
      );
    }

    const incomplete =
      requiredRequirements.filter(
        (requirement) =>
          requirement.status !== "SATISFIED" &&
          requirement.status !== "NOT_APPLICABLE",
      );

    if (incomplete.length > 0) {
      return NextResponse.json(
        {
          error:
            "The vendor cannot be approved until all required onboarding requirements are satisfied.",
          outstanding: incomplete.map(
            (requirement) => ({
              id: requirement.id,
              requirementId:
                requirement.requirementId,
              requirement:
                requirement.name,
              status: requirement.status,
            }),
          ),
        },
        { status: 400 },
      );
    }

    /*
     * Approve the application and activate the vendor
     * in one transaction.
     */
    const now = new Date();

    const result = await prisma.$transaction(
      async (tx) => {
        const updatedApplication =
          await tx.vendorApplication.update({
            where: {
              id: application.id,
            },
            data: {
              status: "APPROVED",
              approvedAt: now,
              reviewedAt:
                application.reviewedAt ?? now,
            },
            select: {
              id: true,
              status: true,
              approvedAt: true,
            },
          });

        const updatedVendor =
          await tx.vendor.update({
            where: {
              id: vendor.id,
            },
            data: {
              verifiedAt: now,
            },
            select: {
              id: true,
              verifiedAt: true,
            },
          });

        await tx.vendorVerificationAction.create({
          data: {
            applicationId: application.id,
            performedById: session.user.id,
            action: "APPROVED",
            notes:
              typeof body?.notes === "string"
                ? body.notes.trim() || null
                : null,
          },
        });

        return {
          application: updatedApplication,
          vendor: updatedVendor,
        };
      },
    );

    return NextResponse.json({
      success: true,
      decision: "APPROVED",
      application: result.application,
      vendorId: result.vendor.id,
      verifiedAt:
        result.vendor.verifiedAt?.toISOString() ??
        null,
    });
  } catch (error) {
    console.error(
      "ADMIN_VENDOR_VERIFICATION_ERROR",
      error,
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while updating vendor verification.",
      },
      { status: 500 },
    );
  }
}