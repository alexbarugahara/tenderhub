import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const ALLOWED_INTEGRATION_TYPES = [
  "PROCUREMENT_PLATFORM",
  "ACCOUNTING",
  "ERP",
  "PAYMENT",
  "IDENTITY",
  "GOVERNMENT",
  "OTHER",
] as const;

const ALLOWED_INTEGRATION_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "ERROR",
  "SUSPENDED",
] as const;

function isValidIntegrationType(
  value: string
): value is (typeof ALLOWED_INTEGRATION_TYPES)[number] {
  return ALLOWED_INTEGRATION_TYPES.includes(
    value as (typeof ALLOWED_INTEGRATION_TYPES)[number]
  );
}

function isValidIntegrationStatus(
  value: string
): value is (typeof ALLOWED_INTEGRATION_STATUSES)[number] {
  return ALLOWED_INTEGRATION_STATUSES.includes(
    value as (typeof ALLOWED_INTEGRATION_STATUSES)[number]
  );
}

async function getOrganizationAccess(
  userId: string,
  userRole: string,
  organizationId: string
) {
  if (userRole === "ADMIN") {
    return true;
  }

  if (userRole !== "ORGANIZATION") {
    return false;
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(membership);
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get("organizationId");
    const provider = searchParams.get("provider");
    const type = searchParams.get("type");
    const status = searchParams.get("status");

    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== "ADMIN" && userRole !== "ORGANIZATION") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only organization users and administrators can access integrations",
        },
        { status: 403 }
      );
    }

    if (organizationId) {
      const hasAccess = await getOrganizationAccess(
        userId,
        userRole,
        organizationId
      );

      if (!hasAccess) {
        return NextResponse.json(
          {
            success: false,
            error: "You do not have access to this organization",
          },
          { status: 403 }
        );
      }
    }

    if (type && !isValidIntegrationType(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid integration type",
        },
        { status: 400 }
      );
    }

    if (status && !isValidIntegrationStatus(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid integration status",
        },
        { status: 400 }
      );
    }

    const where: {
      organizationId?: string | { in: string[] };
      provider?: string;
      type?:
        | "PROCUREMENT_PLATFORM"
        | "ACCOUNTING"
        | "ERP"
        | "PAYMENT"
        | "IDENTITY"
        | "GOVERNMENT"
        | "OTHER";
      status?:
        | "ACTIVE"
        | "INACTIVE"
        | "ERROR"
        | "SUSPENDED";
    } = {};

    if (organizationId) {
      where.organizationId = organizationId;
    } else if (userRole === "ORGANIZATION") {
      const memberships = await prisma.organizationMember.findMany({
        where: {
          userId,
        },
        select: {
          organizationId: true,
        },
      });

      const organizationIds = memberships.map(
        (membership) => membership.organizationId
      );

      if (organizationIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            total: 0,
          },
        });
      }

      where.organizationId = {
        in: organizationIds,
      };
    }

    if (provider) {
      where.provider = provider;
    }

    if (type) {
      where.type = type as
        | "PROCUREMENT_PLATFORM"
        | "ACCOUNTING"
        | "ERP"
        | "PAYMENT"
        | "IDENTITY"
        | "GOVERNMENT"
        | "OTHER";
    }

    if (status) {
      where.status = status as
        | "ACTIVE"
        | "INACTIVE"
        | "ERROR"
        | "SUSPENDED";
    }

    const integrations = await prisma.integration.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
        syncLogs: {
          orderBy: {
            startedAt: "desc",
          },
          take: 5,
        },
        _count: {
          select: {
            syncLogs: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: integrations,
      pagination: {
        total: integrations.length,
      },
    });
  } catch (error) {
    console.error("Get integrations error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve integrations",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== "ADMIN" && userRole !== "ORGANIZATION") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only organization users and administrators can create integrations",
        },
        { status: 403 }
      );
    }

    let body: {
      organizationId?: string;
      name?: string;
      provider?: string;
      type?: string;
      status?: string;
      configuration?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

    const organizationId = body.organizationId?.trim();
    const name = body.name?.trim();
    const provider = body.provider?.trim();
    const type = body.type?.trim();
    const requestedStatus = body.status?.trim();

    if (!organizationId || !name || !provider || !type) {
      return NextResponse.json(
        {
          success: false,
          error:
            "organizationId, name, provider, and type are required",
        },
        { status: 400 }
      );
    }

    const hasAccess = await getOrganizationAccess(
      userId,
      userRole,
      organizationId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to manage this organization",
        },
        { status: 403 }
      );
    }

    if (!isValidIntegrationType(type)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid integration type",
        },
        { status: 400 }
      );
    }

    if (
      requestedStatus &&
      !isValidIntegrationStatus(requestedStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid integration status",
        },
        { status: 400 }
      );
    }

    if (
      body.configuration !== undefined &&
      (body.configuration === null ||
        typeof body.configuration !== "object" ||
        Array.isArray(body.configuration))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "configuration must be a JSON object",
        },
        { status: 400 }
      );
    }

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!organization) {
      return NextResponse.json(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 }
      );
    }

    const existingIntegration = await prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId,
          provider,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingIntegration) {
      return NextResponse.json(
        {
          success: false,
          error: "An integration with this provider already exists",
        },
        { status: 409 }
      );
    }

    const integration = await prisma.integration.create({
      data: {
        organizationId,
        name,
        provider,
        type: type as
          | "PROCUREMENT_PLATFORM"
          | "ACCOUNTING"
          | "ERP"
          | "PAYMENT"
          | "IDENTITY"
          | "GOVERNMENT"
          | "OTHER",
        status: requestedStatus
          ? (requestedStatus as
              | "ACTIVE"
              | "INACTIVE"
              | "ERROR"
              | "SUSPENDED")
          : "INACTIVE",
        configuration:
          body.configuration === undefined
            ? undefined
            : (body.configuration as object),
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Integration created successfully",
        data: integration,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create integration error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create integration",
      },
      { status: 500 }
    );
  }
}