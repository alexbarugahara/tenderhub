import type { UserRole } from "@prisma/client";

export type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
};

export type AuthSession = {
  user: AuthUser;
  expires: string;
};

export type AuthenticatedUser = {
  id: string;
  name: string | null;
  email: string;
  role: UserRole;
};

export type UserRoleValue = UserRole;

export type AuthResult =
  | {
      success: true;
      user: AuthUser;
    }
  | {
      success: false;
      error: string;
    };

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
};

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "ADMIN";
}

export function isOrganization(
  user: AuthUser | null | undefined,
): boolean {
  return user?.role === "ORGANIZATION";
}

export function isVendor(
  user: AuthUser | null | undefined,
): boolean {
  return user?.role === "VENDOR";
}

export function isAuthenticated(
  user: AuthUser | null | undefined,
): user is AuthUser {
  return Boolean(user);
}