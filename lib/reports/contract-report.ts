import { prisma } from "@/lib/prisma";
import { ContractStatus } from "@prisma/client";

export type ContractReportFilters = {
  organizationId?: string;
  vendorId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
};

export type ContractReportRow = {
  id: string;
  reference: string;
  solicitationId: string;
  solicitationReference: string;
  solicitationTitle: string;
  vendorId: string;
  vendorName: string;
  status: string;
  contractValue: number | null;
  startDate: Date | null;
  endDate: Date | null;
  createdAt: Date;
};

export type ContractReportSummary = {
  totalContracts: number;
  draftContracts: number;
  activeContracts: number;
  completedContracts: number;
  terminatedContracts: number;
  totalContractValue: number;
};

export type ContractReport = {
  generatedAt: Date;
  filters: ContractReportFilters;
  summary: ContractReportSummary;
  contracts: ContractReportRow[];
};

function parseContractStatus(
  status?: string,
): ContractStatus | undefined {
  if (!status) {
    return undefined;
  }

  const validStatuses = Object.values(ContractStatus);

  return validStatuses.includes(status as ContractStatus)
    ? (status as ContractStatus)
    : undefined;
}

export async function generateContractReport(
  filters: ContractReportFilters = {},
): Promise<ContractReport> {
  const contractStatus = parseContractStatus(filters.status);

  const contracts = await prisma.contract.findMany({
    where: {
      ...(filters.vendorId
        ? {
            vendorId: filters.vendorId,
          }
        : {}),

      ...(contractStatus
        ? {
            status: contractStatus,
          }
        : {}),

      ...(filters.organizationId
        ? {
            organizationId: filters.organizationId,
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
      contractNumber: true,
      vendorId: true,
      status: true,
      contractValue: true,
      startDate: true,
      endDate: true,
      createdAt: true,

      award: {
        select: {
          solicitationId: true,

          solicitation: {
            select: {
              solicitationNumber: true,
              title: true,
            },
          },
        },
      },

      vendor: {
        select: {
          companyName: true,
        },
      },
    },
  });

  const rows: ContractReportRow[] = contracts.map((contract) => ({
    id: contract.id,

    reference: contract.contractNumber,

    solicitationId: contract.award.solicitationId,

    solicitationReference:
      contract.award.solicitation.solicitationNumber,

    solicitationTitle:
      contract.award.solicitation.title,

    vendorId: contract.vendorId,

    vendorName: contract.vendor.companyName,

    status: String(contract.status),

    contractValue:
      contract.contractValue !== null
        ? Number(contract.contractValue)
        : null,

    startDate: contract.startDate,

    endDate: contract.endDate,

    createdAt: contract.createdAt,
  }));

  const totalContractValue = rows.reduce(
    (sum, row) => sum + (row.contractValue ?? 0),
    0,
  );

  const summary: ContractReportSummary = {
    totalContracts: rows.length,

    draftContracts: rows.filter(
      (row) => row.status === ContractStatus.DRAFT,
    ).length,

    activeContracts: rows.filter(
      (row) => row.status === ContractStatus.ACTIVE,
    ).length,

    completedContracts: rows.filter(
      (row) => row.status === ContractStatus.COMPLETED,
    ).length,

    terminatedContracts: rows.filter(
      (row) => row.status === ContractStatus.TERMINATED,
    ).length,

    totalContractValue,
  };

  return {
    generatedAt: new Date(),
    filters,
    summary,
    contracts: rows,
  };
}

export async function getContractReportSummary(
  filters: ContractReportFilters = {},
): Promise<ContractReportSummary> {
  const report = await generateContractReport(filters);

  return report.summary;
}