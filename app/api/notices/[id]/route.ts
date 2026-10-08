import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

async function canManageNotice(
  userId: string,
  userRole: string | undefined,
  organizationId: string | null,
) {
  if (userRole === "ADMIN") {
    return true;
  }

  if (!organizationId) {
    return false;
  }

  const membership =
    await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: {
        role: true,
      },
    });

  if (!membership) {
    return false;
  }

  return (
    membership.role === "OWNER" ||
    membership.role === "ADMIN" ||
    membership.role === "PROCUREMENT_MANAGER"
  );
}

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const notice = await prisma.notice.findUnique({
      where: {
        id,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            legalName: true,
            logo: true,
            email: true,
            phone: true,
            website: true,
          },
        },
        solicitation: {
          select: {
            id: true,
            solicitationNumber: true,
            title: true,
            description: true,
            status: true,
            publishedAt: true,
            openingDate: true,
            closingDate: true,
            organizationId: true,
          },
        },
      },
    });

    if (!notice) {
      return NextResponse.json(
        {
          success: false,
          error: "Notice not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      notice,
    });
  } catch (error) {
    console.error("Get notice error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve notice",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await params;

    const existingNotice = await prisma.notice.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        organizationId: true,
        solicitationId: true,
        title: true,
        content: true,
        type: true,
        published: true,
        publishedAt: true,
      },
    });

    if (!existingNotice) {
      return NextResponse.json(
        {
          success: false,
          error: "Notice not found",
        },
        {
          status: 404,
        },
      );
    }

    const hasPermission = await canManageNotice(
      currentUser.id,
      currentUser.role,
      existingNotice.organizationId,
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to update this notice",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();

    const {
      organizationId,
      solicitationId,
      title,
      content,
      type,
      published,
    } = body;

    const nextOrganizationId =
      organizationId === undefined
        ? existingNotice.organizationId
        : organizationId;

    const nextSolicitationId =
      solicitationId === undefined
        ? existingNotice.solicitationId
        : solicitationId;

    if (
      title !== undefined &&
      (typeof title !== "string" ||
        title.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Notice title cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    if (
      content !== undefined &&
      (typeof content !== "string" ||
        content.trim().length === 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Notice content cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    if (nextOrganizationId !== null) {
      const organization =
        await prisma.organization.findUnique({
          where: {
            id: nextOrganizationId,
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
          {
            status: 400,
          },
        );
      }

      if (
        nextOrganizationId !== existingNotice.organizationId &&
        currentUser.role !== "ADMIN"
      ) {
        const membership =
          await prisma.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId: nextOrganizationId,
                userId: currentUser.id,
              },
            },
            select: {
              role: true,
            },
          });

        if (
          !membership ||
          (membership.role !== "OWNER" &&
            membership.role !== "ADMIN" &&
            membership.role !== "PROCUREMENT_MANAGER")
        ) {
          return NextResponse.json(
            {
              success: false,
              error:
                "You do not have permission to move this notice to the selected organization",
            },
            {
              status: 403,
            },
          );
        }
      }
    }

    if (nextSolicitationId !== null) {
      const solicitation =
        await prisma.solicitation.findUnique({
          where: {
            id: nextSolicitationId,
          },
          select: {
            id: true,
            organizationId: true,
          },
        });

      if (!solicitation) {
        return NextResponse.json(
          {
            success: false,
            error: "Solicitation not found",
          },
          {
            status: 400,
          },
        );
      }

      if (
        nextOrganizationId &&
        solicitation.organizationId !== nextOrganizationId
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Solicitation does not belong to the selected organization",
          },
          {
            status: 400,
          },
        );
      }
    }

    let nextPublished = existingNotice.published;
    let nextPublishedAt = existingNotice.publishedAt;

    if (published !== undefined) {
      if (typeof published !== "boolean") {
        return NextResponse.json(
          {
            success: false,
            error: "Published must be a boolean value",
          },
          {
            status: 400,
          },
        );
      }

      nextPublished = published;

      if (published && !existingNotice.published) {
        nextPublishedAt = new Date();
      }

      if (!published) {
        nextPublishedAt = null;
      }
    }

    const updatedNotice = await prisma.notice.update({
      where: {
        id,
      },
      data: {
        organizationId: nextOrganizationId,
        solicitationId: nextSolicitationId,
        ...(title !== undefined
          ? {
              title: title.trim(),
            }
          : {}),
        ...(content !== undefined
          ? {
              content: content.trim(),
            }
          : {}),
        ...(type !== undefined
          ? {
              type: type as never,
            }
          : {}),
        published: nextPublished,
        publishedAt: nextPublishedAt,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            legalName: true,
            logo: true,
          },
        },
        solicitation: {
          select: {
            id: true,
            solicitationNumber: true,
            title: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notice updated successfully",
      notice: updatedNotice,
    });
  } catch (error) {
    console.error("Update notice error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update notice",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await params;

    const existingNotice = await prisma.notice.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!existingNotice) {
      return NextResponse.json(
        {
          success: false,
          error: "Notice not found",
        },
        {
          status: 404,
        },
      );
    }

    const hasPermission = await canManageNotice(
      currentUser.id,
      currentUser.role,
      existingNotice.organizationId,
    );

    if (!hasPermission) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to delete this notice",
        },
        {
          status: 403,
        },
      );
    }

    await prisma.notice.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notice deleted successfully",
    });
  } catch (error) {
    console.error("Delete notice error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete notice",
      },
      {
        status: 500,
      },
    );
  }
}