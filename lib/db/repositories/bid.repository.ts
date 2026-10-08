import { BidStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function findBidById(id: string) {
  return prisma.bid.findUnique({
    where: { id },
  });
}

export async function findBidByNumber(
  solicitationId: string,
  bidNumber: string,
) {
  return prisma.bid.findFirst({
    where: {
      solicitationId,
      bidNumber,
    },
  });
}

export async function findBidWithDetails(id: string) {
  return prisma.bid.findUnique({
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
      vendor: {
        include: {
          user: true,
          country: true,
        },
      },
      submittedBy: true,
      documents: true,
      requirementResponses: {
        include: {
          requirement: true,
        },
      },
      evaluations: {
        include: {
          evaluator: true,
          scores: {
            include: {
              criterion: true,
            },
          },
        },
      },
      award: {
        include: {
          vendor: true,
        },
      },
    },
  });
}

export async function createBid(data: Prisma.BidCreateInput) {
  return prisma.bid.create({
    data,
  });
}

export async function updateBid(
  id: string,
  data: Prisma.BidUpdateInput,
) {
  return prisma.bid.update({
    where: { id },
    data,
  });
}

export async function updateBidStatus(
  id: string,
  status: BidStatus,
) {
  return prisma.bid.update({
    where: { id },
    data: { status },
  });
}

export async function submitBid(id: string) {
  return prisma.bid.update({
    where: { id },
    data: {
      status: BidStatus.SUBMITTED,
      submittedAt: new Date(),
      lockedAt: new Date(),
    },
  });
}

export async function withdrawBid(
  id: string,
  withdrawalReason: string,
) {
  return prisma.bid.update({
    where: { id },
    data: {
      status: BidStatus.WITHDRAWN,
      withdrawalReason,
    },
  });
}

export async function deleteBid(id: string) {
  return prisma.bid.delete({
    where: { id },
  });
}

export async function listBids({
  solicitationId,
  lotId,
  vendorId,
  status,
  search,
  skip = 0,
  take = 20,
}: {
  solicitationId?: string;
  lotId?: string;
  vendorId?: string;
  status?: BidStatus;
  search?: string;
  skip?: number;
  take?: number;
}) {
  const where: Prisma.BidWhereInput = {
    ...(solicitationId ? { solicitationId } : {}),
    ...(lotId ? { lotId } : {}),
    ...(vendorId ? { vendorId } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            {
              bidNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              summary: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.bid.findMany({
    where,
    include: {
      solicitation: true,
      lot: true,
      vendor: true,
      submittedBy: true,
      award: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

export async function countBids({
  solicitationId,
  lotId,
  vendorId,
  status,
  search,
}: {
  solicitationId?: string;
  lotId?: string;
  vendorId?: string;
  status?: BidStatus;
  search?: string;
}) {
  const where: Prisma.BidWhereInput = {
    ...(solicitationId ? { solicitationId } : {}),
    ...(lotId ? { lotId } : {}),
    ...(vendorId ? { vendorId } : {}),
    ...(status ? { status } : {}),
    ...(search
      ? {
          OR: [
            {
              bidNumber: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              title: {
                contains: search,
                mode: "insensitive",
              },
            },
            {
              summary: {
                contains: search,
                mode: "insensitive",
              },
            },
          ],
        }
      : {}),
  };

  return prisma.bid.count({
    where,
  });
}

export async function addBidDocument(
  data: Prisma.BidDocumentCreateInput,
) {
  return prisma.bidDocument.create({
    data,
  });
}

export async function updateBidDocument(
  id: string,
  data: Prisma.BidDocumentUpdateInput,
) {
  return prisma.bidDocument.update({
    where: { id },
    data,
  });
}

export async function removeBidDocument(id: string) {
  return prisma.bidDocument.delete({
    where: { id },
  });
}

export async function addBidRequirementResponse(
  data: Prisma.BidRequirementResponseCreateInput,
) {
  return prisma.bidRequirementResponse.create({
    data,
  });
}

export async function updateBidRequirementResponse(
  id: string,
  data: Prisma.BidRequirementResponseUpdateInput,
) {
  return prisma.bidRequirementResponse.update({
    where: { id },
    data,
  });
}

export async function removeBidRequirementResponse(id: string) {
  return prisma.bidRequirementResponse.delete({
    where: { id },
  });
}

export async function findBidRequirementResponse(
  bidId: string,
  requirementId: string,
) {
  return prisma.bidRequirementResponse.findFirst({
    where: {
      bidId,
      requirementId,
    },
  });
}