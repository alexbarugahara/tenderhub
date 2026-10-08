import { NextRequest, NextResponse } from "next/server";
import {
  ComplianceCategory,
  UserRole,
} from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

async function getSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

const ALLOWED_STATUSES = [
  "OUTSTANDING",
  "SUBMITTED",
  "UNDER_REVIEW",
  "SATISFIED",
  "REJECTED",
  "NEEDS_INFORMATION",
  "NOT_APPLICABLE",
] as const;

type ApplicationRequirementStatus =
  (typeof ALLOWED_STATUSES)[number];

function isApplicationRequirementStatus(
  value: unknown,
): value is ApplicationRequirementStatus {
  return (
    typeof value === "string" &&
    ALLOWED_STATUSES.includes(
      value as ApplicationRequirementStatus,
    )
  );
}

function isComplianceCategory(
  value: unknown,
): value is ComplianceCategory {
  return (
    typeof value === "string" &&
    Object.values(ComplianceCategory).includes(
      value as ComplianceCategory,
    )
  );
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);

    const vendorId =
      searchParams.get("vendorId");

    const requirementId =
      searchParams.get("requirementId");

    const status =
      searchParams.get("status");

    const category =
      searchParams.get("category");

    const search =
      searchParams.get("search");

    const activeOnly =
      searchParams.get("activeOnly");

    const role = user.role as UserRole;

    if (
      role !== UserRole.ADMIN &&
      role !== UserRole.VENDOR &&
      role !== UserRole.ORGANIZATION
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to view vendor onboarding requirements",
        },
        { status: 403 },
      );
    }

    if (
      status &&
      !isApplicationRequirementStatus(status)
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

    if (
      category &&
      !isComplianceCategory(category)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid compliance category",
        },
        { status: 400 },
      );
    }

    /*
     * Resolve the VendorApplication first.
     *
     * The current architecture stores application
     * requirements against the application rather
     * than directly against Vendor.
     */
    let applicationIds: string[] | undefined;

    if (vendorId) {
      const vendor = await prisma.vendor.findUnique({
        where: {
          id: vendorId,
        },
        select: {
          id: true,
          userId: true,
        },
      });

      if (!vendor) {
        return NextResponse.json(
          {
            success: false,
            error: "Vendor not found",
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
              "You can only view your own onboarding requirements",
          },
          { status: 403 },
        );
      }

      const application =
        await prisma.vendorApplication.findUnique({
          where: {
            userId: vendor.userId,
          },
          select: {
            id: true,
          },
        });

      applicationIds = application
        ? [application.id]
        : [];
    }

    if (role === UserRole.VENDOR) {
      const vendor =
        await prisma.vendor.findUnique({
          where: {
            userId: user.id,
          },
          select: {
            id: true,
          },
        });

      if (!vendor) {
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
        });
      }

      const application =
        await prisma.vendorApplication.findUnique({
          where: {
            userId: user.id,
          },
          select: {
            id: true,
          },
        });

      if (!application) {
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
        });
      }

      applicationIds = [application.id];
    }

    /*
     * Organization users can see onboarding records
     * for vendors who have participated in their
     * organization's solicitations.
     */
    if (role === UserRole.ORGANIZATION) {
      const organizationMembers =
        await prisma.organizationMember.findMany({
          where: {
            userId: user.id,
          },
          select: {
            organizationId: true,
          },
        });

      if (organizationMembers.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
        });
      }

      const organizationIds =
        organizationMembers.map(
          (membership) =>
            membership.organizationId,
        );

      const vendors =
        await prisma.vendor.findMany({
          where: {
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
            userId: true,
          },
        });

      const vendorUserIds = vendors.map(
        (vendor) => vendor.userId,
      );

      if (vendorUserIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
        });
      }

      const applications =
        await prisma.vendorApplication.findMany({
          where: {
            userId: {
              in: vendorUserIds,
            },
          },
          select: {
            id: true,
          },
        });

      applicationIds = applications.map(
        (application) => application.id,
      );
    }

    const where = {
      ...(applicationIds
        ? {
          applicationId: {
            in: applicationIds,
          },
        }
        : {}),

      ...(requirementId
        ? {
          requirementId,
        }
        : {}),

      ...(status
        ? {
          status:
            status as ApplicationRequirementStatus,
        }
        : {}),

      ...(category
        ? {
          category:
            category as ComplianceCategory,
        }
        : {}),

      ...(search
        ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              code: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
        : {}),

      ...(activeOnly === "true"
        ? {
          requirement: {
            active: true,
          },
        }
        : {}),
    };

    const complianceRecords =
      await prisma.vendorApplicationRequirement.findMany(
        {
          where,
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
          orderBy: [
            {
              status: "asc",
            },
            {
              createdAt: "desc",
            },
          ],
        },
      );

    return NextResponse.json({
      success: true,
      data: complianceRecords,
      count: complianceRecords.length,
    });
  } catch (error) {
    console.error(
      "GET /api/compliance error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to fetch vendor onboarding requirements",
      },
      { status: 500 },
    );
  }
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
      role !== UserRole.VENDOR
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators and vendors can create vendor onboarding requirement records",
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

    const requestedStatus =
      body.status;

    const notes =
      body.notes === undefined ||
        body.notes === null
        ? null
        : String(body.notes).trim() || null;

    if (!vendorId) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor ID is required",
        },
        { status: 400 },
      );
    }

    if (!requirementId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Vendor onboarding requirement ID is required",
        },
        { status: 400 },
      );
    }

    if (
      requestedStatus !== undefined &&
      !isApplicationRequirementStatus(
        requestedStatus,
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
     * Vendors can only create records for themselves.
     */
    const vendor =
      await prisma.vendor.findUnique({
        where: {
          id: vendorId,
        },
        select: {
          id: true,
          userId: true,
        },
      });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor not found",
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
            "You can only manage your own onboarding requirements",
        },
        { status: 403 },
      );
    }

    /*
     * Find the vendor's onboarding application.
     */
    const application =
      await prisma.vendorApplication.findUnique({
        where: {
          userId: vendor.userId,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The vendor does not have a vendor onboarding application.",
        },
        { status: 404 },
      );
    }

    /*
     * Verify that the global requirement exists.
     */
    const requirement =
      await prisma.vendorRequirement.findUnique({
        where: {
          id: requirementId,
        },
      });

    if (!requirement) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Vendor onboarding requirement not found",
        },
        { status: 404 },
      );
    }

    if (
      !requirement.active &&
      role !== UserRole.ADMIN
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This vendor onboarding requirement is no longer active",
        },
        { status: 400 },
      );
    }

    /*
     * Vendors cannot directly assign an administrative
     * outcome such as SATISFIED or REJECTED.
     */
    const administrativeStatuses = [
      "SATISFIED",
      "REJECTED",
      "NEEDS_INFORMATION",
      "NOT_APPLICABLE",
    ] as const;

    if (
      role === UserRole.VENDOR &&
      requestedStatus !== undefined &&
      administrativeStatuses.includes(
        requestedStatus as
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

    /*
     * Do not create duplicate application requirements.
     */
    const existingRecord =
      await prisma.vendorApplicationRequirement.findUnique(
        {
          where: {
            applicationId_requirementId: {
              applicationId: application.id,
              requirementId,
            },
          },
        },
      );

    if (existingRecord) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A vendor onboarding requirement record already exists for this application and requirement.",
          data: existingRecord,
        },
        { status: 409 },
      );
    }

    /*
     * Snapshot the requirement's current information
     * into the application requirement.
     */
    const compliance =
      await prisma.vendorApplicationRequirement.create(
        {
          data: {
            id: crypto.randomUUID(),
            applicationId: application.id,
            requirementId: requirement.id,
            code: requirement.code,
            name: requirement.name,
            description:
              requirement.description,
            category: requirement.category,
            required: requirement.required,
            status:
              requestedStatus === undefined
                ? "OUTSTANDING"
                : requestedStatus,
            notes,
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
            },
            reviewedBy: true,
          },
        },
      );

    return NextResponse.json(
      {
        success: true,
        message:
          "Vendor onboarding requirement record created successfully",
        data: compliance,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/compliance error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Failed to create vendor onboarding requirement record",
      },
      { status: 500 },
    );
  }
}