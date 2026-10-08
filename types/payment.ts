import type { Prisma } from "@prisma/client";

export type Payment =
  Prisma.PaymentGetPayload<{}>;

export type PaymentWithRelations =
  Prisma.PaymentGetPayload<{
    include: {
      user: true;
      organization: true;
      vendor: true;
    };
  }>;

export type PaymentCreateInput =
  Prisma.PaymentCreateInput;

export type PaymentUpdateInput =
  Prisma.PaymentUpdateInput;

export type PaymentWhereInput =
  Prisma.PaymentWhereInput;

export type PaymentOrderByInput =
  Prisma.PaymentOrderByWithRelationInput;

export type PaymentListItem =
  Prisma.PaymentGetPayload<{
    select: {
      id: true;
      amount: true;
      currency: true;
      status: true;
      type: true;
      provider: true;
      transactionId: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;