"use client";

import React, { useMemo } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export interface BidComparisonCriterion {
  id: string;
  name: string;
  weight: number | string;
  maxScore: number | string;
  sortOrder: number;
}

export interface BidComparisonScore {
  evaluationId: string;
  criterionId: string;
  score: number | string;
  weightedScore?: number | string | null;
  comment?: string | null;
}

export interface BidComparisonEvaluation {
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

export interface BidComparisonBid {
  id: string;
  bidNumber: string;
  vendorName?: string | null;
  title?: string | null;
  totalAmount: number | string;
  currencyCode?: string | null;
}

export interface BidComparisonProps {
  criteria: BidComparisonCriterion[];
  evaluations: BidComparisonEvaluation[];
  scores: BidComparisonScore[];
  bids: BidComparisonBid[];
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
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function formatAmount(
  value: number | string,
  currencyCode?: string | null,
): string {
  return `${currencyCode ? `${currencyCode} ` : ""}${new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(toNumber(value))}`;
}

function getStatusLabel(
  status: BidComparisonEvaluation["status"],
): string {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress";
    default:
      return status.charAt(0) + status.slice(1).toLowerCase();
  }
}

function getStatusVariant(
  status: BidComparisonEvaluation["status"],
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

export default function BidComparison({
  criteria,
  evaluations,
  scores,
  bids,
  className = "",
}: BidComparisonProps) {
  const sortedCriteria = useMemo(
    () =>
      [...criteria].sort(
        (first, second) => first.sortOrder - second.sortOrder,
      ),
    [criteria],
  );

  const bidMap = useMemo(() => {
    const map = new Map<string, BidComparisonBid>();

    bids.forEach((bid) => {
      map.set(bid.id, bid);
    });

    return map;
  }, [bids]);

  const scoreMap = useMemo(() => {
    const map = new Map<string, BidComparisonScore>();

    scores.forEach((score) => {
      map.set(
        `${score.evaluationId}:${score.criterionId}`,
        score,
      );
    });

    return map;
  }, [scores]);

  const comparisonRows = useMemo(() => {
    return evaluations
      .map((evaluation) => {
        const bid = bidMap.get(evaluation.bidId);

        if (!bid) {
          return null;
        }

        const criterionScores = sortedCriteria.map((criterion) => {
          const score = scoreMap.get(
            `${evaluation.id}:${criterion.id}`,
          );

          const rawScore = score ? toNumber(score.score) : 0;
          const maxScore = toNumber(criterion.maxScore);
          const weight = toNumber(criterion.weight);

          const percentage =
            maxScore > 0 ? (rawScore / maxScore) * 100 : 0;

          const weightedScore =
            score?.weightedScore !== null &&
            score?.weightedScore !== undefined
              ? toNumber(score.weightedScore)
              : maxScore > 0
                ? (rawScore / maxScore) * weight
                : 0;

          return {
            criterion,
            score,
            rawScore,
            percentage,
            weightedScore,
          };
        });

        return {
          evaluation,
          bid,
          criterionScores,
          totalScore: toNumber(evaluation.totalScore),
        };
      })
      .filter(
        (
          row,
        ): row is NonNullable<typeof row> => row !== null,
      )
      .sort((first, second) => {
        return second.totalScore - first.totalScore;
      });
  }, [evaluations, bidMap, sortedCriteria, scoreMap]);

  if (comparisonRows.length === 0) {
    return (
      <Card className={className}>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Bid Comparison
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            No evaluated bids are available for comparison.
          </p>
        </div>
      </Card>
    );
  }

  const highestTotalScore = Math.max(
    ...comparisonRows.map((row) => row.totalScore),
  );

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-tenderhub-navy">
          Bid Comparison
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Compare evaluated bids by price and evaluation criteria.
        </p>
      </div>

      <div className="-mx-6 overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-y border-gray-200 bg-gray-50">
              <th className="min-w-[190px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Bid / Vendor
              </th>

              <th className="min-w-[150px] px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Bid Amount
              </th>

              {sortedCriteria.map((criterion) => (
                <th
                  key={criterion.id}
                  className="min-w-[150px] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500"
                >
                  <div>{criterion.name}</div>

                  <div className="mt-1 font-normal normal-case">
                    {formatNumber(criterion.weight)}% weight
                  </div>
                </th>
              ))}

              <th className="min-w-[110px] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                Total Score
              </th>

              <th className="min-w-[120px] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {comparisonRows.map((row) => {
              const isHighest =
                highestTotalScore > 0 &&
                row.totalScore === highestTotalScore;

              return (
                <tr
                  key={row.evaluation.id}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  <td className="px-4 py-4 align-top">
                    <p className="text-sm font-semibold text-gray-900">
                      {row.bid.bidNumber}
                    </p>

                    <p className="mt-1 text-sm text-gray-600">
                      {row.bid.vendorName ||
                        "Vendor not specified"}
                    </p>

                    {row.bid.title && (
                      <p className="mt-1 text-xs text-gray-500">
                        {row.bid.title}
                      </p>
                    )}
                  </td>

                  <td className="px-4 py-4 text-right align-top">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatAmount(
                        row.bid.totalAmount,
                        row.bid.currencyCode,
                      )}
                    </p>
                  </td>

                  {row.criterionScores.map((criterionScore) => (
                    <td
                      key={criterionScore.criterion.id}
                      className="px-4 py-4 text-center align-top"
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {criterionScore.score
                          ? formatNumber(
                              criterionScore.rawScore,
                            )
                          : "—"}

                        <span className="font-normal text-gray-400">
                          {" "}
                          /{" "}
                          {formatNumber(
                            criterionScore.criterion.maxScore,
                          )}
                        </span>
                      </p>

                      {criterionScore.score && (
                        <p className="mt-1 text-xs text-gray-500">
                          {formatNumber(
                            criterionScore.percentage,
                          )}
                          %
                        </p>
                      )}

                      <p className="mt-2 text-xs font-medium text-tenderhub-navy">
                        Weighted:{" "}
                        {formatNumber(
                          criterionScore.weightedScore,
                        )}
                      </p>

                      {criterionScore.score?.comment && (
                        <p className="mt-2 text-left text-xs leading-5 text-gray-500">
                          {criterionScore.score.comment}
                        </p>
                      )}
                    </td>
                  ))}

                  <td className="px-4 py-4 text-center align-top">
                    <p
                      className={
                        isHighest
                          ? "text-lg font-bold text-tenderhub-gold"
                          : "text-lg font-bold text-tenderhub-navy"
                      }
                    >
                      {formatNumber(row.totalScore)}
                    </p>

                    {isHighest && (
                      <div className="mt-2">
                        <Badge variant="primary">
                          Highest
                        </Badge>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-center align-top">
                    <Badge
                      variant={getStatusVariant(
                        row.evaluation.status,
                      )}
                    >
                      {getStatusLabel(row.evaluation.status)}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Bids Compared
          </p>

          <p className="mt-1 text-lg font-semibold text-tenderhub-navy">
            {comparisonRows.length}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Evaluation Criteria
          </p>

          <p className="mt-1 text-lg font-semibold text-tenderhub-navy">
            {sortedCriteria.length}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Highest Total Score
          </p>

          <p className="mt-1 text-lg font-semibold text-tenderhub-navy">
            {formatNumber(highestTotalScore)}
          </p>
        </div>
      </div>
    </Card>
  );
}
