import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { AwardStatus } from "@prisma/client";

async function getSessionUser() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
    },
  });

  return user;
}

export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);

    const solicitationId = searchParams.get("solicitationId");
    const lotId = searchParams.get("lotId");
    const bidId = searchParams.get("bidId");
    const vendorId = searchParams.get("vendorId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (solicitationId) {
      where.solicitationId = solicitationId;
    }

    if (lotId) {
      where.lotId = lotId;
    }

    if (bidId) {
      where.bidId = bidId;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (status) {
      if (
        !Object.values(AwardStatus).includes(
          status as AwardStatus
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid award status",
          },
          { status: 400 }
        );
      }

      where.status = status;
    }

    if (search) {
      where.OR = [
        {
          awardNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          notes: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (user.role === "VENDOR") {
      const vendor = await prisma.vendor.findUnique({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
        },
      });

      where.vendorId = vendor?.id ?? "__NO_VENDOR__";
    }

    if (user.role === "ORGANIZATION") {
      const memberships =
        await prisma.organizationMember.findMany({
          where: {
            userId: user.id,
          },
          select: {
            organizationId: true,
          },
        });

      const organizationIds = memberships.map(
        (membership) => membership.organizationId
      );

      if (organizationIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
        });
      }

      where.solicitation = {
        organizationId: {
          in: organizationIds,
        },
      };
    }

    const awards = await prisma.award.findMany({
      where,
      include: {
        solicitation: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                legalName: true,
              },
            },
            procurement: {
              select: {
                id: true,
                title: true,
                referenceNumber: true,
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
            number: true,
            title: true,
            description: true,
            estimatedValue: true,
            status: true,
          },
        },
        bid: {
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                legalName: true,
                email: true,
                phone: true,
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
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
            legalName: true,
            email: true,
            phone: true,
            website: true,
            country: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
          },
        },
        contract: {
          select: {
            id: true,
            contractNumber: true,
            title: true,
            status: true,
            contractValue: true,
            startDate: true,
            endDate: true,
          },
        },
      },
      orderBy: {
        awardDate: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: awards,
    });
  } catch (error) {
    console.error("GET /api/awards error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch awards",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    if (
      user.role !== "ADMIN" &&
      user.role !== "ORGANIZATION"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only administrators and organization users can create awards",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const {
      solicitationId,
      lotId,
      bidId,
      vendorId,
      awardNumber,
      status,
      awardAmount,
      awardDate,
      notes,
    } = body;

    if (
      !solicitationId ||
      typeof solicitationId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "solicitationId is required",
        },
        { status: 400 }
      );
    }

    if (!bidId || typeof bidId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "bidId is required",
        },
        { status: 400 }
      );
    }

    if (!vendorId || typeof vendorId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "vendorId is required",
        },
        { status: 400 }
      );
    }

    if (
      !awardNumber ||
      typeof awardNumber !== "string" ||
      !awardNumber.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "awardNumber is required",
        },
        { status: 400 }
      );
    }

    if (
      awardAmount === undefined ||
      awardAmount === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "awardAmount is required",
        },
        { status: 400 }
      );
    }

    const numericAwardAmount = Number(awardAmount);

    if (
      !Number.isFinite(numericAwardAmount) ||
      numericAwardAmount < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "awardAmount must be a valid non-negative number",
        },
        { status: 400 }
      );
    }

    if (
      status !== undefined &&
      !Object.values(AwardStatus).includes(
        status as AwardStatus
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid award status",
        },
        { status: 400 }
      );
    }

    const solicitation =
      await prisma.solicitation.findUnique({
        where: {
          id: solicitationId,
        },
        select: {
          id: true,
          title: true,
          organizationId: true,
          status: true,
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

    if (user.role === "ORGANIZATION") {
      const membership =
        await prisma.organizationMember.findFirst({
          where: {
            organizationId:
              solicitation.organizationId,
            userId: user.id,
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
              "You do not have access to this organization's solicitation",
          },
          { status: 403 }
        );
      }
    }

    const bid = await prisma.bid.findUnique({
      where: {
        id: bidId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
          },
        },
        solicitation: {
          select: {
            id: true,
            organizationId: true,
            title: true,
          },
        },
        lot: {
          select: {
            id: true,
            solicitationId: true,
            number: true,
            title: true,
            status: true,
          },
        },
        award: {
          select: {
            id: true,
            awardNumber: true,
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

    if (bid.solicitationId !== solicitationId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The bid does not belong to the selected solicitation",
        },
        { status: 400 }
      );
    }

    if (bid.vendorId !== vendorId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected vendor does not own the bid",
        },
        { status: 400 }
      );
    }

    if (bid.award) {
      return NextResponse.json(
        {
          success: false,
          error: "This bid already has an award",
        },
        { status: 409 }
      );
    }

    if (
      bid.status !== "EVALUATED" &&
      bid.status !== "SHORTLISTED" &&
      bid.status !== "COMPLIANT"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Only evaluated, shortlisted, or compliant bids can receive an award",
        },
        { status: 409 }
      );
    }

    let selectedLotId: string | null | undefined;

    if (lotId !== undefined && lotId !== null && lotId !== "") {
      if (typeof lotId !== "string") {
        return NextResponse.json(
          {
            success: false,
            error: "lotId must be a valid string",
          },
          { status: 400 }
        );
      }

      selectedLotId = lotId;
    } else {
      selectedLotId = bid.lotId;
    }

    if (!selectedLotId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A lot is required to create an award",
        },
        { status: 400 }
      );
    }

    const lot = await prisma.lot.findUnique({
      where: {
        id: selectedLotId,
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

    if (lot.solicitationId !== solicitationId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected lot does not belong to the solicitation",
        },
        { status: 400 }
      );
    }

    if (lot.status === "CANCELLED") {
      return NextResponse.json(
        {
          success: false,
          error:
            "A cancelled lot cannot receive an award",
        },
        { status: 409 }
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: {
        id: vendorId,
      },
      select: {
        id: true,
        companyName: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: "Vendor not found",
        },
        { status: 404 }
      );
    }

    const existingAwardNumber =
      await prisma.award.findUnique({
        where: {
          awardNumber: awardNumber.trim(),
        },
        select: {
          id: true,
        },
      });

    if (existingAwardNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            "An award with this award number already exists",
        },
        { status: 409 }
      );
    }

    let parsedAwardDate: Date | undefined;

    if (
      awardDate !== undefined &&
      awardDate !== null &&
      awardDate !== ""
    ) {
      parsedAwardDate = new Date(awardDate);

      if (Number.isNaN(parsedAwardDate.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid awardDate",
          },
          { status: 400 }
        );
      }
    }

    const award = await prisma.award.create({
      data: {
        solicitationId,
        lotId: selectedLotId,
        bidId,
        vendorId,
        awardNumber: awardNumber.trim(),
        status:
          status !== undefined
            ? (status as AwardStatus)
            : AwardStatus.PENDING,
        awardAmount: numericAwardAmount,
        ...(parsedAwardDate && {
          awardDate: parsedAwardDate,
        }),
        notes:
          notes !== undefined
            ? notes
            : null,
      },
      include: {
        solicitation: {
          select: {
            id: true,
            solicitationNumber: true,
            title: true,
            organizationId: true,
          },
        },
        lot: {
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
        bid: {
          select: {
            id: true,
            bidNumber: true,
            title: true,
            totalAmount: true,
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
            legalName: true,
            email: true,
          },
        },
      },
    });

    await prisma.applicationActivity.create({
      data: {
        bidId,
        performedById: user.id,
        action: "AWARD_CREATED",
        description: `Award "${award.awardNumber}" was created for bid "${bid.bidNumber}".`,
      },
    });

    const vendorUser = await prisma.vendor.findUnique({
      where: {
        id: vendorId,
      },
      select: {
        userId: true,
      },
    });

    await prisma.notification.create({
      data: {
        userId: vendorUser?.userId ?? user.id,
        title: "Award notification",
        message: `An award has been created for your bid "${bid.bidNumber}" for "${solicitation.title}".`,
        type: "AWARD_NOTIFICATION",
        link: `/dashboard/vendor/awards/${award.id}`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: award,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/awards error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create award",
      },
      { status: 500 }
    );
  }
}