import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search")?.trim() || "";
    const organizationId =
      searchParams.get("organizationId") || "";
    const solicitationId =
      searchParams.get("solicitationId") || "";
    const type = searchParams.get("type") || "";
    const published = searchParams.get("published");

    const notices = await prisma.notice.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  content: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(organizationId ? { organizationId } : {}),
        ...(solicitationId ? { solicitationId } : {}),
        ...(type
          ? {
              type: type as never,
            }
          : {}),
        ...(published === "true"
          ? {
              published: true,
            }
          : {}),
        ...(published === "false"
          ? {
              published: false,
            }
          : {}),
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
      orderBy: [
        {
          publishedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      notices,
      count: notices.length,
    });
  } catch (error) {
    console.error("Get notices error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve notices",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const {
      organizationId,
      solicitationId,
      title,
      content,
      type,
      published,
    } = body;

    if (
      typeof title !== "string" ||
      title.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Notice title is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Notice content is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      organizationId !== undefined &&
      organizationId !== null
    ) {
      const organization =
        await prisma.organization.findUnique({
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
          {
            status: 400,
          },
        );
      }

      if (currentUser.role !== "ADMIN") {
        const membership =
          await prisma.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId,
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
                "You do not have permission to create notices for this organization",
            },
            {
              status: 403,
            },
          );
        }
      }
    } else if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators can create notices without an organization",
        },
        {
          status: 403,
        },
      );
    }

    if (
      solicitationId !== undefined &&
      solicitationId !== null
    ) {
      const solicitation =
        await prisma.solicitation.findUnique({
          where: {
            id: solicitationId,
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
        organizationId &&
        solicitation.organizationId !== organizationId
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

      if (
        currentUser.role !== "ADMIN" &&
        solicitation.organizationId
      ) {
        const membership =
          await prisma.organizationMember.findUnique({
            where: {
              organizationId_userId: {
                organizationId:
                  solicitation.organizationId,
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
                "You do not have permission to create notices for this solicitation",
            },
            {
              status: 403,
            },
          );
        }
      }
    }

    const shouldPublish = published === true;

    const notice = await prisma.notice.create({
      data: {
        organizationId:
          organizationId === undefined
            ? null
            : organizationId,
        solicitationId:
          solicitationId === undefined
            ? null
            : solicitationId,
        title: title.trim(),
        content: content.trim(),
        type: type
          ? (type as never)
          : "GENERAL",
        published: shouldPublish,
        publishedAt: shouldPublish ? new Date() : null,
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

    return NextResponse.json(
      {
        success: true,
        message: shouldPublish
          ? "Notice published successfully"
          : "Notice created successfully",
        notice,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create notice error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create notice",
      },
      {
        status: 500,
      },
    );
  }
}