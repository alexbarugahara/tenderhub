import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { LotStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    const { searchParams } = new URL(request.url);

    const solicitationId = searchParams.get(
      "solicitationId",
    );
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: {
      solicitationId?: string;
      status?: LotStatus;
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

    if (status) {
      if (
        !Object.values(LotStatus).includes(
          status as LotStatus,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid lot status",
          },
          { status: 400 },
        );
      }

      where.status = status as LotStatus;
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

    const lots = await prisma.lot.findMany({
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

        requirements: {
          orderBy: {
            sortOrder: "asc",
          },
        },

        bids: {
          select: {
            id: true,
            bidNumber: true,
            vendorId: true,
            totalAmount: true,
            status: true,
            submittedAt: true,
          },
          orderBy: {
            submittedAt: "desc",
          },
        },

        awards: {
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                legalName: true,
              },
            },

            bid: {
              select: {
                id: true,
                bidNumber: true,
                totalAmount: true,
                status: true,
              },
            },
          },

          orderBy: {
            awardDate: "desc",
          },
        },

        _count: {
          select: {
            requirements: true,
            bids: true,
            awards: true,
          },
        },
      },

      orderBy: [
        {
          solicitationId: "asc",
        },
        {
          number: "asc",
        },
      ],
    });

    /*
     * PUBLIC ACCESS
     *
     * Draft and cancelled lots are not exposed publicly.
     */
    if (!session?.user?.id) {
      const publicLots = lots.filter(
        (lot) =>
          lot.solicitation.status !== "DRAFT" &&
          lot.solicitation.status !== "CANCELLED",
      );

      return NextResponse.json({
        success: true,
        data: publicLots,
        count: publicLots.length,
      });
    }

    /*
     * ADMIN ACCESS
     */
    if (session.user.role === "ADMIN") {
      return NextResponse.json({
        success: true,
        data: lots,
        count: lots.length,
      });
    }

    /*
     * ORGANIZATION ACCESS
     */
    if (session.user.role === "ORGANIZATION") {
      const organizationMemberships =
        await prisma.organizationMember.findMany({
          where: {
            userId: session.user.id,
          },

          select: {
            organizationId: true,
          },
        });

      const organizationIds = new Set(
        organizationMemberships.map(
          (membership) =>
            membership.organizationId,
        ),
      );

      const organizationLots = lots.filter(
        (lot) =>
          organizationIds.has(
            lot.solicitation.organization.id,
          ),
      );

      return NextResponse.json({
        success: true,
        data: organizationLots,
        count: organizationLots.length,
      });
    }

    /*
     * Other authenticated roles do not receive
     * organization lot management data.
     */
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
    });
  } catch (error) {
    console.error("GET /api/lots error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch lots",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    /*
     * AUTHENTICATION
     */
    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    /*
     * ROLE AUTHORIZATION
     */
    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "ORGANIZATION"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators and organization users can create lots",
        },
        { status: 403 },
      );
    }

    const body = await request.json();

    const {
      solicitationId,
      number,
      title,
      description,
      estimatedValue,
      status,
    } = body;

    /*
     * SOLICITATION ID
     */
    if (
      !solicitationId ||
      typeof solicitationId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "solicitationId is required",
        },
        { status: 400 },
      );
    }

    /*
     * LOT NUMBER
     */
    if (
      number === undefined ||
      number === null ||
      !Number.isInteger(Number(number)) ||
      Number(number) <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "number must be a positive integer",
        },
        { status: 400 },
      );
    }

    /*
     * TITLE
     */
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
        { status: 400 },
      );
    }

    /*
     * DESCRIPTION
     */
    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "description must be a string",
        },
        { status: 400 },
      );
    }

    /*
     * STATUS
     */
    if (
      status !== undefined &&
      !Object.values(LotStatus).includes(
        status as LotStatus,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid lot status",
        },
        { status: 400 },
      );
    }

    /*
     * SOLICITATION
     *
     * The solicitation is the parent of the Lot.
     */
    const solicitation =
      await prisma.solicitation.findUnique({
        where: {
          id: solicitationId,
        },

        select: {
          id: true,
          title: true,
          status: true,
          organizationId: true,
          estimatedValue: true,
        },
      });

    if (!solicitation) {
      return NextResponse.json(
        {
          success: false,
          error: "Solicitation not found",
        },
        { status: 404 },
      );
    }

    /*
     * DRAFT-ONLY ENFORCEMENT
     *
     * Lots can only be created while the
     * solicitation is being prepared.
     */
    if (solicitation.status !== "DRAFT") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Lots can only be created while the solicitation is in Draft status",
        },
        { status: 400 },
      );
    }

    /*
     * ORGANIZATION AUTHORIZATION
     */
    if (session.user.role === "ORGANIZATION") {
      const membership =
        await prisma.organizationMember.findUnique({
          where: {
            organizationId_userId: {
              organizationId:
                solicitation.organizationId,
              userId: session.user.id,
            },
          },

          select: {
            id: true,
          },
        });

      if (!membership) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You are not authorized to manage this solicitation",
          },
          { status: 403 },
        );
      }
    }

    const numericNumber = Number(number);

    /*
     * DUPLICATE LOT NUMBER
     */
    const existingLot =
      await prisma.lot.findUnique({
        where: {
          solicitationId_number: {
            solicitationId,
            number: numericNumber,
          },
        },

        select: {
          id: true,
        },
      });

    if (existingLot) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A lot with this number already exists for this solicitation",
        },
        { status: 409 },
      );
    }

    /*
     * LOT ESTIMATED VALUE
     *
     * Optional at database level.
     * When supplied, it must be non-negative.
     */
    let numericEstimatedValue:
      | number
      | undefined;

    if (
      estimatedValue !== undefined &&
      estimatedValue !== null &&
      estimatedValue !== ""
    ) {
      numericEstimatedValue =
        Number(estimatedValue);

      if (
        !Number.isFinite(
          numericEstimatedValue,
        ) ||
        numericEstimatedValue < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "estimatedValue must be a valid non-negative number",
          },
          { status: 400 },
        );
      }
    }

    /*
     * FINANCIAL ALLOCATION
     *
     * The solicitation estimated value acts as
     * the parent financial ceiling for its lots.
     *
     * Example:
     *
     * Solicitation = $500,000
     *
     * Lot 1 = $200,000
     * Lot 2 = $150,000
     *
     * Available = $150,000
     */
    const requestedAllocation =
      numericEstimatedValue ?? 0;

    let result:
      | {
          lot: Awaited<
            ReturnType<
              typeof prisma.lot.create
            >
          >;
          financial: {
            solicitationBudget: number;
            alreadyAllocated: number;
            availableAllocation: number;
            lotAllocation: number;
            totalAllocatedAfterCreate: number;
            availableAfterCreate: number;
          };
        }
      | undefined;

    try {
      result = await prisma.$transaction(
        async (tx) => {
          /*
           * Calculate existing lot allocations.
           */
          const existingAllocation =
            await tx.lot.aggregate({
              where: {
                solicitationId,
              },

              _sum: {
                estimatedValue: true,
              },
            });

          const alreadyAllocated =
            Number(
              existingAllocation._sum
                .estimatedValue ?? 0,
            );

          const solicitationBudget =
            Number(
              solicitation.estimatedValue ?? 0,
            );

          const availableAllocation =
            solicitationBudget -
            alreadyAllocated;

          /*
           * Do not allow the new lot to exceed
           * the remaining solicitation allocation.
           */
          if (
            requestedAllocation >
            availableAllocation
          ) {
            throw new Error(
              `LOT_ALLOCATION_EXCEEDED:${solicitationBudget}:${alreadyAllocated}:${availableAllocation}:${requestedAllocation}`,
            );
          }

          /*
           * CREATE LOT
           */
          const lot = await tx.lot.create({
            data: {
              solicitationId,

              number: numericNumber,

              title: title.trim(),

              description:
                description === undefined ||
                description === null
                  ? null
                  : description.trim(),

              ...(numericEstimatedValue !==
                undefined && {
                estimatedValue:
                  numericEstimatedValue,
              }),

              ...(status !== undefined && {
                status:
                  status as LotStatus,
              }),
            },

            include: {
              solicitation: {
                select: {
                  id: true,
                  solicitationNumber: true,
                  title: true,
                  status: true,
                  estimatedValue: true,
                },
              },

              requirements: {
                orderBy: {
                  sortOrder: "asc",
                },
              },

              _count: {
                select: {
                  requirements: true,
                  bids: true,
                  awards: true,
                },
              },
            },
          });

          const totalAllocatedAfterCreate =
            alreadyAllocated +
            requestedAllocation;

          const availableAfterCreate =
            solicitationBudget -
            totalAllocatedAfterCreate;

          return {
            lot,
            financial: {
              solicitationBudget,
              alreadyAllocated,
              availableAllocation,
              lotAllocation:
                requestedAllocation,
              totalAllocatedAfterCreate,
              availableAfterCreate,
            },
          };
        },
      );
    } catch (error) {
      /*
       * Financial allocation validation.
       */
      if (
        error instanceof Error &&
        error.message.startsWith(
          "LOT_ALLOCATION_EXCEEDED:",
        )
      ) {
        const parts =
          error.message.split(":");

        const solicitationBudget =
          Number(parts[1] ?? 0);

        const alreadyAllocated =
          Number(parts[2] ?? 0);

        const availableAllocation =
          Number(parts[3] ?? 0);

        const requestedAllocation =
          Number(parts[4] ?? 0);

        return NextResponse.json(
          {
            success: false,
            error:
              "Lot allocation exceeds the available solicitation budget",

            financial: {
              solicitationBudget,
              alreadyAllocated,
              availableAllocation,
              requestedAllocation,
            },
          },
          { status: 400 },
        );
      }

      throw error;
    }

    /*
     * ACTIVITY LOG
     */
    await prisma.solicitationActivity.create({
      data: {
        solicitationId,

        performedById:
          session.user.id,

        action: "CREATE_LOT",

        description: `Lot ${numericNumber} "${title.trim()}" was created.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: result.lot,
        financial: result.financial,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "POST /api/lots error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create lot",
      },
      { status: 500 },
    );
  }
}