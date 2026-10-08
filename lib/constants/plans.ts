export const PLANS = {
  ORGANIZATION_STARTER: "ORGANIZATION_STARTER",
  ORGANIZATION_PROFESSIONAL: "ORGANIZATION_PROFESSIONAL",
  ORGANIZATION_ENTERPRISE: "ORGANIZATION_ENTERPRISE",
  VENDOR_FREE: "VENDOR_FREE",
  VENDOR_PROFESSIONAL: "VENDOR_PROFESSIONAL",
  VENDOR_PREMIUM: "VENDOR_PREMIUM",
} as const;

export type Plan = (typeof PLANS)[keyof typeof PLANS];

export type PlanType = "ORGANIZATION" | "VENDOR";

export const PLAN_LABELS: Record<Plan, string> = {
  ORGANIZATION_STARTER: "Starter",
  ORGANIZATION_PROFESSIONAL: "Professional",
  ORGANIZATION_ENTERPRISE: "Enterprise",
  VENDOR_FREE: "Free",
  VENDOR_PROFESSIONAL: "Professional",
  VENDOR_PREMIUM: "Premium",
};

export const PLAN_TYPES: Record<Plan, PlanType> = {
  ORGANIZATION_STARTER: "ORGANIZATION",
  ORGANIZATION_PROFESSIONAL: "ORGANIZATION",
  ORGANIZATION_ENTERPRISE: "ORGANIZATION",
  VENDOR_FREE: "VENDOR",
  VENDOR_PROFESSIONAL: "VENDOR",
  VENDOR_PREMIUM: "VENDOR",
};

export const ORGANIZATION_PLANS = [
  PLANS.ORGANIZATION_STARTER,
  PLANS.ORGANIZATION_PROFESSIONAL,
  PLANS.ORGANIZATION_ENTERPRISE,
] as const;

export const VENDOR_PLANS = [
  PLANS.VENDOR_FREE,
  PLANS.VENDOR_PROFESSIONAL,
  PLANS.VENDOR_PREMIUM,
] as const;

export const PLAN_DESCRIPTIONS: Record<Plan, string> = {
  ORGANIZATION_STARTER: "For organizations getting started with procurement.",
  ORGANIZATION_PROFESSIONAL:
    "For organizations managing procurement at a larger scale.",
  ORGANIZATION_ENTERPRISE:
    "For organizations requiring advanced procurement capabilities and support.",
  VENDOR_FREE: "For vendors starting to discover procurement opportunities.",
  VENDOR_PROFESSIONAL:
    "For vendors actively participating in procurement opportunities.",
  VENDOR_PREMIUM:
    "For vendors requiring advanced tools and higher usage limits.",
};

export function isValidPlan(value: unknown): value is Plan {
  return (
    typeof value === "string" &&
    Object.values(PLANS).includes(value as Plan)
  );
}

export function isOrganizationPlan(
  plan: Plan,
): plan is (typeof ORGANIZATION_PLANS)[number] {
  return (ORGANIZATION_PLANS as readonly string[]).includes(plan);
}

export function isVendorPlan(
  plan: Plan,
): plan is (typeof VENDOR_PLANS)[number] {
  return (VENDOR_PLANS as readonly string[]).includes(plan);
}

export function getPlanLabel(plan: Plan): string {
  return PLAN_LABELS[plan];
}

export function getPlanType(plan: Plan): PlanType {
  return PLAN_TYPES[plan];
}

export function getPlanDescription(plan: Plan): string {
  return PLAN_DESCRIPTIONS[plan];
}