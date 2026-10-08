import { prisma } from "@/lib/prisma";

export type BidReportFilters = {
  organizationId?: string;
  vendorId?: string;
  solicitationId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
};

export type BidReportRow = {
  id: string;
  reference: string;
  solicitationId: string;
  solicitationReference: string;
  solicitationTitle: string;
  vendorId: string;
  vendorName: string;
  status: string;
  submittedAt: Date | null;
  createdAt: Date;
};

export type BidReportSummary = {
  totalBids: number;
  draftBids: number;
  submittedBids: number;
  underEvaluationBids: number;
  awardedBids: number;
  rejectedBids: number;
  withdrawnBids: number;
};

export type BidReport = {
  generatedAt: Date;
  filters: BidReportFilters;
  summary: BidReportSummary;
  bids: BidReportRow[];
};

export async function generateBidReport(
  filters: BidReportFilters = {},
): Promise<BidReport> {
  const bids = await prisma.bid.findMany({
    where: {
      ...(filters.vendorId
        ? {
            vendorId: filters.vendorId,
          }
        : {}),
      ...(filters.solicitationId
        ? {
            solicitationId: filters.solicitationId,
          }
        : {}),
      ...(filters.status
        ? {
            status: filters.status as never,
          }
        : {}),
      ...(filters.organizationId
        ? {
            solicitation: {
              organizationId: filters.organizationId,
            },
          }
        : {}),
      ...(filters.startDate || filters.endDate
        ? {
            createdAt: {
              ...(filters.startDate
                ? {
                    gte: filters.startDate,
                  }
                : {}),
              ...(filters.endDate
                ? {
                    lte: filters.endDate,
                  }
                : {}),
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      bidNumber: true,
      solicitationId: true,
      vendorId: true,
      status: true,
      submittedAt: true,
      createdAt: true,
      solicitation: {
        select: {
          solicitationNumber: true,
          title: true,
        },
      },
      vendor: {
        select: {
          companyName: true,
        },
      },
    },
  });

  const rows: BidReportRow[] = bids.map((bid) => ({
    id: bid.id,
    reference: bid.bidNumber,
    solicitationId: bid.solicitationId,
    solicitationReference:
      bid.solicitation.solicitationNumber,
    solicitationTitle: bid.solicitation.title,
    vendorId: bid.vendorId,
    vendorName: bid.vendor.companyName,
    status: String(bid.status),
    submittedAt: bid.submittedAt,
    createdAt: bid.createdAt,
  }));

  const summary: BidReportSummary = {
    totalBids: rows.length,
    draftBids: rows.filter(
      (row) => row.status === "DRAFT",
    ).length,
    submittedBids: rows.filter(
      (row) => row.status === "SUBMITTED",
    ).length,
    underEvaluationBids: rows.filter(
      (row) => row.status === "UNDER_REVIEW",
    ).length,
    awardedBids: rows.filter(
      (row) => row.status === "AWARDED",
    ).length,
    rejectedBids: rows.filter(
      (row) => row.status === "REJECTED",
    ).length,
    withdrawnBids: rows.filter(
      (row) => row.status === "WITHDRAWN",
    ).length,
  };

  return {
    generatedAt: new Date(),
    filters,
    summary,
    bids: rows,
  };
}

export async function getBidReportSummary(
  filters: BidReportFilters = {},
): Promise<BidReportSummary> {
  const report = await generateBidReport(filters);

  return report.summary;
}