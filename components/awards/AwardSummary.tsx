"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export type AwardSummaryStatusValue =
  | "PENDING"
  | "APPROVED"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED";

export interface AwardSummaryProps {
  id: string;
  awardNumber: string;
  status: AwardSummaryStatusValue;
  awardAmount: number | string;
  awardDate: Date | string;

  solicitationId: string;
  solicitationNumber?: string | null;
  solicitationTitle?: string | null;

  bidId: string;
  bidNumber?: string | null;

  vendorId: string;
  vendorName?: string | null;

  lotId?: string | null;
  lotNumber?: number | null;
  lotTitle?: string | null;

  currencyCode?: string | null;
  notes?: string | null;

  className?: string;
}

const statusLabels: Record<
  AwardSummaryStatusValue,
  string
> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

const statusVariants: Record<
  AwardSummaryStatusValue,
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
  return `${currencyCode ? `${currencyCode} ` : ""}${new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(toNumber(value))}`;
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function AwardSummary({
  id,
  awardNumber,
  status,
  awardAmount,
  awardDate,
  solicitationId,
  solicitationNumber,
  solicitationTitle,
  bidId,
  bidNumber,
  vendorId,
  vendorName,
  lotId,
  lotNumber,
  lotTitle,
  currencyCode,
  notes,
  className = "",
}: AwardSummaryProps) {
  return (
    <Card className={className}>
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {awardNumber}
            </span>

            <Badge
              variant={statusVariants[status]}
              size="sm"
              dot
            >
              {statusLabels[status]}
            </Badge>
          </div>

          <h2 className="mt-2 text-xl font-bold text-tenderhub-navy">
            Award Summary
          </h2>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Award Amount
          </p>

          <p className="mt-1 text-xl font-bold text-tenderhub-navy">
            {formatAmount(awardAmount, currencyCode)}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Award Date
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {formatDate(awardDate)}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Solicitation
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {solicitationNumber || solicitationId}
          </p>

          {solicitationTitle && (
            <p className="mt-1 truncate text-xs text-gray-500">
              {solicitationTitle}
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Awarded Bid
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {bidNumber || bidId}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Vendor
          </p>

          <p className="mt-1 truncate text-sm font-semibold text-gray-900">
            {vendorName || vendorId}
          </p>
        </div>
      </div>

      {lotId && (
        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Awarded Lot
          </p>

          <p className="mt-1 text-sm font-semibold text-gray-900">
            {lotNumber !== null && lotNumber !== undefined
              ? `Lot ${lotNumber}`
              : lotTitle || lotId}
          </p>

          {lotTitle &&
            lotNumber !== null &&
            lotNumber !== undefined && (
              <p className="mt-1 text-sm text-gray-600">
                {lotTitle}
              </p>
            )}
        </div>
      )}

      {notes && (
        <div className="mt-5 border-t border-gray-200 pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Notes
          </p>

          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {notes}
          </p>
        </div>
      )}

      <div className="mt-5 border-t border-gray-200 pt-4">
        <p className="text-xs text-gray-400">
          Award ID: {id}
        </p>
      </div>
    </Card>
  );
}