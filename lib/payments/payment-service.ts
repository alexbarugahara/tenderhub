import {
  PaymentGatewayProvider,
  PaymentStatus,
  PaymentType,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export interface CreatePaymentInput {
  userId: string;
  amount: number;
  currency?: string;
  reference: string;
  status?: PaymentStatus;
  provider?: PaymentGatewayProvider;
  transactionId?: string;
  checkoutUrl?: string;
  paidAt?: Date;
  failureReason?: string;
  type?: PaymentType;
}

export interface UpdatePaymentInput {
  amount?: number;
  currency?: string | null;
  status?: PaymentStatus;
  provider?: PaymentGatewayProvider | null;
  transactionId?: string | null;
  checkoutUrl?: string | null;
  paidAt?: Date | null;
  failureReason?: string | null;
  type?: PaymentType;
}

export interface ListPaymentsInput {
  userId?: string;
  status?: PaymentStatus;
  provider?: PaymentGatewayProvider;
  type?: PaymentType;
  search?: string;
  page?: number;
  pageSize?: number;
}

function normalizeCurrency(currency?: string): string {
  return currency?.trim().toUpperCase() || "UGX";
}

function normalizeReference(reference: string): string {
  return reference.trim();
}

function normalizeAmount(amount: number): number {
  if (!Number.isFinite(amount)) {
    throw new Error("Payment amount must be a valid number.");
  }

  if (amount < 0) {
    throw new Error("Payment amount cannot be negative.");
  }

  return amount;
}

function validateUserId(userId: string): void {
  if (!userId?.trim()) {
    throw new Error("User ID is required.");
  }
}

function validateReference(reference: string): void {
  if (!reference?.trim()) {
    throw new Error("Payment reference is required.");
  }
}

function normalizePage(page?: number): number {
  return Math.max(1, Math.floor(page ?? 1));
}

function normalizePageSize(pageSize?: number): number {
  return Math.min(100, Math.max(1, Math.floor(pageSize ?? 20)));
}

async function resolveCurrencyId(
  currency?: string | null,
): Promise<string | null> {
  if (currency === null) {
    return null;
  }

  const code = normalizeCurrency(currency ?? undefined);

  const currencyRecord = await prisma.currency.findUnique({
    where: {
      code,
    },
    select: {
      id: true,
    },
  });

  if (!currencyRecord) {
    throw new Error(`Currency "${code}" was not found.`);
  }

  return currencyRecord.id;
}

export async function getPaymentById(id: string) {
  if (!id?.trim()) {
    throw new Error("Payment ID is required.");
  }

  return prisma.payment.findUnique({
    where: {
      id,
    },
  });
}

export async function getPaymentByReference(reference: string) {
  validateReference(reference);

  return prisma.payment.findUnique({
    where: {
      reference: normalizeReference(reference),
    },
  });
}

export async function createPayment(input: CreatePaymentInput) {
  validateUserId(input.userId);
  validateReference(input.reference);

  const amount = normalizeAmount(input.amount);

  const reference = normalizeReference(input.reference);

  const existing = await prisma.payment.findUnique({
    where: {
      reference,
    },
  });

  if (existing) {
    throw new Error(
      `A payment with reference "${reference}" already exists.`,
    );
  }

  const currencyId = await resolveCurrencyId(input.currency);

  return prisma.payment.create({
    data: {
      userId: input.userId.trim(),
      currencyId,
      amount,
      reference,
      status: input.status ?? PaymentStatus.PENDING,
      provider: input.provider ?? null,
      transactionId: input.transactionId ?? null,
      checkoutUrl: input.checkoutUrl ?? null,
      paidAt: input.paidAt ?? null,
      failureReason: input.failureReason ?? null,
      type: input.type ?? PaymentType.SUBSCRIPTION,
    },
  });
}

export async function updatePayment(
  id: string,
  input: UpdatePaymentInput,
) {
  if (!id?.trim()) {
    throw new Error("Payment ID is required.");
  }

  if (input.amount !== undefined) {
    normalizeAmount(input.amount);
  }

  if (
    input.currency !== undefined &&
    input.currency !== null &&
    !input.currency.trim()
  ) {
    throw new Error("Currency cannot be empty.");
  }

  let currencyId: string | null | undefined;

  if (input.currency !== undefined) {
    currencyId = await resolveCurrencyId(input.currency);
  }

  return prisma.payment.update({
    where: {
      id,
    },
    data: {
      ...(input.amount !== undefined
        ? {
            amount: normalizeAmount(input.amount),
          }
        : {}),

      ...(input.currency !== undefined
        ? {
            currencyId,
          }
        : {}),

      ...(input.status !== undefined
        ? {
            status: input.status,
          }
        : {}),

      ...(input.provider !== undefined
        ? {
            provider: input.provider,
          }
        : {}),

      ...(input.transactionId !== undefined
        ? {
            transactionId: input.transactionId,
          }
        : {}),

      ...(input.checkoutUrl !== undefined
        ? {
            checkoutUrl: input.checkoutUrl,
          }
        : {}),

      ...(input.paidAt !== undefined
        ? {
            paidAt: input.paidAt,
          }
        : {}),

      ...(input.failureReason !== undefined
        ? {
            failureReason: input.failureReason,
          }
        : {}),

      ...(input.type !== undefined
        ? {
            type: input.type,
          }
        : {}),
    },
  });
}

export async function getPayments(
  input: ListPaymentsInput = {},
) {
  const page = normalizePage(input.page);

  const pageSize = normalizePageSize(input.pageSize);

  const skip = (page - 1) * pageSize;

  const where = {
    ...(input.userId
      ? {
          userId: input.userId,
        }
      : {}),

    ...(input.status
      ? {
          status: input.status,
        }
      : {}),

    ...(input.provider
      ? {
          provider: input.provider,
        }
      : {}),

    ...(input.type
      ? {
          type: input.type,
        }
      : {}),

    ...(input.search?.trim()
      ? {
          reference: {
            contains: input.search.trim(),
            mode: "insensitive" as const,
          },
        }
      : {}),
  };

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: pageSize,
    }),

    prisma.payment.count({
      where,
    }),
  ]);

  return {
    data: payments,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function changePaymentStatus(
  id: string,
  status: PaymentStatus,
) {
  if (!id?.trim()) {
    throw new Error("Payment ID is required.");
  }

  return prisma.payment.update({
    where: {
      id,
    },
    data: {
      status,
    },
  });
}

export async function markPaymentPaid(
  id: string,
  transactionId?: string,
) {
  if (!id?.trim()) {
    throw new Error("Payment ID is required.");
  }

  return prisma.payment.update({
    where: {
      id,
    },
    data: {
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      ...(transactionId
        ? {
            transactionId: transactionId.trim(),
          }
        : {}),
      failureReason: null,
    },
  });
}

export async function markPaymentFailed(
  id: string,
  failureReason?: string,
) {
  if (!id?.trim()) {
    throw new Error("Payment ID is required.");
  }

  return prisma.payment.update({
    where: {
      id,
    },
    data: {
      status: PaymentStatus.FAILED,
      failureReason:
        failureReason?.trim() || "Payment failed.",
    },
  });
}

export async function refundPayment(id: string) {
  if (!id?.trim()) {
    throw new Error("Payment ID is required.");
  }

  const payment = await prisma.payment.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found.");
  }

  if (payment.status !== PaymentStatus.PAID) {
    throw new Error("Only paid payments can be refunded.");
  }

  return prisma.payment.update({
    where: {
      id,
    },
    data: {
      status: PaymentStatus.REFUNDED,
    },
  });
}

export async function getUserPayments(
  userId: string,
  options: Omit<ListPaymentsInput, "userId"> = {},
) {
  validateUserId(userId);

  return getPayments({
    ...options,
    userId,
  });
}

export async function getPaidPayments(userId?: string) {
  return getPayments({
    userId,
    status: PaymentStatus.PAID,
  });
}

export async function getPendingPayments(userId?: string) {
  return getPayments({
    userId,
    status: PaymentStatus.PENDING,
  });
}

export async function paymentExists(
  reference: string,
): Promise<boolean> {
  const payment = await getPaymentByReference(reference);

  return payment !== null;
}

export function isPaymentPaid(
  status: PaymentStatus,
): boolean {
  return status === PaymentStatus.PAID;
}

export function isPaymentPending(
  status: PaymentStatus,
): boolean {
  return status === PaymentStatus.PENDING;
}

export function isPaymentFailed(
  status: PaymentStatus,
): boolean {
  return status === PaymentStatus.FAILED;
}

export function isPaymentRefunded(
  status: PaymentStatus,
): boolean {
  return status === PaymentStatus.REFUNDED;
}