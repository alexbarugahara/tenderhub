import { SubscriptionPlan } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { PLAN_FEATURES } from "./plans";

// ============================================================
// SUBSCRIPTION
// ============================================================

export async function getUserSubscription(userId: string) {
  if (!userId.trim()) {
    throw new Error("User ID is required.");
  }

  return prisma.subscription.findFirst({
    where: {
      userId,
      status: {
        in: ["ACTIVE", "TRIAL"],
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// ============================================================
// USER PLAN
// ============================================================

export async function getUserPlan(
  userId: string,
): Promise<SubscriptionPlan> {
  const subscription = await getUserSubscription(userId);

  /*
   * Users without a subscription receive the
   * Vendor Free plan by default.
   */
  return (
    subscription?.plan ??
    SubscriptionPlan.VENDOR_FREE
  );
}

// ============================================================
// PLAN FEATURES
// ============================================================

export async function getUserFeature(
  userId: string,
) {
  const plan = await getUserPlan(userId);

  return PLAN_FEATURES[plan];
}

// ============================================================
// VENDOR FEATURES
// ============================================================

export async function getVendorFeature(
  userId: string,
) {
  const plan = await getUserPlan(userId);

  if (
    plan !== SubscriptionPlan.VENDOR_FREE &&
    plan !== SubscriptionPlan.VENDOR_PROFESSIONAL &&
    plan !== SubscriptionPlan.VENDOR_PREMIUM
  ) {
    return undefined;
  }

  return PLAN_FEATURES[plan];
}

// ============================================================
// ORGANIZATION FEATURES
// ============================================================

export async function getOrganizationFeature(
  userId: string,
) {
  const plan = await getUserPlan(userId);

  if (
    plan !== SubscriptionPlan.ORGANIZATION_STARTER &&
    plan !== SubscriptionPlan.ORGANIZATION_PROFESSIONAL &&
    plan !== SubscriptionPlan.ORGANIZATION_ENTERPRISE
  ) {
    return undefined;
  }

  return PLAN_FEATURES[plan];
}

// ============================================================
// PROFESSIONAL ACCESS
// ============================================================

export async function hasProfessionalAccess(
  userId: string,
): Promise<boolean> {
  const plan = await getUserPlan(userId);

  return (
    plan ===
      SubscriptionPlan.VENDOR_PROFESSIONAL ||
    plan ===
      SubscriptionPlan.VENDOR_PREMIUM ||
    plan ===
      SubscriptionPlan.ORGANIZATION_PROFESSIONAL ||
    plan ===
      SubscriptionPlan.ORGANIZATION_ENTERPRISE
  );
}

// ============================================================
// PREMIUM ACCESS
// ============================================================

export async function hasPremiumAccess(
  userId: string,
): Promise<boolean> {
  const plan = await getUserPlan(userId);

  return (
    plan ===
    SubscriptionPlan.VENDOR_PREMIUM
  );
}

// ============================================================
// DEADLINE REMINDER ACCESS
// ============================================================

export async function hasDeadlineReminderAccess(
  userId: string,
): Promise<boolean> {
  const plan = await getUserPlan(userId);

  return (
    plan ===
      SubscriptionPlan.VENDOR_PROFESSIONAL ||
    plan ===
      SubscriptionPlan.VENDOR_PREMIUM
  );
}

// ============================================================
// FEATURE ACCESS
// ============================================================

export async function userHasFeature(
  userId: string,
  feature: string,
): Promise<boolean> {
  const plan = await getUserPlan(userId);

  const planFeatures = PLAN_FEATURES[plan];

  if (!planFeatures) {
    return false;
  }

  if (!(feature in planFeatures)) {
    return false;
  }

  const featureValue =
    planFeatures[
      feature as keyof typeof planFeatures
    ];

  return Boolean(featureValue);
}

// ============================================================
// PLAN TYPE HELPERS
// ============================================================

export function isOrganizationPlan(
  plan: SubscriptionPlan,
): boolean {
  return (
    plan ===
      SubscriptionPlan.ORGANIZATION_STARTER ||
    plan ===
      SubscriptionPlan.ORGANIZATION_PROFESSIONAL ||
    plan ===
      SubscriptionPlan.ORGANIZATION_ENTERPRISE
  );
}

export function isVendorPlan(
  plan: SubscriptionPlan,
): boolean {
  return (
    plan ===
      SubscriptionPlan.VENDOR_FREE ||
    plan ===
      SubscriptionPlan.VENDOR_PROFESSIONAL ||
    plan ===
      SubscriptionPlan.VENDOR_PREMIUM
  );
}

export function isFreePlan(
  plan: SubscriptionPlan,
): boolean {
  return (
    plan ===
      SubscriptionPlan.ORGANIZATION_STARTER ||
    plan ===
      SubscriptionPlan.VENDOR_FREE
  );
}

export function isPaidPlan(
  plan: SubscriptionPlan,
): boolean {
  return !isFreePlan(plan);
}