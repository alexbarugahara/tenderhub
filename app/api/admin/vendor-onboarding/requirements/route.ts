import { NextResponse } from "next/server";
import { ComplianceCategory, DocumentCategory } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

function isAdmin(session: any) {
  return session?.user?.role === "ADMIN";
}

function isComplianceCategory(value: unknown): value is ComplianceCategory {
  return (
    typeof value === "string" &&
    Object.values(ComplianceCategory).includes(value as ComplianceCategory)
  );
}

function isDocumentCategory(value: unknown): value is DocumentCategory {
  return (
    typeof value === "string" &&
    Object.values(DocumentCategory).includes(value as DocumentCategory)
  );
}

/**
 * GET
 *
 * Returns the global TenderHub vendor onboarding requirements.
 */
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const requirements = await prisma.vendorRequirement.findMany({
      orderBy: [
        {
          required: "desc",
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({
      requirements,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/vendor-onboarding/requirements failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load vendor onboarding requirements.",
      },
      { status: 500 },
    );
  }
}

/**
 * POST
 *
 * Creates a global TenderHub vendor onboarding requirement.
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!isAdmin(session)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 },
      );
    }

    const body = await request.json();

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
      typeof body.category === "string"
        ? body.category.trim()
        : "";

    const required =
      typeof body.required === "boolean"
        ? body.required
        : true;

    const active =
      typeof body.active === "boolean"
        ? body.active
        : true;

    const validityDays =
      typeof body.validityDays === "number" &&
      Number.isInteger(body.validityDays) &&
      body.validityDays > 0
        ? body.validityDays
        : null;

    const allowedDocumentCategories = Array.isArray(
      body.allowedDocumentCategories,
    )
      ? body.allowedDocumentCategories.filter(isDocumentCategory)
      : [];

    if (!code) {
      return NextResponse.json(
        {
          error: "Requirement code is required.",
        },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error: "Requirement name is required.",
        },
        { status: 400 },
      );
    }

    if (!isComplianceCategory(category)) {
      return NextResponse.json(
        {
          error: "A valid requirement category is required.",
        },
        { status: 400 },
      );
    }

    const existingByCode = await prisma.vendorRequirement.findUnique({
      where: {
        code,
      },
    });

    if (existingByCode) {
      return NextResponse.json(
        {
          error:
            "A vendor onboarding requirement with this code already exists.",
        },
        { status: 409 },
      );
    }

    const existingByName = await prisma.vendorRequirement.findFirst({
      where: {
        name: {
          equals: name,
          mode: "insensitive",
        },
      },
    });

    if (existingByName) {
      return NextResponse.json(
        {
          error:
            "A vendor onboarding requirement with this name already exists.",
        },
        { status: 409 },
      );
    }

    const requirement = await prisma.vendorRequirement.create({
      data: {
        code,
        name,
        description,
        category,
        required,
        validityDays,
        active,
        allowedDocumentCategories,
      },
    });

    return NextResponse.json(
      {
        requirement,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/admin/vendor-onboarding/requirements failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to create vendor onboarding requirement.",
      },
      { status: 500 },
    );
  }
}