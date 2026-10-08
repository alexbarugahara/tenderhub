import type { Prisma } from "@prisma/client";

export type Classification =
  Prisma.ClassificationGetPayload<{}>;

export type ClassificationWithRelations =
  Prisma.ClassificationGetPayload<{
    include: {
      parent: true;
      children: true;
      vendorClassifications: true;
      solicitationClassifications: true;
    };
  }>;

export type ClassificationCreateInput =
  Prisma.ClassificationCreateInput;

export type ClassificationUpdateInput =
  Prisma.ClassificationUpdateInput;

export type ClassificationWhereInput =
  Prisma.ClassificationWhereInput;

export type ClassificationOrderByInput =
  Prisma.ClassificationOrderByWithRelationInput;

export type ClassificationListItem =
  Prisma.ClassificationGetPayload<{
    select: {
      id: true;
      code: true;
      name: true;
      description: true;
      type: true;
      parentId: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;