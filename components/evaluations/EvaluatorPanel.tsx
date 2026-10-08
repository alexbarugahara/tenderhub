"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type EvaluatorPanelStatusValue =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "APPROVED";

export interface EvaluatorPanelEvaluation {
  id: string;
  bidId: string;
  evaluatorId: string;
  status: EvaluatorPanelStatusValue;
  totalScore: number | string;
  comments?: string | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
}

export interface EvaluatorPanelBid {
  id: string;
  bidNumber: string;
  title?: string | null;
  vendorName?: string | null;
  totalAmount?: number | string | null;
  currencyCode?: string | null;
}

export interface EvaluatorPanelProps {
  evaluation: EvaluatorPanelEvaluation;
  bid: EvaluatorPanelBid;
  evaluatorName?: string | null;
  criteriaCount?: number;
  completedCriteriaCount?: number;
  onOpen?: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onApprove?: () => void;
  disabled?: boolean;
  className?: string;
}

const statusLabels: Record<
  EvaluatorPanelStatusValue,
  string
> = {
  DRAFT: "Draft",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  APPROVED: "Approved",
};

const statusVariants: Record<
  EvaluatorPanelStatusValue,
  "default" | "info" | "success" | "warning"
> = {
  DRAFT: "default",
  IN_PROGRESS: "warning",
  COMPLETED: "info",
  APPROVED: "success",
};

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

function formatDate(
  value?: Date | string | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatAmount(
  value?: number | string | null,
  currencyCode?: string | null,
): string {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${currencyCode ? `${currencyCode} ` : ""}${formatNumber(value)}`;
}

export default function EvaluatorPanel({
  evaluation,
  bid,
  evaluatorName,
  criteriaCount = 0,
  completedCriteriaCount = 0,
  onOpen,
  onStart,
  onComplete,
  onApprove,
  disabled = false,
  className = "",
}: EvaluatorPanelProps) {
  const progressPercentage =
    criteriaCount > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (completedCriteriaCount / criteriaCount) * 100,
          ),
        )
      : 0;

  const canStart =
    evaluation.status === "DRAFT" && Boolean(onStart);

  const canComplete =
    evaluation.status === "IN_PROGRESS" &&
    completedCriteriaCount >= criteriaCount &&
    Boolean(onComplete);

  const canApprove =
    evaluation.status === "COMPLETED" && Boolean(onApprove);

  return (
    <Card className={className}>
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Evaluation
            </span>

            <Badge
              variant={statusVariants[evaluation.status]}
            >
              {statusLabels[evaluation.status]}
            </Badge>
          </div>

          <h2 className="mt-2 text-lg font-semibold text-tenderhub-navy">
            {bid.bidNumber}
          </h2>

          {bid.title && (
            <p className="mt-1 text-sm text-gray-600">
              {bid.title}
            </p>
          )}
        </div>

        {onOpen && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={onOpen}
          >
            Open Evaluation
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Vendor
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-gray-900">
            {bid.vendorName || "—"}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Bid Amount
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {formatAmount(
              bid.totalAmount,
              bid.currencyCode,
            )}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Evaluator
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-gray-900">
            {evaluatorName || evaluation.evaluatorId}
          </p>
        </div>

        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Total Score
          </p>

          <p className="mt-1 text-sm font-semibold text-tenderhub-navy">
            {formatNumber(evaluation.totalScore)}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Evaluation Progress
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {completedCriteriaCount} of {criteriaCount} criteria
              scored
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
              width: `${progressPercentage}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-200 pt-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Started
          </p>

          <p className="mt-1 text-sm text-gray-700">
            {formatDate(evaluation.startedAt)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Completed
          </p>

          <p className="mt-1 text-sm text-gray-700">
            {formatDate(evaluation.completedAt)}
          </p>
        </div>
      </div>

      {evaluation.comments && (
        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Comments
          </p>

          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {evaluation.comments}
          </p>
        </div>
      )}

      {(canStart || canComplete || canApprove) && (
        <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
          {canStart && (
            <Button
              type="button"
              variant="primary"
              disabled={disabled}
              onClick={onStart}
            >
              Start Evaluation
            </Button>
          )}

          {canComplete && (
            <Button
              type="button"
              variant="primary"
              disabled={disabled}
              onClick={onComplete}
            >
              Complete Evaluation
            </Button>
          )}

          {canApprove && (
            <Button
              type="button"
              variant="primary"
              disabled={disabled}
              onClick={onApprove}
            >
              Approve Evaluation
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
