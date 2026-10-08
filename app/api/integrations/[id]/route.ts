import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

async function getIntegration(id: string) {
  return prisma.integration.findUnique({
    where: {
      id,
    },
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
        take: 20,
      },
      _count: {
        select: {
          syncLogs: true,
        },
      },
    },
  });
}

async function hasOrganizationAccess(
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

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const integration = await getIntegration(id);

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: "Integration not found",
        },
        { status: 404 }
      );
    }

    const hasAccess = await hasOrganizationAccess(
      session.user.id,
      session.user.role,
      integration.organizationId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to access this integration",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: integration,
    });
  } catch (error) {
    console.error("Get integration error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve integration",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const integration = await prisma.integration.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        organizationId: true,
        provider: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: "Integration not found",
        },
        { status: 404 }
      );
    }

    const hasAccess = await hasOrganizationAccess(
      session.user.id,
      session.user.role,
      integration.organizationId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to update this integration",
        },
        { status: 403 }
      );
    }

    let body: {
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

    const data: Prisma.IntegrationUpdateInput = {};

    if (body.name !== undefined) {
      const name = body.name.trim();

      if (!name) {
        return NextResponse.json(
          {
            success: false,
            error: "Integration name cannot be empty",
          },
          { status: 400 }
        );
      }

      data.name = name;
    }

    if (body.provider !== undefined) {
      const provider = body.provider.trim();

      if (!provider) {
        return NextResponse.json(
          {
            success: false,
            error: "Integration provider cannot be empty",
          },
          { status: 400 }
        );
      }

      const existingProvider = await prisma.integration.findFirst({
        where: {
          organizationId: integration.organizationId,
          provider,
          id: {
            not: id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingProvider) {
        return NextResponse.json(
          {
            success: false,
            error: "An integration with this provider already exists",
          },
          { status: 409 }
        );
      }

      data.provider = provider;
    }

    if (body.type !== undefined) {
      const type = body.type.trim();

      if (!isValidIntegrationType(type)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid integration type",
          },
          { status: 400 }
        );
      }

      data.type = type;
    }

    if (body.status !== undefined) {
      const status = body.status.trim();

      if (!isValidIntegrationStatus(status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid integration status",
          },
          { status: 400 }
        );
      }

      data.status = status;
    }

    if (body.configuration !== undefined) {
      if (
        body.configuration !== null &&
        (typeof body.configuration !== "object" ||
          Array.isArray(body.configuration))
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "configuration must be a JSON object or null",
          },
          { status: 400 }
        );
      }

      if (body.configuration === null) {
        data.configuration = Prisma.JsonNull;
      } else {
        data.configuration =
          body.configuration as Prisma.InputJsonValue;
      }
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No valid fields were provided for update",
        },
        { status: 400 }
      );
    }

    const updatedIntegration = await prisma.integration.update({
      where: {
        id,
      },
      data,
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
          take: 20,
        },
        _count: {
          select: {
            syncLogs: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Integration updated successfully",
      data: updatedIntegration,
    });
  } catch (error) {
    console.error("Update integration error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update integration",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
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

    const { id } = await context.params;

    const integration = await prisma.integration.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        organizationId: true,
        name: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: "Integration not found",
        },
        { status: 404 }
      );
    }

    const hasAccess = await hasOrganizationAccess(
      session.user.id,
      session.user.role,
      integration.organizationId
    );

    if (!hasAccess) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to delete this integration",
        },
        { status: 403 }
      );
    }

    await prisma.integration.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Integration deleted successfully",
    });
  } catch (error) {
    console.error("Delete integration error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete integration",
      },
      { status: 500 }
    );
  }
}
