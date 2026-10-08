"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type BidCardStatusValue =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "SHORTLISTED"
  | "EVALUATED"
  | "WITHDRAWN"
  | "REJECTED"
  | "AWARDED";

export interface BidCardProps {
  id: string;
  solicitationId: string;
  lotId?: string | null;
  vendorId: string;
  submittedById: string;
  currencyId?: string | null;
  bidNumber: string;
  status: BidCardStatusValue;
  title?: string | null;
  summary?: string | null;
  totalAmount: number | string;
  submittedAt?: Date | string | null;
  lockedAt?: Date | string | null;
  withdrawalReason?: string | null;
  solicitationNumber?: string | null;
  solicitationTitle?: string | null;
  vendorName?: string | null;
  lotNumber?: number | null;
  lotTitle?: string | null;
  currencyCode?: string | null;
  href?: string;
  className?: string;
}

const statusLabels: Record<BidCardStatusValue, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  SHORTLISTED: "Shortlisted",
  EVALUATED: "Evaluated",
  WITHDRAWN: "Withdrawn",
  REJECTED: "Rejected",
  AWARDED: "Awarded",
};

const statusVariants: Record<
  BidCardStatusValue,
  "default" | "info" | "success" | "warning" | "danger" | "primary" | "secondary"
> = {
  DRAFT: "default",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  COMPLIANT: "success",
  NON_COMPLIANT: "danger",
  SHORTLISTED: "primary",
  EVALUATED: "info",
  WITHDRAWN: "default",
  REJECTED: "danger",
  AWARDED: "primary",
};

function formatDate(value?: Date | string | null): string {
  if (!value) {
    return "Not submitted";
  }

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

function formatAmount(
  amount: number | string,
  currencyCode?: string | null,
): string {
  const numericAmount =
    typeof amount === "number" ? amount : Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return `${currencyCode ? `${currencyCode} ` : ""}${amount}`;
  }

  return `${currencyCode ? `${currencyCode} ` : ""}${new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(numericAmount)}`;
}

export default function BidCard({
  id,
  solicitationId,
  lotId,
  vendorId,
  submittedById,
  currencyId,
  bidNumber,
  status,
  title,
  summary,
  totalAmount,
  submittedAt,
  lockedAt,
  withdrawalReason,
  solicitationNumber,
  solicitationTitle,
  vendorName,
  lotNumber,
  lotTitle,
  currencyCode,
  href = `/dashboard/vendor/bids/${id}`,
  className = "",
}: BidCardProps) {
  const hasLot = Boolean(lotId);

  return (
    <Card
      className={`overflow-hidden transition-shadow hover:shadow-md ${className}`}
    >
      <div className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {bidNumber}
              </span>

              <Badge variant={statusVariants[status]} dot>
                {statusLabels[status]}
              </Badge>
            </div>

            <h3 className="mt-2 text-lg font-semibold text-tenderhub-navy">
              {title || "Untitled Bid"}
            </h3>

            {solicitationTitle && (
              <p className="mt-1 text-sm text-gray-600">
                {solicitationNumber && (
                  <span className="font-medium">
                    {solicitationNumber} ·{" "}
                  </span>
                )}
                {solicitationTitle}
              </p>
            )}
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Bid Amount
            </p>

            <p className="mt-1 text-lg font-bold text-tenderhub-navy">
              {formatAmount(totalAmount, currencyCode)}
            </p>
          </div>
        </div>

        {summary && (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600">
            {summary}
          </p>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:grid-cols-4">
          {vendorName && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Vendor
              </p>

              <p className="mt-1 truncate text-sm font-medium text-gray-900">
                {vendorName}
              </p>
            </div>
          )}

          {(hasLot || lotNumber !== null || lotTitle) && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Lot
              </p>

              <p className="mt-1 truncate text-sm font-medium text-gray-900">
                {lotNumber !== null && lotNumber !== undefined
                  ? `Lot ${lotNumber}`
                  : lotTitle || "Specific lot"}

                {lotTitle &&
                lotNumber !== null &&
                lotNumber !== undefined
                  ? ` · ${lotTitle}`
                  : ""}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Submitted
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {formatDate(submittedAt)}
            </p>
          </div>

          {lockedAt && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Locked
              </p>

              <p className="mt-1 text-sm text-gray-700">
                {formatDate(lockedAt)}
              </p>
            </div>
          )}
        </div>

        {status === "WITHDRAWN" && withdrawalReason && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Withdrawal Reason
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {withdrawalReason}
            </p>
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              window.location.href = href;
            }}
          >
            View Bid
          </Button>
        </div>
      </div>
    </Card>
  );
}