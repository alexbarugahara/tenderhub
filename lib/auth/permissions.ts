import { UserRole } from "@prisma/client";

export type Permission =
  | "users:read"
  | "users:manage"
  | "organizations:read"
  | "organizations:manage"
  | "vendors:read"
  | "vendors:manage"
  | "procurements:read"
  | "procurements:create"
  | "procurements:update"
  | "procurements:delete"
  | "solicitations:read"
  | "solicitations:create"
  | "solicitations:update"
  | "solicitations:publish"
  | "solicitations:delete"
  | "bids:read"
  | "bids:create"
  | "bids:update"
  | "bids:submit"
  | "bids:withdraw"
  | "evaluations:read"
  | "evaluations:create"
  | "evaluations:update"
  | "evaluations:approve"
  | "awards:read"
  | "awards:create"
  | "awards:update"
  | "awards:approve"
  | "awards:accept"
  | "contracts:read"
  | "contracts:create"
  | "contracts:update"
  | "contracts:manage"
  | "compliance:read"
  | "compliance:manage"
  | "classifications:read"
  | "classifications:manage"
  | "notifications:read"
  | "notifications:manage"
  | "payments:read"
  | "payments:manage"
  | "subscriptions:read"
  | "subscriptions:manage"
  | "integrations:read"
  | "integrations:manage"
  | "reports:read"
  | "audit-logs:read";

const ADMIN_PERMISSIONS: Permission[] = [
  "users:read",
  "users:manage",
  "organizations:read",
  "organizations:manage",
  "vendors:read",
  "vendors:manage",
  "procurements:read",
  "procurements:create",
  "procurements:update",
  "procurements:delete",
  "solicitations:read",
  "solicitations:create",
  "solicitations:update",
  "solicitations:publish",
  "solicitations:delete",
  "bids:read",
  "bids:create",
  "bids:update",
  "bids:submit",
  "bids:withdraw",
  "evaluations:read",
  "evaluations:create",
  "evaluations:update",
  "evaluations:approve",
  "awards:read",
  "awards:create",
  "awards:update",
  "awards:approve",
  "awards:accept",
  "contracts:read",
  "contracts:create",
  "contracts:update",
  "contracts:manage",
  "compliance:read",
  "compliance:manage",
  "classifications:read",
  "classifications:manage",
  "notifications:read",
  "notifications:manage",
  "payments:read",
  "payments:manage",
  "subscriptions:read",
  "subscriptions:manage",
  "integrations:read",
  "integrations:manage",
  "reports:read",
  "audit-logs:read",
];

const ORGANIZATION_PERMISSIONS: Permission[] = [
  "organizations:read",
  "organizations:manage",
  "vendors:read",
  "procurements:read",
  "procurements:create",
  "procurements:update",
  "procurements:delete",
  "solicitations:read",
  "solicitations:create",
  "solicitations:update",
  "solicitations:publish",
  "solicitations:delete",
  "bids:read",
  "evaluations:read",
  "evaluations:create",
  "evaluations:update",
  "evaluations:approve",
  "awards:read",
  "awards:create",
  "awards:update",
  "awards:approve",
  "awards:accept",
  "contracts:read",
  "contracts:create",
  "contracts:update",
  "contracts:manage",
  "compliance:read",
  "classifications:read",
  "notifications:read",
  "notifications:manage",
  "payments:read",
  "payments:manage",
  "subscriptions:read",
  "subscriptions:manage",
  "reports:read",
];

const VENDOR_PERMISSIONS: Permission[] = [
  "organizations:read",
  "vendors:read",
  "vendors:manage",
  "procurements:read",
  "solicitations:read",
  "bids:read",
  "bids:create",
  "bids:update",
  "bids:submit",
  "bids:withdraw",
  "evaluations:read",
  "awards:read",
  "awards:accept",
  "contracts:read",
  "compliance:read",
  "compliance:manage",
  "classifications:read",
  "notifications:read",
  "notifications:manage",
  "payments:read",
  "payments:manage",
  "subscriptions:read",
  "subscriptions:manage",
];

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: ADMIN_PERMISSIONS,
  ORGANIZATION: ORGANIZATION_PERMISSIONS,
  VENDOR: VENDOR_PERMISSIONS,
};

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(
  role: UserRole,
  permission: Permission,
): boolean {
  return getRolePermissions(role).includes(permission);
}

export function hasAnyPermission(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.some((permission) =>
    hasPermission(role, permission),
  );
}

export function hasAllPermissions(
  role: UserRole,
  permissions: Permission[],
): boolean {
  return permissions.every((permission) =>
    hasPermission(role, permission),
  );
}

export function isAdmin(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function isOrganization(role: UserRole): boolean {
  return role === UserRole.ORGANIZATION;
}

export function isVendor(role: UserRole): boolean {
  return role === UserRole.VENDOR;
}

export function canManageOrganization(role: UserRole): boolean {
  return hasPermission(role, "organizations:manage");
}

export function canCreateProcurement(role: UserRole): boolean {
  return hasPermission(role, "procurements:create");
}

export function canManageSolicitations(role: UserRole): boolean {
  return (
    hasPermission(role, "solicitations:create") ||
    hasPermission(role, "solicitations:update")
  );
}

export function canSubmitBids(role: UserRole): boolean {
  return hasPermission(role, "bids:submit");
}

export function canEvaluateBids(role: UserRole): boolean {
  return hasPermission(role, "evaluations:create");
}

export function canManageAwards(role: UserRole): boolean {
  return hasPermission(role, "awards:create");
}

export function canManageContracts(role: UserRole): boolean {
  return hasPermission(role, "contracts:manage");
}

export function canManageCompliance(role: UserRole): boolean {
  return hasPermission(role, "compliance:manage");
}

export function canManagePayments(role: UserRole): boolean {
  return hasPermission(role, "payments:manage");
}

export function canManageIntegrations(role: UserRole): boolean {
  return hasPermission(role, "integrations:manage");
}

export function canViewAuditLogs(role: UserRole): boolean {
  return hasPermission(role, "audit-logs:read");
}