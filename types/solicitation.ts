import type { Prisma } from "@prisma/client";

export type Solicitation = Prisma.SolicitationGetPayload<{}>;

export type SolicitationWithRelations =
  Prisma.SolicitationGetPayload<{
    include: {
      procurement: true;
      organization: true;
      lots: true;
      bids: true;
    };
  }>;

export type SolicitationCreateInput =
  Prisma.SolicitationCreateInput;

export type SolicitationUpdateInput =
  Prisma.SolicitationUpdateInput;

export type SolicitationWhereInput =
  Prisma.SolicitationWhereInput;

export type SolicitationOrderByInput =
  Prisma.SolicitationOrderByWithRelationInput;

export type SolicitationListItem =
  Prisma.SolicitationGetPayload<{
    select: {
      id: true;
      solicitationNumber: true;
      title: true;
      description: true;
      type: true;
      status: true;
      openingDate: true;
      closingDate: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;