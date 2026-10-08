import { EvaluationStatus } from "@prisma/client";

import type { Evaluation } from "@prisma/client";

import {
  addEvaluationScore,
  findEvaluationScore,
  listEvaluationScores,
  removeEvaluationScore,
  updateEvaluationScore,
} from "@/lib/db/repositories/evaluation.repository";

import { prisma } from "@/lib/db/prisma";

export interface CreateScoreInput {
  evaluationId: string;
  criterionId: string;
  score: number;
  comment?: string | null;
}

export interface UpdateScoreInput {
  score?: number;
  comment?: string | null;
}

export interface EvaluationScoreSummary {
  totalScore: number;
  maximumScore: number;
  percentage: number;
  scoreCount: number;
}

export interface EvaluationScoringInput {
  scores: Array<{
    score: number;
    maximumScore: number;
  }>;
}

function normalizeScore(value: number): number {
  return Number(value);
}

function normalizeOptionalString(
  value?: string | null,
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function validateScore(score: number): void {
  if (!Number.isFinite(score)) {
    throw new Error(
      "Evaluation score must be a valid number.",
    );
  }

  if (score < 0) {
    throw new Error(
      "Evaluation score cannot be negative.",
    );
  }
}

function validateMaximumScore(
  maximumScore: number,
): void {
  if (!Number.isFinite(maximumScore)) {
    throw new Error(
      "Maximum score must be a valid number.",
    );
  }

  if (maximumScore <= 0) {
    throw new Error(
      "Maximum score must be greater than zero.",
    );
  }
}

function validateScoreAgainstMaximum(
  score: number,
  maximumScore: number,
): void {
  validateScore(score);
  validateMaximumScore(maximumScore);

  if (score > maximumScore) {
    throw new Error(
      "Evaluation score cannot exceed the maximum score.",
    );
  }
}

function decimalToNumber(
  value: unknown,
): number {
  return Number(value);
}

/**
 * Finds a score by its evaluation and criterion.
 *
 * The current repository does not expose a direct
 * findEvaluationScoreById() method.
 */
export async function getEvaluationScoreById(
  id: string,
) {
  return prisma.evaluationScore.findUnique({
    where: { id },
    include: {
      criterion: true,
      evaluation: true,
    },
  });
}

export async function getEvaluationScores(
  evaluationId: string,
) {
  return listEvaluationScores(evaluationId);
}

export async function createScore(
  input: CreateScoreInput,
) {
  const score = normalizeScore(input.score);

  validateScore(score);

  const criterion =
    await prisma.evaluationCriterion.findUnique({
      where: {
        id: input.criterionId,
      },
      select: {
        id: true,
        maxScore: true,
        weight: true,
      },
    });

  if (!criterion) {
    throw new Error(
      "Evaluation criterion not found.",
    );
  }

  const maximumScore =
    decimalToNumber(criterion.maxScore);

  const weight =
    decimalToNumber(criterion.weight);

  validateScoreAgainstMaximum(
    score,
    maximumScore,
  );

  if (!Number.isFinite(weight)) {
    throw new Error(
      "Evaluation criterion weight must be a valid number.",
    );
  }

  if (weight < 0) {
    throw new Error(
      "Evaluation criterion weight cannot be negative.",
    );
  }

  const weightedScore =
    calculateWeightedScore(
      score,
      maximumScore,
      weight,
    );

  return addEvaluationScore({
    evaluation: {
      connect: {
        id: input.evaluationId,
      },
    },
    criterion: {
      connect: {
        id: input.criterionId,
      },
    },
    score,
    weightedScore,
    comment: normalizeOptionalString(
      input.comment,
    ),
  });
}

export async function updateScore(
  id: string,
  input: UpdateScoreInput,
) {
  const existingScore =
    await getEvaluationScoreById(id);

  if (!existingScore) {
    throw new Error(
      "Evaluation score not found.",
    );
  }

  let weightedScore:
    | number
    | undefined;

  if (input.score !== undefined) {
    const score = normalizeScore(
      input.score,
    );

    validateScore(score);

    const criterion =
      await prisma.evaluationCriterion.findUnique({
        where: {
          id: existingScore.criterionId,
        },
        select: {
          maxScore: true,
          weight: true,
        },
      });

    if (!criterion) {
      throw new Error(
        "Evaluation criterion not found.",
      );
    }

    const maximumScore =
      decimalToNumber(
        criterion.maxScore,
      );

    const weight =
      decimalToNumber(
        criterion.weight,
      );

    validateScoreAgainstMaximum(
      score,
      maximumScore,
    );

    weightedScore =
      calculateWeightedScore(
        score,
        maximumScore,
        weight,
      );
  }

  return updateEvaluationScore(id, {
    score:
      input.score !== undefined
        ? normalizeScore(input.score)
        : undefined,

    weightedScore,

    comment:
      input.comment !== undefined
        ? normalizeOptionalString(
            input.comment,
          )
        : undefined,
  });
}

export async function removeScore(
  id: string,
) {
  const existingScore =
    await getEvaluationScoreById(id);

  if (!existingScore) {
    throw new Error(
      "Evaluation score not found.",
    );
  }

  return removeEvaluationScore(id);
}

export async function findScore(
  evaluationId: string,
  criterionId: string,
) {
  return findEvaluationScore(
    evaluationId,
    criterionId,
  );
}

export function calculateScorePercentage(
  score: number,
  maximumScore: number,
): number {
  validateScoreAgainstMaximum(
    score,
    maximumScore,
  );

  return (score / maximumScore) * 100;
}

export function calculateWeightedScore(
  score: number,
  maximumScore: number,
  weight: number,
): number {
  validateScoreAgainstMaximum(
    score,
    maximumScore,
  );

  if (!Number.isFinite(weight)) {
    throw new Error(
      "Weight must be a valid number.",
    );
  }

  if (weight < 0) {
    throw new Error(
      "Weight cannot be negative.",
    );
  }

  return (
    calculateScorePercentage(
      score,
      maximumScore,
    ) *
    weight
  );
}

export function calculateEvaluationTotal(
  input: EvaluationScoringInput,
): EvaluationScoreSummary {
  if (input.scores.length === 0) {
    return {
      totalScore: 0,
      maximumScore: 0,
      percentage: 0,
      scoreCount: 0,
    };
  }

  let totalScore = 0;
  let maximumScore = 0;

  for (const item of input.scores) {
    validateScoreAgainstMaximum(
      item.score,
      item.maximumScore,
    );

    totalScore += item.score;
    maximumScore += item.maximumScore;
  }

  const percentage =
    maximumScore > 0
      ? (totalScore / maximumScore) * 100
      : 0;

  return {
    totalScore,
    maximumScore,
    percentage,
    scoreCount: input.scores.length,
  };
}

export function calculateAverageScore(
  scores: number[],
): number {
  if (scores.length === 0) {
    return 0;
  }

  for (const score of scores) {
    validateScore(score);
  }

  const total = scores.reduce(
    (sum, score) => sum + score,
    0,
  );

  return total / scores.length;
}

export function calculatePercentageFromScores(
  scores: Array<{
    score: number;
    maximumScore: number;
  }>,
): number {
  return calculateEvaluationTotal({
    scores,
  }).percentage;
}

export function isPassingScore(
  score: number,
  maximumScore: number,
  passingPercentage: number,
): boolean {
  if (
    !Number.isFinite(passingPercentage) ||
    passingPercentage < 0 ||
    passingPercentage > 100
  ) {
    throw new Error(
      "Passing percentage must be between 0 and 100.",
    );
  }

  return (
    calculateScorePercentage(
      score,
      maximumScore,
    ) >= passingPercentage
  );
}

export function rankScores(
  scores: number[],
): number[] {
  if (scores.length === 0) {
    return [];
  }

  scores.forEach(validateScore);

  return [...scores].sort(
    (a, b) => b - a,
  );
}

export function getScoreRank(
  score: number,
  scores: number[],
): number {
  validateScore(score);

  if (scores.length === 0) {
    return 1;
  }

  scores.forEach(validateScore);

  const sortedScores = rankScores(scores);

  return (
    sortedScores.findIndex(
      (value) => value === score,
    ) + 1
  );
}

export function isEvaluationScorable(
  evaluation: Pick<Evaluation, "status">,
): boolean {
  return (
    evaluation.status ===
      EvaluationStatus.DRAFT ||
    evaluation.status ===
      EvaluationStatus.IN_PROGRESS
  );
}

export function assertEvaluationIsScorable(
  evaluation: Pick<Evaluation, "status">,
): void {
  if (!isEvaluationScorable(evaluation)) {
    throw new Error(
      "Scores cannot be modified for a completed or approved evaluation.",
    );
  }
}
