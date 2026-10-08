import { NextResponse } from "next/server";
import {
  OrganizationVerificationCategory,
} from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

function isAdmin(session: any) {
  return session?.user?.role === "ADMIN";
}

const VALID_CATEGORIES = Object.values(
  OrganizationVerificationCategory,
);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function serializeRequirement(requirement: any) {
  return {
    id: requirement.id,
    code: requirement.code,
    name: requirement.name,
    description: requirement.description,
    category: requirement.category,
    required: requirement.required,
    validityDays: requirement.validityDays,
    active: requirement.active,
    createdAt: requirement.createdAt.toISOString(),
    updatedAt: requirement.updatedAt.toISOString(),
    verificationCheckCount:
      requirement._count?.verificationChecks ?? 0,
  };
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Requirement ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const requirement =
      await prisma.organizationComplianceRequirement.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              verificationChecks: true,
            },
          },
        },
      });

    if (!requirement) {
      return NextResponse.json(
        {
          error:
            "Organization compliance requirement not found",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      requirement: serializeRequirement(
        requirement,
      ),
    });
  } catch (error) {
    console.error(
      "GET organization compliance requirement error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load organization compliance requirement",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}

export async function PUT(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Requirement ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const body = await request
      .json()
      .catch(() => ({}));

    const existing =
      await prisma.organizationComplianceRequirement.findUnique({
        where: {
          id,
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Organization compliance requirement not found",
        },
        {
          status: 404,
        },
      );
    }

    const {
      code,
      name,
      description,
      category,
      required,
      validityDays,
      active,
    } = body;

    if (
      code !== undefined &&
      (typeof code !== "string" ||
        !code.trim())
    ) {
      return NextResponse.json(
        {
          error:
            "Requirement code cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    if (
      name !== undefined &&
      (typeof name !== "string" ||
        !name.trim())
    ) {
      return NextResponse.json(
        {
          error:
            "Requirement name cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    if (
      category !== undefined &&
      (typeof category !== "string" ||
        !VALID_CATEGORIES.includes(
          category as OrganizationVerificationCategory,
        ))
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid organization verification category.",
          validCategories:
            VALID_CATEGORIES,
        },
        {
          status: 400,
        },
      );
    }

    if (
      required !== undefined &&
      typeof required !== "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Required must be a boolean.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      active !== undefined &&
      typeof active !== "boolean"
    ) {
      return NextResponse.json(
        {
          error:
            "Active must be a boolean.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedCode =
      code !== undefined
        ? String(code).trim().toUpperCase()
        : existing.code;

    if (!normalizedCode) {
      return NextResponse.json(
        {
          error:
            "Requirement code cannot be empty",
        },
        {
          status: 400,
        },
      );
    }

    if (normalizedCode !== existing.code) {
      const duplicate =
        await prisma.organizationComplianceRequirement.findUnique({
          where: {
            code: normalizedCode,
          },
        });

      if (duplicate) {
        return NextResponse.json(
          {
            error: `A requirement with code "${normalizedCode}" already exists`,
          },
          {
            status: 409,
          },
        );
      }
    }

    let parsedValidityDays =
      existing.validityDays;

    if (validityDays !== undefined) {
      if (
        validityDays === null ||
        validityDays === ""
      ) {
        parsedValidityDays = null;
      } else {
        const numericValidityDays =
          Number(validityDays);

        if (
          !Number.isInteger(
            numericValidityDays,
          ) ||
          numericValidityDays < 0
        ) {
          return NextResponse.json(
            {
              error:
                "Validity days must be a non-negative whole number or null.",
            },
            {
              status: 400,
            },
          );
        }

        parsedValidityDays =
          numericValidityDays;
      }
    }

    const requirement =
      await prisma.organizationComplianceRequirement.update({
        where: {
          id,
        },
        data: {
          code: normalizedCode,

          name:
            name !== undefined
              ? String(name).trim()
              : existing.name,

          description:
            description !== undefined
              ? typeof description === "string"
                ? description.trim() || null
                : null
              : existing.description,

          category:
            category !== undefined
              ? (category as OrganizationVerificationCategory)
              : existing.category,

          required:
            required !== undefined
              ? required
              : existing.required,

          validityDays:
            parsedValidityDays,

          active:
            active !== undefined
              ? active
              : existing.active,
        },
        include: {
          _count: {
            select: {
              verificationChecks: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      requirement:
        serializeRequirement(requirement),
      message:
        "Organization compliance requirement updated successfully.",
    });
  } catch (error: any) {
    console.error(
      "PUT organization compliance requirement error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to update organization compliance requirement",
        details:
          process.env.NODE_ENV === "development"
            ? error?.stack
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Requirement ID is required",
        },
        {
          status: 400,
        },
      );
    }

    const requirement =
      await prisma.organizationComplianceRequirement.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              verificationChecks: true,
            },
          },
        },
      });

    if (!requirement) {
      return NextResponse.json(
        {
          error:
            "Organization compliance requirement not found",
        },
        {
          status: 404,
        },
      );
    }

    const usedByChecks =
      requirement._count.verificationChecks;

    if (usedByChecks > 0) {
      if (requirement.active) {
        const deactivated =
          await prisma.organizationComplianceRequirement.update({
            where: {
              id,
            },
            data: {
              active: false,
            },
            include: {
              _count: {
                select: {
                  verificationChecks: true,
                },
              },
            },
          });

        return NextResponse.json({
          success: true,
          action: "DEACTIVATED",
          requirement:
            serializeRequirement(
              deactivated,
            ),
          message:
            "This requirement is already used by organization verification checks, so it was deactivated instead of deleted.",
          usedByChecks,
        });
      }

      return NextResponse.json(
        {
          error:
            "This requirement is already used by organization verification checks and is already inactive. It cannot be deleted.",
          usedByChecks,
        },
        {
          status: 409,
        },
      );
    }

    await prisma.organizationComplianceRequirement.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      action: "DELETED",
      message:
        "Organization compliance requirement deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE organization compliance requirement error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete organization compliance requirement",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      {
        status: 500,
      },
    );
  }
}
