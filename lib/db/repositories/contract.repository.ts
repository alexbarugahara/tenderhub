import {
  ContractPaymentStatus,
  ContractStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function findContractById(id: string) {
  return prisma.contract.findUnique({
    where: { id },
  });
}

export async function findContractWithDetails(id: string) {
  return prisma.contract.findUnique({
    where: { id },
    include: {
      organization: true,
      vendor: {
        include: {
          user: true,
          country: true,
        },
      },
      award: {
        include: {
          solicitation: true,
          lot: true,
          bid: true,
        },
      },
      documents: true,
      milestones: true,
      payments: {
        include: {
          currency: true,
        },
      },
    },
  });
}

export async function findContractByNumber(
  contractNumber: string,
) {
  return prisma.contract.findUnique({
    where: { contractNumber },
  });
}

export async function findContractByAwardId(
  awardId: string,
) {
  return prisma.contract.findFirst({
    where: { awardId },
    include: {
      organization: true,
      vendor: true,
      award: {
        include: {
          solicitation: true,
          lot: true,
          bid: true,
        },
      },
    },
  });
}

export async function createContract(
  data: Prisma.ContractCreateInput,
) {
  return prisma.contract.create({
    data,
  });
}

export async function updateContract(
  id: string,
  data: Prisma.ContractUpdateInput,
) {
  return prisma.contract.update({
    where: { id },
    data,
  });
}

export async function updateContractStatus(
  id: string,
  status: ContractStatus,
) {
  return prisma.contract.update({
    where: { id },
    data: { status },
  });
}

export async function activateContract(id: string) {
  return prisma.contract.update({
    where: { id },
    data: {
      status: ContractStatus.ACTIVE,
      startDate: new Date(),
    },
  });
}

export async function completeContract(id: string) {
  return prisma.contract.update({
    where: { id },
    data: {
      status: ContractStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
}

export async function terminateContract(id: string) {
  return prisma.contract.update({
    where: { id },
    data: {
      status: ContractStatus.TERMINATED,
      terminatedAt: new Date(),
    },
  });
}

export async function deleteContract(id: string) {
  return prisma.contract.delete({
    where: { id },
  });
}

interface ListContractsParams {
  organizationId?: string;
  vendorId?: string;
  awardId?: string;
  solicitationId?: string;
  status?: ContractStatus;
  search?: string;
  skip?: number;
  take?: number;
}

function buildContractWhere({
  organizationId,
  vendorId,
  awardId,
  solicitationId,
  status,
  search,
}: Omit<ListContractsParams, "skip" | "take">): Prisma.ContractWhereInput {
  return {
    ...(organizationId ? { organizationId } : {}),
    ...(vendorId ? { vendorId } : {}),
    ...(awardId ? { awardId } : {}),
    ...(solicitationId
      ? {
          award: {
            is: {
              solicitationId,
            },
          },
        }
      : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            {
              contractNumber: {
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
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };
}

export async function listContracts({
  organizationId,
  vendorId,
  awardId,
  solicitationId,
  status,
  search,
  skip = 0,
  take = 20,
}: ListContractsParams) {
  const where = buildContractWhere({
    organizationId,
    vendorId,
    awardId,
    solicitationId,
    status,
    search,
  });

  return prisma.contract.findMany({
    where,
    include: {
      organization: true,
      vendor: true,
      award: {
        include: {
          solicitation: true,
          lot: true,
          bid: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

export async function countContracts({
  organizationId,
  vendorId,
  awardId,
  solicitationId,
  status,
  search,
}: Omit<ListContractsParams, "skip" | "take">) {
  const where = buildContractWhere({
    organizationId,
    vendorId,
    awardId,
    solicitationId,
    status,
    search,
  });

  return prisma.contract.count({
    where,
  });
}

export async function addContractDocument(
  data: Prisma.ContractDocumentCreateInput,
) {
  return prisma.contractDocument.create({
    data,
  });
}

export async function updateContractDocument(
  id: string,
  data: Prisma.ContractDocumentUpdateInput,
) {
  return prisma.contractDocument.update({
    where: { id },
    data,
  });
}

export async function removeContractDocument(id: string) {
  return prisma.contractDocument.delete({
    where: { id },
  });
}

export async function addContractMilestone(
  data: Prisma.ContractMilestoneCreateInput,
) {
  return prisma.contractMilestone.create({
    data,
  });
}

export async function updateContractMilestone(
  id: string,
  data: Prisma.ContractMilestoneUpdateInput,
) {
  return prisma.contractMilestone.update({
    where: { id },
    data,
  });
}

export async function removeContractMilestone(id: string) {
  return prisma.contractMilestone.delete({
    where: { id },
  });
}

export async function addContractPayment(
  data: Prisma.ContractPaymentCreateInput,
) {
  return prisma.contractPayment.create({
    data,
  });
}

export async function createContractPayment(
  data: Prisma.ContractPaymentCreateInput,
) {
  return addContractPayment(data);
}

export async function updateContractPayment(
  id: string,
  data: Prisma.ContractPaymentUpdateInput,
) {
  return prisma.contractPayment.update({
    where: { id },
    data,
  });
}

export async function updateContractPaymentStatus(
  id: string,
  status: ContractPaymentStatus,
) {
  return prisma.contractPayment.update({
    where: { id },
    data: { status },
  });
}

export async function removeContractPayment(id: string) {
  return prisma.contractPayment.delete({
    where: { id },
  });
}

export async function deleteContractPayment(id: string) {
  return removeContractPayment(id);
}

export async function listContractPayments({
  contractId,
  status,
  skip = 0,
  take = 20,
}: {
  contractId: string;
  status?: ContractPaymentStatus;
  skip?: number;
  take?: number;
}) {
  return prisma.contractPayment.findMany({
    where: {
      contractId,
      ...(status ? { status } : {}),
    },
    include: {
      currency: true,
    },
    orderBy: [
      {
        paymentDate: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    skip,
    take,
  });
}

export async function countContractPayments({
  contractId,
  status,
}: {
  contractId: string;
  status?: ContractPaymentStatus;
}) {
  return prisma.contractPayment.count({
    where: {
      contractId,
      ...(status ? { status } : {}),
    },
  });
}

export async function findContractMilestoneById(id: string) {
  return prisma.contractMilestone.findUnique({
    where: { id },
  });
}

export async function findContractPaymentById(id: string) {
  return prisma.contractPayment.findUnique({
    where: { id },
    include: {
      currency: true,
    },
  });
}