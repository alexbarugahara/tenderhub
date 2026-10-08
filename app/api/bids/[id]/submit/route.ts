import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { BidStatus } from "@prisma/client";

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

export async function POST(
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

    if (user.role !== "VENDOR") {
      return NextResponse.json(
        {
          success: false,
          error: "Only vendors can submit bids",
        },
        { status: 403 }
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
          include: {
            requirements: {
              where: {
                isMandatory: true,
              },
              select: {
                id: true,
                title: true,
                type: true,
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
        documents: {
          select: {
            id: true,
            name: true,
            category: true,
            fileUrl: true,
            status: true,
          },
        },
        requirementResponses: {
          select: {
            id: true,
            requirementId: true,
            response: true,
            booleanValue: true,
            numericValue: true,
            evidenceUrl: true,
            compliant: true,
          },
        },
        currency: {
          select: {
            id: true,
            code: true,
            name: true,
            symbol: true,
            decimals: true,
            active: true,
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

    if (bid.vendor.userId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error:
            "You do not have permission to submit this bid",
        },
        { status: 403 }
      );
    }

    if (bid.status !== BidStatus.DRAFT) {
      return NextResponse.json(
        {
          success: false,
          error: `Only draft bids can be submitted. Current status: ${bid.status}`,
        },
        { status: 409 }
      );
    }

    const solicitation = bid.solicitation;

    if (
      solicitation.status !== "OPEN" &&
      solicitation.status !== "PUBLISHED"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This solicitation is not currently accepting bid submissions",
        },
        { status: 409 }
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
          error: "The solicitation has not opened yet",
        },
        { status: 409 }
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
            "The bid submission deadline has passed",
        },
        { status: 409 }
      );
    }

    if (
      bid.lot &&
      bid.lot.status !== "OPEN"
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "The selected lot is no longer open for bidding",
        },
        { status: 409 }
      );
    }

    if (
      bid.currencyId &&
      bid.currency &&
      !bid.currency.active
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "The bid currency is inactive",
        },
        { status: 409 }
      );
    }

    if (
      !bid.bidNumber ||
      !bid.bidNumber.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A bid number is required before submission",
        },
        { status: 400 }
      );
    }

    if (
      !bid.totalAmount ||
      Number(bid.totalAmount) < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A valid non-negative total bid amount is required",
        },
        { status: 400 }
      );
    }

    if (
      !bid.title ||
      !bid.title.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "A bid title is required before submission",
        },
        { status: 400 }
      );
    }

    const missingMandatoryRequirements =
      solicitation.requirements.filter(
        (requirement) => {
          const response =
            bid.requirementResponses.find(
              (item) =>
                item.requirementId === requirement.id
            );

          if (!response) {
            return true;
          }

          const hasResponseText =
            typeof response.response === "string" &&
            response.response.trim().length > 0;

          const hasBooleanValue =
            response.booleanValue !== null &&
            response.booleanValue !== undefined;

          const hasNumericValue =
            response.numericValue !== null &&
            response.numericValue !== undefined;

          const hasEvidence =
            typeof response.evidenceUrl === "string" &&
            response.evidenceUrl.trim().length > 0;

          return !(
            hasResponseText ||
            hasBooleanValue ||
            hasNumericValue ||
            hasEvidence
          );
        }
      );

    if (
      missingMandatoryRequirements.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "All mandatory solicitation requirements must be answered before submitting the bid",
          missingRequirements:
            missingMandatoryRequirements.map(
              (requirement) => ({
                id: requirement.id,
                title: requirement.title,
                type: requirement.type,
              })
            ),
        },
        { status: 400 }
      );
    }

    const requiredBidDocuments =
      bid.solicitation.applicationFeeRequired
        ? ["FINANCIAL_PROPOSAL"]
        : [];

    const missingRequiredDocuments =
      requiredBidDocuments.filter(
        (category) =>
          !bid.documents.some(
            (document) =>
              document.category === category &&
              document.status !== "REJECTED" &&
              document.fileUrl
          )
      );

    if (
      missingRequiredDocuments.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Required bid documents are missing",
          missingDocuments:
            missingRequiredDocuments,
        },
        { status: 400 }
      );
    }

    const submittedAt = new Date();
    const lockedAt = new Date();

    const result =
      await prisma.$transaction(
        async (tx) => {
          const updatedBid =
            await tx.bid.update({
              where: {
                id: bid.id,
              },
              data: {
                status: BidStatus.SUBMITTED,
                submittedAt,
                lockedAt,
                withdrawalReason: null,
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

          await tx.applicationActivity.create({
            data: {
              bidId: bid.id,
              performedById: user.id,
              action: "SUBMIT",
              description: `Bid "${bid.bidNumber}" was submitted.`,
            },
          });

          await tx.notification.create({
            data: {
              userId: user.id,
              title: "Bid submitted",
              message: `Your bid "${bid.bidNumber}" has been successfully submitted for "${solicitation.title}".`,
              type: "BID_SUBMITTED",
              link: `/dashboard/vendor/bids/${bid.id}`,
            },
          });

          return updatedBid;
        }
      );

    return NextResponse.json({
      success: true,
      message: "Bid submitted successfully",
      data: result,
    });
  } catch (error) {
    console.error(
      "POST /api/bids/[id]/submit error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Failed to submit bid",
      },
      { status: 500 }
    );
  }
}
