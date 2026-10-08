export const Permissions = {
  ADMIN: [
    "manage_users",
    "manage_roles",
    "manage_tenders",
    "manage_categories",
    "manage_organizations",
    "manage_suppliers",
    "manage_applications",
    "manage_payments",
    "manage_subscriptions",
    "manage_news",
    "manage_notifications",
    "view_audit_logs",
    "system_settings",
  ],

  ORGANIZATION: [
    "create_tender",
    "edit_tender",
    "delete_tender",
    "publish_tender",
    "close_tender",
    "view_applications",
    "award_tender",
    "manage_company_profile",
  ],

  VENDOR: [
    "view_tenders",
    "search_tenders",
    "save_tender",
    "apply_tender",
    "upload_documents",
    "manage_profile",
    "manage_subscription",
    "view_payment_history",
  ],
} as const;

export type Role = keyof typeof Permissions;

export type Permission =
  (typeof Permissions)[Role][number];

export function hasPermission(
  role: Role,
  permission: Permission,
): boolean {
  return (Permissions[role] as readonly Permission[]).includes(permission);
}

export function isAdmin(role: string): boolean {
  return role === "ADMIN";
}

export function isOrganization(role: string): boolean {
  return role === "ORGANIZATION";
}

export function isVendor(role: string): boolean {
  return role === "VENDOR";
}

/**
 * Backward-compatible alias for older code that still calls isSupplier().
 * The current application role is VENDOR.
 */
export function isSupplier(role: string): boolean {
  return role === "VENDOR";
}