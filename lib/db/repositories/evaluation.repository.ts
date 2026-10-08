import { EvaluationStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export async function findEvaluationById(id: string) {
  return prisma.evaluation.findUnique({
    where: { id },
  });
}

export async function findEvaluationWithDetails(id: string) {
  return prisma.evaluation.findUnique({
    where: { id },
    include: {
      bid: {
        include: {
          solicitation: true,
          lot: true,
          vendor: true,
        },
      },
      evaluator: true,
      scores: {
        include: {
          criterion: true,
        },
        orderBy: {
          criterion: {
            sortOrder: "asc",
          },
        },
      },
    },
  });
}

export async function findEvaluationByBidAndEvaluator(
  bidId: string,
  evaluatorId: string,
) {
  return prisma.evaluation.findFirst({
    where: {
      bidId,
      evaluatorId,
    },
    include: {
      scores: {
        include: {
          criterion: true,
        },
      },
    },
  });
}

export async function createEvaluation(
  data: Prisma.EvaluationCreateInput,
) {
  return prisma.evaluation.create({
    data,
  });
}

export async function updateEvaluation(
  id: string,
  data: Prisma.EvaluationUpdateInput,
) {
  return prisma.evaluation.update({
    where: { id },
    data,
  });
}

export async function updateEvaluationStatus(
  id: string,
  status: EvaluationStatus,
) {
  return prisma.evaluation.update({
    where: { id },
    data: { status },
  });
}

export async function completeEvaluation(id: string) {
  return prisma.evaluation.update({
    where: { id },
    data: {
      status: EvaluationStatus.COMPLETED,
      completedAt: new Date(),
    },
  });
}

export async function approveEvaluation(id: string) {
  return prisma.evaluation.update({
    where: { id },
    data: {
      status: EvaluationStatus.APPROVED,
    },
  });
}

export async function deleteEvaluation(id: string) {
  return prisma.evaluation.delete({
    where: { id },
  });
}

export async function listEvaluations({
  bidId,
  solicitationId,
  evaluatorId,
  status,
  skip = 0,
  take = 20,
}: {
  bidId?: string;
  solicitationId?: string;
  evaluatorId?: string;
  status?: EvaluationStatus;
  skip?: number;
  take?: number;
}) {
  const where: Prisma.EvaluationWhereInput = {
    ...(bidId ? { bidId } : {}),
    ...(solicitationId
      ? {
          bid: {
            solicitationId,
          },
        }
      : {}),
    ...(evaluatorId ? { evaluatorId } : {}),
    ...(status ? { status } : {}),
  };

  return prisma.evaluation.findMany({
    where,
    include: {
      bid: {
        include: {
          vendor: true,
          solicitation: true,
          lot: true,
        },
      },
      evaluator: true,
      scores: {
        include: {
          criterion: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take,
  });
}

export async function countEvaluations({
  bidId,
  solicitationId,
  evaluatorId,
  status,
}: {
  bidId?: string;
  solicitationId?: string;
  evaluatorId?: string;
  status?: EvaluationStatus;
}) {
  const where: Prisma.EvaluationWhereInput = {
    ...(bidId ? { bidId } : {}),
    ...(solicitationId
      ? {
          bid: {
            solicitationId,
          },
        }
      : {}),
    ...(evaluatorId ? { evaluatorId } : {}),
    ...(status ? { status } : {}),
  };

  return prisma.evaluation.count({
    where,
  });
}

export async function addEvaluationScore(
  data: Prisma.EvaluationScoreCreateInput,
) {
  return prisma.evaluationScore.create({
    data,
  });
}

export async function updateEvaluationScore(
  id: string,
  data: Prisma.EvaluationScoreUpdateInput,
) {
  return prisma.evaluationScore.update({
    where: { id },
    data,
  });
}

export async function removeEvaluationScore(id: string) {
  return prisma.evaluationScore.delete({
    where: { id },
  });
}

export async function findEvaluationScore(
  evaluationId: string,
  criterionId: string,
) {
  return prisma.evaluationScore.findFirst({
    where: {
      evaluationId,
      criterionId,
    },
  });
}

export async function findEvaluationScoreById(id: string) {
  return prisma.evaluationScore.findUnique({
    where: { id },
  });
}

export async function listEvaluationScores(
  evaluationId: string,
) {
  return prisma.evaluationScore.findMany({
    where: {
      evaluationId,
    },
    include: {
      criterion: true,
    },
    orderBy: {
      criterion: {
        sortOrder: "asc",
      },
    },
  });
}