import {
  EvaluationStatus,
} from "@prisma/client";

import {
  createEvaluation,
  deleteEvaluation,
  findEvaluationById,
  listEvaluations,
  updateEvaluation,
  updateEvaluationStatus,
} from "@/lib/db/repositories/evaluation.repository";
import { prisma } from "@/lib/db/prisma";

export interface CreateEvaluationInput {
  solicitationId: string;
  bidId: string;
  evaluatorId: string;
  status?: EvaluationStatus;
  comments?: string | null;
  totalScore?: number | null;
}

export interface UpdateEvaluationInput {
  solicitationId?: string;
  bidId?: string;
  evaluatorId?: string;
  status?: EvaluationStatus;
  comments?: string | null;
  totalScore?: number | null;
  completedAt?: Date | null;
}

export interface ListEvaluationsInput {
  solicitationId?: string;
  bidId?: string;
  evaluatorId?: string;
  status?: EvaluationStatus;
  page?: number;
  pageSize?: number;
}

function normalizeRequiredString(
  value: string,
): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error("Required value cannot be empty.");
  }

  return normalized;
}

function normalizeOptionalString(
  value?: string | null,
): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeScore(
  value?: number | null,
): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  const normalized = Number(value);

  if (!Number.isFinite(normalized)) {
    throw new Error(
      "Total score must be a valid number.",
    );
  }

  if (normalized < 0) {
    throw new Error(
      "Total score cannot be negative.",
    );
  }

  return normalized;
}

function normalizeDate(
  value?: Date | null,
): Date | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error("Invalid date.");
    }

    return value;
  }

  const normalized = new Date(value);

  if (Number.isNaN(normalized.getTime())) {
    throw new Error("Invalid date.");
  }

  return normalized;
}

export async function getEvaluationById(
  id: string,
) {
  return findEvaluationById(id);
}

export async function getEvaluations(
  input: ListEvaluationsInput = {},
) {
  const page = Math.max(
    1,
    Math.floor(input.page ?? 1),
  );

  const pageSize = Math.min(
    100,
    Math.max(
      1,
      Math.floor(input.pageSize ?? 20),
    ),
  );

  const skip = (page - 1) * pageSize;

  return listEvaluations({
    solicitationId: input.solicitationId,
    bidId: input.bidId,
    evaluatorId: input.evaluatorId,
    status: input.status,
    skip,
    take: pageSize,
  });
}

export async function createNewEvaluation(
  input: CreateEvaluationInput,
) {
  const solicitationId =
    normalizeRequiredString(
      input.solicitationId,
    );

  const bidId = normalizeRequiredString(
    input.bidId,
  );

  const evaluatorId =
    normalizeRequiredString(
      input.evaluatorId,
    );

  /*
   * Verify that the bid belongs to the
   * solicitation supplied by the caller.
   *
   * The current schema reaches the solicitation
   * through Bid; Evaluation itself has no
   * solicitationId field.
   */
  const bid = await prisma.bid.findFirst({
    where: {
      id: bidId,
      solicitationId,
    },
    select: {
      id: true,
    },
  });

  if (!bid) {
    throw new Error(
      "Bid does not belong to the specified solicitation.",
    );
  }

  const existingEvaluation =
    await prisma.evaluation.findFirst({
      where: {
        bidId,
        evaluatorId,
      },
      select: {
        id: true,
      },
    });

  if (existingEvaluation) {
    throw new Error(
      "An evaluation already exists for this bid and evaluator.",
    );
  }

  const totalScore = normalizeScore(
    input.totalScore,
  );

  return createEvaluation({
    bid: {
      connect: {
        id: bidId,
      },
    },
    evaluator: {
      connect: {
        id: evaluatorId,
      },
    },
    status:
      input.status ??
      EvaluationStatus.DRAFT,
    ...(input.comments !== undefined
      ? {
          comments:
            normalizeOptionalString(
              input.comments,
            ),
        }
      : {}),
    ...(totalScore !== undefined
      ? {
          totalScore,
        }
      : {}),
  });
}

export async function editEvaluation(
  id: string,
  input: UpdateEvaluationInput,
) {
  const existingEvaluation =
    await findEvaluationById(id);

  if (!existingEvaluation) {
    throw new Error(
      "Evaluation not found.",
    );
  }

  const data: Parameters<
    typeof updateEvaluation
  >[1] = {};

  if (input.status !== undefined) {
    data.status = input.status;
  }

  if (input.comments !== undefined) {
    data.comments =
      normalizeOptionalString(
        input.comments,
      );
  }

  if (input.totalScore !== undefined) {
    const totalScore = normalizeScore(
      input.totalScore,
    );

    if (totalScore !== undefined) {
      data.totalScore = totalScore;
    }
  }

  if (input.completedAt !== undefined) {
    data.completedAt =
      normalizeDate(
        input.completedAt,
      );
  }

  /*
   * Evaluation belongs to a Bid. If the caller
   * requests a bid change, validate that the new
   * bid belongs to the requested solicitation
   * when one is supplied.
   */
  if (
    input.bidId !== undefined ||
    input.solicitationId !== undefined
  ) {
    const bidId =
      input.bidId ??
      existingEvaluation.bidId;

    const solicitationId =
      input.solicitationId;

    const bid = await prisma.bid.findFirst({
      where: {
        id: bidId,
        ...(solicitationId
          ? { solicitationId }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (!bid) {
      throw new Error(
        "Bid does not belong to the specified solicitation.",
      );
    }

    if (input.bidId !== undefined) {
      data.bid = {
        connect: {
          id: bidId,
        },
      };
    }
  }

  if (
    input.evaluatorId !== undefined
  ) {
    const evaluatorId =
      normalizeRequiredString(
        input.evaluatorId,
      );

    data.evaluator = {
      connect: {
        id: evaluatorId,
      },
    };
  }

  return updateEvaluation(id, data);
}

export async function changeEvaluationStatus(
  id: string,
  status: EvaluationStatus,
) {
  const existingEvaluation =
    await findEvaluationById(id);

  if (!existingEvaluation) {
    throw new Error(
      "Evaluation not found.",
    );
  }

  return updateEvaluationStatus(
    id,
    status,
  );
}

export async function removeEvaluation(
  id: string,
) {
  const existingEvaluation =
    await findEvaluationById(id);

  if (!existingEvaluation) {
    throw new Error(
      "Evaluation not found.",
    );
  }

  return deleteEvaluation(id);
}

export async function startEvaluation(
  id: string,
) {
  const existingEvaluation =
    await findEvaluationById(id);

  if (!existingEvaluation) {
    throw new Error(
      "Evaluation not found.",
    );
  }

  if (
    existingEvaluation.status !==
    EvaluationStatus.DRAFT
  ) {
    throw new Error(
      "Only draft evaluations can be started.",
    );
  }

  return updateEvaluationStatus(
    id,
    EvaluationStatus.IN_PROGRESS,
  );
}

export async function completeEvaluation(
  id: string,
) {
  const existingEvaluation =
    await findEvaluationById(id);

  if (!existingEvaluation) {
    throw new Error(
      "Evaluation not found.",
    );
  }

  if (
    existingEvaluation.status !==
    EvaluationStatus.IN_PROGRESS
  ) {
    throw new Error(
      "Only evaluations in progress can be completed.",
    );
  }

  const completedAt = new Date();

  return updateEvaluation(id, {
    status:
      EvaluationStatus.COMPLETED,
    completedAt,
  });
}

export async function approveEvaluation(
  id: string,
) {
  const existingEvaluation =
    await findEvaluationById(id);

  if (!existingEvaluation) {
    throw new Error(
      "Evaluation not found.",
    );
  }

  if (
    existingEvaluation.status !==
    EvaluationStatus.COMPLETED
  ) {
    throw new Error(
      "Only completed evaluations can be approved.",
    );
  }

  return updateEvaluationStatus(
    id,
    EvaluationStatus.APPROVED,
  );
}

export async function reopenEvaluation(
  id: string,
) {
  const existingEvaluation =
    await findEvaluationById(id);

  if (!existingEvaluation) {
    throw new Error(
      "Evaluation not found.",
    );
  }

  if (
    existingEvaluation.status !==
      EvaluationStatus.COMPLETED &&
    existingEvaluation.status !==
      EvaluationStatus.APPROVED
  ) {
    throw new Error(
      "Only completed or approved evaluations can be reopened.",
    );
  }

  return updateEvaluationStatus(
    id,
    EvaluationStatus.IN_PROGRESS,
  );
}