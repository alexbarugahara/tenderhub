import {
  Prisma,
  SubscriptionPlan,
  SubscriptionStatus,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

// ============================================================
// TYPES
// ============================================================

export interface CreateSubscriptionInput {
  userId: string;
  organizationId?: string;
  plan: SubscriptionPlan;
  status?: SubscriptionStatus;
  startDate?: Date;
  endDate?: Date;
  autoRenew?: boolean;
  price?: number | Prisma.Decimal;
}

export interface UpdateSubscriptionInput {
  userId?: string;
  organizationId?: string | null;
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  startDate?: Date;
  endDate?: Date | null;
  autoRenew?: boolean;
  price?: number | Prisma.Decimal;
}

export interface ListSubscriptionsInput {
  userId?: string;
  organizationId?: string;
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  page?: number;
  pageSize?: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

// ============================================================
// HELPERS
// ============================================================

function normalizePage(page?: number): number {
  if (!page || !Number.isFinite(page) || page < 1) {
    return DEFAULT_PAGE;
  }

  return Math.floor(page);
}

function normalizePageSize(pageSize?: number): number {
  if (!pageSize || !Number.isFinite(pageSize) || pageSize < 1) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.min(Math.floor(pageSize), MAX_PAGE_SIZE);
}

function normalizePrice(
  price?: number | Prisma.Decimal,
): Prisma.Decimal {
  if (price instanceof Prisma.Decimal) {
    return price;
  }

  if (price === undefined) {
    return new Prisma.Decimal(0);
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Subscription price must be a non-negative number.");
  }

  return new Prisma.Decimal(price);
}

function validateSubscriptionDates(
  startDate?: Date,
  endDate?: Date | null,
): void {
  if (startDate && Number.isNaN(startDate.getTime())) {
    throw new Error("Invalid subscription start date.");
  }

  if (endDate && Number.isNaN(endDate.getTime())) {
    throw new Error("Invalid subscription end date.");
  }

  if (startDate && endDate && endDate < startDate) {
    throw new Error(
      "Subscription end date cannot be earlier than the start date.",
    );
  }
}

function validateSubscriptionIdentity(
  userId: string,
  plan: SubscriptionPlan,
): void {
  if (!userId.trim()) {
    throw new Error("User ID is required.");
  }

  if (!Object.values(SubscriptionPlan).includes(plan)) {
    throw new Error("Invalid subscription plan.");
  }
}

function validateSubscriptionStatus(
  status: SubscriptionStatus,
): void {
  if (!Object.values(SubscriptionStatus).includes(status)) {
    throw new Error("Invalid subscription status.");
  }
}

// ============================================================
// GET
// ============================================================

export async function getSubscriptionById(id: string) {
  if (!id.trim()) {
    throw new Error("Subscription ID is required.");
  }

  return prisma.subscription.findUnique({
    where: { id },
    include: {
      user: true,
      organization: true,
    },
  });
}

export async function getActiveSubscriptionForUser(userId: string) {
  if (!userId.trim()) {
    throw new Error("User ID is required.");
  }

  return prisma.subscription.findFirst({
    where: {
      userId,
      status: SubscriptionStatus.ACTIVE,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      organization: true,
    },
  });
}

export async function getActiveSubscriptionForOrganization(
  organizationId: string,
) {
  if (!organizationId.trim()) {
    throw new Error("Organization ID is required.");
  }

  return prisma.subscription.findFirst({
    where: {
      organizationId,
      status: SubscriptionStatus.ACTIVE,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      organization: true,
    },
  });
}

export async function getUserSubscriptions(userId: string) {
  if (!userId.trim()) {
    throw new Error("User ID is required.");
  }

  return prisma.subscription.findMany({
    where: { userId },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      organization: true,
    },
  });
}

export async function getOrganizationSubscriptions(
  organizationId: string,
) {
  if (!organizationId.trim()) {
    throw new Error("Organization ID is required.");
  }

  return prisma.subscription.findMany({
    where: { organizationId },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
    },
  });
}

// ============================================================
// CREATE
// ============================================================

export async function createSubscription(
  input: CreateSubscriptionInput,
) {
  const {
    userId,
    organizationId,
    plan,
    status = SubscriptionStatus.ACTIVE,
    startDate = new Date(),
    endDate,
    autoRenew = false,
    price = 0,
  } = input;

  validateSubscriptionIdentity(userId, plan);
  validateSubscriptionStatus(status);
  validateSubscriptionDates(startDate, endDate);

  const normalizedPrice = normalizePrice(price);

  return prisma.subscription.create({
    data: {
      userId,
      organizationId: organizationId || undefined,
      plan,
      status,
      startDate,
      endDate,
      autoRenew,
      price: normalizedPrice,
    },
    include: {
      user: true,
      organization: true,
    },
  });
}

// ============================================================
// UPDATE
// ============================================================

export async function updateSubscription(
  id: string,
  input: UpdateSubscriptionInput,
) {
  if (!id.trim()) {
    throw new Error("Subscription ID is required.");
  }

  const existing = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Subscription not found.");
  }

  const userId = input.userId ?? existing.userId;
  const plan = input.plan ?? existing.plan;
  const startDate = input.startDate ?? existing.startDate;
  const endDate =
    input.endDate !== undefined
      ? input.endDate
      : existing.endDate;

  validateSubscriptionIdentity(userId, plan);

  if (input.status !== undefined) {
    validateSubscriptionStatus(input.status);
  }

  validateSubscriptionDates(startDate, endDate);

  const data: Prisma.SubscriptionUpdateInput = {};

  if (input.userId !== undefined) {
    data.user = {
      connect: {
        id: input.userId,
      },
    };
  }

  if (input.organizationId !== undefined) {
    data.organization =
      input.organizationId === null
        ? { disconnect: true }
        : {
            connect: {
              id: input.organizationId,
            },
          };
  }

  if (input.plan !== undefined) {
    data.plan = input.plan;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  if (input.startDate !== undefined) {
    data.startDate = input.startDate;
  }

  if (input.endDate !== undefined) {
    data.endDate = input.endDate;
  }

  if (input.autoRenew !== undefined) {
    data.autoRenew = input.autoRenew;
  }

  if (input.price !== undefined) {
    data.price = normalizePrice(input.price);
  }

  return prisma.subscription.update({
    where: { id },
    data,
    include: {
      user: true,
      organization: true,
    },
  });
}

// ============================================================
// LIST
// ============================================================

export async function getSubscriptions(
  input: ListSubscriptionsInput = {},
) {
  const page = normalizePage(input.page);
  const pageSize = normalizePageSize(input.pageSize);

  const where: Prisma.SubscriptionWhereInput = {
    userId: input.userId,
    organizationId: input.organizationId,
    plan: input.plan,
    status: input.status,
  };

  const [data, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        organization: true,
      },
    }),

    prisma.subscription.count({
      where,
    }),
  ]);

  return {
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

// ============================================================
// STATUS MANAGEMENT
// ============================================================

export async function changeSubscriptionStatus(
  id: string,
  status: SubscriptionStatus,
) {
  if (!id.trim()) {
    throw new Error("Subscription ID is required.");
  }

  validateSubscriptionStatus(status);

  const existing = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Subscription not found.");
  }

  return prisma.subscription.update({
    where: { id },
    data: {
      status,
    },
    include: {
      user: true,
      organization: true,
    },
  });
}

export async function activateSubscription(id: string) {
  return changeSubscriptionStatus(
    id,
    SubscriptionStatus.ACTIVE,
  );
}

export async function cancelSubscription(id: string) {
  return changeSubscriptionStatus(
    id,
    SubscriptionStatus.CANCELLED,
  );
}

export async function expireSubscription(id: string) {
  return changeSubscriptionStatus(
    id,
    SubscriptionStatus.EXPIRED,
  );
}

export async function setSubscriptionPending(id: string) {
  return changeSubscriptionStatus(
    id,
    SubscriptionStatus.PENDING,
  );
}

export async function startSubscriptionTrial(id: string) {
  return changeSubscriptionStatus(
    id,
    SubscriptionStatus.TRIAL,
  );
}

// ============================================================
// SUBSCRIPTION LIFECYCLE
// ============================================================

export async function renewSubscription(
  id: string,
  endDate?: Date,
) {
  if (!id.trim()) {
    throw new Error("Subscription ID is required.");
  }

  const existing = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Subscription not found.");
  }

  const newEndDate = endDate ?? existing.endDate;

  if (newEndDate) {
    validateSubscriptionDates(
      existing.startDate,
      newEndDate,
    );
  }

  return prisma.subscription.update({
    where: { id },
    data: {
      status: SubscriptionStatus.ACTIVE,
      endDate: newEndDate,
      autoRenew: true,
    },
    include: {
      user: true,
      organization: true,
    },
  });
}

export async function enableAutoRenew(id: string) {
  if (!id.trim()) {
    throw new Error("Subscription ID is required.");
  }

  return prisma.subscription.update({
    where: { id },
    data: {
      autoRenew: true,
    },
    include: {
      user: true,
      organization: true,
    },
  });
}

export async function disableAutoRenew(id: string) {
  if (!id.trim()) {
    throw new Error("Subscription ID is required.");
  }

  return prisma.subscription.update({
    where: { id },
    data: {
      autoRenew: false,
    },
    include: {
      user: true,
      organization: true,
    },
  });
}

// ============================================================
// PLAN MANAGEMENT
// ============================================================

export async function changeSubscriptionPlan(
  id: string,
  plan: SubscriptionPlan,
  price?: number | Prisma.Decimal,
) {
  if (!id.trim()) {
    throw new Error("Subscription ID is required.");
  }

  if (!Object.values(SubscriptionPlan).includes(plan)) {
    throw new Error("Invalid subscription plan.");
  }

  const data: Prisma.SubscriptionUpdateInput = {
    plan,
  };

  if (price !== undefined) {
    data.price = normalizePrice(price);
  }

  return prisma.subscription.update({
    where: { id },
    data,
    include: {
      user: true,
      organization: true,
    },
  });
}

// ============================================================
// DELETE
// ============================================================

export async function deleteSubscription(id: string) {
  if (!id.trim()) {
    throw new Error("Subscription ID is required.");
  }

  const existing = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new Error("Subscription not found.");
  }

  return prisma.subscription.delete({
    where: { id },
  });
}

// ============================================================
// EXPIRATION
// ============================================================

export async function expireEndedSubscriptions() {
  const now = new Date();

  return prisma.subscription.updateMany({
    where: {
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.TRIAL,
        ],
      },
      endDate: {
        not: null,
        lt: now,
      },
    },
    data: {
      status: SubscriptionStatus.EXPIRED,
    },
  });
}

export async function getExpiringSubscriptions(
  days = 30,
) {
  if (!Number.isFinite(days) || days < 0) {
    throw new Error(
      "Expiration window must be a non-negative number of days.",
    );
  }

  const now = new Date();

  const expiryLimit = new Date(
    now.getTime() +
      Math.floor(days) * 24 * 60 * 60 * 1000,
  );

  return prisma.subscription.findMany({
    where: {
      status: SubscriptionStatus.ACTIVE,
      endDate: {
        gte: now,
        lte: expiryLimit,
      },
    },
    orderBy: {
      endDate: "asc",
    },
    include: {
      user: true,
      organization: true,
    },
  });
}

// ============================================================
// CHECKS
// ============================================================

export async function subscriptionExists(id: string) {
  if (!id.trim()) {
    return false;
  }

  const count = await prisma.subscription.count({
    where: { id },
  });

  return count > 0;
}

export async function hasActiveSubscription(
  userId: string,
) {
  if (!userId.trim()) {
    return false;
  }

  const subscription =
    await getActiveSubscriptionForUser(userId);

  if (!subscription) {
    return false;
  }

  if (
    subscription.endDate &&
    subscription.endDate < new Date()
  ) {
    return false;
  }

  return true;
}

export async function hasActiveOrganizationSubscription(
  organizationId: string,
) {
  if (!organizationId.trim()) {
    return false;
  }

  const subscription =
    await getActiveSubscriptionForOrganization(
      organizationId,
    );

  if (!subscription) {
    return false;
  }

  if (
    subscription.endDate &&
    subscription.endDate < new Date()
  ) {
    return false;
  }

  return true;
}

export function isSubscriptionActive(
  subscription: {
    status: SubscriptionStatus;
    endDate?: Date | null;
  },
): boolean {
  if (subscription.status !== SubscriptionStatus.ACTIVE) {
    return false;
  }

  if (
    subscription.endDate &&
    subscription.endDate < new Date()
  ) {
    return false;
  }

  return true;
}

export function isSubscriptionCancelled(
  subscription: {
    status: SubscriptionStatus;
  },
): boolean {
  return (
    subscription.status === SubscriptionStatus.CANCELLED
  );
}

export function isSubscriptionExpired(
  subscription: {
    status: SubscriptionStatus;
    endDate?: Date | null;
  },
): boolean {
  if (subscription.status === SubscriptionStatus.EXPIRED) {
    return true;
  }

  return Boolean(
    subscription.endDate &&
      subscription.endDate < new Date(),
  );
}

export function isSubscriptionTrial(
  subscription: {
    status: SubscriptionStatus;
  },
): boolean {
  return subscription.status === SubscriptionStatus.TRIAL;
}

// ============================================================
// DEFAULT PLAN HELPERS
// ============================================================

export function isOrganizationPlan(
  plan: SubscriptionPlan,
): boolean {
  return (
    plan === SubscriptionPlan.ORGANIZATION_STARTER ||
    plan === SubscriptionPlan.ORGANIZATION_PROFESSIONAL ||
    plan === SubscriptionPlan.ORGANIZATION_ENTERPRISE
  );
}

export function isVendorPlan(
  plan: SubscriptionPlan,
): boolean {
  return (
    plan === SubscriptionPlan.VENDOR_FREE ||
    plan === SubscriptionPlan.VENDOR_PROFESSIONAL ||
    plan === SubscriptionPlan.VENDOR_PREMIUM
  );
}

export function isFreePlan(
  plan: SubscriptionPlan,
): boolean {
  return (
    plan === SubscriptionPlan.ORGANIZATION_STARTER ||
    plan === SubscriptionPlan.VENDOR_FREE
  );
}

export function isPaidPlan(
  plan: SubscriptionPlan,
): boolean {
  return !isFreePlan(plan);
}