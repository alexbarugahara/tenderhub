import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  ComplianceCategory,
  DocumentCategory,
} from "@prisma/client";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

const VALID_CATEGORIES = Object.values(
  ComplianceCategory,
);

const VALID_DOCUMENT_CATEGORIES = Object.values(
  DocumentCategory,
);

function parseAllowedDocumentCategories(
  value: unknown,
): DocumentCategory[] | null {
  if (value === undefined || value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const invalidValues = value.filter(
    (item) =>
      typeof item !== "string" ||
      !VALID_DOCUMENT_CATEGORIES.includes(
        item as DocumentCategory,
      ),
  );

  if (invalidValues.length > 0) {
    return null;
  }

  return Array.from(
    new Set(value as DocumentCategory[]),
  );
}

function serializeRequirement(
  requirement: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    category: ComplianceCategory;
    required: boolean;
    validityDays: number | null;
    active: boolean;
    allowedDocumentCategories: DocumentCategory[];
    createdAt: Date;
    updatedAt: Date;
    _count?: {
      applicationRequirements: number;
    };
  },
) {
  return {
    id: requirement.id,
    code: requirement.code,
    name: requirement.name,
    description: requirement.description,
    category: requirement.category,
    required: requirement.required,
    validityDays: requirement.validityDays,
    active: requirement.active,

    allowedDocumentCategories:
      requirement.allowedDocumentCategories,

    createdAt:
      requirement.createdAt.toISOString(),

    updatedAt:
      requirement.updatedAt.toISOString(),

    ...(requirement._count
      ? {
          /*
           * Compatibility property for existing UI.
           */
          vendorComplianceCount:
            requirement._count
              .applicationRequirements,

          /*
           * New architecture property.
           */
          applicationRequirementCount:
            requirement._count
              .applicationRequirements,
        }
      : {}),
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Compliance requirement ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const requirement =
      await prisma.vendorRequirement.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              applicationRequirements: true,
            },
          },
        },
      });

    if (!requirement) {
      return NextResponse.json(
        {
          error:
            "Vendor compliance requirement not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      requirement:
        serializeRequirement(requirement),
    });
  } catch (error) {
    console.error(
      "ADMIN_VENDOR_COMPLIANCE_REQUIREMENT_GET_ERROR",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load vendor compliance requirement.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Compliance requirement ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.vendorRequirement.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              applicationRequirements: true,
            },
          },
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Vendor compliance requirement not found.",
        },
        {
          status: 404,
        },
      );
    }

    const body =
      await request.json().catch(() => ({}));

    const data: {
      name?: string;
      description?: string | null;
      category?: ComplianceCategory;
      required?: boolean;
      validityDays?: number | null;
      active?: boolean;
      allowedDocumentCategories?: DocumentCategory[];
    } = {};

    if (body.name !== undefined) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim()
      ) {
        return NextResponse.json(
          {
            error:
              "Requirement name cannot be empty.",
          },
          {
            status: 400,
          },
        );
      }

      data.name = body.name.trim();
    }

    if (body.description !== undefined) {
      if (
        body.description !== null &&
        typeof body.description !== "string"
      ) {
        return NextResponse.json(
          {
            error:
              "Description must be a string or null.",
          },
          {
            status: 400,
          },
        );
      }

      data.description =
        typeof body.description === "string"
          ? body.description.trim() || null
          : null;
    }

    if (body.category !== undefined) {
      if (
        typeof body.category !== "string" ||
        !VALID_CATEGORIES.includes(
          body.category as ComplianceCategory,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid compliance category.",
            validCategories:
              VALID_CATEGORIES,
          },
          {
            status: 400,
          },
        );
      }

      data.category =
        body.category as ComplianceCategory;
    }

    const requiredValue =
      body.required !== undefined
        ? body.required
        : body.mandatory;

    if (requiredValue !== undefined) {
      if (
        typeof requiredValue !== "boolean"
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

      data.required = requiredValue;
    }

    if (body.validityDays !== undefined) {
      if (
        body.validityDays === null ||
        body.validityDays === ""
      ) {
        data.validityDays = null;
      } else {
        const validityDays =
          Number(body.validityDays);

        if (
          !Number.isInteger(validityDays) ||
          validityDays <= 0
        ) {
          return NextResponse.json(
            {
              error:
                "Validity days must be a positive whole number or null.",
            },
            {
              status: 400,
            },
          );
        }

        data.validityDays = validityDays;
      }
    }

    if (
      body.allowedDocumentCategories !==
      undefined
    ) {
      const allowedDocumentCategories =
        parseAllowedDocumentCategories(
          body.allowedDocumentCategories,
        );

      if (allowedDocumentCategories === null) {
        return NextResponse.json(
          {
            error:
              "Allowed document types must be an array containing only valid document categories.",
            validDocumentCategories:
              VALID_DOCUMENT_CATEGORIES,
          },
          {
            status: 400,
          },
        );
      }

      data.allowedDocumentCategories =
        allowedDocumentCategories;
    }

    if (body.active !== undefined) {
      if (
        typeof body.active !== "boolean"
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

      data.active = body.active;
    }

    if (
      data.name &&
      data.name.toLowerCase() !==
        existing.name.toLowerCase()
    ) {
      const duplicate =
        await prisma.vendorRequirement.findFirst({
          where: {
            id: {
              not: id,
            },
            name: {
              equals: data.name,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
          },
        });

      if (duplicate) {
        return NextResponse.json(
          {
            error:
              "A vendor compliance requirement with this name already exists.",
          },
          {
            status: 409,
          },
        );
      }
    }

    const updated =
      await prisma.vendorRequirement.update({
        where: {
          id,
        },
        data,
        include: {
          _count: {
            select: {
              applicationRequirements: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      requirement:
        serializeRequirement(updated),
      message:
        "Vendor compliance requirement updated successfully.",
    });
  } catch (error) {
    console.error(
      "ADMIN_VENDOR_COMPLIANCE_REQUIREMENT_UPDATE_ERROR",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to update vendor compliance requirement.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Forbidden.",
        },
        {
          status: 403,
        },
      );
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Compliance requirement ID is required.",
        },
        {
          status: 400,
        },
      );
    }

    const existing =
      await prisma.vendorRequirement.findUnique({
        where: {
          id,
        },
        include: {
          _count: {
            select: {
              applicationRequirements: true,
            },
          },
        },
      });

    if (!existing) {
      return NextResponse.json(
        {
          error:
            "Vendor compliance requirement not found.",
        },
        {
          status: 404,
        },
      );
    }

    /*
     * A requirement that has already been used by an
     * application must not be physically deleted.
     *
     * Deactivate it instead so historical application
     * records remain intact.
     */
    if (
      existing._count.applicationRequirements > 0
    ) {
      if (existing.active) {
        const deactivated =
          await prisma.vendorRequirement.update({
            where: {
              id,
            },
            data: {
              active: false,
            },
          });

        return NextResponse.json({
          success: true,
          deleted: false,
          deactivated: true,

          requirement: {
            id: deactivated.id,
            code: deactivated.code,
            name: deactivated.name,
            active: deactivated.active,
            updatedAt:
              deactivated.updatedAt.toISOString(),
          },

          message:
            "The requirement has existing vendor application records, so it was deactivated instead of deleted.",
        });
      }

      return NextResponse.json(
        {
          error:
            "This requirement has existing vendor application records and is already inactive. It cannot be deleted.",
        },
        {
          status: 409,
        },
      );
    }

    /*
     * No application has used the requirement, so it
     * is safe to remove the master requirement.
     */
    await prisma.vendorRequirement.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      deleted: true,
      requirementId: id,
      message:
        "Vendor compliance requirement deleted successfully.",
    });
  } catch (error) {
    console.error(
      "ADMIN_VENDOR_COMPLIANCE_REQUIREMENT_DELETE_ERROR",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to delete vendor compliance requirement.",
      },
      {
        status: 500,
      },
    );
  }
}