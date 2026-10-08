import type { Prisma } from "@prisma/client";

export type Award =
  Prisma.AwardGetPayload<{}>;

export type AwardWithRelations =
  Prisma.AwardGetPayload<{
    include: {
      solicitation: true;
      bid: true;
      vendor: true;
    };
  }>;

export type AwardCreateInput =
  Prisma.AwardCreateInput;

export type AwardUpdateInput =
  Prisma.AwardUpdateInput;

export type AwardWhereInput =
  Prisma.AwardWhereInput;

export type AwardOrderByInput =
  Prisma.AwardOrderByWithRelationInput;

export type AwardListItem =
  Prisma.AwardGetPayload<{
    select: {
      id: true;
      awardNumber: true;
      solicitationId: true;
      bidId: true;
      vendorId: true;
      awardAmount: true;
      awardDate: true;
      status: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;