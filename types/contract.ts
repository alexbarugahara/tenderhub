import type { Prisma } from "@prisma/client";

export type Contract =
  Prisma.ContractGetPayload<{}>;

export type ContractWithRelations =
  Prisma.ContractGetPayload<{
    include: {
      award: true;
      vendor: true;
      organization: true;
      milestones: true;
      payments: true;
    };
  }>;

export type ContractCreateInput =
  Prisma.ContractCreateInput;

export type ContractUpdateInput =
  Prisma.ContractUpdateInput;

export type ContractWhereInput =
  Prisma.ContractWhereInput;

export type ContractOrderByInput =
  Prisma.ContractOrderByWithRelationInput;

export type ContractListItem =
  Prisma.ContractGetPayload<{
    select: {
      id: true;
      contractNumber: true;
      title: true;
      description: true;
      contractValue: true;
      status: true;
      startDate: true;
      endDate: true;
      signedAt: true;
      completedAt: true;
      terminatedAt: true;
      terminationReason: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;