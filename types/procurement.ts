import type { Prisma } from "@prisma/client";

export type Procurement = Prisma.ProcurementGetPayload<{}>;

export type ProcurementWithRelations =
  Prisma.ProcurementGetPayload<{
    include: {
      organization: true;
      solicitations: true;
    };
  }>;

export type ProcurementCreateInput =
  Prisma.ProcurementCreateInput;

export type ProcurementUpdateInput =
  Prisma.ProcurementUpdateInput;

export type ProcurementWhereInput =
  Prisma.ProcurementWhereInput;

export type ProcurementOrderByInput =
  Prisma.ProcurementOrderByWithRelationInput;

export type ProcurementListItem =
  Prisma.ProcurementGetPayload<{
    select: {
      id: true;
      referenceNumber: true;
      title: true;
      status: true;
      procurementMethod: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;