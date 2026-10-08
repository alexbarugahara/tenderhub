import { SubscriptionPlan } from "@prisma/client";

// ============================================================
// PLAN AUDIENCE HELPERS
// ============================================================

function isOrganizationPlan(plan: SubscriptionPlan): boolean {
  return (
    plan === SubscriptionPlan.ORGANIZATION_STARTER ||
    plan === SubscriptionPlan.ORGANIZATION_PROFESSIONAL ||
    plan === SubscriptionPlan.ORGANIZATION_ENTERPRISE
  );
}

function isVendorPlan(plan: SubscriptionPlan): boolean {
  return (
    plan === SubscriptionPlan.VENDOR_FREE ||
    plan === SubscriptionPlan.VENDOR_PROFESSIONAL ||
    plan === SubscriptionPlan.VENDOR_PREMIUM
  );
}

// ============================================================
// LIMIT TYPES
// ============================================================

export type SubscriptionLimitKey =
  | "activeSolicitations"
  | "savedSolicitations"
  | "organizationMembers"
  | "departments"
  | "evaluators"
  | "vendorTeamMembers"
  | "bidSubmissionsPerMonth"
  | "notifications"
  | "integrations";

export type SubscriptionLimitValue =
  | number
  | "UNLIMITED";

export interface SubscriptionLimits {
  activeSolicitations: SubscriptionLimitValue;
  savedSolicitations: SubscriptionLimitValue;

  organizationMembers: SubscriptionLimitValue;
  departments: SubscriptionLimitValue;
  evaluators: SubscriptionLimitValue;

  vendorTeamMembers: SubscriptionLimitValue;
  bidSubmissionsPerMonth: SubscriptionLimitValue;

  notifications: SubscriptionLimitValue;
  integrations: SubscriptionLimitValue;
}

// ============================================================
// PLAN LIMITS
// ============================================================

export const SUBSCRIPTION_LIMITS: Record<
  SubscriptionPlan,
  SubscriptionLimits
> = {
  [SubscriptionPlan.ORGANIZATION_STARTER]: {
    activeSolicitations: 1,
    savedSolicitations: 0,

    organizationMembers: 3,
    departments: 1,
    evaluators: 2,

    vendorTeamMembers: 0,
    bidSubmissionsPerMonth: "UNLIMITED",

    notifications: 50,
    integrations: 0,
  },

  [SubscriptionPlan.ORGANIZATION_PROFESSIONAL]: {
    activeSolicitations: 25,
    savedSolicitations: 0,

    organizationMembers: 15,
    departments: 10,
    evaluators: 10,

    vendorTeamMembers: 0,
    bidSubmissionsPerMonth: "UNLIMITED",

    notifications: "UNLIMITED",
    integrations: 3,
  },

  [SubscriptionPlan.ORGANIZATION_ENTERPRISE]: {
    activeSolicitations: "UNLIMITED",
    savedSolicitations: 0,

    organizationMembers: "UNLIMITED",
    departments: "UNLIMITED",
    evaluators: "UNLIMITED",

    vendorTeamMembers: 0,
    bidSubmissionsPerMonth: "UNLIMITED",

    notifications: "UNLIMITED",
    integrations: "UNLIMITED",
  },

  [SubscriptionPlan.VENDOR_FREE]: {
    activeSolicitations: 0,
    savedSolicitations: 5,

    organizationMembers: 0,
    departments: 0,
    evaluators: 0,

    vendorTeamMembers: 1,
    bidSubmissionsPerMonth: "UNLIMITED",

    notifications: 0,
    integrations: 0,
  },

  [SubscriptionPlan.VENDOR_PROFESSIONAL]: {
    activeSolicitations: 0,
    savedSolicitations: "UNLIMITED",

    organizationMembers: 0,
    departments: 0,
    evaluators: 0,

    vendorTeamMembers: 5,
    bidSubmissionsPerMonth: "UNLIMITED",

    notifications: "UNLIMITED",
    integrations: 1,
  },

  [SubscriptionPlan.VENDOR_PREMIUM]: {
    activeSolicitations: 0,
    savedSolicitations: "UNLIMITED",

    organizationMembers: 0,
    departments: 0,
    evaluators: 0,

    vendorTeamMembers: "UNLIMITED",
    bidSubmissionsPerMonth: "UNLIMITED",

    notifications: "UNLIMITED",
    integrations: 5,
  },
};

// ============================================================
// LIMIT LOOKUPS
// ============================================================

export function getSubscriptionLimits(
  plan: SubscriptionPlan,
): SubscriptionLimits {
  return SUBSCRIPTION_LIMITS[plan];
}

export function getPlanLimit(
  plan: SubscriptionPlan,
  limit: SubscriptionLimitKey,
): SubscriptionLimitValue {
  return SUBSCRIPTION_LIMITS[plan][limit];
}

export function isUnlimitedLimit(
  value: SubscriptionLimitValue,
): boolean {
  return value === "UNLIMITED";
}

export function hasReachedLimit(
  current: number,
  limit: SubscriptionLimitValue,
): boolean {
  if (limit === "UNLIMITED") {
    return false;
  }

  return current >= limit;
}

export function canAddWithinLimit(
  current: number,
  limit: SubscriptionLimitValue,
  amount = 1,
): boolean {
  if (amount < 0) {
    return false;
  }

  if (limit === "UNLIMITED") {
    return true;
  }

  return current + amount <= limit;
}

export function getRemainingLimit(
  current: number,
  limit: SubscriptionLimitValue,
): SubscriptionLimitValue {
  if (limit === "UNLIMITED") {
    return "UNLIMITED";
  }

  return Math.max(0, limit - current);
}

// ============================================================
// SPECIFIC LIMIT CHECKS
// ============================================================

export function canCreateSolicitation(
  plan: SubscriptionPlan,
  currentActiveSolicitations: number,
): boolean {
  if (!isOrganizationPlan(plan)) {
    return false;
  }

  return canAddWithinLimit(
    currentActiveSolicitations,
    getPlanLimit(plan, "activeSolicitations"),
  );
}

export function canSaveSolicitation(
  plan: SubscriptionPlan,
  currentSavedSolicitations: number,
): boolean {
  if (!isVendorPlan(plan)) {
    return false;
  }

  return canAddWithinLimit(
    currentSavedSolicitations,
    getPlanLimit(plan, "savedSolicitations"),
  );
}

export function canAddOrganizationMember(
  plan: SubscriptionPlan,
  currentMembers: number,
): boolean {
  if (!isOrganizationPlan(plan)) {
    return false;
  }

  return canAddWithinLimit(
    currentMembers,
    getPlanLimit(plan, "organizationMembers"),
  );
}

export function canAddDepartment(
  plan: SubscriptionPlan,
  currentDepartments: number,
): boolean {
  if (!isOrganizationPlan(plan)) {
    return false;
  }

  return canAddWithinLimit(
    currentDepartments,
    getPlanLimit(plan, "departments"),
  );
}

export function canAddEvaluator(
  plan: SubscriptionPlan,
  currentEvaluators: number,
): boolean {
  if (!isOrganizationPlan(plan)) {
    return false;
  }

  return canAddWithinLimit(
    currentEvaluators,
    getPlanLimit(plan, "evaluators"),
  );
}

export function canAddVendorTeamMember(
  plan: SubscriptionPlan,
  currentTeamMembers: number,
): boolean {
  if (!isVendorPlan(plan)) {
    return false;
  }

  return canAddWithinLimit(
    currentTeamMembers,
    getPlanLimit(plan, "vendorTeamMembers"),
  );
}

export function canUseIntegration(
  plan: SubscriptionPlan,
  currentIntegrations: number,
): boolean {
  return canAddWithinLimit(
    currentIntegrations,
    getPlanLimit(plan, "integrations"),
  );
}

// ============================================================
// LIMIT DISPLAY
// ============================================================

export function formatSubscriptionLimit(
  value: SubscriptionLimitValue,
): string {
  if (value === "UNLIMITED") {
    return "Unlimited";
  }

  return value.toLocaleString();
}

export function getLimitLabel(
  limit: SubscriptionLimitKey,
): string {
  const labels: Record<
    SubscriptionLimitKey,
    string
  > = {
    activeSolicitations: "Active solicitations",
    savedSolicitations: "Saved solicitations",
    organizationMembers: "Organization members",
    departments: "Departments",
    evaluators: "Evaluators",
    vendorTeamMembers: "Vendor team members",
    bidSubmissionsPerMonth: "Bid submissions per month",
    notifications: "Notifications",
    integrations: "Integrations",
  };

  return labels[limit];
}