import { prisma } from "@/lib/prisma";

export type EvaluationReportFilters = {
  organizationId?: string;
  solicitationId?: string;
  bidId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
};

export type EvaluationReportRow = {
  id: string;
  solicitationId: string;
  solicitationReference: string;
  solicitationTitle: string;
  bidId: string;
  bidReference: string;
  vendorId: string;
  vendorName: string;
  status: string;
  totalScore: number | null;
  createdAt: Date;
  completedAt: Date | null;
};

export type EvaluationReportSummary = {
  totalEvaluations: number;
  draftEvaluations: number;
  inProgressEvaluations: number;
  completedEvaluations: number;
  cancelledEvaluations: number;
  averageScore: number | null;
};

export type EvaluationReport = {
  generatedAt: Date;
  filters: EvaluationReportFilters;
  summary: EvaluationReportSummary;
  evaluations: EvaluationReportRow[];
};

export async function generateEvaluationReport(
  filters: EvaluationReportFilters = {},
): Promise<EvaluationReport> {
  const evaluations = await prisma.evaluation.findMany({
    where: {
      ...(filters.bidId
        ? {
            bidId: filters.bidId,
          }
        : {}),
      ...(filters.solicitationId
        ? {
            bid: {
              solicitationId: filters.solicitationId,
            },
          }
        : {}),
      ...(filters.organizationId
        ? {
            bid: {
              solicitation: {
                organizationId: filters.organizationId,
              },
            },
          }
        : {}),
      ...(filters.status
        ? {
            status: filters.status as never,
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
      bidId: true,
      status: true,
      totalScore: true,
      createdAt: true,
      completedAt: true,
      bid: {
        select: {
          bidNumber: true,
          vendorId: true,
          vendor: {
            select: {
              companyName: true,
            },
          },
          solicitationId: true,
          solicitation: {
            select: {
              solicitationNumber: true,
              title: true,
            },
          },
        },
      },
    },
  });

  const rows: EvaluationReportRow[] = evaluations.map(
    (evaluation) => ({
      id: evaluation.id,
      solicitationId: evaluation.bid.solicitationId,
      solicitationReference:
        evaluation.bid.solicitation.solicitationNumber,
      solicitationTitle:
        evaluation.bid.solicitation.title,
      bidId: evaluation.bidId,
      bidReference: evaluation.bid.bidNumber,
      vendorId: evaluation.bid.vendorId,
      vendorName: evaluation.bid.vendor.companyName,
      status: String(evaluation.status),
      totalScore:
        evaluation.totalScore !== null
          ? Number(evaluation.totalScore)
          : null,
      createdAt: evaluation.createdAt,
      completedAt: evaluation.completedAt,
    }),
  );

  const scoredEvaluations = rows.filter(
    (row) => row.totalScore !== null,
  );

  const averageScore =
    scoredEvaluations.length > 0
      ? scoredEvaluations.reduce(
          (sum, row) => sum + (row.totalScore ?? 0),
          0,
        ) / scoredEvaluations.length
      : null;

  const summary: EvaluationReportSummary = {
    totalEvaluations: rows.length,
    draftEvaluations: rows.filter(
      (row) => row.status === "DRAFT",
    ).length,
    inProgressEvaluations: rows.filter(
      (row) => row.status === "IN_PROGRESS",
    ).length,
    completedEvaluations: rows.filter(
      (row) => row.status === "COMPLETED",
    ).length,
    cancelledEvaluations: rows.filter(
      (row) => row.status === "CANCELLED",
    ).length,
    averageScore,
  };

  return {
    generatedAt: new Date(),
    filters,
    summary,
    evaluations: rows,
  };
}

export async function getEvaluationReportSummary(
  filters: EvaluationReportFilters = {},
): Promise<EvaluationReportSummary> {
  const report = await generateEvaluationReport(filters);

  return report.summary;
}