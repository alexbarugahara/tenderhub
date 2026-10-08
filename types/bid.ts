import type { Prisma } from "@prisma/client";

export type Bid = Prisma.BidGetPayload<{}>;

export type BidWithRelations =
  Prisma.BidGetPayload<{
    include: {
      vendor: true;
      solicitation: true;
      lot: true;
    };
  }>;

export type BidCreateInput =
  Prisma.BidCreateInput;

export type BidUpdateInput =
  Prisma.BidUpdateInput;

export type BidWhereInput =
  Prisma.BidWhereInput;

export type BidOrderByInput =
  Prisma.BidOrderByWithRelationInput;

export type BidListItem =
  Prisma.BidGetPayload<{
    select: {
      id: true;
      bidNumber: true;
      vendorId: true;
      solicitationId: true;
      lotId: true;
      totalAmount: true;
      status: true;
      submittedAt: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;