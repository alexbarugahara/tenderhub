import {
  OrganizationMemberRole,
  UserRole,
} from "@prisma/client";

export interface ProcurementPermissionContext {
  userId: string;
  userRole: UserRole;
  organizationId: string;
  organizationMemberRole?: OrganizationMemberRole | null;
}

export const PROCUREMENT_PERMISSIONS = {
  VIEW: "procurement:view",
  CREATE: "procurement:create",
  EDIT: "procurement:edit",
  DELETE: "procurement:delete",
  CHANGE_STATUS: "procurement:change_status",
  MANAGE: "procurement:manage",
} as const;

export type ProcurementPermission =
  (typeof PROCUREMENT_PERMISSIONS)[keyof typeof PROCUREMENT_PERMISSIONS];

const ORGANIZATION_MANAGEMENT_ROLES: OrganizationMemberRole[] = [
  OrganizationMemberRole.OWNER,
  OrganizationMemberRole.ADMIN,
  OrganizationMemberRole.PROCUREMENT_MANAGER,
];

const PROCUREMENT_VIEW_ROLES: OrganizationMemberRole[] = [
  OrganizationMemberRole.OWNER,
  OrganizationMemberRole.ADMIN,
  OrganizationMemberRole.PROCUREMENT_MANAGER,
  OrganizationMemberRole.EVALUATOR,
  OrganizationMemberRole.FINANCE,
  OrganizationMemberRole.MEMBER,
];

function isOrganizationMemberRole(
  context: ProcurementPermissionContext,
): boolean {
  return context.userRole === UserRole.ADMIN ||
    context.organizationMemberRole !== null &&
    context.organizationMemberRole !== undefined;
}

function hasOrganizationManagementRole(
  context: ProcurementPermissionContext,
): boolean {
  return (
    context.userRole === UserRole.ADMIN ||
    (context.organizationMemberRole !== null &&
      context.organizationMemberRole !== undefined &&
      ORGANIZATION_MANAGEMENT_ROLES.includes(
        context.organizationMemberRole,
      ))
  );
}

function hasOrganizationViewRole(
  context: ProcurementPermissionContext,
): boolean {
  return (
    context.userRole === UserRole.ADMIN ||
    (context.organizationMemberRole !== null &&
      context.organizationMemberRole !== undefined &&
      PROCUREMENT_VIEW_ROLES.includes(
        context.organizationMemberRole,
      ))
  );
}

export function canViewProcurement(
  context: ProcurementPermissionContext,
): boolean {
  return hasOrganizationViewRole(context);
}

export function canCreateProcurement(
  context: ProcurementPermissionContext,
): boolean {
  return hasOrganizationManagementRole(context);
}

export function canEditProcurement(
  context: ProcurementPermissionContext,
): boolean {
  return hasOrganizationManagementRole(context);
}

export function canDeleteProcurement(
  context: ProcurementPermissionContext,
): boolean {
  return (
    context.userRole === UserRole.ADMIN ||
    context.organizationMemberRole ===
      OrganizationMemberRole.OWNER ||
    context.organizationMemberRole ===
      OrganizationMemberRole.ADMIN
  );
}

export function canChangeProcurementStatus(
  context: ProcurementPermissionContext,
): boolean {
  return hasOrganizationManagementRole(context);
}

export function canManageProcurement(
  context: ProcurementPermissionContext,
): boolean {
  return hasOrganizationManagementRole(context);
}

export function hasProcurementPermission(
  context: ProcurementPermissionContext,
  permission: ProcurementPermission,
): boolean {
  switch (permission) {
    case PROCUREMENT_PERMISSIONS.VIEW:
      return canViewProcurement(context);

    case PROCUREMENT_PERMISSIONS.CREATE:
      return canCreateProcurement(context);

    case PROCUREMENT_PERMISSIONS.EDIT:
      return canEditProcurement(context);

    case PROCUREMENT_PERMISSIONS.DELETE:
      return canDeleteProcurement(context);

    case PROCUREMENT_PERMISSIONS.CHANGE_STATUS:
      return canChangeProcurementStatus(context);

    case PROCUREMENT_PERMISSIONS.MANAGE:
      return canManageProcurement(context);

    default:
      return false;
  }
}

export function assertProcurementPermission(
  context: ProcurementPermissionContext,
  permission: ProcurementPermission,
): void {
  if (!hasProcurementPermission(context, permission)) {
    throw new Error(
      `You do not have permission to perform "${permission}" on this procurement.`,
    );
  }
}

export function getProcurementPermissions(
  context: ProcurementPermissionContext,
): Record<ProcurementPermission, boolean> {
  return {
    [PROCUREMENT_PERMISSIONS.VIEW]:
      canViewProcurement(context),

    [PROCUREMENT_PERMISSIONS.CREATE]:
      canCreateProcurement(context),

    [PROCUREMENT_PERMISSIONS.EDIT]:
      canEditProcurement(context),

    [PROCUREMENT_PERMISSIONS.DELETE]:
      canDeleteProcurement(context),

    [PROCUREMENT_PERMISSIONS.CHANGE_STATUS]:
      canChangeProcurementStatus(context),

    [PROCUREMENT_PERMISSIONS.MANAGE]:
      canManageProcurement(context),
  };
}

export function isProcurementManager(
  context: ProcurementPermissionContext,
): boolean {
  return (
    context.userRole === UserRole.ADMIN ||
    context.organizationMemberRole ===
      OrganizationMemberRole.OWNER ||
    context.organizationMemberRole ===
      OrganizationMemberRole.ADMIN ||
    context.organizationMemberRole ===
      OrganizationMemberRole.PROCUREMENT_MANAGER
  );
}

export function canManageProcurementAsOrganizationMember(
  role: OrganizationMemberRole | null | undefined,
): boolean {
  if (!role) {
    return false;
  }

  return ORGANIZATION_MANAGEMENT_ROLES.includes(role);
}

export function canViewProcurementAsOrganizationMember(
  role: OrganizationMemberRole | null | undefined,
): boolean {
  if (!role) {
    return false;
  }

  return PROCUREMENT_VIEW_ROLES.includes(role);
}

export function isProcurementOrganizationMember(
  context: ProcurementPermissionContext,
): boolean {
  return isOrganizationMemberRole(context);
}