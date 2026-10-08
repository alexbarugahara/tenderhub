import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    const organizationId = searchParams.get("organizationId");
    const solicitationId = searchParams.get("solicitationId");
    const vendorId = searchParams.get("vendorId");
    const status = searchParams.get("status");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const userId = session.user.id;
    const userRole = session.user.role;

    if (userRole !== "ADMIN" && userRole !== "ORGANIZATION") {
      return NextResponse.json(
        {
          success: false,
          error: "Only organization users and administrators can access bid reports",
        },
        { status: 403 }
      );
    }

    let allowedOrganizationIds: string[] | undefined;

    if (userRole === "ORGANIZATION") {
      const memberships = await prisma.organizationMember.findMany({
        where: {
          userId,
        },
        select: {
          organizationId: true,
        },
      });

      allowedOrganizationIds = memberships.map(
        (membership) => membership.organizationId
      );

      if (allowedOrganizationIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: {
            summary: {
              totalBids: 0,
              draft: 0,
              submitted: 0,
              underReview: 0,
              compliant: 0,
              nonCompliant: 0,
              shortlisted: 0,
              evaluated: 0,
              withdrawn: 0,
              rejected: 0,
              awarded: 0,
              totalBidValue: 0,
              averageBidValue: 0,
            },
            byStatus: [],
            bySolicitation: [],
            byVendor: [],
            bids: [],
          },
        });
      }
    }

    if (
      organizationId &&
      allowedOrganizationIds &&
      !allowedOrganizationIds.includes(organizationId)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You do not have access to this organization",
        },
        { status: 403 }
      );
    }

    const where: {
      solicitation?: {
        organizationId?: string | { in: string[] };
        id?: string;
      };
      vendorId?: string;
      status?:
        | "DRAFT"
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "COMPLIANT"
        | "NON_COMPLIANT"
        | "SHORTLISTED"
        | "EVALUATED"
        | "WITHDRAWN"
        | "REJECTED"
        | "AWARDED";
      submittedAt?: {
        gte?: Date;
        lte?: Date;
      };
    } = {
      solicitation: {},
    };

    if (organizationId) {
      where.solicitation = {
        organizationId,
      };
    } else if (allowedOrganizationIds) {
      where.solicitation = {
        organizationId: {
          in: allowedOrganizationIds,
        },
      };
    }

    if (solicitationId) {
      where.solicitation = {
        ...where.solicitation,
        id: solicitationId,
      };
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    if (status) {
      const validStatuses = [
        "DRAFT",
        "SUBMITTED",
        "UNDER_REVIEW",
        "COMPLIANT",
        "NON_COMPLIANT",
        "SHORTLISTED",
        "EVALUATED",
        "WITHDRAWN",
        "REJECTED",
        "AWARDED",
      ];

      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: "Invalid bid status",
          },
          { status: 400 }
        );
      }

      where.status = status as
        | "DRAFT"
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "COMPLIANT"
        | "NON_COMPLIANT"
        | "SHORTLISTED"
        | "EVALUATED"
        | "WITHDRAWN"
        | "REJECTED"
        | "AWARDED";
    }

    if (from || to) {
      where.submittedAt = {};

      if (from) {
        const fromDate = new Date(from);

        if (Number.isNaN(fromDate.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid from date",
            },
            { status: 400 }
          );
        }

        where.submittedAt.gte = fromDate;
      }

      if (to) {
        const toDate = new Date(to);

        if (Number.isNaN(toDate.getTime())) {
          return NextResponse.json(
            {
              success: false,
              error: "Invalid to date",
            },
            { status: 400 }
          );
        }

        toDate.setHours(23, 59, 59, 999);
        where.submittedAt.lte = toDate;
      }
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
            organizationId: true,
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
          },
        },
        vendor: {
          select: {
            id: true,
            companyName: true,
            legalName: true,
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
            symbol: true,
            decimals: true,
          },
        },
        evaluations: {
          select: {
            id: true,
            status: true,
            totalScore: true,
            evaluatorId: true,
            completedAt: true,
          },
        },
        award: {
          select: {
            id: true,
            awardNumber: true,
            status: true,
            awardAmount: true,
            awardDate: true,
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

    const totalBidValue = bids.reduce(
      (total, bid) => total + Number(bid.totalAmount),
      0
    );

    const averageBidValue =
      bids.length > 0 ? totalBidValue / bids.length : 0;

    const statusCounts = {
      DRAFT: 0,
      SUBMITTED: 0,
      UNDER_REVIEW: 0,
      COMPLIANT: 0,
      NON_COMPLIANT: 0,
      SHORTLISTED: 0,
      EVALUATED: 0,
      WITHDRAWN: 0,
      REJECTED: 0,
      AWARDED: 0,
    };

    bids.forEach((bid) => {
      statusCounts[bid.status] += 1;
    });

    const statusLabels: Record<string, string> = {
      DRAFT: "Draft",
      SUBMITTED: "Submitted",
      UNDER_REVIEW: "Under Review",
      COMPLIANT: "Compliant",
      NON_COMPLIANT: "Non-Compliant",
      SHORTLISTED: "Shortlisted",
      EVALUATED: "Evaluated",
      WITHDRAWN: "Withdrawn",
      REJECTED: "Rejected",
      AWARDED: "Awarded",
    };

    const byStatus = Object.entries(statusCounts)
      .map(([bidStatus, count]) => ({
        status: bidStatus,
        label: statusLabels[bidStatus] ?? bidStatus,
        count,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    const solicitationMap = new Map<
      string,
      {
        solicitationId: string;
        solicitationNumber: string;
        title: string;
        bidCount: number;
        totalBidValue: number;
      }
    >();

    bids.forEach((bid) => {
      const existing = solicitationMap.get(bid.solicitationId);

      if (existing) {
        existing.bidCount += 1;
        existing.totalBidValue += Number(bid.totalAmount);
      } else {
        solicitationMap.set(bid.solicitationId, {
          solicitationId: bid.solicitationId,
          solicitationNumber: bid.solicitation.solicitationNumber,
          title: bid.solicitation.title,
          bidCount: 1,
          totalBidValue: Number(bid.totalAmount),
        });
      }
    });

    const vendorMap = new Map<
      string,
      {
        vendorId: string;
        companyName: string;
        country: {
          id: string;
          code: string;
          name: string;
        } | null;
        bidCount: number;
        totalBidValue: number;
        awardedCount: number;
      }
    >();

    bids.forEach((bid) => {
      const existing = vendorMap.get(bid.vendorId);

      if (existing) {
        existing.bidCount += 1;
        existing.totalBidValue += Number(bid.totalAmount);

        if (bid.status === "AWARDED" || bid.award) {
          existing.awardedCount += 1;
        }
      } else {
        vendorMap.set(bid.vendorId, {
          vendorId: bid.vendorId,
          companyName: bid.vendor.companyName,
          country: bid.vendor.country,
          bidCount: 1,
          totalBidValue: Number(bid.totalAmount),
          awardedCount:
            bid.status === "AWARDED" || Boolean(bid.award) ? 1 : 0,
        });
      }
    });

    const reportBids = bids.map((bid) => ({
      id: bid.id,
      bidNumber: bid.bidNumber,
      title: bid.title,
      summary: bid.summary,
      status: bid.status,
      totalAmount: bid.totalAmount,
      submittedAt: bid.submittedAt,
      lockedAt: bid.lockedAt,
      createdAt: bid.createdAt,
      updatedAt: bid.updatedAt,
      solicitation: bid.solicitation,
      lot: bid.lot,
      vendor: bid.vendor,
      currency: bid.currency,
      evaluations: bid.evaluations,
      award: bid.award,
      documentCount: bid._count.documents,
      requirementResponseCount: bid._count.requirementResponses,
      evaluationCount: bid._count.evaluations,
      activityCount: bid._count.activities,
    }));

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalBids: bids.length,
          draft: statusCounts.DRAFT,
          submitted: statusCounts.SUBMITTED,
          underReview: statusCounts.UNDER_REVIEW,
          compliant: statusCounts.COMPLIANT,
          nonCompliant: statusCounts.NON_COMPLIANT,
          shortlisted: statusCounts.SHORTLISTED,
          evaluated: statusCounts.EVALUATED,
          withdrawn: statusCounts.WITHDRAWN,
          rejected: statusCounts.REJECTED,
          awarded: statusCounts.AWARDED,
          totalBidValue,
          averageBidValue,
        },
        byStatus,
        bySolicitation: Array.from(solicitationMap.values()).sort(
          (a, b) => b.bidCount - a.bidCount
        ),
        byVendor: Array.from(vendorMap.values()).sort(
          (a, b) => b.bidCount - a.bidCount
        ),
        bids: reportBids,
      },
    });
  } catch (error) {
    console.error("Bid report error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate bid report",
      },
      { status: 500 }
    );
  }
}