export enum UserRole {
  ADMIN = "ADMIN",
  ORGANIZATION = "ORGANIZATION",
  SUPPLIER = "SUPPLIER",
  USER = "USER",
}

export function isAdmin(role: UserRole) {
  return role === UserRole.ADMIN;
}

export function canPostTender(role: UserRole) {
  return (
    role === UserRole.ADMIN ||
    role === UserRole.ORGANIZATION
  );
}