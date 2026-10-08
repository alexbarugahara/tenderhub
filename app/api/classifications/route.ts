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
    const type = searchParams.get("type")?.trim() || "";
    const parentId = searchParams.get("parentId");
    const rootOnly = searchParams.get("rootOnly") === "true";

    const classifications = await prisma.classification.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  code: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  name: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  description: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
        ...(type
          ? {
              type: type as never,
            }
          : {}),
        ...(parentId !== null
          ? {
              parentId,
            }
          : {}),
        ...(rootOnly
          ? {
              parentId: null,
            }
          : {}),
      },
      include: {
        parent: true,
        children: {
          orderBy: {
            name: "asc",
          },
        },
        _count: {
          select: {
            children: true,
            vendorClassifications: true,
            solicitationClassifications: true,
          },
        },
      },
      orderBy: [
        {
          type: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({
      success: true,
      classifications,
      count: classifications.length,
    });
  } catch (error) {
    console.error("Get classifications error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve classifications",
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
          error: "Only administrators can create classifications",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();

    const {
      code,
      name,
      description,
      type,
      parentId,
    } = body;

    if (
      typeof code !== "string" ||
      code.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Classification code is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof name !== "string" ||
      name.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Classification name is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof type !== "string" ||
      type.trim().length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Classification type is required",
        },
        {
          status: 400,
        },
      );
    }

    if (parentId !== undefined && parentId !== null) {
      const parent = await prisma.classification.findUnique({
        where: {
          id: parentId,
        },
        select: {
          id: true,
          type: true,
        },
      });

      if (!parent) {
        return NextResponse.json(
          {
            success: false,
            error: "Parent classification not found",
          },
          {
            status: 400,
          },
        );
      }

      if (parent.type !== type) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Parent classification must use the same classification type",
          },
          {
            status: 400,
          },
        );
      }
    }

    const existingClassification =
      await prisma.classification.findFirst({
        where: {
          type: type as never,
          code: code.trim(),
        },
        select: {
          id: true,
        },
      });

    if (existingClassification) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A classification with this code already exists for this type",
        },
        {
          status: 409,
        },
      );
    }

    const classification = await prisma.classification.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        description:
          description === undefined || description === null
            ? null
            : String(description).trim(),
        type: type as never,
        ...(parentId !== undefined
          ? {
              parentId,
            }
          : {}),
      },
      include: {
        parent: true,
        children: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Classification created successfully",
        classification,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Create classification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create classification",
      },
      {
        status: 500,
      },
    );
  }
}