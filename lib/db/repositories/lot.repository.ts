import { Prisma, LotStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function findLotById(id: string) {
  return prisma.lot.findUnique({
    where: { id },
  });
}

export async function findLotByNumber(
  solicitationId: string,
  lotNumber: string,
) {
  const number = Number(lotNumber);

  if (!Number.isInteger(number)) {
    return null;
  }

  return prisma.lot.findFirst({
    where: {
      solicitationId,
      number,
    },
  });
}

export async function findLotWithDetails(id: string) {
  return prisma.lot.findUnique({
    where: { id },
    include: {
      solicitation: {
        include: {
          organization: true,
          procurement: true,
        },
      },
      requirements: {
        orderBy: {
          createdAt: "asc",
        },
      },
      bids: {
        include: {
          vendor: true,
          submittedBy: true,
          documents: true,
          requirementResponses: true,
          evaluations: true,
          award: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      awards: {
        include: {
          vendor: true,
          bid: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });
}

export async function createLot(data: Prisma.LotCreateInput) {
  return prisma.lot.create({
    data,
  });
}

export async function updateLot(
  id: string,
  data: Prisma.LotUpdateInput,
) {
  return prisma.lot.update({
    where: { id },
    data,
  });
}

export async function updateLotStatus(
  id: string,
  status: LotStatus,
) {
  return prisma.lot.update({
    where: { id },
    data: { status },
  });
}

export async function deleteLot(id: string) {
  return prisma.lot.delete({
    where: { id },
  });
}

export async function listLots({
  solicitationId,
  status,
  search,
  skip = 0,
  take = 20,
}: {
  solicitationId: string;
  status?: LotStatus;
  search?: string;
  skip?: number;
  take?: number;
}) {
  const searchNumber =
    search && /^\d+$/.test(search) ? Number(search) : null;

  const where: Prisma.LotWhereInput = {
    solicitationId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            ...(searchNumber !== null
              ? [
                  {
                    number: searchNumber,
                  },
                ]
              : []),
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.lot.findMany({
    where,
    include: {
      requirements: true,
      bids: {
        include: {
          vendor: true,
        },
      },
      awards: {
        include: {
          vendor: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    skip,
    take,
  });
}

export async function countLots({
  solicitationId,
  status,
  search,
}: {
  solicitationId: string;
  status?: LotStatus;
  search?: string;
}) {
  const searchNumber =
    search && /^\d+$/.test(search) ? Number(search) : null;

  const where: Prisma.LotWhereInput = {
    solicitationId,
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            ...(searchNumber !== null
              ? [
                  {
                    number: searchNumber,
                  },
                ]
              : []),
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              description: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.lot.count({
    where,
  });
}

export async function addLotRequirement(
  data: Prisma.RequirementCreateInput,
) {
  return prisma.requirement.create({
    data,
  });
}

export async function updateLotRequirement(
  id: string,
  data: Prisma.RequirementUpdateInput,
) {
  return prisma.requirement.update({
    where: { id },
    data,
  });
}

export async function removeLotRequirement(id: string) {
  return prisma.requirement.delete({
    where: { id },
  });
}