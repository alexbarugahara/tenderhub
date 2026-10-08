"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type AwardNoticeStatusValue =
  | "PENDING"
  | "APPROVED"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED";

export interface AwardNoticeProps {
  awardId: string;
  awardNumber: string;
  status: AwardNoticeStatusValue;
  awardAmount: number | string;
  awardDate: Date | string;
  solicitationNumber?: string | null;
  solicitationTitle?: string | null;
  vendorName?: string | null;
  bidNumber?: string | null;
  currencyCode?: string | null;
  notes?: string | null;
  publishedAt?: Date | string | null;
  showActions?: boolean;
  onPublish?: () => void;
  onViewAward?: () => void;
  publishing?: boolean;
  className?: string;
}

const statusLabels: Record<AwardNoticeStatusValue, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

const statusVariants: Record<
  AwardNoticeStatusValue,
  "default" | "info" | "success" | "warning" | "danger"
> = {
  PENDING: "warning",
  APPROVED: "info",
  ACCEPTED: "success",
  DECLINED: "danger",
  CANCELLED: "danger",
};

function toNumber(value: number | string): number {
  const numericValue =
    typeof value === "number" ? value : Number(value);

  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatAmount(
  value: number | string,
  currencyCode?: string | null,
): string {
  const numericValue = toNumber(value);

  return `${currencyCode ? `${currencyCode} ` : ""}${new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(numericValue)}`;
}

function formatDate(
  value?: Date | string | null,
): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export default function AwardNotice({
  awardId,
  awardNumber,
  status,
  awardAmount,
  awardDate,
  solicitationNumber,
  solicitationTitle,
  vendorName,
  bidNumber,
  currencyCode,
  notes,
  publishedAt,
  showActions = true,
  onPublish,
  onViewAward,
  publishing = false,
  className = "",
}: AwardNoticeProps) {
  const isPublished = Boolean(publishedAt);

  const canPublish =
    showActions &&
    Boolean(onPublish) &&
    !isPublished &&
    status !== "CANCELLED" &&
    status !== "DECLINED";

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="border-b border-gray-200 bg-gray-50 px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Award Notice
              </span>

              <Badge variant={statusVariants[status]} dot>
                {statusLabels[status]}
              </Badge>

              {isPublished && (
                <Badge variant="success">
                  Published
                </Badge>
              )}
            </div>

            <h2 className="mt-2 text-xl font-bold text-tenderhub-navy">
              {awardNumber}
            </h2>
          </div>

          {showActions && onViewAward && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onViewAward}
            >
              View Award
            </Button>
          )}
        </div>
      </div>

      <div className="px-5 py-6 sm:px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Awarded Contract Value
          </p>

          <p className="mt-2 text-3xl font-bold text-tenderhub-navy">
            {formatAmount(awardAmount, currencyCode)}
          </p>

          <p className="mt-2 text-sm text-gray-500">
            Award date: {formatDate(awardDate)}
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 border-t border-gray-200 pt-6 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Solicitation
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {solicitationNumber || "—"}
            </p>

            {solicitationTitle && (
              <p className="mt-1 text-sm text-gray-600">
                {solicitationTitle}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Awarded Vendor
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {vendorName || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Bid
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {bidNumber || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Notice Status
            </p>

            <div className="mt-1">
              <Badge
                variant={isPublished ? "success" : "default"}
                dot
              >
                {isPublished ? "Published" : "Not Published"}
              </Badge>
            </div>
          </div>
        </div>

        {notes && (
          <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Notice Information
            </p>

            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {notes}
            </p>
          </div>
        )}

        <div className="mt-6 border-t border-gray-200 pt-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Publication
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {isPublished
                  ? `Published on ${formatDate(publishedAt)}`
                  : "This award notice has not been published."}
              </p>
            </div>

            {canPublish && (
              <Button
                type="button"
                variant="primary"
                disabled={publishing}
                onClick={onPublish}
              >
                {publishing ? "Publishing..." : "Publish Notice"}
              </Button>
            )}
          </div>
        </div>

        <p className="mt-5 text-xs text-gray-400">
          Award ID: {awardId}
        </p>
      </div>
    </Card>
  );
}