import { NextRequest, NextResponse } from "next/server";
import { BidStatus, Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

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
    const session = await auth();

    const { searchParams } = new URL(request.url);

    const solicitationId = searchParams.get("solicitationId");
    const lotId = searchParams.get("lotId");
    const vendorId = searchParams.get("vendorId");
    const submittedById = searchParams.get("submittedById");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    if (!session?.user?.id && !solicitationId) {
      return NextResponse.json(
        {
          success: false,
          error: "solicitationId is required",
        },
        { status: 400 }
      );
    }

    if (
      status &&
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

    const where: Prisma.BidWhereInput = {};

    if (solicitationId) {
      where.solicitationId = solicitationId;
    }

    if (lotId) {
      where.lotId = lotId;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (submittedById) {
      where.submittedById = submittedById;
    }

    if (status) {
      where.status = status as BidStatus;
    }

    if (search) {
      where.OR = [
        {
          bidNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          title: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          summary: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    /*
     * Public users may only see bids that have progressed beyond DRAFT.
     * Authenticated users can retrieve the full bid data subject to
     * the filters supplied above.
     */
    if (!session?.user?.id) {
      where.status = {
        not: BidStatus.DRAFT,
      };
    }

    const bids = await prisma.bid.findMany({
      where,
      include: {
        solicitation: {
          select: {
            id: true,
            solicitationNumber: true,
            title: true,
            status: true,
            openingDate: true,
            closingDate: true,
            organization: {
              select: {
                id: true,
                name: true,
                legalName: true,
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
            estimatedValue: true,
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
        documents: {
          orderBy: {
            uploadedAt: "desc",
          },
        },
        requirementResponses: {
          include: {
            requirement: {
              select: {
                id: true,
                type: true,
                title: true,
                isMandatory: true,
                sortOrder: true,
              },
            },
          },
          orderBy: {
            requirement: {
              sortOrder: "asc",
            },
          },
        },
        evaluations: {
          include: {
            evaluator: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            scores: {
              include: {
                criterion: {
                  select: {
                    id: true,
                    name: true,
                    weight: true,
                    maxScore: true,
                    sortOrder: true,
                  },
                },
              },
            },
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
        _count: {
          select: {
            documents: true,
            requirementResponses: true,
            evaluations: true,
            activities: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!session?.user?.id) {
      const publicBids = bids.map((bid) => ({
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
        vendor: bid.vendor,
        currency: bid.currency,
      }));

      return NextResponse.json({
        success: true,
        data: publicBids,
        count: publicBids.length,
      });
    }

    return NextResponse.json({
      success: true,
      data: bids,
      count: bids.length,
    });
  } catch (error) {
    console.error("GET /api/bids error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch bids",
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

    if (user.role !== "VENDOR") {
      return NextResponse.json(
        {
          success: false,
          error: "Only vendor users can create bids",
        },
        { status: 403 }
      );
    }

    let body: {
      solicitationId?: unknown;
      lotId?: unknown;
      vendorId?: unknown;
      submittedById?: unknown;
      currencyId?: unknown;
      bidNumber?: unknown;
      title?: unknown;
      summary?: unknown;
      totalAmount?: unknown;
      status?: unknown;
    };

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON request body",
        },
        { status: 400 }
      );
    }

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

    if (!lotId || typeof lotId !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "lotId is required",
        },
        { status: 400 }
      );
    }

    if (
      !bidNumber ||
      typeof bidNumber !== "string" ||
      !bidNumber.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "bidNumber is required",
        },
        { status: 400 }
      );
    }

    if (
      totalAmount === undefined ||
      totalAmount === null
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "totalAmount is required",
        },
        { status: 400 }
      );
    }

    const numericTotalAmount = Number(totalAmount);

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
      status !== undefined &&
      !Object.values(BidStatus).includes(
        status as BidStatus
      )
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
      currencyId !== undefined &&
      currencyId !== null &&
      typeof currencyId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "currencyId must be a string",
        },
        { status: 400 }
      );
    }

    if (
      vendorId !== undefined &&
      vendorId !== null &&
      typeof vendorId !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "vendorId must be a string",
        },
        { status: 400 }
      );
    }

    if (
      submittedById !== undefined &&
      submittedById !== null &&
      typeof submittedById !== "string"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "submittedById must be a string",
        },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: {
        userId: user.id,
      },
      select: {
        id: true,
        userId: true,
        companyName: true,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Vendor profile not found. Complete your vendor profile before creating a bid.",
        },
        { status: 400 }
      );
    }

    if (
      vendorId !== undefined &&
      vendorId !== null &&
      vendorId !== vendor.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You can only create bids for your own vendor account",
        },
        { status: 403 }
      );
    }

    if (
      submittedById !== undefined &&
      submittedById !== null &&
      submittedById !== user.id
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You can only create bids on behalf of your own user account",
        },
        { status: 403 }
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
          status: true,
          openingDate: true,
          closingDate: true,
          organizationId: true,
          currencyId: true,
          bidSecurityRequired: true,
          bidSecurityAmount: true,
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

    if (
      solicitation.status !== "OPEN" &&
      solicitation.status !== "PUBLISHED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bids can only be created for published or open solicitations",
        },
        { status: 400 }
      );
    }

    const now = new Date();

    if (
      solicitation.openingDate &&
      now < solicitation.openingDate
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bidding has not opened for this solicitation",
        },
        { status: 400 }
      );
    }

    if (
      solicitation.closingDate &&
      now > solicitation.closingDate
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The bidding period for this solicitation has closed",
        },
        { status: 400 }
      );
    }

    const lot = await prisma.lot.findUnique({
      where: {
        id: lotId,
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
            "The selected lot does not belong to this solicitation",
        },
        { status: 400 }
      );
    }

    if (lot.status !== "OPEN") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Bids cannot be created for a closed or unavailable lot",
        },
        { status: 400 }
      );
    }

    let selectedCurrencyId:
      | string
      | null
      | undefined = currencyId as
      | string
      | null
      | undefined;

    if (
      selectedCurrencyId !== undefined &&
      selectedCurrencyId !== null
    ) {
      const currency = await prisma.currency.findUnique({
        where: {
          id: selectedCurrencyId,
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
          { status: 400 }
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
    } else {
      selectedCurrencyId = solicitation.currencyId;
    }

    const existingBid = await prisma.bid.findFirst({
      where: {
        vendorId: vendor.id,
        solicitationId,
        lotId,
      },
      select: {
        id: true,
        bidNumber: true,
        status: true,
      },
    });

    if (existingBid) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Your vendor account already has a bid for this solicitation and lot",
          existingBid,
        },
        { status: 409 }
      );
    }

    const duplicateBidNumber =
      await prisma.bid.findUnique({
        where: {
          bidNumber: bidNumber.trim(),
        },
        select: {
          id: true,
        },
      });

    if (duplicateBidNumber) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A bid with this bid number already exists",
        },
        { status: 409 }
      );
    }

    const bid = await prisma.bid.create({
      data: {
        solicitationId,
        lotId,
        vendorId: vendor.id,
        submittedById: user.id,
        currencyId: selectedCurrencyId,
        bidNumber: bidNumber.trim(),
        title:
          title === undefined || title === null
            ? null
            : title.trim(),
        summary:
          summary === undefined || summary === null
            ? null
            : summary.trim(),
        totalAmount: numericTotalAmount,
        status:
          status === undefined
            ? BidStatus.DRAFT
            : (status as BidStatus),
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
        bidId: bid.id,
        performedById: user.id,
        action: "CREATE",
        description: `Bid "${bid.bidNumber}" was created as a draft.`,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: bid,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/bids error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create bid",
      },
      { status: 500 }
    );
  }
}
