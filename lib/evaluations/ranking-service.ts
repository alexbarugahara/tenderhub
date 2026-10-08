import {
  BidStatus,
  EvaluationStatus,
} from "@prisma/client";

import {
  findEvaluationById,
  listEvaluations,
} from "@/lib/db/repositories/evaluation.repository";

import {
  calculateScorePercentage,
} from "@/lib/evaluations/scoring-service";

export interface BidRankingInput {
  bidId: string;
  score: number;
  maximumScore: number;
}

export interface RankedBid {
  bidId: string;
  score: number;
  maximumScore: number;
  percentage: number;
  rank: number;
}

export interface EvaluationRankingInput {
  evaluationId: string;
  totalScore: number;
  maximumScore: number;
}

export interface RankedEvaluation {
  evaluationId: string;
  totalScore: number;
  maximumScore: number;
  percentage: number;
  rank: number;
}

function validateNumber(
  value: number,
  label: string,
): void {
  if (!Number.isFinite(value)) {
    throw new Error(
      `${label} must be a valid number.`,
    );
  }
}

function validateNonNegative(
  value: number,
  label: string,
): void {
  validateNumber(value, label);

  if (value < 0) {
    throw new Error(
      `${label} cannot be negative.`,
    );
  }
}

function validateMaximumScore(
  maximumScore: number,
): void {
  validateNumber(
    maximumScore,
    "Maximum score",
  );

  if (maximumScore <= 0) {
    throw new Error(
      "Maximum score must be greater than zero.",
    );
  }
}

function validateScoreRange(
  score: number,
  maximumScore: number,
): void {
  validateNonNegative(score, "Score");
  validateMaximumScore(maximumScore);

  if (score > maximumScore) {
    throw new Error(
      "Score cannot exceed the maximum score.",
    );
  }
}

export function rankBids(
  bids: BidRankingInput[],
): RankedBid[] {
  const ranked = bids.map((bid) => {
    validateScoreRange(
      bid.score,
      bid.maximumScore,
    );

    return {
      bidId: bid.bidId,
      score: bid.score,
      maximumScore: bid.maximumScore,
      percentage: calculateScorePercentage(
        bid.score,
        bid.maximumScore,
      ),
      rank: 0,
    };
  });

  ranked.sort(
    (a, b) => b.percentage - a.percentage,
  );

  let previousPercentage: number | null = null;
  let currentRank = 0;

  ranked.forEach((bid, index) => {
    if (
      previousPercentage === null ||
      bid.percentage !== previousPercentage
    ) {
      currentRank = index + 1;
    }

    bid.rank = currentRank;
    previousPercentage = bid.percentage;
  });

  return ranked;
}

export function rankEvaluations(
  evaluations: EvaluationRankingInput[],
): RankedEvaluation[] {
  const ranked = evaluations.map(
    (evaluation) => {
      validateScoreRange(
        evaluation.totalScore,
        evaluation.maximumScore,
      );

      return {
        evaluationId:
          evaluation.evaluationId,
        totalScore:
          evaluation.totalScore,
        maximumScore:
          evaluation.maximumScore,
        percentage:
          calculateScorePercentage(
            evaluation.totalScore,
            evaluation.maximumScore,
          ),
        rank: 0,
      };
    },
  );

  ranked.sort(
    (a, b) => b.percentage - a.percentage,
  );

  let previousPercentage: number | null = null;
  let currentRank = 0;

  ranked.forEach((evaluation, index) => {
    if (
      previousPercentage === null ||
      evaluation.percentage !==
        previousPercentage
    ) {
      currentRank = index + 1;
    }

    evaluation.rank = currentRank;
    previousPercentage =
      evaluation.percentage;
  });

  return ranked;
}

export function getRankedBid(
  bids: BidRankingInput[],
  bidId: string,
): RankedBid | null {
  const ranked = rankBids(bids);

  return (
    ranked.find(
      (bid) => bid.bidId === bidId,
    ) ?? null
  );
}

export function getRankedEvaluation(
  evaluations: EvaluationRankingInput[],
  evaluationId: string,
): RankedEvaluation | null {
  const ranked =
    rankEvaluations(evaluations);

  return (
    ranked.find(
      (evaluation) =>
        evaluation.evaluationId ===
        evaluationId,
    ) ?? null
  );
}

export function getBidRankingPosition(
  bids: BidRankingInput[],
  bidId: string,
): number | null {
  const ranked = getRankedBid(
    bids,
    bidId,
  );

  return ranked?.rank ?? null;
}

export function getEvaluationRankingPosition(
  evaluations: EvaluationRankingInput[],
  evaluationId: string,
): number | null {
  const ranked =
    getRankedEvaluation(
      evaluations,
      evaluationId,
    );

  return ranked?.rank ?? null;
}

export function getTopRankedBids(
  bids: BidRankingInput[],
  limit = 10,
): RankedBid[] {
  const normalizedLimit = Math.max(
    1,
    Math.min(100, Math.floor(limit)),
  );

  return rankBids(bids).slice(
    0,
    normalizedLimit,
  );
}

export function getTopRankedEvaluations(
  evaluations: EvaluationRankingInput[],
  limit = 10,
): RankedEvaluation[] {
  const normalizedLimit = Math.max(
    1,
    Math.min(100, Math.floor(limit)),
  );

  return rankEvaluations(
    evaluations,
  ).slice(0, normalizedLimit);
}

export function calculateRankingPercentage(
  score: number,
  maximumScore: number,
): number {
  return calculateScorePercentage(
    score,
    maximumScore,
  );
}

export function compareRankedBids(
  first: BidRankingInput,
  second: BidRankingInput,
): number {
  validateScoreRange(
    first.score,
    first.maximumScore,
  );

  validateScoreRange(
    second.score,
    second.maximumScore,
  );

  const firstPercentage =
    calculateScorePercentage(
      first.score,
      first.maximumScore,
    );

  const secondPercentage =
    calculateScorePercentage(
      second.score,
      second.maximumScore,
    );

  return secondPercentage - firstPercentage;
}

export function hasHigherRank(
  first: RankedBid,
  second: RankedBid,
): boolean {
  return first.rank < second.rank;
}

export function isTopRanked(
  rankedBid: RankedBid,
): boolean {
  return rankedBid.rank === 1;
}

export function getRankingSummary(
  bids: BidRankingInput[],
): {
  totalBids: number;
  highestScore: number;
  lowestScore: number;
  averagePercentage: number;
} {
  if (bids.length === 0) {
    return {
      totalBids: 0,
      highestScore: 0,
      lowestScore: 0,
      averagePercentage: 0,
    };
  }

  const ranked = rankBids(bids);

  const percentages = ranked.map(
    (bid) => bid.percentage,
  );

  const totalPercentage =
    percentages.reduce(
      (sum, percentage) =>
        sum + percentage,
      0,
    );

  return {
    totalBids: ranked.length,
    highestScore:
      ranked[0]?.percentage ?? 0,
    lowestScore:
      ranked[ranked.length - 1]?.percentage ??
      0,
    averagePercentage:
      totalPercentage / ranked.length,
  };
}

export async function getEvaluationRanking(
  solicitationId: string,
) {
  return listEvaluations({
    solicitationId,
    status: EvaluationStatus.COMPLETED,
    skip: 0,
    take: 100,
  });
}

export async function getEvaluationRankingById(
  evaluationId: string,
) {
  const evaluation =
    await findEvaluationById(
      evaluationId,
    );

  if (!evaluation) {
    throw new Error(
      "Evaluation not found.",
    );
  }

  if (
    evaluation.status !==
      EvaluationStatus.COMPLETED &&
    evaluation.status !==
      EvaluationStatus.APPROVED
  ) {
    throw new Error(
      "Only completed or approved evaluations can be ranked.",
    );
  }

  return evaluation;
}

export function canRankBid(
  bid: {
    status: BidStatus;
  },
): boolean {
  return (
    bid.status === BidStatus.EVALUATED ||
    bid.status === BidStatus.SHORTLISTED ||
    bid.status === BidStatus.COMPLIANT
  );
}

export function canRankEvaluation(
  evaluation: {
    status: EvaluationStatus;
  },
): boolean {
  return (
    evaluation.status ===
      EvaluationStatus.COMPLETED ||
    evaluation.status ===
      EvaluationStatus.APPROVED
  );
}