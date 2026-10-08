import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const ALLOWED_STATUSES = [
  "OUTSTANDING",
  "SUBMITTED",
  "UNDER_REVIEW",
  "SATISFIED",
  "REJECTED",
  "NEEDS_INFORMATION",
  "NOT_APPLICABLE",
] as const;

type AllowedStatus = (typeof ALLOWED_STATUSES)[number];

interface RouteContext {
  params: Promise<{
    id: string;
    complianceId: string;
  }>;
}

function isAllowedStatus(value: unknown): value is AllowedStatus {
  return (
    typeof value === "string" &&
    ALLOWED_STATUSES.includes(value as AllowedStatus)
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

    const { id, complianceId } = await context.params;

    const body = await request.json();

    const status = body?.status;

    const notes =
      typeof body?.notes === "string"
        ? body.notes.trim()
        : "";

    if (!isAllowedStatus(status)) {
      return NextResponse.json(
        { error: "Invalid vendor application requirement status." },
        { status: 400 },
      );
    }

    /*
     * The route's [id] is the Vendor ID.
     *
     * VendorApplicationRequirement belongs to a VendorApplication,
     * which belongs to the User associated with the Vendor.
     */
    const vendor = await prisma.vendor.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found." },
        { status: 404 },
      );
    }

    const application = await prisma.vendorApplication.findUnique({
      where: {
        userId: vendor.userId,
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Vendor application not found." },
        { status: 404 },
      );
    }

    const existing =
      await prisma.vendorApplicationRequirement.findFirst({
        where: {
          id: complianceId,
          applicationId: application.id,
        },
        include: {
          requirement: true,
          evidence: {
            orderBy: {
              uploadedAt: "desc",
            },
            include: {
              reviewedBy: true,
            },
          },
        },
      });

    if (!existing) {
      return NextResponse.json(
        { error: "Vendor application requirement not found." },
        { status: 404 },
      );
    }

    const reviewedAt =
      status === "OUTSTANDING" || status === "SUBMITTED"
        ? null
        : new Date();

    const record =
      await prisma.vendorApplicationRequirement.update({
        where: {
          id: complianceId,
        },
        data: {
          status,
          notes: notes || null,
          reviewedAt,
          reviewedById: session.user.id,
        },
        include: {
          requirement: true,
          evidence: {
            orderBy: {
              uploadedAt: "desc",
            },
            include: {
              reviewedBy: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      record,
    });
  } catch (error) {
    console.error(
      "ADMIN_VENDOR_COMPLIANCE_UPDATE_ERROR",
      error,
    );

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while updating vendor application requirements.",
      },
      { status: 500 },
    );
  }
}