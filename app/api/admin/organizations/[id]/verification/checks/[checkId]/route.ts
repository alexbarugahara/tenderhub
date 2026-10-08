import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { OrganizationVerificationCheckStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
    checkId: string;
  }>;
};

export async function PUT(
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

    const { id, checkId } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Organization ID is required" },
        { status: 400 }
      );
    }

    if (!checkId) {
      return NextResponse.json(
        { error: "Verification check ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const status = body.status;
    const notes =
      typeof body.notes === "string"
        ? body.notes.trim()
        : null;

    const validStatuses =
      Object.values(OrganizationVerificationCheckStatus);

    if (
      typeof status !== "string" ||
      !validStatuses.includes(
        status as OrganizationVerificationCheckStatus
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid verification check status",
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
          verification: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
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

    const check =
      await prisma.organizationVerificationCheck.findFirst({
        where: {
          id: checkId,
          verificationId:
            organization.verification.id,
        },
        select: {
          id: true,
          verificationId: true,
          code: true,
          name: true,
          status: true,
        },
      });

    if (!check) {
      return NextResponse.json(
        {
          error:
            "Verification check not found for this organization.",
        },
        { status: 404 }
      );
    }

    const updatedCheck =
      await prisma.organizationVerificationCheck.update({
        where: {
          id: check.id,
        },
        data: {
          status:
            status as OrganizationVerificationCheckStatus,
          checkedAt: new Date(),
          checkedById: session.user.id,
          notes,
        },
        select: {
          id: true,
          verificationId: true,
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
          updatedAt: true,
        },
      });

    return NextResponse.json({
      success: true,
      check: updatedCheck,
      message: "Verification check updated successfully.",
    });
  } catch (error) {
    console.error(
      "Admin verification check update error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to update verification check",
      },
      { status: 500 }
    );
  }
}