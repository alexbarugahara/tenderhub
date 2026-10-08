import { prisma } from "@/lib/prisma";

export type ProcurementReportFilters = {
  organizationId?: string;
  status?: string;
  procurementMethod?: string;
  categoryId?: string;
  startDate?: Date;
  endDate?: Date;
};

export type ProcurementReportRow = {
  id: string;
  reference: string;
  title: string;
  status: string;
  procurementMethod: string;
  openingDate: Date | null;
  closingDate: Date | null;
  createdAt: Date;
};

export type ProcurementReportSummary = {
  totalSolicitations: number;
  draftSolicitations: number;
  openSolicitations: number;
  closedSolicitations: number;
  awardedSolicitations: number;
  cancelledSolicitations: number;
};

export type ProcurementReport = {
  generatedAt: Date;
  filters: ProcurementReportFilters;
  summary: ProcurementReportSummary;
  solicitations: ProcurementReportRow[];
};

function isDateInRange(
  date: Date,
  startDate?: Date,
  endDate?: Date,
): boolean {
  if (startDate && date < startDate) {
    return false;
  }

  if (endDate && date > endDate) {
    return false;
  }

  return true;
}

export async function generateProcurementReport(
  filters: ProcurementReportFilters = {},
): Promise<ProcurementReport> {
  const solicitations = await prisma.solicitation.findMany({
    where: {
      ...(filters.organizationId
        ? {
            organizationId: filters.organizationId,
          }
        : {}),
      ...(filters.status
        ? {
            status: filters.status as never,
          }
        : {}),
      ...(filters.procurementMethod
        ? {
            procurementMethod:
              filters.procurementMethod as never,
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
      solicitationNumber: true,
      title: true,
      status: true,
      procurementMethod: true,
      publishedAt: true,
      createdAt: true,
    },
  });

  const rows: ProcurementReportRow[] = solicitations.map(
    (solicitation) => ({
      id: solicitation.id,
      reference: solicitation.solicitationNumber,
      title: solicitation.title,
      status: String(solicitation.status),
      procurementMethod: String(
        solicitation.procurementMethod,
      ),
      openingDate: solicitation.publishedAt,
      closingDate: null,
      createdAt: solicitation.createdAt,
    }),
  );

  const summary: ProcurementReportSummary = {
    totalSolicitations: rows.length,
    draftSolicitations: rows.filter(
      (row) => row.status === "DRAFT",
    ).length,
    openSolicitations: rows.filter(
      (row) =>
        row.status === "OPEN" ||
        row.status === "PUBLISHED",
    ).length,
    closedSolicitations: rows.filter(
      (row) =>
        row.status === "CLOSED" ||
        row.status === "CLOSED_FOR_BIDDING",
    ).length,
    awardedSolicitations: rows.filter(
      (row) => row.status === "AWARDED",
    ).length,
    cancelledSolicitations: rows.filter(
      (row) => row.status === "CANCELLED",
    ).length,
  };

  return {
    generatedAt: new Date(),
    filters,
    summary,
    solicitations: rows,
  };
}

export async function getProcurementReportSummary(
  filters: ProcurementReportFilters = {},
): Promise<ProcurementReportSummary> {
  const report = await generateProcurementReport(filters);

  return report.summary;
}

export function filterProcurementReportByDate(
  rows: ProcurementReportRow[],
  startDate?: Date,
  endDate?: Date,
): ProcurementReportRow[] {
  return rows.filter((row) =>
    isDateInRange(row.createdAt, startDate, endDate),
  );
}