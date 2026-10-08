"use client";

import React, { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type EvaluationScorecardStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "APPROVED";

export interface EvaluationScorecardCriterion {
  id: string;
  name: string;
  description?: string | null;
  weight: number | string;
  maxScore: number | string;
  sortOrder: number;
}

export interface EvaluationScorecardScore {
  id?: string;
  evaluationId?: string;
  criterionId: string;
  score: number | string;
  weightedScore?: number | string | null;
  comment?: string | null;
}

export interface EvaluationScorecardEvaluation {
  id: string;
  bidId: string;
  evaluatorId: string;
  status: EvaluationScorecardStatus;
  totalScore: number | string;
  comments?: string | null;
}

export interface EvaluationScorecardProps {
  evaluation: EvaluationScorecardEvaluation;
  criteria: EvaluationScorecardCriterion[];
  scores?: EvaluationScorecardScore[];
  readOnly?: boolean;
  disabled?: boolean;
  onScoreChange?: (
    criterionId: string,
    score: number,
    comment: string,
  ) => void;
  onSave?: (
    scores: EvaluationScorecardScore[],
    comments: string,
  ) => void;
  onComplete?: () => void;
  className?: string;
}

function toNumber(
  value: number | string | null | undefined,
): number {
  const numericValue =
    typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatNumber(
  value: number | string | null | undefined,
): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function getStatusVariant(
  status: EvaluationScorecardStatus,
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
  status: EvaluationScorecardStatus,
): string {
  switch (status) {
    case "IN_PROGRESS":
      return "In Progress";
    default:
      return (
        status.charAt(0) +
        status.slice(1).toLowerCase()
      );
  }
}

export default function EvaluationScorecard({
  evaluation,
  criteria,
  scores = [],
  readOnly = false,
  disabled = false,
  onScoreChange,
  onSave,
  onComplete,
  className = "",
}: EvaluationScorecardProps) {
  const sortedCriteria = useMemo(
    () =>
      [...criteria].sort(
        (first, second) =>
          first.sortOrder - second.sortOrder,
      ),
    [criteria],
  );

  const initialScores = useMemo(() => {
    const map = new Map<string, EvaluationScorecardScore>();

    scores.forEach((score) => {
      map.set(score.criterionId, score);
    });

    return map;
  }, [scores]);

  const [scoreValues, setScoreValues] =
    useState<Map<string, number>>(() => {
      const map = new Map<string, number>();

      initialScores.forEach((score, criterionId) => {
        map.set(criterionId, toNumber(score.score));
      });

      return map;
    });

  const [comments, setComments] = useState<
    Map<string, string>
  >(() => {
    const map = new Map<string, string>();

    initialScores.forEach((score, criterionId) => {
      map.set(criterionId, score.comment ?? "");
    });

    return map;
  });

  const [evaluationComments, setEvaluationComments] =
    useState(evaluation.comments ?? "");

  const totalWeightedScore = useMemo(() => {
    return sortedCriteria.reduce((total, criterion) => {
      const score = scoreValues.get(criterion.id) ?? 0;
      const maxScore = toNumber(criterion.maxScore);
      const weight = toNumber(criterion.weight);

      if (maxScore <= 0) {
        return total;
      }

      return total + (score / maxScore) * weight;
    }, 0);
  }, [scoreValues, sortedCriteria]);

  const scoredCriteriaCount = useMemo(() => {
    return sortedCriteria.filter((criterion) => {
      const score = scoreValues.get(criterion.id);

      return score !== undefined;
    }).length;
  }, [scoreValues, sortedCriteria]);

  const progressPercentage =
    sortedCriteria.length > 0
      ? (scoredCriteriaCount / sortedCriteria.length) * 100
      : 0;

  const handleScoreChange = (
    criterion: EvaluationScorecardCriterion,
    value: string,
  ) => {
    if (readOnly || disabled) {
      return;
    }

    const numericValue = Number(value);

    if (
      value !== "" &&
      (!Number.isFinite(numericValue) ||
        numericValue < 0 ||
        numericValue > toNumber(criterion.maxScore))
    ) {
      return;
    }

    const nextScores = new Map(scoreValues);

    if (value === "") {
      nextScores.delete(criterion.id);
    } else {
      nextScores.set(criterion.id, numericValue);
    }

    setScoreValues(nextScores);

    onScoreChange?.(
      criterion.id,
      numericValue,
      comments.get(criterion.id) ?? "",
    );
  };

  const handleCommentChange = (
    criterionId: string,
    value: string,
  ) => {
    if (readOnly || disabled) {
      return;
    }

    const nextComments = new Map(comments);
    nextComments.set(criterionId, value);
    setComments(nextComments);
  };

  const handleSave = () => {
    if (disabled || !onSave) {
      return;
    }

    const nextScores: EvaluationScorecardScore[] =
      sortedCriteria
        .filter((criterion) =>
          scoreValues.has(criterion.id),
        )
        .map((criterion) => {
          const score = scoreValues.get(criterion.id) ?? 0;
          const maxScore = toNumber(criterion.maxScore);
          const weight = toNumber(criterion.weight);

          const weightedScore =
            maxScore > 0
              ? (score / maxScore) * weight
              : 0;

          const existing = initialScores.get(
            criterion.id,
          );

          return {
            id: existing?.id,
            evaluationId:
              existing?.evaluationId ?? evaluation.id,
            criterionId: criterion.id,
            score,
            weightedScore,
            comment:
              comments.get(criterion.id) ??
              existing?.comment ??
              "",
          };
        });

    onSave(nextScores, evaluationComments);
  };

  const canComplete =
    evaluation.status === "IN_PROGRESS" &&
    sortedCriteria.length > 0 &&
    scoredCriteriaCount === sortedCriteria.length;

  return (
    <Card className={className}>
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Evaluation Scorecard
            </h2>

            <Badge
              variant={getStatusVariant(evaluation.status)}
            >
              {getStatusLabel(evaluation.status)}
            </Badge>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Score each evaluation criterion and record supporting
            comments.
          </p>
        </div>

        <div className="text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Total Score
          </p>

          <p className="mt-1 text-xl font-bold text-tenderhub-navy">
            {formatNumber(totalWeightedScore)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Scoring Progress
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {scoredCriteriaCount} of {sortedCriteria.length}{" "}
              criteria scored
            </p>
          </div>

          <span className="text-sm font-semibold text-tenderhub-navy">
            {formatNumber(progressPercentage)}%
          </span>
        </div>

        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-tenderhub-gold transition-all"
            style={{
              width: `${Math.min(
                100,
                Math.max(0, progressPercentage),
              )}%`,
            }}
          />
        </div>
      </div>

      {sortedCriteria.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
          <p className="text-sm font-medium text-gray-700">
            No evaluation criteria have been configured.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {sortedCriteria.map((criterion, index) => {
            const currentScore = scoreValues.get(
              criterion.id,
            );

            const currentComment =
              comments.get(criterion.id) ?? "";

            const maxScore = toNumber(
              criterion.maxScore,
            );

            const weight = toNumber(criterion.weight);

            const percentage =
              currentScore !== undefined && maxScore > 0
                ? (currentScore / maxScore) * 100
                : 0;

            const weightedScore =
              currentScore !== undefined && maxScore > 0
                ? (currentScore / maxScore) * weight
                : 0;

            return (
              <div
                key={criterion.id}
                className="rounded-lg border border-gray-200 bg-white p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-semibold text-white">
                      {index + 1}
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {criterion.name}
                      </h3>

                      {criterion.description && (
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          {criterion.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Badge variant="info">
                      Weight: {formatNumber(weight)}%
                    </Badge>

                    <Badge variant="default">
                      Max: {formatNumber(maxScore)}
                    </Badge>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[180px_1fr]">
                  <div>
                    <label
                      htmlFor={`score-${criterion.id}`}
                      className="block text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Score
                    </label>

                    <div className="mt-2 flex items-center gap-2">
                      <input
                        id={`score-${criterion.id}`}
                        type="number"
                        min={0}
                        max={maxScore}
                        step="0.01"
                        value={
                          currentScore !== undefined
                            ? currentScore
                            : ""
                        }
                        disabled={
                          readOnly || disabled
                        }
                        onChange={(event) =>
                          handleScoreChange(
                            criterion,
                            event.target.value,
                          )
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10 disabled:bg-gray-100"
                      />

                      <span className="text-sm text-gray-500">
                        / {formatNumber(maxScore)}
                      </span>
                    </div>

                    {currentScore !== undefined && (
                      <div className="mt-2 text-xs text-gray-500">
                        {formatNumber(percentage)}% · Weighted{" "}
                        {formatNumber(weightedScore)}
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor={`comment-${criterion.id}`}
                      className="block text-xs font-semibold uppercase tracking-wide text-gray-500"
                    >
                      Criterion Comment
                    </label>

                    <textarea
                      id={`comment-${criterion.id}`}
                      rows={3}
                      value={currentComment}
                      disabled={
                        readOnly || disabled
                      }
                      onChange={(event) =>
                        handleCommentChange(
                          criterion.id,
                          event.target.value,
                        )
                      }
                      placeholder="Add comments supporting this score..."
                      className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10 disabled:bg-gray-100"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 border-t border-gray-200 pt-5">
        <label
          htmlFor="evaluation-comments"
          className="block text-xs font-semibold uppercase tracking-wide text-gray-500"
        >
          Evaluation Comments
        </label>

        <textarea
          id="evaluation-comments"
          rows={4}
          value={evaluationComments}
          disabled={readOnly || disabled}
          onChange={(event) =>
            setEvaluationComments(event.target.value)
          }
          placeholder="Add overall evaluation comments..."
          className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10 disabled:bg-gray-100"
        />
      </div>

      {!readOnly && (
        <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
          {onSave && (
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              onClick={handleSave}
            >
              Save Scores
            </Button>
          )}

          {onComplete && (
            <Button
              type="button"
              variant="primary"
              disabled={disabled || !canComplete}
              onClick={onComplete}
            >
              Complete Evaluation
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
