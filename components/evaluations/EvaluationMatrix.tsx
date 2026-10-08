"use client";

import React, { useMemo } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export interface EvaluationMatrixCriterion {
  id: string;
  name: string;
  weight: number | string;
  maxScore: number | string;
  sortOrder: number;
}

export interface EvaluationMatrixScore {
  evaluationId: string;
  criterionId: string;
  score: number | string;
  weightedScore?: number | string | null;
  comment?: string | null;
}

export interface EvaluationMatrixEvaluation {
  id: string;
  bidId: string;
  evaluatorId: string;
  status:
    | "DRAFT"
    | "IN_PROGRESS"
    | "COMPLETED"
    | "APPROVED";
  totalScore: number | string;
  comments?: string | null;
}

export interface EvaluationMatrixBid {
  id: string;
  bidNumber: string;
  vendorName?: string | null;
}

export interface EvaluationMatrixProps {
  criteria: EvaluationMatrixCriterion[];
  evaluations: EvaluationMatrixEvaluation[];
  scores: EvaluationMatrixScore[];
  bids: EvaluationMatrixBid[];
  className?: string;
}

function toNumber(
  value: number | string | null | undefined,
): number {
  const numericValue =
    typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatNumber(value: number | string): string {
  const numericValue = toNumber(value);

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function getStatusVariant(
  status: EvaluationMatrixEvaluation["status"],
): "default" | "info" | "success" | "warning" {
  switch (status) {
    case "APPROVED":
      return "success";
    case "COMPLETED":
      return "info";
    case "IN_PROGRESS":
      return "warning";
    default:
      return "default";
  }
}

function getStatusLabel(
  status: EvaluationMatrixEvaluation["status"],
): string {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

export default function EvaluationMatrix({
  criteria,
  evaluations,
  scores,
  bids,
  className = "",
}: EvaluationMatrixProps) {
  const sortedCriteria = useMemo(
    () =>
      [...criteria].sort(
        (first, second) =>
          first.sortOrder - second.sortOrder,
      ),
    [criteria],
  );

  const bidMap = useMemo(() => {
    const map = new Map<string, EvaluationMatrixBid>();

    bids.forEach((bid) => {
      map.set(bid.id, bid);
    });

    return map;
  }, [bids]);

  const scoreMap = useMemo(() => {
    const map = new Map<string, EvaluationMatrixScore>();

    scores.forEach((score) => {
      map.set(
        `${score.evaluationId}:${score.criterionId}`,
        score,
      );
    });

    return map;
  }, [scores]);

  const sortedEvaluations = useMemo(() => {
    return [...evaluations].sort((first, second) => {
      const firstScore = toNumber(first.totalScore);
      const secondScore = toNumber(second.totalScore);

      return secondScore - firstScore;
    });
  }, [evaluations]);

  const highestScore = useMemo(() => {
    if (sortedEvaluations.length === 0) {
      return 0;
    }

    return Math.max(
      ...sortedEvaluations.map((evaluation) =>
        toNumber(evaluation.totalScore),
      ),
    );
  }, [sortedEvaluations]);

  if (
    sortedCriteria.length === 0 ||
    sortedEvaluations.length === 0
  ) {
    return (
      <Card className={className}>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Evaluation Matrix
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Evaluation criteria and completed evaluations are
            required to display the matrix.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-tenderhub-navy">
          Evaluation Matrix
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Compare bid evaluation scores across the available
          criteria.
        </p>
      </div>

      <div className="-mx-6 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-y border-gray-200 bg-gray-50">
              <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Bid
              </th>

              {sortedCriteria.map((criterion) => (
                <th
                  key={criterion.id}
                  className="min-w-[140px] whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  <div>{criterion.name}</div>

                  <div className="mt-1 font-normal normal-case">
                    {formatNumber(criterion.weight)}% weight
                  </div>
                </th>
              ))}

              <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total
              </th>

              <th className="whitespace-nowrap px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedEvaluations.map((evaluation) => {
              const bid = bidMap.get(evaluation.bidId);
              const totalScore = toNumber(evaluation.totalScore);

              const isHighest =
                highestScore > 0 &&
                totalScore === highestScore;

              return (
                <tr
                  key={evaluation.id}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-4 align-top">
                    <div className="min-w-[180px]">
                      <p className="text-sm font-semibold text-gray-900">
                        {bid?.bidNumber || evaluation.bidId}
                      </p>

                      {bid?.vendorName && (
                        <p className="mt-1 text-xs text-gray-500">
                          {bid.vendorName}
                        </p>
                      )}
                    </div>
                  </td>

                  {sortedCriteria.map((criterion) => {
                    const score = scoreMap.get(
                      `${evaluation.id}:${criterion.id}`,
                    );

                    const rawScore = score
                      ? toNumber(score.score)
                      : 0;

                    const maxScore = toNumber(
                      criterion.maxScore,
                    );

                    const percentage =
                      maxScore > 0
                        ? (rawScore / maxScore) * 100
                        : 0;

                    const weightedScore =
                      score?.weightedScore !== null &&
                      score?.weightedScore !== undefined
                        ? toNumber(score.weightedScore)
                        : maxScore > 0
                          ? (rawScore / maxScore) *
                            toNumber(criterion.weight)
                          : 0;

                    return (
                      <td
                        key={criterion.id}
                        className="px-4 py-4 text-center align-top"
                      >
                        <div className="text-sm font-semibold text-gray-900">
                          {score
                            ? formatNumber(rawScore)
                            : "—"}

                          <span className="font-normal text-gray-400">
                            {" "}
                            / {formatNumber(maxScore)}
                          </span>
                        </div>

                        {score && (
                          <div className="mt-1 text-xs text-gray-500">
                            {formatNumber(percentage)}%
                          </div>
                        )}

                        <div className="mt-2 text-xs font-medium text-tenderhub-navy">
                          Weighted:{" "}
                          {formatNumber(weightedScore)}
                        </div>

                        {score?.comment && (
                          <p className="mt-2 max-w-[180px] text-left text-xs leading-5 text-gray-500">
                            {score.comment}
                          </p>
                        )}
                      </td>
                    );
                  })}

                  <td className="px-4 py-4 text-center align-top">
                    <div
                      className={
                        isHighest
                          ? "font-bold text-tenderhub-gold"
                          : "font-bold text-tenderhub-navy"
                      }
                    >
                      {formatNumber(totalScore)}
                    </div>

                    {isHighest && (
                      <div className="mt-1">
                        <Badge variant="primary">
                          Highest
                        </Badge>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center align-top">
                    <Badge
                      variant={getStatusVariant(
                        evaluation.status,
                      )}
                    >
                      {getStatusLabel(evaluation.status)}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
