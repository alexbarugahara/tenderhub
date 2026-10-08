import type { Prisma } from "@prisma/client";

export type Evaluation =
  Prisma.EvaluationGetPayload<{}>;

export type EvaluationWithRelations =
  Prisma.EvaluationGetPayload<{
    include: {
      bid: true;
      evaluator: true;
      scores: true;
    };
  }>;

export type EvaluationCreateInput =
  Prisma.EvaluationCreateInput;

export type EvaluationUpdateInput =
  Prisma.EvaluationUpdateInput;

export type EvaluationWhereInput =
  Prisma.EvaluationWhereInput;

export type EvaluationOrderByInput =
  Prisma.EvaluationOrderByWithRelationInput;

export type EvaluationListItem =
  Prisma.EvaluationGetPayload<{
    select: {
      id: true;
      bidId: true;
      status: true;
      totalScore: true;
      createdAt: true;
      updatedAt: true;
    };
  }>;