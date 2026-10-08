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

export async function GET(request: Request) {
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

    const { searchParams } =
      new URL(request.url);

    const activeParam =
      searchParams.get("active");

    const category =
      searchParams.get("category");

    const where: {
      active?: boolean;
      category?: OrganizationVerificationCategory;
    } = {};

    if (activeParam === "true") {
      where.active = true;
    }

    if (activeParam === "false") {
      where.active = false;
    }

    if (
      category &&
      VALID_CATEGORIES.includes(
        category as OrganizationVerificationCategory,
      )
    ) {
      where.category =
        category as OrganizationVerificationCategory;
    }

    const requirements =
      await prisma.organizationComplianceRequirement.findMany({
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
              verificationChecks: true,
            },
          },
        },
      });

    return NextResponse.json({
      success: true,
      requirements:
        requirements.map((requirement) => ({
          id: requirement.id,
          code: requirement.code,
          name: requirement.name,
          description:
            requirement.description,
          category:
            requirement.category,
          required:
            requirement.required,
          validityDays:
            requirement.validityDays,
          active:
            requirement.active,
          createdAt:
            requirement.createdAt.toISOString(),
          updatedAt:
            requirement.updatedAt.toISOString(),
          verificationCheckCount:
            requirement._count
              .verificationChecks,
        })),
    });
  } catch (error) {
    console.error(
      "GET /api/admin/organization-compliance-requirements error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Failed to load organization compliance requirements",

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

export async function POST(request: Request) {
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

    const body =
      await request.json().catch(() => ({}));

    const code =
      typeof body.code === "string"
        ? body.code.trim().toUpperCase()
        : "";

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    const description =
      typeof body.description === "string"
        ? body.description.trim() || null
        : null;

    const category =
      body.category;

    const required =
      typeof body.required === "boolean"
        ? body.required
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

    if (!code) {
      return NextResponse.json(
        {
          error:
            "Requirement code is required",
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
            "Requirement name is required",
        },
        {
          status: 400,
        },
      );
    }

    if (
      typeof category !== "string" ||
      !VALID_CATEGORIES.includes(
        category as OrganizationVerificationCategory,
      )
    ) {
      return NextResponse.json(
        {
          error:
            "A valid organization verification category is required.",
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
        validityDays < 0)
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

    const existing =
      await prisma.organizationComplianceRequirement.findUnique({
        where: {
          code,
        },
        select: {
          id: true,
        },
      });

    if (existing) {
      return NextResponse.json(
        {
          error: `A requirement with code "${code}" already exists`,
        },
        {
          status: 409,
        },
      );
    }

    const requirement =
      await prisma.organizationComplianceRequirement.create({
        data: {
          code,
          name,
          description,
          category:
            category as OrganizationVerificationCategory,
          required,
          validityDays,
          active,
        },
        include: {
          _count: {
            select: {
              verificationChecks: true,
            },
          },
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
          category:
            requirement.category,
          required:
            requirement.required,
          validityDays:
            requirement.validityDays,
          active:
            requirement.active,
          createdAt:
            requirement.createdAt.toISOString(),
          updatedAt:
            requirement.updatedAt.toISOString(),
          verificationCheckCount:
            requirement._count
              .verificationChecks,
        },
        message:
          "Organization compliance requirement created successfully.",
      },
      {
        status: 201,
      },
    );
  } catch (error: any) {
    console.error(
      "POST /api/admin/organization-compliance-requirements error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "Failed to create organization compliance requirement",

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