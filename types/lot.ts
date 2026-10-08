import type { Prisma } from "@prisma/client";

export type Lot = Prisma.LotGetPayload<{}>;

export type LotWithRelations =
  Prisma.LotGetPayload<{
    include: {
      solicitation: true;
      bids: true;
    };
  }>;

export type LotCreateInput =
  Prisma.LotCreateInput;

export type LotUpdateInput =
  Prisma.LotUpdateInput;

export type LotWhereInput =
  Prisma.LotWhereInput;

export type LotOrderByInput =
  Prisma.LotOrderByWithRelationInput;

export type LotListItem =
  Prisma.LotGetPayload<{
    select: {
      id: true;
      solicitationId: true;
      lotNumber: true;
      title: true;
      description: true;
      status: true;
      estimatedValue: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;