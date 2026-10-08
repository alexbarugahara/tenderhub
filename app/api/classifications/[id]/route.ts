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

export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const classification = await prisma.classification.findUnique({
      where: {
        id,
      },
      include: {
        parent: true,
        children: {
          orderBy: {
            name: "asc",
          },
        },
        vendorClassifications: {
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                legalName: true,
                verifiedAt: true,
              },
            },
          },
        },
        solicitationClassifications: {
          include: {
            solicitation: {
              select: {
                id: true,
                solicitationNumber: true,
                title: true,
                status: true,
                publishedAt: true,
                closingDate: true,
              },
            },
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
    });

    if (!classification) {
      return NextResponse.json(
        {
          success: false,
          error: "Classification not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      classification,
    });
  } catch (error) {
    console.error("Get classification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve classification",
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

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators can update classifications",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    const existingClassification =
      await prisma.classification.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          type: true,
          parentId: true,
        },
      });

    if (!existingClassification) {
      return NextResponse.json(
        {
          success: false,
          error: "Classification not found",
        },
        {
          status: 404,
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

    const nextCode =
      code === undefined
        ? existingClassification.code
        : String(code).trim();

    const nextName =
      name === undefined
        ? existingClassification.name
        : String(name).trim();

    const nextType =
      type === undefined
        ? existingClassification.type
        : String(type).trim();

    const nextParentId =
      parentId === undefined
        ? existingClassification.parentId
        : parentId;

    if (!nextCode) {
      return NextResponse.json(
        {
          success: false,
          error: "Classification code cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    if (!nextName) {
      return NextResponse.json(
        {
          success: false,
          error: "Classification name cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    if (!nextType) {
      return NextResponse.json(
        {
          success: false,
          error: "Classification type cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    if (nextParentId === id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A classification cannot be its own parent",
        },
        {
          status: 400,
        },
      );
    }

    if (nextParentId !== null) {
      const parent = await prisma.classification.findUnique({
        where: {
          id: nextParentId,
        },
        select: {
          id: true,
          type: true,
          parentId: true,
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

      if (parent.type !== nextType) {
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

      let ancestorId = parent.parentId;

      while (ancestorId) {
        if (ancestorId === id) {
          return NextResponse.json(
            {
              success: false,
              error:
                "The selected parent would create a classification hierarchy cycle",
            },
            {
              status: 400,
            },
          );
        }

        const ancestor =
          await prisma.classification.findUnique({
            where: {
              id: ancestorId,
            },
            select: {
              parentId: true,
            },
          });

        ancestorId = ancestor?.parentId ?? null;
      }
    }

    const duplicate =
      await prisma.classification.findFirst({
        where: {
          type: nextType as never,
          code: nextCode,
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

    if (duplicate) {
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

    const updatedClassification =
      await prisma.classification.update({
        where: {
          id,
        },
        data: {
          code: nextCode,
          name: nextName,
          description:
            description === undefined
              ? existingClassification.description
              : description === null
                ? null
                : String(description).trim(),
          type: nextType as never,
          parentId: nextParentId,
        },
        include: {
          parent: true,
          children: {
            orderBy: {
              name: "asc",
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      message: "Classification updated successfully",
      classification: updatedClassification,
    });
  } catch (error) {
    console.error("Update classification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update classification",
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

    if (currentUser.role !== "ADMIN") {
      return NextResponse.json(
        {
          success: false,
          error: "Only administrators can delete classifications",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await params;

    const classification =
      await prisma.classification.findUnique({
        where: {
          id,
        },
        select: {
          id: true,
          _count: {
            select: {
              children: true,
              vendorClassifications: true,
              solicitationClassifications: true,
            },
          },
        },
      });

    if (!classification) {
      return NextResponse.json(
        {
          success: false,
          error: "Classification not found",
        },
        {
          status: 404,
        },
      );
    }

    if (classification._count.children > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This classification cannot be deleted because it has child classifications",
        },
        {
          status: 409,
        },
      );
    }

    if (
      classification._count.vendorClassifications > 0 ||
      classification._count.solicitationClassifications > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This classification cannot be deleted because it is currently assigned to vendors or solicitations",
        },
        {
          status: 409,
        },
      );
    }

    await prisma.classification.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Classification deleted successfully",
    });
  } catch (error) {
    console.error("Delete classification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete classification",
      },
      {
        status: 500,
      },
    );
  }
}