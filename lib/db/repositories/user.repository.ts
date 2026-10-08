import { prisma } from "@/lib/db/prisma";
import type { Prisma, UserRole, UserStatus } from "@prisma/client";

export async function findUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function findUserByPhone(phone: string) {
  return prisma.user.findUnique({
    where: { phone },
  });
}

export async function findUserWithDetails(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      organizationMemberships: {
        include: {
          organization: true,
          department: true,
        },
      },
      vendor: true,
      subscriptions: true,
    },
  });
}

export async function createUser(data: Prisma.UserCreateInput) {
  return prisma.user.create({
    data,
  });
}

export async function updateUser(
  id: string,
  data: Prisma.UserUpdateInput
) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function updateUserStatus(
  id: string,
  status: UserStatus
) {
  return prisma.user.update({
    where: { id },
    data: { status },
  });
}

export async function updateUserRole(
  id: string,
  role: UserRole
) {
  return prisma.user.update({
    where: { id },
    data: { role },
  });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}

export async function listUsers(params?: {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  skip?: number;
  take?: number;
}) {
  const { role, status, search, skip = 0, take = 50 } = params ?? {};

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.user.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

export async function countUsers(params?: {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}) {
  const { role, status, search } = params ?? {};

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            {
              name: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              email: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.user.count({
    where,
  });
}