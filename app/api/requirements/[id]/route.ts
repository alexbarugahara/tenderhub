import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const VALID_TYPES = [
  "ELIGIBILITY",
  "TECHNICAL",
  "FINANCIAL",
  "EXPERIENCE",
  "COMPLIANCE",
  "DOCUMENT",
  "GENERAL",
] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: solicitationId } = await params;

    const membership = await prisma.organizationMember.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!membership) {
      return NextResponse.json(
        { success: false, error: "Organization membership not found" },
        { status: 403 }
      );
    }

    const solicitation = await prisma.solicitation.findFirst({
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
        { success: false, error: "Solicitation not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    const {
      type,
      title,
      description,
      isMandatory,
      sortOrder,
      lotId,
    } = body;

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, error: "Invalid requirement type" },
        { status: 400 }
      );
    }

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Requirement title is required" },
        { status: 400 }
      );
    }

    if (lotId) {
      const lot = await prisma.lot.findFirst({
        where: {
          id: lotId,
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
            error: "Selected lot does not belong to this solicitation",
          },
          { status: 400 }
        );
      }
    }

    const requirement = await prisma.requirement.create({
      data: {
        solicitationId,
        lotId: lotId || null,
        type,
        title: title.trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        isMandatory: Boolean(isMandatory),
        sortOrder:
          typeof sortOrder === "number" && Number.isFinite(sortOrder)
            ? sortOrder
            : 0,
      },
      include: {
        lot: {
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        requirement,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create requirement error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create requirement",
      },
      { status: 500 }
    );
  }
}