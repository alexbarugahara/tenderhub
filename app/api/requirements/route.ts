import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { RequirementType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    const { searchParams } = new URL(request.url);

    const solicitationId = searchParams.get("solicitationId");
    const lotId = searchParams.get("lotId");
    const type = searchParams.get("type");
    const mandatory = searchParams.get("mandatory");
    const search = searchParams.get("search");

    /*
     * Public requests must provide a solicitationId.
     * Authenticated users may query more broadly.
     */
    if (!session?.user?.id && !solicitationId) {
      return NextResponse.json(
        {
          success: false,
          error: "solicitationId is required",
        },
        { status: 400 }
      );
    }

    /*
     * Validate requirement type.
     */
    if (
      type &&
      !Object.values(RequirementType).includes(
        type as RequirementType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid requirement type",
        },
        { status: 400 }
      );
    }

    /*
     * Build Prisma filter.
     */
    const where: {
      solicitationId?: string;
      lotId?: string | null;
      type?: RequirementType;
      isMandatory?: boolean;
      OR?: Array<{
        title?: {
          contains: string;
          mode: "insensitive";
        };
        description?: {
          contains: string;
          mode: "insensitive";
        };
      }>;
    } = {};

    if (solicitationId) {
      where.solicitationId = solicitationId;
    }

    if (lotId) {
      where.lotId = lotId;
    }

    if (type) {
      where.type = type as RequirementType;
    }

    if (mandatory !== null) {
      if (
        mandatory !== "true" &&
        mandatory !== "false"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "mandatory must be either true or false",
          },
          { status: 400 }
        );
      }

      where.isMandatory = mandatory === "true";
    }

    if (search) {
      where.OR = [
        {
          title: {
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
      ];
    }

    const requirements =
      await prisma.requirement.findMany({
        where,
        include: {
          solicitation: {
            select: {
              id: true,
              solicitationNumber: true,
              title: true,
              status: true,
              organization: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          lot: {
            select: {
              id: true,
              number: true,
              title: true,
              status: true,
            },
          },
          responses: {
            select: {
              id: true,
              bidId: true,
              response: true,
              booleanValue: true,
              numericValue: true,
              evidenceUrl: true,
              compliant: true,
              reviewerComment: true,
              reviewedAt: true,
              reviewedById: true,
            },
          },
          _count: {
            select: {
              responses: true,
            },
          },
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      });

    /*
     * Public users should not receive bid-response information.
     */
    if (!session?.user?.id) {
      const publicRequirements = requirements.map(
        (requirement) => ({
          id: requirement.id,
          solicitationId:
            requirement.solicitationId,
          lotId: requirement.lotId,
          type: requirement.type,
          title: requirement.title,
          description: requirement.description,
          isMandatory: requirement.isMandatory,
          sortOrder: requirement.sortOrder,
          createdAt: requirement.createdAt,
          updatedAt: requirement.updatedAt,
          solicitation:
            requirement.solicitation,
          lot: requirement.lot,
        })
      );

      return NextResponse.json({
        success: true,
        data: publicRequirements,
        count: publicRequirements.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: requirements,
      count: requirements.length,
    });
  } catch (error) {
    console.error(
      "GET /api/requirements error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch requirements",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    /*
     * Authentication.
     */
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    /*
     * Only administrators and organization users
     * can create requirements.
     */
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "ORGANIZATION"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators and organization users can create requirements",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      solicitationId,
      lotId,
      type,
      title,
      description,
      isMandatory,
      sortOrder,
    } = body;

    /*
     * ---------------------------------------------------------
     * CANONICAL PARENT RULE
     * ---------------------------------------------------------
     *
     * Exactly ONE of these must be supplied:
     *
     * {
     *   solicitationId: "...",
     *   lotId: null
     * }
     *
     * OR
     *
     * {
     *   solicitationId: null,
     *   lotId: "..."
     * }
     *
     * Never both.
     */
    const hasSolicitationId =
      solicitationId !== undefined &&
      solicitationId !== null &&
      solicitationId !== "";

    const hasLotId =
      lotId !== undefined &&
      lotId !== null &&
      lotId !== "";

    if (hasSolicitationId && hasLotId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Provide either solicitationId or lotId, not both",
        },
        { status: 400 }
      );
    }

    if (!hasSolicitationId && !hasLotId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Either solicitationId or lotId is required",
        },
        { status: 400 }
      );
    }

    /*
     * Validate supplied IDs.
     */
    if (
      hasSolicitationId &&
      typeof solicitationId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "solicitationId must be a valid string",
        },
        { status: 400 }
      );
    }

    if (
      hasLotId &&
      typeof lotId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "lotId must be a valid string",
        },
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * RESOLVE THE PARENT SOLICITATION
     * ---------------------------------------------------------
     *
     * If solicitationId was supplied directly:
     *     use it.
     *
     * If lotId was supplied:
     *     find the Lot and derive its solicitationId.
     */
    let resolvedSolicitationId: string;
    let lotExists: {
      id: string;
      solicitationId: string;
      number: string | number;
      title: string;
    } | null = null;

    if (hasLotId) {
      lotExists = await prisma.lot.findUnique({
        where: {
          id: lotId,
        },
        select: {
          id: true,
          solicitationId: true,
          number: true,
          title: true,
        },
      });

      if (!lotExists) {
        return NextResponse.json(
          {
            success: false,
            error: "Lot not found",
          },
          { status: 404 }
        );
      }

      resolvedSolicitationId =
        lotExists.solicitationId;
    } else {
      resolvedSolicitationId = solicitationId;
    }

    /*
     * Find the parent solicitation.
     */
    const solicitation =
      await prisma.solicitation.findUnique({
        where: {
          id: resolvedSolicitationId,
        },
        select: {
          id: true,
          title: true,
          status: true,
          organizationId: true,
        },
      });

    if (!solicitation) {
      return NextResponse.json(
        {
          success: false,
          error: "Solicitation not found",
        },
        { status: 404 }
      );
    }

    /*
     * ---------------------------------------------------------
     * VALIDATE REQUIREMENT FIELDS
     * ---------------------------------------------------------
     */

    if (
      !type ||
      !Object.values(RequirementType).includes(
        type as RequirementType
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid requirement type is required",
        },
        { status: 400 }
      );
    }

    if (
      !title ||
      typeof title !== "string" ||
      !title.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "title is required",
        },
        { status: 400 }
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "description must be a string",
        },
        { status: 400 }
      );
    }

    if (
      isMandatory !== undefined &&
      typeof isMandatory !== "boolean"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "isMandatory must be a boolean",
        },
        { status: 400 }
      );
    }

    if (
      sortOrder !== undefined &&
      (!Number.isInteger(Number(sortOrder)) ||
        Number(sortOrder) < 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "sortOrder must be a non-negative integer",
        },
        { status: 400 }
      );
    }

    /*
     * ---------------------------------------------------------
     * CREATE REQUIREMENT
     * ---------------------------------------------------------
     *
     * The database always receives the resolved
     * solicitationId.
     *
     * lotId is null for solicitation-level
     * requirements.
     */
    const requirement =
      await prisma.requirement.create({
        data: {
          solicitationId:
            resolvedSolicitationId,

          lotId: hasLotId
            ? lotId
            : null,

          type: type as RequirementType,

          title: title.trim(),

          description:
            description === undefined ||
            description === null
              ? null
              : description.trim(),

          isMandatory:
            isMandatory === undefined
              ? true
              : isMandatory,

          sortOrder:
            sortOrder === undefined
              ? 0
              : Number(sortOrder),
        },

        include: {
          solicitation: {
            select: {
              id: true,
              solicitationNumber: true,
              title: true,
              status: true,
            },
          },

          lot: {
            select: {
              id: true,
              number: true,
              title: true,
            },
          },

          _count: {
            select: {
              responses: true,
            },
          },
        },
      });

    /*
     * Record activity against the solicitation.
     */
    await prisma.solicitationActivity.create({
      data: {
        solicitationId:
          resolvedSolicitationId,

        performedById:
          session.user.id,

        action: "CREATE_REQUIREMENT",

        description:
          `Requirement "${requirement.title}" was created.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: requirement,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/requirements error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create requirement",
      },
      { status: 500 }
    );
  }
}