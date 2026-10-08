import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { LotStatus } from "@prisma/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function canManageOrganizationSolicitation(
  userId: string,
  organizationId: string,
) {
  const membership =
    await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: {
        id: true,
      },
    });

  return Boolean(membership);
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    const lot = await prisma.lot.findUnique({
      where: {
        id,
      },
      include: {
        solicitation: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                legalName: true,
                email: true,
                phone: true,
                website: true,
              },
            },
            procurement: {
              select: {
                id: true,
                title: true,
                referenceNumber: true,
                status: true,
                procurementMethod: true,
              },
            },
            currency: {
              select: {
                id: true,
                code: true,
                name: true,
                symbol: true,
                decimals: true,
              },
            },
          },
        },
        requirements: {
          orderBy: {
            sortOrder: "asc",
          },
          include: {
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
          },
        },
        bids: {
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                legalName: true,
                email: true,
                phone: true,
                website: true,
                verifiedAt: true,
                country: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                  },
                },
              },
            },
            currency: {
              select: {
                id: true,
                code: true,
                name: true,
                symbol: true,
                decimals: true,
              },
            },
            documents: {
              orderBy: {
                uploadedAt: "desc",
              },
            },
            requirementResponses: true,
            evaluations: {
              include: {
                evaluator: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                  },
                },
                scores: {
                  include: {
                    criterion: true,
                  },
                },
              },
            },
            award: true,
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
                verifiedAt: true,
              },
            },
            bid: {
              select: {
                id: true,
                bidNumber: true,
                totalAmount: true,
                status: true,
                submittedAt: true,
              },
            },
            contract: true,
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
    });

    if (!lot) {
      return NextResponse.json(
        {
          success: false,
          error: "Lot not found",
        },
        { status: 404 },
      );
    }

    if (!session?.user?.id) {
      if (
        lot.solicitation.status === "DRAFT" ||
        lot.solicitation.status === "CANCELLED"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Lot not found",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          ...lot,
          bids: lot.bids.filter(
            (bid) =>
              bid.status !== "DRAFT" &&
              bid.status !== "WITHDRAWN",
          ),
        },
      });
    }

    if (session.user.role === "ADMIN") {
      return NextResponse.json({
        success: true,
        data: lot,
      });
    }

    if (session.user.role === "ORGANIZATION") {
      const authorized =
        await canManageOrganizationSolicitation(
          session.user.id,
          lot.solicitation.organizationId,
        );

      if (!authorized) {
        return NextResponse.json(
          {
            success: false,
            error: "Lot not found",
          },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        data: lot,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: "Lot not found",
      },
      { status: 404 },
    );
  } catch (error) {
    console.error("GET /api/lots/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch lot",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "ORGANIZATION"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators and organization users can update lots",
        },
        { status: 403 },
      );
    }

    const existingLot = await prisma.lot.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        solicitationId: true,
        number: true,
        title: true,
        description: true,
        estimatedValue: true,
        status: true,
        solicitation: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!existingLot) {
      return NextResponse.json(
        {
          success: false,
          error: "Lot not found",
        },
        { status: 404 },
      );
    }

    if (session.user.role === "ORGANIZATION") {
      const authorized =
        await canManageOrganizationSolicitation(
          session.user.id,
          existingLot.solicitation.organizationId,
        );

      if (!authorized) {
        return NextResponse.json(
          {
            success: false,
            error: "You are not authorized to update this lot",
          },
          { status: 403 },
        );
      }
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

    if (
      solicitationId !== undefined &&
      (!solicitationId ||
        typeof solicitationId !== "string")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "solicitationId must be a valid string",
        },
        { status: 400 },
      );
    }

    const nextSolicitationId =
      solicitationId !== undefined
        ? solicitationId
        : existingLot.solicitationId;

    const solicitation =
      await prisma.solicitation.findUnique({
        where: {
          id: nextSolicitationId,
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

    if (session.user.role === "ORGANIZATION") {
      const authorized =
        await canManageOrganizationSolicitation(
          session.user.id,
          solicitation.organizationId,
        );

      if (!authorized) {
        return NextResponse.json(
          {
            success: false,
            error:
              "You are not authorized to move this lot to that solicitation",
          },
          { status: 403 },
        );
      }
    }

    if (
      number !== undefined &&
      (!Number.isInteger(Number(number)) ||
        Number(number) <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "number must be a positive integer",
        },
        { status: 400 },
      );
    }

    const nextNumber =
      number !== undefined
        ? Number(number)
        : existingLot.number;

    if (
      solicitationId !== undefined ||
      number !== undefined
    ) {
      const duplicateLot = await prisma.lot.findFirst({
        where: {
          solicitationId: nextSolicitationId,
          number: nextNumber,
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicateLot) {
        return NextResponse.json(
          {
            success: false,
            error:
              "A lot with this number already exists for this solicitation",
          },
          { status: 409 },
        );
      }
    }

    if (
      title !== undefined &&
      (!title ||
        typeof title !== "string" ||
        !title.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "title cannot be empty",
        },
        { status: 400 },
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
          error: "description must be a string",
        },
        { status: 400 },
      );
    }

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

    let numericEstimatedValue:
      | number
      | null
      | undefined;

    if (estimatedValue !== undefined) {
      if (
        estimatedValue === null ||
        estimatedValue === ""
      ) {
        numericEstimatedValue = null;
      } else {
        numericEstimatedValue = Number(estimatedValue);

        if (
          !Number.isFinite(numericEstimatedValue) ||
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
    }

    /*
     * Financial allocation control
     *
     * The lot being edited MUST be excluded from the
     * aggregate. This means:
     *
     * Solicitation = 25,000
     * Lot 1 = 15,000
     * Lot 2 = 10,000
     *
     * Editing Lot 1:
     * Other lots = 10,000
     * Available for Lot 1 = 15,000
     *
     * Therefore:
     * 15,000 -> allowed
     * 16,000 -> rejected
     *
     * If the lot is moved to another solicitation, the
     * calculation is performed against the target
     * solicitation instead.
     */
    const nextEstimatedValue =
      estimatedValue !== undefined
        ? numericEstimatedValue ?? 0
        : Number(existingLot.estimatedValue ?? 0);

    const existingAllocation =
      await prisma.lot.aggregate({
        where: {
          solicitationId: nextSolicitationId,
          NOT: {
            id,
          },
        },
        _sum: {
          estimatedValue: true,
        },
      });

    const alreadyAllocated = Number(
      existingAllocation._sum.estimatedValue ?? 0,
    );

    const solicitationBudget = Number(
      solicitation.estimatedValue ?? 0,
    );

    const availableAllocation =
      solicitationBudget - alreadyAllocated;

    if (nextEstimatedValue > availableAllocation) {
      return NextResponse.json(
        {
          success: false,
          error:
            "LOT_ALLOCATION_EXCEEDED",
          message:
            "The lot allocation exceeds the amount available under this solicitation.",
          financial: {
            solicitationBudget,
            alreadyAllocated,
            availableAllocation,
            requestedLotAllocation:
              nextEstimatedValue,
          },
        },
        { status: 409 },
      );
    }

    const totalAllocatedAfterUpdate =
      alreadyAllocated + nextEstimatedValue;

    const availableAfterUpdate =
      solicitationBudget - totalAllocatedAfterUpdate;

    const updatedLot = await prisma.lot.update({
      where: {
        id,
      },
      data: {
        ...(solicitationId !== undefined && {
          solicitationId: nextSolicitationId,
        }),
        ...(number !== undefined && {
          number: nextNumber,
        }),
        ...(title !== undefined && {
          title: title.trim(),
        }),
        ...(description !== undefined && {
          description:
            description === null
              ? null
              : description.trim(),
        }),
        ...(estimatedValue !== undefined && {
          estimatedValue: numericEstimatedValue,
        }),
        ...(status !== undefined && {
          status: status as LotStatus,
        }),
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

    await prisma.solicitationActivity.create({
      data: {
        solicitationId: updatedLot.solicitationId,
        performedById: session.user.id,
        action: "UPDATE_LOT",
        description: `Lot ${updatedLot.number} "${updatedLot.title}" was updated.`,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedLot,
      financial: {
        solicitationBudget,
        alreadyAllocated,
        availableAllocation,
        lotAllocation: nextEstimatedValue,
        totalAllocatedAfterUpdate,
        availableAfterUpdate,
      },
    });
  } catch (error) {
    console.error("PATCH /api/lots/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update lot",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    if (
      session.user.role !== "ADMIN" &&
      session.user.role !== "ORGANIZATION"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators and organization users can delete lots",
        },
        { status: 403 },
      );
    }

    const lot = await prisma.lot.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        solicitationId: true,
        number: true,
        title: true,
        solicitation: {
          select: {
            organizationId: true,
          },
        },
      },
    });

    if (!lot) {
      return NextResponse.json(
        {
          success: false,
          error: "Lot not found",
        },
        { status: 404 },
      );
    }

    if (session.user.role === "ORGANIZATION") {
      const authorized =
        await canManageOrganizationSolicitation(
          session.user.id,
          lot.solicitation.organizationId,
        );

      if (!authorized) {
        return NextResponse.json(
          {
            success: false,
            error: "You are not authorized to delete this lot",
          },
          { status: 403 },
        );
      }
    }

    const bidCount = await prisma.bid.count({
      where: {
        lotId: id,
      },
    });

    const awardCount = await prisma.award.count({
      where: {
        lotId: id,
      },
    });

    if (bidCount > 0 || awardCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This lot cannot be deleted because it has bids or awards associated with it",
        },
        { status: 409 },
      );
    }

    await prisma.lot.delete({
      where: {
        id,
      },
    });

    await prisma.solicitationActivity.create({
      data: {
        solicitationId: lot.solicitationId,
        performedById: session.user.id,
        action: "DELETE_LOT",
        description: `Lot ${lot.number} "${lot.title}" was deleted.`,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: "Lot deleted successfully",
      },
    });
  } catch (error) {
    console.error("DELETE /api/lots/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete lot",
      },
      { status: 500 },
    );
  }
}
