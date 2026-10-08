import { UserRole, UserStatus } from "@prisma/client";

export const USER_ROLES = {
  ADMIN: UserRole.ADMIN,
  ORGANIZATION: UserRole.ORGANIZATION,
  VENDOR: UserRole.VENDOR,
} as const;

export const USER_STATUSES = {
  PENDING: UserStatus.PENDING,
  ACTIVE: UserStatus.ACTIVE,
  SUSPENDED: UserStatus.SUSPENDED,
  DELETED: UserStatus.DELETED,
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Administrator",
  ORGANIZATION: "Organization",
  VENDOR: "Vendor",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  ADMIN: "Platform administrator with full system access.",
  ORGANIZATION:
    "Organization user who manages procurements, solicitations, evaluations, awards, and contracts.",
  VENDOR:
    "Vendor user who discovers solicitations, submits bids, and manages vendor compliance.",
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  PENDING: "Pending",
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
  DELETED: "Deleted",
};

export function isValidRole(value: unknown): value is UserRole {
  return (
    value === UserRole.ADMIN ||
    value === UserRole.ORGANIZATION ||
    value === UserRole.VENDOR
  );
}

export function isValidUserStatus(
  value: unknown,
): value is UserStatus {
  return (
    value === UserStatus.PENDING ||
    value === UserStatus.ACTIVE ||
    value === UserStatus.SUSPENDED ||
    value === UserStatus.DELETED
  );
}

export function isAdminRole(role: UserRole): boolean {
  return role === UserRole.ADMIN;
}

export function isOrganizationRole(role: UserRole): boolean {
  return role === UserRole.ORGANIZATION;
}

export function isVendorRole(role: UserRole): boolean {
  return role === UserRole.VENDOR;
}

export function canAccessDashboard(role: UserRole): boolean {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.ORGANIZATION ||
    role === UserRole.VENDOR
  );
}

export function getDefaultDashboardPath(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "/dashboard/admin";

    case UserRole.ORGANIZATION:
      return "/dashboard/organization";

    case UserRole.VENDOR:
      return "/dashboard/vendor";

    default:
      return "/auth/login";
  }
}

export function getRoleHomePath(role: UserRole): string {
  return getDefaultDashboardPath(role);
}

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function getRoleDescription(role: UserRole): string {
  return ROLE_DESCRIPTIONS[role];
}

export function getUserStatusLabel(status: UserStatus): string {
  return STATUS_LABELS[status];
}