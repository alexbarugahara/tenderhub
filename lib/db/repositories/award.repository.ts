import { AwardStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function findAwardById(id: string) {
  return prisma.award.findUnique({
    where: { id },
  });
}

export async function findAwardWithDetails(id: string) {
  return prisma.award.findUnique({
    where: { id },
    include: {
      solicitation: {
        include: {
          organization: true,
          procurement: true,
          currency: true,
        },
      },
      lot: true,
      bid: {
        include: {
          vendor: true,
          submittedBy: true,
        },
      },
      vendor: {
        include: {
          user: true,
          country: true,
        },
      },
      contract: true,
    },
  });
}

export async function findAwardByBidId(bidId: string) {
  return prisma.award.findUnique({
    where: { bidId },
    include: {
      solicitation: true,
      lot: true,
      bid: true,
      vendor: true,
      contract: true,
    },
  });
}

export async function findAwardBySolicitationAndVendor(
  solicitationId: string,
  vendorId: string,
) {
  return prisma.award.findFirst({
    where: {
      solicitationId,
      vendorId,
    },
    include: {
      lot: true,
      bid: true,
      vendor: true,
    },
  });
}

export async function createAward(data: Prisma.AwardCreateInput) {
  return prisma.award.create({
    data,
  });
}

export async function updateAward(
  id: string,
  data: Prisma.AwardUpdateInput,
) {
  return prisma.award.update({
    where: { id },
    data,
  });
}

export async function updateAwardStatus(
  id: string,
  status: AwardStatus,
) {
  return prisma.award.update({
    where: { id },
    data: { status },
  });
}

export async function approveAward(id: string) {
  return prisma.award.update({
    where: { id },
    data: {
      status: AwardStatus.APPROVED,
    },
  });
}

export async function acceptAward(id: string) {
  return prisma.award.update({
    where: { id },
    data: {
      status: AwardStatus.ACCEPTED,
    },
  });
}

export async function declineAward(id: string) {
  return prisma.award.update({
    where: { id },
    data: {
      status: AwardStatus.DECLINED,
    },
  });
}

export async function cancelAward(id: string) {
  return prisma.award.update({
    where: { id },
    data: {
      status: AwardStatus.CANCELLED,
    },
  });
}

export async function deleteAward(id: string) {
  return prisma.award.delete({
    where: { id },
  });
}

export async function listAwards({
  solicitationId,
  lotId,
  vendorId,
  bidId,
  status,
  skip = 0,
  take = 20,
}: {
  solicitationId?: string;
  lotId?: string;
  vendorId?: string;
  bidId?: string;
  status?: AwardStatus;
  skip?: number;
  take?: number;
}) {
  const where: Prisma.AwardWhereInput = {
    ...(solicitationId ? { solicitationId } : {}),
    ...(lotId ? { lotId } : {}),
    ...(vendorId ? { vendorId } : {}),
    ...(bidId ? { bidId } : {}),
    ...(status ? { status } : {}),
  };

  return prisma.award.findMany({
    where,
    include: {
      solicitation: true,
      lot: true,
      bid: true,
      vendor: true,
      contract: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

export async function countAwards({
  solicitationId,
  lotId,
  vendorId,
  bidId,
  status,
}: {
  solicitationId?: string;
  lotId?: string;
  vendorId?: string;
  bidId?: string;
  status?: AwardStatus;
}) {
  const where: Prisma.AwardWhereInput = {
    ...(solicitationId ? { solicitationId } : {}),
    ...(lotId ? { lotId } : {}),
    ...(vendorId ? { vendorId } : {}),
    ...(bidId ? { bidId } : {}),
    ...(status ? { status } : {}),
  };

  return prisma.award.count({
    where,
  });
}