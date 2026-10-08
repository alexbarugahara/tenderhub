import { SubscriptionPlan } from "@prisma/client";

// ============================================================
// PLAN TYPES
// ============================================================

export type SubscriptionAudience = "ORGANIZATION" | "VENDOR";

export interface SubscriptionPlanDefinition {
  plan: SubscriptionPlan;
  name: string;
  description: string;
  audience: SubscriptionAudience;

  price: number;
  currency: string;

  billingInterval: "MONTHLY" | "YEARLY" | "CUSTOM";

  popular?: boolean;
  customPricing?: boolean;

  features: string[];
}

// ============================================================
// PLAN DEFINITIONS
// ============================================================

export const SUBSCRIPTION_PLANS: Record<
  SubscriptionPlan,
  SubscriptionPlanDefinition
> = {
  [SubscriptionPlan.ORGANIZATION_STARTER]: {
    plan: SubscriptionPlan.ORGANIZATION_STARTER,
    name: "Starter",
    description:
      "Essential procurement tools for organizations getting started.",
    audience: "ORGANIZATION",
    price: 0,
    currency: "UGX",
    billingInterval: "MONTHLY",

    features: [
      "1 active solicitation",
      "Basic procurement management",
      "Vendor management",
      "Bid management",
      "Basic evaluations",
      "Basic award management",
      "Basic contract management",
    ],
  },

  [SubscriptionPlan.ORGANIZATION_PROFESSIONAL]: {
    plan: SubscriptionPlan.ORGANIZATION_PROFESSIONAL,
    name: "Professional",
    description:
      "Advanced procurement management for growing organizations.",
    audience: "ORGANIZATION",
    price: 150000,
    currency: "UGX",
    billingInterval: "MONTHLY",
    popular: true,

    features: [
      "Multiple active solicitations",
      "Advanced procurement management",
      "Vendor management",
      "Advanced bid management",
      "Evaluation workflows",
      "Award management",
      "Contract management",
      "Procurement reporting",
      "Notifications",
    ],
  },

  [SubscriptionPlan.ORGANIZATION_ENTERPRISE]: {
    plan: SubscriptionPlan.ORGANIZATION_ENTERPRISE,
    name: "Enterprise",
    description:
      "Advanced procurement capabilities for large and complex organizations.",
    audience: "ORGANIZATION",
    price: 0,
    currency: "UGX",
    billingInterval: "CUSTOM",
    customPricing: true,

    features: [
      "Unlimited active solicitations",
      "Advanced procurement workflows",
      "Advanced vendor management",
      "Advanced evaluations",
      "Award management",
      "Contract management",
      "Advanced reporting",
      "Integrations",
      "Priority support",
      "Custom configuration",
    ],
  },

  [SubscriptionPlan.VENDOR_FREE]: {
    plan: SubscriptionPlan.VENDOR_FREE,
    name: "Free",
    description:
      "Discover procurement opportunities and manage a basic vendor profile.",
    audience: "VENDOR",
    price: 0,
    currency: "UGX",
    billingInterval: "MONTHLY",

    features: [
      "Vendor profile",
      "Browse solicitations",
      "Save up to 5 solicitations",
      "Basic bid management",
      "Basic compliance management",
    ],
  },

  [SubscriptionPlan.VENDOR_PROFESSIONAL]: {
    plan: SubscriptionPlan.VENDOR_PROFESSIONAL,
    name: "Professional",
    description:
      "More tools for vendors actively pursuing procurement opportunities.",
    audience: "VENDOR",
    price: 30000,
    currency: "UGX",
    billingInterval: "MONTHLY",
    popular: true,

    features: [
      "Everything in Free",
      "Unlimited saved solicitations",
      "Procurement alerts",
      "Advanced bid management",
      "Compliance tracking",
      "Bid document management",
      "Vendor performance tracking",
    ],
  },

  [SubscriptionPlan.VENDOR_PREMIUM]: {
    plan: SubscriptionPlan.VENDOR_PREMIUM,
    name: "Premium",
    description:
      "Advanced tools for vendors managing a high volume of opportunities.",
    audience: "VENDOR",
    price: 100000,
    currency: "UGX",
    billingInterval: "MONTHLY",

    features: [
      "Everything in Professional",
      "Advanced procurement alerts",
      "Advanced compliance management",
      "Advanced vendor profile",
      "Advanced bid management",
      "Advanced reporting",
      "Priority support",
    ],
  },
};

// ============================================================
// PLAN LOOKUPS
// ============================================================

export function getPlanDefinition(
  plan: SubscriptionPlan,
): SubscriptionPlanDefinition {
  return SUBSCRIPTION_PLANS[plan];
}

export function getPlanName(
  plan: SubscriptionPlan,
): string {
  return SUBSCRIPTION_PLANS[plan].name;
}

export function getPlanDescription(
  plan: SubscriptionPlan,
): string {
  return SUBSCRIPTION_PLANS[plan].description;
}

export function getPlanPrice(
  plan: SubscriptionPlan,
): number {
  return SUBSCRIPTION_PLANS[plan].price;
}

export function getPlanCurrency(
  plan: SubscriptionPlan,
): string {
  return SUBSCRIPTION_PLANS[plan].currency;
}

export function getPlanAudience(
  plan: SubscriptionPlan,
): SubscriptionAudience {
  return SUBSCRIPTION_PLANS[plan].audience;
}

export function getPlanFeatures(
  plan: SubscriptionPlan,
): string[] {
  return SUBSCRIPTION_PLANS[plan].features;
}

// ============================================================
// PLAN GROUPS
// ============================================================

export const ORGANIZATION_PLANS: SubscriptionPlan[] = [
  SubscriptionPlan.ORGANIZATION_STARTER,
  SubscriptionPlan.ORGANIZATION_PROFESSIONAL,
  SubscriptionPlan.ORGANIZATION_ENTERPRISE,
];

export const VENDOR_PLANS: SubscriptionPlan[] = [
  SubscriptionPlan.VENDOR_FREE,
  SubscriptionPlan.VENDOR_PROFESSIONAL,
  SubscriptionPlan.VENDOR_PREMIUM,
];

export function getOrganizationPlans(): SubscriptionPlanDefinition[] {
  return ORGANIZATION_PLANS.map(
    (plan) => SUBSCRIPTION_PLANS[plan],
  );
}

export function getVendorPlans(): SubscriptionPlanDefinition[] {
  return VENDOR_PLANS.map(
    (plan) => SUBSCRIPTION_PLANS[plan],
  );
}

export function isOrganizationPlan(
  plan: SubscriptionPlan,
): boolean {
  return ORGANIZATION_PLANS.includes(plan);
}

export function isVendorPlan(
  plan: SubscriptionPlan,
): boolean {
  return VENDOR_PLANS.includes(plan);
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

export function isCustomPricedPlan(
  plan: SubscriptionPlan,
): boolean {
  return Boolean(
    SUBSCRIPTION_PLANS[plan].customPricing,
  );
}

// ============================================================
// PLAN VALIDATION
// ============================================================

export function isValidSubscriptionPlan(
  value: unknown,
): value is SubscriptionPlan {
  return Object.values(SubscriptionPlan).includes(
    value as SubscriptionPlan,
  );
}

export function assertValidSubscriptionPlan(
  value: unknown,
): asserts value is SubscriptionPlan {
  if (!isValidSubscriptionPlan(value)) {
    throw new Error("Invalid subscription plan.");
  }
}

// ============================================================
// PLAN COMPARISON
// ============================================================

const ORGANIZATION_PLAN_ORDER: SubscriptionPlan[] = [
  SubscriptionPlan.ORGANIZATION_STARTER,
  SubscriptionPlan.ORGANIZATION_PROFESSIONAL,
  SubscriptionPlan.ORGANIZATION_ENTERPRISE,
];

const VENDOR_PLAN_ORDER: SubscriptionPlan[] = [
  SubscriptionPlan.VENDOR_FREE,
  SubscriptionPlan.VENDOR_PROFESSIONAL,
  SubscriptionPlan.VENDOR_PREMIUM,
];

export function getPlanLevel(
  plan: SubscriptionPlan,
): number {
  if (isOrganizationPlan(plan)) {
    return ORGANIZATION_PLAN_ORDER.indexOf(plan);
  }

  if (isVendorPlan(plan)) {
    return VENDOR_PLAN_ORDER.indexOf(plan);
  }

  return -1;
}

export function isPlanUpgrade(
  currentPlan: SubscriptionPlan,
  newPlan: SubscriptionPlan,
): boolean {
  if (
    getPlanAudience(currentPlan) !==
    getPlanAudience(newPlan)
  ) {
    return false;
  }

  return (
    getPlanLevel(newPlan) >
    getPlanLevel(currentPlan)
  );
}

export function isPlanDowngrade(
  currentPlan: SubscriptionPlan,
  newPlan: SubscriptionPlan,
): boolean {
  if (
    getPlanAudience(currentPlan) !==
    getPlanAudience(newPlan)
  ) {
    return false;
  }

  return (
    getPlanLevel(newPlan) <
    getPlanLevel(currentPlan)
  );
}

export function canChangeToPlan(
  currentPlan: SubscriptionPlan,
  newPlan: SubscriptionPlan,
): boolean {
  return (
    currentPlan === newPlan ||
    (
      getPlanAudience(currentPlan) ===
      getPlanAudience(newPlan)
    )
  );
}