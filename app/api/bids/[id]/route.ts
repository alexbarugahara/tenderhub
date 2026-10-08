import { NextRequest, NextResponse } from "next/server";
import { BidStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

async function getSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  return prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });
}

async function isOrganizationMember(
  organizationId: string,
  userId: string
) {
  const membership = await prisma.organizationMember.findFirst({
    where: {
      organizationId,
      userId,
    },
    select: {
      id: true,
    },
  });

  return Boolean(membership);
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await auth();
    const { id } = await context.params;

    const bid = await prisma.bid.findUnique({
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

        lot: {
          select: {
            id: true,
            solicitationId: true,
            number: true,
            title: true,
            description: true,
            estimatedValue: true,
            status: true,
          },
        },

        /*
         * IMPORTANT:
         * Do not load the retired Vendor compliance/document/
         * classification architecture here.
         *
         * Vendor onboarding is now handled through:
         * VendorApplication
         * VendorApplicationRequirement
         * VendorApplicationEvidence
         */
        vendor: {
          select: {
            id: true,
            userId: true,
            companyName: true,
            legalName: true,
            email: true,
            phone: true,
            website: true,
            address: true,
            registrationNumber: true,
            taxNumber: true,
            businessType: true,
            numberOfEmployees: true,
            yearsOperating: true,
            operatingLocations: true,
            portfolioDescription: true,
            verifiedAt: true,
            countryId: true,
          },
        },

        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
          include: {
            reviewedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            uploadedAt: "desc",
          },
        },

        requirementResponses: {
          include: {
            requirement: {
              include: {
                lot: {
                  select: {
                    id: true,
                    number: true,
                    title: true,
                  },
                },
              },
            },
            reviewedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },

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
              orderBy: {
                criterion: {
                  sortOrder: "asc",
                },
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },

        award: {
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                legalName: true,
              },
            },
            contract: true,
          },
        },

        activities: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!bid) {
      return NextResponse.json(
        {
          success: false,
          error: "Bid not found",
        },
        { status: 404 }
      );
    }

    /*
     * Public access is intentionally limited.
     */
    if (!session?.user?.id) {
      if (
        bid.solicitation.status === "DRAFT" ||
        bid.solicitation.status === "CANCELLED"
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Bid not found",
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          id: bid.id,
          solicitationId: bid.solicitationId,
          lotId: bid.lotId,
          vendorId: bid.vendorId,
          bidNumber: bid.bidNumber,
          title: bid.title,
          summary: bid.summary,
          totalAmount: bid.totalAmount,
          submittedAt: bid.submittedAt,
          lockedAt: bid.lockedAt,
          status: bid.status,

          solicitation: bid.solicitation,

          lot: bid.lot,

          vendor: {
            id: bid.vendor.id,
            companyName: bid.vendor.companyName,
            legalName: bid.vendor.legalName,
            verifiedAt: bid.vendor.verifiedAt,
          },

          currency: bid.currency,
        },
      });
    }

    const user = await getSessionUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const isAdmin = user.role === "ADMIN";

    const isVendorOwner =
      user.role === "VENDOR" &&
      bid.vendor.userId === user.id;

    const isOrganizationUser =
      user.role === "ORGANIZATION"
        ? await isOrganizationMember(
            bid.solicitation.organizationId,
            user.id
          )
        : false;

    if (!isAdmin && !isVendorOwner && !isOrganizationUser) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to this bid",
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bid,
    });
  } catch (error) {
    console.error("GET /api/bids/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch bid",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const existingBid = await prisma.bid.findUnique({
      where: {
        id,
      },
      include: {
        vendor: {
          select: {
            id: true,
            userId: true,
            companyName: true,
          },
        },

        solicitation: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            status: true,
            openingDate: true,
            closingDate: true,
            currencyId: true,
          },
        },
      },
    });

    if (!existingBid) {
      return NextResponse.json(
        {
          success: false,
          error: "Bid not found",
        },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "ADMIN";

    const isVendorOwner =
      user.role === "VENDOR" &&
      existingBid.vendor.userId === user.id;

    const isOrganizationUser =
      user.role === "ORGANIZATION"
        ? await isOrganizationMember(
            existingBid.solicitation.organizationId,
            user.id
          )
        : false;

    if (!isAdmin && !isVendorOwner && !isOrganizationUser) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to update this bid",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      solicitationId,
      lotId,
      vendorId,
      submittedById,
      currencyId,
      bidNumber,
      title,
      summary,
      totalAmount,
      status,
      submittedAt,
      lockedAt,
      withdrawalReason,
    } = body;

    if (
      solicitationId !== undefined &&
      solicitationId !== existingBid.solicitationId &&
      !isAdmin
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators can move a bid to another solicitation",
        },
        { status: 403 }
      );
    }

    if (
      vendorId !== undefined &&
      vendorId !== existingBid.vendorId
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "A bid cannot be transferred to another vendor",
        },
        { status: 400 }
      );
    }

    if (
      submittedById !== undefined &&
      submittedById !== existingBid.submittedById &&
      !isAdmin
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators can change the submitting user",
        },
        { status: 403 }
      );
    }

    /*
     * Once a bid has entered the formal procurement process,
     * normal users cannot edit its substantive information.
     *
     * Use strings here instead of relying on legacy BidStatus
     * members such as COMPLIANT/NON_COMPLIANT.
     */
    const lockedStatuses = new Set([
      "SUBMITTED",
      "UNDER_REVIEW",
      "SHORTLISTED",
      "EVALUATED",
      "AWARDED",
    ]);

    if (lockedStatuses.has(String(existingBid.status))) {
      const administrativeStatusUpdate =
        isAdmin &&
        status !== undefined &&
        status !== existingBid.status;

      const administrativeWithdrawalUpdate =
        isAdmin && withdrawalReason !== undefined;

      if (
        !administrativeStatusUpdate &&
        !administrativeWithdrawalUpdate
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "This bid is locked and cannot be edited after submission",
          },
          { status: 409 }
        );
      }
    }

    if (
      status !== undefined &&
      !Object.values(BidStatus).includes(status as BidStatus)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid bid status",
        },
        { status: 400 }
      );
    }

    if (
      title !== undefined &&
      title !== null &&
      typeof title !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "title must be a string",
        },
        { status: 400 }
      );
    }

    if (
      summary !== undefined &&
      summary !== null &&
      typeof summary !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "summary must be a string",
        },
        { status: 400 }
      );
    }

    if (
      withdrawalReason !== undefined &&
      withdrawalReason !== null &&
      typeof withdrawalReason !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "withdrawalReason must be a string",
        },
        { status: 400 }
      );
    }

    if (
      lotId !== undefined &&
      lotId !== null &&
      typeof lotId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "lotId must be a valid string or null",
        },
        { status: 400 }
      );
    }

    const nextSolicitationId =
      solicitationId !== undefined
        ? solicitationId
        : existingBid.solicitationId;

    const solicitation = await prisma.solicitation.findUnique({
      where: {
        id: nextSolicitationId,
      },
      select: {
        id: true,
        title: true,
        organizationId: true,
        status: true,
        openingDate: true,
        closingDate: true,
        currencyId: true,
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

    const nextLotId =
      lotId !== undefined ? lotId : existingBid.lotId;

    if (nextLotId) {
      const lot = await prisma.lot.findUnique({
        where: {
          id: nextLotId,
        },
        select: {
          id: true,
          solicitationId: true,
          status: true,
        },
      });

      if (!lot) {
        return NextResponse.json(
          {
            success: false,
            error: "Lot not found",
          },
          { status: 404 }
        );
      }

      if (lot.solicitationId !== nextSolicitationId) {
        return NextResponse.json(
          {
            success: false,
            error:
              "The selected lot does not belong to the solicitation",
          },
          { status: 400 }
        );
      }
    }

    if (
      currencyId !== undefined &&
      currencyId !== null
    ) {
      const currency = await prisma.currency.findUnique({
        where: {
          id: currencyId,
        },
        select: {
          id: true,
          active: true,
        },
      });

      if (!currency) {
        return NextResponse.json(
          {
            success: false,
            error: "Currency not found",
          },
          { status: 404 }
        );
      }

      if (!currency.active) {
        return NextResponse.json(
          {
            success: false,
            error: "Selected currency is inactive",
          },
          { status: 400 }
        );
      }
    }

    if (
      bidNumber !== undefined &&
      (!bidNumber ||
        typeof bidNumber !== "string" ||
        !bidNumber.trim())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "bidNumber cannot be empty",
        },
        { status: 400 }
      );
    }

    if (
      bidNumber !== undefined &&
      bidNumber.trim() !== existingBid.bidNumber
    ) {
      const duplicateBid = await prisma.bid.findFirst({
        where: {
          bidNumber: bidNumber.trim(),
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

      if (duplicateBid) {
        return NextResponse.json(
          {
            success: false,
            error: "A bid with this bid number already exists",
          },
          { status: 409 }
        );
      }
    }

    let numericTotalAmount: number | undefined;

    if (totalAmount !== undefined) {
      numericTotalAmount = Number(totalAmount);

      if (
        !Number.isFinite(numericTotalAmount) ||
        numericTotalAmount < 0
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "totalAmount must be a valid non-negative number",
          },
          { status: 400 }
        );
      }
    }

    let parsedSubmittedAt: Date | null | undefined;

    if (submittedAt !== undefined) {
      if (submittedAt === null || submittedAt === "") {
        parsedSubmittedAt = null;
      } else {
        parsedSubmittedAt = new Date(submittedAt);

        if (Number.isNaN(parsedSubmittedAt.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid submittedAt",
            },
            { status: 400 }
          );
        }
      }
    }

    let parsedLockedAt: Date | null | undefined;

    if (lockedAt !== undefined) {
      if (lockedAt === null || lockedAt === "") {
        parsedLockedAt = null;
      } else {
        parsedLockedAt = new Date(lockedAt);

        if (Number.isNaN(parsedLockedAt.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid lockedAt",
            },
            { status: 400 }
          );
        }
      }
    }

    if (
      status === BidStatus.SUBMITTED &&
      !existingBid.submittedAt &&
      parsedSubmittedAt === undefined
    ) {
      parsedSubmittedAt = new Date();
    }

    if (
      status === BidStatus.SUBMITTED &&
      !existingBid.lockedAt &&
      parsedLockedAt === undefined
    ) {
      parsedLockedAt = new Date();
    }

    if (
      status === BidStatus.WITHDRAWN &&
      withdrawalReason === undefined &&
      !existingBid.withdrawalReason
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "withdrawalReason is required when withdrawing a bid",
        },
        { status: 400 }
      );
    }

    const updatedBid = await prisma.bid.update({
      where: {
        id,
      },

      data: {
        ...(solicitationId !== undefined && {
          solicitationId: nextSolicitationId,
        }),

        ...(lotId !== undefined && {
          lotId: nextLotId,
        }),

        ...(currencyId !== undefined && {
          currencyId,
        }),

        ...(bidNumber !== undefined && {
          bidNumber: bidNumber.trim(),
        }),

        ...(title !== undefined && {
          title: title === null ? null : title.trim(),
        }),

        ...(summary !== undefined && {
          summary: summary === null ? null : summary.trim(),
        }),

        ...(numericTotalAmount !== undefined && {
          totalAmount: numericTotalAmount,
        }),

        ...(status !== undefined && {
          status: status as BidStatus,
        }),

        ...(submittedById !== undefined &&
          isAdmin && {
            submittedById,
          }),

        ...(parsedSubmittedAt !== undefined && {
          submittedAt: parsedSubmittedAt,
        }),

        ...(parsedLockedAt !== undefined && {
          lockedAt: parsedLockedAt,
        }),

        ...(withdrawalReason !== undefined && {
          withdrawalReason:
            withdrawalReason === null
              ? null
              : withdrawalReason.trim(),
        }),
      },

      include: {
        solicitation: {
          select: {
            id: true,
            solicitationNumber: true,
            title: true,
            status: true,
            openingDate: true,
            closingDate: true,
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

        vendor: {
          select: {
            id: true,
            companyName: true,
            legalName: true,
          },
        },

        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    await prisma.applicationActivity.create({
      data: {
        bidId: updatedBid.id,
        performedById: user.id,
        action: "UPDATE",
        description: `Bid "${updatedBid.bidNumber}" was updated.`,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBid,
    });
  } catch (error) {
    console.error("PATCH /api/bids/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update bid",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSessionUser();
    const { id } = await context.params;

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const bid = await prisma.bid.findUnique({
      where: {
        id,
      },
      include: {
        vendor: {
          select: {
            id: true,
            userId: true,
            companyName: true,
          },
        },

        solicitation: {
          select: {
            id: true,
            title: true,
            organizationId: true,
            status: true,
          },
        },

        award: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!bid) {
      return NextResponse.json(
        {
          success: false,
          error: "Bid not found",
        },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "ADMIN";

    const isVendorOwner =
      user.role === "VENDOR" &&
      bid.vendor.userId === user.id;

    const isOrganizationUser =
      user.role === "ORGANIZATION"
        ? await isOrganizationMember(
            bid.solicitation.organizationId,
            user.id
          )
        : false;

    if (!isAdmin && !isVendorOwner && !isOrganizationUser) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have permission to delete this bid",
        },
        { status: 403 }
      );
    }

    if (bid.award) {
      return NextResponse.json(
        {
          success: false,
          error: "An awarded bid cannot be deleted",
        },
        { status: 409 }
      );
    }

    if (bid.status !== "DRAFT" && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: "Only draft bids can be deleted",
        },
        { status: 409 }
      );
    }

    await prisma.bid.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        message: "Bid deleted successfully",
      },
    });
  } catch (error) {
    console.error("DELETE /api/bids/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete bid",
      },
      { status: 500 }
    );
  }
}