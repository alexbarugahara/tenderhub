"use client";

import { useMemo } from "react";

export type Permission =
  | "organization:read"
  | "organization:manage"
  | "vendor:read"
  | "vendor:manage"
  | "procurement:read"
  | "procurement:create"
  | "procurement:manage"
  | "solicitation:read"
  | "solicitation:create"
  | "solicitation:manage"
  | "bid:read"
  | "bid:create"
  | "bid:manage"
  | "evaluation:read"
  | "evaluation:manage"
  | "award:read"
  | "award:manage"
  | "contract:read"
  | "contract:manage";

type UsePermissionsOptions = {
  role?: string | null;
  permissions?: string[];
};

export function usePermissions({
  role,
  permissions = [],
}: UsePermissionsOptions = {}) {
  const permissionSet = useMemo(
    () => new Set(permissions),
    [permissions],
  );

  const isAdmin = role === "ADMIN";
  const isOrganization = role === "ORGANIZATION";
  const isVendor = role === "VENDOR";

  const can = (permission: Permission): boolean => {
    if (isAdmin) {
      return true;
    }

    return permissionSet.has(permission);
  };

  return {
    role,
    permissions: permissionSet,
    isAdmin,
    isOrganization,
    isVendor,
    can,
  };
}