import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { RequirementType } from "@prisma/client";

const VALID_TYPES: RequirementType[] = [
  "ELIGIBILITY",
  "TECHNICAL",
  "FINANCIAL",
  "EXPERIENCE",
  "COMPLIANCE",
  "DOCUMENT",
  "GENERAL",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const { id: solicitationId } = await params;
    const body = await request.json();

    const {
      type,
      title,
      description,
      isMandatory,
      sortOrder,
      lotId,
    } = body;

    if (
      !type ||
      !VALID_TYPES.includes(type as RequirementType)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid requirement type.",
        },
        { status: 400 },
      );
    }

    if (!title || !String(title).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "Requirement title is required.",
        },
        { status: 400 },
      );
    }

    if (!lotId || !String(lotId).trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "A lot must be selected for this requirement.",
        },
        { status: 400 },
      );
    }

    const membership =
      await prisma.organizationMember.findFirst({
        where: {
          userId: session.user.id,
        },
        select: {
          organizationId: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: "You are not a member of an organization.",
        },
        { status: 403 },
      );
    }

    const solicitation =
      await prisma.solicitation.findFirst({
        where: {
          id: solicitationId,
          organizationId: membership.organizationId,
        },
        select: {
          id: true,
        },
      });

    if (!solicitation) {
      return NextResponse.json(
        {
          success: false,
          error: "Solicitation not found.",
        },
        { status: 404 },
      );
    }

    const lot = await prisma.lot.findFirst({
      where: {
        id: String(lotId),
        solicitationId,
      },
      select: {
        id: true,
      },
    });

    if (!lot) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Selected lot does not belong to this solicitation.",
        },
        { status: 400 },
      );
    }

    const requirement =
      await prisma.requirement.create({
        data: {
          solicitationId,
          lotId: lot.id,
          type: type as RequirementType,
          title: String(title).trim(),
          description:
            description &&
            String(description).trim()
              ? String(description).trim()
              : null,
          isMandatory: Boolean(isMandatory),
          sortOrder:
            typeof sortOrder === "number" &&
            Number.isInteger(sortOrder)
              ? sortOrder
              : 0,
        },
      });

    return NextResponse.json(
      {
        success: true,
        requirement: {
          id: requirement.id,
          solicitationId: requirement.solicitationId,
          lotId: requirement.lotId,
          type: requirement.type,
          title: requirement.title,
          description: requirement.description,
          isMandatory: requirement.isMandatory,
          sortOrder: requirement.sortOrder,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create requirement error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create requirement.",
      },
      { status: 500 },
    );
  }
}