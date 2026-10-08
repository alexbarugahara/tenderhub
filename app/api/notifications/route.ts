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

    const { searchParams } = new URL(request.url);

    const unreadOnly = searchParams.get("unread") === "true";
    const type = searchParams.get("type") || "";
    const limitParam = Number(searchParams.get("limit") || "50");
    const pageParam = Number(searchParams.get("page") || "1");

    const limit = Math.min(
      Math.max(Number.isFinite(limitParam) ? limitParam : 50, 1),
      100,
    );

    const page = Math.max(
      Number.isFinite(pageParam) ? pageParam : 1,
      1,
    );

    const where = {
      userId: currentUser.id,
      ...(unreadOnly
        ? {
            read: false,
          }
        : {}),
      ...(type
        ? {
            type: type as never,
          }
        : {}),
    };

    const [notifications, total, unreadCount] =
      await prisma.$transaction([
        prisma.notification.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.notification.count({
          where,
        }),
        prisma.notification.count({
          where: {
            userId: currentUser.id,
            read: false,
          },
        }),
      ]);

    return NextResponse.json({
      success: true,
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Get notifications error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve notifications",
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

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators can create notifications directly",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();

    const {
      userId,
      title,
      message,
      type,
      link,
    } = body;

    if (
      typeof userId !== "string" ||
      userId.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof title !== "string" ||
      title.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification title is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification message is required",
        },
        {
          status: 400,
        },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        {
          status: 404,
        },
      );
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title: title.trim(),
        message: message.trim(),
        type: type
          ? (type as never)
          : "INFO",
        link:
          link === undefined || link === null
            ? null
            : String(link).trim(),
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Notification created successfully",
        notification,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create notification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create notification",
      },
      {
        status: 500,
      },
    );
  }
}