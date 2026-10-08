export const ROLES = {
  ADMIN: "ADMIN",
  ORGANIZATION: "ORGANIZATION",
  VENDOR: "VENDOR",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Administrator",
  ORGANIZATION: "Organization",
  VENDOR: "Vendor",
};

export const ADMIN_ROLES: Role[] = [ROLES.ADMIN];

export const ORGANIZATION_ROLES: Role[] = [ROLES.ORGANIZATION];

export const VENDOR_ROLES: Role[] = [ROLES.VENDOR];

export function isValidRole(value: unknown): value is Role {
  return (
    typeof value === "string" &&
    Object.values(ROLES).includes(value as Role)
  );
}

export function isAdminRole(role: Role): boolean {
  return role === ROLES.ADMIN;
}

export function isOrganizationRole(role: Role): boolean {
  return role === ROLES.ORGANIZATION;
}

export function isVendorRole(role: Role): boolean {
  return role === ROLES.VENDOR;
}

export function getRoleLabel(role: Role): string {
  return ROLE_LABELS[role];
}