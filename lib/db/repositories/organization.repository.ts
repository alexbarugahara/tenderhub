import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export async function findOrganizationById(id: string) {
  return prisma.organization.findUnique({
    where: { id },
  });
}

export async function findOrganizationByEmail(email: string) {
  return prisma.organization.findUnique({
    where: { email },
  });
}

export async function findOrganizationWithDetails(id: string) {
  return prisma.organization.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: true,
          department: true,
        },
      },
      departments: true,
      procurements: true,
      solicitations: true,
      integrations: true,
      subscriptions: true,
      notices: true,
    },
  });
}

export async function createOrganization(
  data: Prisma.OrganizationCreateInput
) {
  return prisma.organization.create({
    data,
  });
}

export async function updateOrganization(
  id: string,
  data: Prisma.OrganizationUpdateInput
) {
  return prisma.organization.update({
    where: { id },
    data,
  });
}

export async function verifyOrganization(id: string) {
  return prisma.organization.update({
    where: { id },
    data: {
      verifiedAt: new Date(),
    },
  });
}

export async function deleteOrganization(id: string) {
  return prisma.organization.delete({
    where: { id },
  });
}

export async function listOrganizations(params?: {
  search?: string;
  countryId?: string;
  organizationTypeId?: string;
  skip?: number;
  take?: number;
}) {
  const {
    search,
    countryId,
    organizationTypeId,
    skip = 0,
    take = 50,
  } = params ?? {};

  const where: Prisma.OrganizationWhereInput = {
    ...(countryId ? { countryId } : {}),
    ...(organizationTypeId ? { organizationTypeId } : {}),
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
              legalName: {
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
              registrationNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.organization.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

export async function countOrganizations(params?: {
  search?: string;
  countryId?: string;
  organizationTypeId?: string;
}) {
  const { search, countryId, organizationTypeId } = params ?? {};

  const where: Prisma.OrganizationWhereInput = {
    ...(countryId ? { countryId } : {}),
    ...(organizationTypeId ? { organizationTypeId } : {}),
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
              legalName: {
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
              registrationNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.organization.count({
    where,
  });
}

export async function addOrganizationMember(
  data: Prisma.OrganizationMemberCreateInput
) {
  return prisma.organizationMember.create({
    data,
  });
}

export async function findOrganizationMember(
  organizationId: string,
  userId: string
) {
  return prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId,
        userId,
      },
    },
    include: {
      user: true,
      organization: true,
      department: true,
    },
  });
}

export async function updateOrganizationMember(
  id: string,
  data: Prisma.OrganizationMemberUpdateInput
) {
  return prisma.organizationMember.update({
    where: { id },
    data,
  });
}

export async function removeOrganizationMember(id: string) {
  return prisma.organizationMember.delete({
    where: { id },
  });
}