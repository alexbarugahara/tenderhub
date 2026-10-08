import { OrganizationMemberRole, UserRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function getOrganizationMembership(
  userId: string,
  organizationId: string,
) {
  return prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      organization: true,
      department: true,
      user: true,
    },
  });
}

export async function isOrganizationMember(
  userId: string,
  organizationId: string,
): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: {
      id: true,
    },
  });

  return Boolean(membership);
}

export async function getOrganizationMemberRole(
  userId: string,
  organizationId: string,
): Promise<OrganizationMemberRole | null> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    select: {
      role: true,
    },
  });

  return membership?.role ?? null;
}

export function canManageOrganizationMember(
  role: OrganizationMemberRole,
): boolean {
  return (
    role === OrganizationMemberRole.OWNER ||
    role === OrganizationMemberRole.ADMIN
  );
}

export function canManageProcurement(
  role: OrganizationMemberRole,
): boolean {
  return (
    role === OrganizationMemberRole.OWNER ||
    role === OrganizationMemberRole.ADMIN ||
    role === OrganizationMemberRole.PROCUREMENT_MANAGER
  );
}

export function canEvaluate(
  role: OrganizationMemberRole,
): boolean {
  return (
    role === OrganizationMemberRole.OWNER ||
    role === OrganizationMemberRole.ADMIN ||
    role === OrganizationMemberRole.PROCUREMENT_MANAGER ||
    role === OrganizationMemberRole.EVALUATOR
  );
}

export function canManageFinance(
  role: OrganizationMemberRole,
): boolean {
  return (
    role === OrganizationMemberRole.OWNER ||
    role === OrganizationMemberRole.ADMIN ||
    role === OrganizationMemberRole.FINANCE
  );
}

export async function requireOrganizationMember(
  userId: string,
  organizationId: string,
) {
  const membership = await getOrganizationMembership(
    userId,
    organizationId,
  );

  if (!membership) {
    throw new Error("You are not a member of this organization.");
  }

  return membership;
}

export async function requireOrganizationRole(
  userId: string,
  organizationId: string,
  allowedRoles: OrganizationMemberRole[],
) {
  const membership = await requireOrganizationMember(
    userId,
    organizationId,
  );

  if (!allowedRoles.includes(membership.role)) {
    throw new Error(
      "You do not have permission to perform this action.",
    );
  }

  return membership;
}

export async function requireOrganizationOwner(
  userId: string,
  organizationId: string,
) {
  return requireOrganizationRole(
    userId,
    organizationId,
    [OrganizationMemberRole.OWNER],
  );
}

export async function requireOrganizationAdmin(
  userId: string,
  organizationId: string,
) {
  return requireOrganizationRole(
    userId,
    organizationId,
    [
      OrganizationMemberRole.OWNER,
      OrganizationMemberRole.ADMIN,
    ],
  );
}

export async function requireProcurementAccess(
  userId: string,
  organizationId: string,
) {
  return requireOrganizationRole(
    userId,
    organizationId,
    [
      OrganizationMemberRole.OWNER,
      OrganizationMemberRole.ADMIN,
      OrganizationMemberRole.PROCUREMENT_MANAGER,
    ],
  );
}

export async function requireEvaluationAccess(
  userId: string,
  organizationId: string,
) {
  return requireOrganizationRole(
    userId,
    organizationId,
    [
      OrganizationMemberRole.OWNER,
      OrganizationMemberRole.ADMIN,
      OrganizationMemberRole.PROCUREMENT_MANAGER,
      OrganizationMemberRole.EVALUATOR,
    ],
  );
}

export async function requireFinanceAccess(
  userId: string,
  organizationId: string,
) {
  return requireOrganizationRole(
    userId,
    organizationId,
    [
      OrganizationMemberRole.OWNER,
      OrganizationMemberRole.ADMIN,
      OrganizationMemberRole.FINANCE,
    ],
  );
}

export async function requirePlatformOrOrganizationAccess(
  userId: string,
  userRole: UserRole,
  organizationId: string,
) {
  if (userRole === UserRole.ADMIN) {
    return prisma.organization.findUnique({
      where: { id: organizationId },
    });
  }

  return requireOrganizationMember(userId, organizationId);
}

export async function listUserOrganizations(userId: string) {
  return prisma.organizationMember.findMany({
    where: {
      userId,
    },
    include: {
      organization: true,
      department: true,
    },
    orderBy: {
      joinedAt: "asc",
    },
  });
}