import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  ComplianceCategory,
  DocumentCategory,
} from "@prisma/client";

const VALID_CATEGORIES = Object.values(ComplianceCategory);

const VALID_DOCUMENT_CATEGORIES =
  Object.values(DocumentCategory);

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

function isAdmin(session: {
  user?: {
    id?: string | null;
    role?: string | null;
  } | null;
} | null) {
  return Boolean(
    session?.user?.id &&
      session.user.role === "ADMIN",
  );
}

export async function GET(request: NextRequest) {
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

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          error: "Forbidden.",
        },
        {
          status: 403,
        },
      );
    }

    const { searchParams } =
      new URL(request.url);

    const activeParam =
      searchParams.get("active");

    const requiredParam =
      searchParams.get("required") ??
      searchParams.get("mandatory");

    const category =
      searchParams.get("category");

    const search =
      searchParams.get("search")?.trim() || "";

    const where = {
      ...(activeParam === "true"
        ? { active: true }
        : {}),
      ...(activeParam === "false"
        ? { active: false }
        : {}),
      ...(requiredParam === "true"
        ? { required: true }
        : {}),
      ...(requiredParam === "false"
        ? { required: false }
        : {}),
      ...(category &&
      VALID_CATEGORIES.includes(
        category as ComplianceCategory,
      )
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
                description: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };

    const requirements =
      await prisma.vendorRequirement.findMany({
        where,
        orderBy: [
          {
            active: "desc",
          },
          {
            required: "desc",
          },
          {
            category: "asc",
          },
          {
            name: "asc",
          },
        ],
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

      requirements: requirements.map(
        (requirement) => ({
          id: requirement.id,
          code: requirement.code,
          name: requirement.name,
          description:
            requirement.description,
          category: requirement.category,
          required: requirement.required,
          validityDays:
            requirement.validityDays,
          active: requirement.active,

          allowedDocumentCategories:
            requirement.allowedDocumentCategories,

          createdAt:
            requirement.createdAt.toISOString(),

          updatedAt:
            requirement.updatedAt.toISOString(),

          /*
           * Keep the old response property name
           * temporarily so existing admin UI does
           * not immediately break.
           */
          vendorComplianceCount:
            requirement._count
              .applicationRequirements,

          /*
           * New architecture name.
           */
          applicationRequirementCount:
            requirement._count
              .applicationRequirements,
        }),
      ),
    });
  } catch (error) {
    console.error(
      "ADMIN_VENDOR_COMPLIANCE_REQUIREMENTS_GET_ERROR",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load vendor compliance requirements.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: NextRequest,
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

    if (!isAdmin(session)) {
      return NextResponse.json(
        {
          error: "Forbidden.",
        },
        {
          status: 403,
        },
      );
    }

    const body =
      await request.json().catch(() => ({}));

    const code =
      typeof body.code === "string"
        ? body.code.trim()
        : "";

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;

    const category = body.category;

    const required =
      typeof body.required === "boolean"
        ? body.required
        : typeof body.mandatory === "boolean"
          ? body.mandatory
          : true;

    const active =
      typeof body.active === "boolean"
        ? body.active
        : true;

    const validityDays =
      body.validityDays === null ||
      body.validityDays === undefined ||
      body.validityDays === ""
        ? null
        : Number(body.validityDays);

    const allowedDocumentCategories =
      parseAllowedDocumentCategories(
        body.allowedDocumentCategories,
      );

    if (!code) {
      return NextResponse.json(
        {
          error:
            "Requirement code is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Requirement name is required.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof category !== "string" ||
      !VALID_CATEGORIES.includes(
        category as ComplianceCategory,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A valid compliance category is required.",
          validCategories:
            VALID_CATEGORIES,
        },
        {
          status: 400,
        },
      );
    }

    if (
      validityDays !== null &&
      (!Number.isInteger(validityDays) ||
        validityDays <= 0)
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

    if (
      allowedDocumentCategories === null
    ) {
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

    const existingByCode =
      await prisma.vendorRequirement.findUnique({
        where: {
          code,
        },
        select: {
          id: true,
        },
      });

    if (existingByCode) {
      return NextResponse.json(
        {
          error:
            "A vendor compliance requirement with this code already exists.",
        },
        {
          status: 409,
        },
      );
    }

    const existingByName =
      await prisma.vendorRequirement.findFirst({
        where: {
          name: {
            equals: name,
            mode: "insensitive",
          },
        },
        select: {
          id: true,
        },
      });

    if (existingByName) {
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

    const requirement =
      await prisma.vendorRequirement.create({
        data: {
          code,
          name,
          description,
          category:
            category as ComplianceCategory,
          required,
          validityDays,
          active,
          allowedDocumentCategories,
        },
      });

    return NextResponse.json(
      {
        success: true,

        requirement: {
          id: requirement.id,
          code: requirement.code,
          name: requirement.name,
          description:
            requirement.description,
          category: requirement.category,
          required: requirement.required,
          validityDays:
            requirement.validityDays,
          active: requirement.active,

          allowedDocumentCategories:
            requirement.allowedDocumentCategories,

          createdAt:
            requirement.createdAt.toISOString(),

          updatedAt:
            requirement.updatedAt.toISOString(),
        },

        message:
          "Vendor compliance requirement created successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "ADMIN_VENDOR_COMPLIANCE_REQUIREMENT_CREATE_ERROR",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to create vendor compliance requirement.",
      },
      {
        status: 500,
      },
    );
  }
}