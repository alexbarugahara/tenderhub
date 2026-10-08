import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

async function getApplicationRequirement(id: string) {
  return prisma.vendorApplicationRequirement.findUnique({
    where: {
      id,
    },
    include: {
      application: {
        include: {
          user: true,
          country: true,
        },
      },
      requirement: true,
      evidence: {
        include: {
          reviewedBy: true,
        },
        orderBy: {
          uploadedAt: "desc",
        },
      },
      reviewedBy: true,
    },
  });
}

async function getVendorForApplication(
  applicationUserId: string,
) {
  return prisma.vendor.findUnique({
    where: {
      userId: applicationUserId,
    },
    select: {
      id: true,
      userId: true,
    },
  });
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const compliance =
      await getApplicationRequirement(id);

    if (!compliance) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor onboarding requirement not found",
        },
        { status: 404 },
      );
    }

    const role = user.role as UserRole;

    const vendor = await getVendorForApplication(
      compliance.application.userId,
    );

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor not found for this application",
        },
        { status: 404 },
      );
    }

    if (
      role === UserRole.VENDOR &&
      vendor.userId !== user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to view this onboarding requirement",
        },
        { status: 403 },
      );
    }

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.VENDOR &&
      role !== UserRole.ORGANIZATION
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to view this onboarding requirement",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      success: true,
      data: compliance,
    });
  } catch (error) {
    console.error(
      "GET /api/compliance/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to fetch vendor onboarding requirement",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const existingCompliance =
      await getApplicationRequirement(id);

    if (!existingCompliance) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Vendor onboarding requirement not found",
        },
        { status: 404 },
      );
    }

    const role = user.role as UserRole;

    const vendor = await getVendorForApplication(
      existingCompliance.application.userId,
    );

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor not found for this application",
        },
        { status: 404 },
      );
    }

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.VENDOR
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators and vendors can update onboarding requirements",
        },
        { status: 403 },
      );
    }

    if (
      role === UserRole.VENDOR &&
      vendor.userId !== user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You can only manage your own onboarding requirements",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      status,
      notes,
    } = body;

    const allowedStatuses = [
      "OUTSTANDING",
      "SUBMITTED",
      "UNDER_REVIEW",
      "SATISFIED",
      "REJECTED",
      "NEEDS_INFORMATION",
      "NOT_APPLICABLE",
    ] as const;

    type AllowedStatus =
      (typeof allowedStatuses)[number];

    if (
      status !== undefined &&
      (
        typeof status !== "string" ||
        !allowedStatuses.includes(
          status as AllowedStatus,
        )
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Invalid vendor onboarding requirement status",
        },
        { status: 400 },
      );
    }

    /*
     * Vendors may submit/update their requirement status,
     * but administrative review statuses should only be
     * assigned by an administrator.
     */
    const administrativeStatuses = [
      "SATISFIED",
      "REJECTED",
      "NEEDS_INFORMATION",
      "NOT_APPLICABLE",
    ] as const;

    if (
      role === UserRole.VENDOR &&
      status !== undefined &&
      administrativeStatuses.includes(
        status as
          (typeof administrativeStatuses)[number],
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Vendors cannot assign administrative review outcomes.",
        },
        { status: 403 },
      );
    }

    const data: {
      status?: AllowedStatus;
      notes?: string | null;
      reviewedAt?: Date | null;
      reviewedById?: string | null;
    } = {};

    if (status !== undefined) {
      data.status = status as AllowedStatus;
    }

    if (notes !== undefined) {
      data.notes =
        notes === null
          ? null
          : String(notes).trim() || null;
    }

    if (role === UserRole.ADMIN) {
      if (
        status === "SATISFIED" ||
        status === "REJECTED" ||
        status === "NEEDS_INFORMATION" ||
        status === "NOT_APPLICABLE"
      ) {
        data.reviewedAt = new Date();
        data.reviewedById = user.id;
      }
    }

    if (status === "OUTSTANDING") {
      data.reviewedAt = null;
      data.reviewedById = null;
    }

    const compliance =
      await prisma.vendorApplicationRequirement.update({
        where: {
          id,
        },
        data,
        include: {
          application: {
            include: {
              user: true,
              country: true,
            },
          },
          requirement: true,
          evidence: {
            include: {
              reviewedBy: true,
            },
            orderBy: {
              uploadedAt: "desc",
            },
          },
          reviewedBy: true,
        },
      });

    return NextResponse.json({
      success: true,
      message:
        "Vendor onboarding requirement updated successfully",
      data: compliance,
    });
  } catch (error) {
    console.error(
      "PATCH /api/compliance/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to update vendor onboarding requirement",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const existingCompliance =
      await getApplicationRequirement(id);

    if (!existingCompliance) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Vendor onboarding requirement not found",
        },
        { status: 404 },
      );
    }

    const role = user.role as UserRole;

    const vendor = await getVendorForApplication(
      existingCompliance.application.userId,
    );

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor not found for this application",
        },
        { status: 404 },
      );
    }

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.VENDOR
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators and vendors can delete onboarding requirements",
        },
        { status: 403 },
      );
    }

    if (
      role === UserRole.VENDOR &&
      vendor.userId !== user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You can only manage your own onboarding requirements",
        },
        { status: 403 },
      );
    }

    /*
     * Do not allow deletion of a requirement that has
     * evidence attached. The evidence is part of the
     * verification audit trail.
     */
    const evidenceCount =
      await prisma.vendorApplicationEvidence.count({
        where: {
          requirementId: id,
        },
      });

    if (evidenceCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This onboarding requirement cannot be deleted because evidence is attached to it.",
        },
        { status: 400 },
      );
    }

    await prisma.vendorApplicationRequirement.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Vendor onboarding requirement deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE /api/compliance/[id] error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to delete vendor onboarding requirement",
      },
      { status: 500 },
    );
  }
}