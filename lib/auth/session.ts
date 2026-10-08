import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getDefaultDashboardPath } from "@/lib/auth/roles";

export type AuthSession = NonNullable<
  Awaited<ReturnType<typeof auth>>
>;

export async function getSession() {
  return auth();
}

export async function getCurrentUser() {
  const session = await auth();

  return session?.user ?? null;
}

export async function requireSession() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  return session;
}

export async function requireUser() {
  const session = await requireSession();

  return session.user;
}

export async function requireActiveUser() {
  const user = await requireUser();

  if (user.status !== "ACTIVE") {
    redirect("/auth/login");
  }

  return user;
}

export async function requireRole(
  allowedRoles: string[],
) {
  const user = await requireActiveUser();

  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect(getDefaultDashboardPath(user.role));
  }

  return user;
}

export async function requireAdmin() {
  return requireRole(["ADMIN"]);
}

export async function requireOrganizationUser() {
  return requireRole(["ORGANIZATION"]);
}

export async function requireVendor() {
  return requireRole(["VENDOR"]);
}

export async function getAuthenticatedUserId() {
  const user = await requireActiveUser();

  return user.id;
}

export async function getAuthenticatedUserRole() {
  const user = await requireActiveUser();

  return user.role;
}

export async function redirectAuthenticatedUser() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    return;
  }

  redirect(
    getDefaultDashboardPath(session.user.role),
  );
}
