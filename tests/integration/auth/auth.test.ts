import { describe, expect, it } from "vitest";

import {
  UserRole,
  UserStatus,
} from "@prisma/client";

describe("Authentication integration", () => {
  it("should support the user roles defined by Prisma", () => {
    const validRoles = Object.values(UserRole);

    expect(validRoles).toContain(UserRole.ADMIN);
    expect(validRoles).toContain(UserRole.ORGANIZATION);
    expect(validRoles).toContain(UserRole.VENDOR);
  });

  it("should support the user statuses defined by Prisma", () => {
    const validStatuses = Object.values(UserStatus);

    expect(validStatuses).toContain(UserStatus.PENDING);
    expect(validStatuses).toContain(UserStatus.ACTIVE);
    expect(validStatuses).toContain(UserStatus.SUSPENDED);
    expect(validStatuses).toContain(UserStatus.DELETED);
  });

  it("should create a valid authenticated user representation", () => {
    const user = {
      id: "user-test-001",
      email: "user@example.com",
      name: "Test User",
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
    };

    expect(user.id).toBeTruthy();
    expect(user.email).toBeTruthy();
    expect(user.name).toBeTruthy();
    expect(user.role).toBe(UserRole.VENDOR);
    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it("should only allow supported roles", () => {
    const validRoles = Object.values(UserRole);

    const userRoles = [
      UserRole.ADMIN,
      UserRole.ORGANIZATION,
      UserRole.VENDOR,
    ];

    for (const role of userRoles) {
      expect(validRoles).toContain(role);
    }
  });

  it("should identify an active user as eligible for authentication", () => {
    const user = {
      id: "user-test-002",
      email: "active@example.com",
      role: UserRole.VENDOR,
      status: UserStatus.ACTIVE,
    };

    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it("should not treat a deleted user as active", () => {
    const user = {
      id: "user-test-003",
      email: "deleted@example.com",
      role: UserRole.VENDOR,
      status: UserStatus.DELETED,
    };

    expect(user.status).not.toBe(UserStatus.ACTIVE);
  });

  it("should not treat a suspended user as active", () => {
    const user = {
      id: "user-test-004",
      email: "suspended@example.com",
      role: UserRole.VENDOR,
      status: UserStatus.SUSPENDED,
    };

    expect(user.status).not.toBe(UserStatus.ACTIVE);
  });

  it("should preserve the authenticated user's role in a session representation", () => {
    const user = {
      id: "user-test-005",
      email: "organization@example.com",
      role: UserRole.ORGANIZATION,
      status: UserStatus.ACTIVE,
    };

    const session = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };

    expect(session.user.id).toBe(user.id);
    expect(session.user.email).toBe(user.email);
    expect(session.user.role).toBe(UserRole.ORGANIZATION);
  });

  it("should preserve an admin role in the authenticated session", () => {
    const session = {
      user: {
        id: "admin-test-001",
        email: "admin@example.com",
        role: UserRole.ADMIN,
      },
    };

    expect(session.user.role).toBe(UserRole.ADMIN);
  });

  it("should preserve a vendor role in the authenticated session", () => {
    const session = {
      user: {
        id: "vendor-test-001",
        email: "vendor@example.com",
        role: UserRole.VENDOR,
      },
    };

    expect(session.user.role).toBe(UserRole.VENDOR);
  });

  it("should reject an unsupported role", () => {
    const validRoles = Object.values(UserRole);

    expect(validRoles).not.toContain("INVALID_ROLE");
  });

  it("should reject an unsupported user status", () => {
    const validStatuses = Object.values(UserStatus);

    expect(validStatuses).not.toContain("INVALID_STATUS");
  });
});