"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type AwardDetailsStatusValue =
  | "PENDING"
  | "APPROVED"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED";

export interface AwardDetailsProps {
  id: string;
  solicitationId: string;
  lotId?: string | null;
  bidId: string;
  vendorId: string;
  awardNumber: string;
  status: AwardDetailsStatusValue;
  awardAmount: number | string;
  awardDate: Date | string;
  notes?: string | null;

  solicitationNumber?: string | null;
  solicitationTitle?: string | null;
  bidNumber?: string | null;
  bidTitle?: string | null;
  vendorName?: string | null;
  lotNumber?: number | null;
  lotTitle?: string | null;
  currencyCode?: string | null;

  solicitationHref?: string;
  bidHref?: string;
  vendorHref?: string;
  lotHref?: string;

  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const statusLabels: Record<AwardDetailsStatusValue, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

const statusVariants: Record<
  AwardDetailsStatusValue,
  "default" | "info" | "success" | "warning" | "danger"
> = {
  PENDING: "warning",
  APPROVED: "info",
  ACCEPTED: "success",
  DECLINED: "danger",
  CANCELLED: "danger",
};

function formatAmount(
  value: number | string,
  currencyCode?: string | null,
): string {
  const numericValue =
    typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue)) {
    return `${currencyCode ? `${currencyCode} ` : ""}${value}`;
  }

  return `${currencyCode ? `${currencyCode} ` : ""}${new Intl.NumberFormat(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(numericValue)}`;
}

function formatDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function navigateTo(href: string) {
  window.location.href = href;
}

export default function AwardDetails({
  id,
  solicitationId,
  lotId,
  bidId,
  vendorId,
  awardNumber,
  status,
  awardAmount,
  awardDate,
  notes,
  solicitationNumber,
  solicitationTitle,
  bidNumber,
  bidTitle,
  vendorName,
  lotNumber,
  lotTitle,
  currencyCode,
  solicitationHref,
  bidHref,
  vendorHref,
  lotHref,
  showActions = true,
  onEdit,
  onDelete,
  className = "",
}: AwardDetailsProps) {
  const defaultSolicitationHref =
    solicitationHref ||
    `/dashboard/organization/solicitations/${solicitationId}`;

  const defaultBidHref =
    bidHref || `/dashboard/organization/bids/${bidId}`;

  const defaultVendorHref =
    vendorHref || `/dashboard/organization/vendors/${vendorId}`;

  /*
   * Lots belong to a Solicitation.
   *
   * There is no standalone:
   * /dashboard/organization/lots/[id]
   *
   * route in TenderHub.
   *
   * When an explicit lotHref is supplied, use it.
   * Otherwise return to the parent solicitation's lots page.
   */
  const defaultLotHref = lotId
    ? lotHref ||
      `/dashboard/organization/solicitations/${solicitationId}/lots`
    : null;

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {awardNumber}
              </span>

              <Badge variant={statusVariants[status]} dot>
                {statusLabels[status]}
              </Badge>
            </div>

            <h1 className="mt-2 text-2xl font-bold text-tenderhub-navy">
              Award Details
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Award ID: {id}
            </p>
          </div>

          {showActions && (onEdit || onDelete) && (
            <div className="flex flex-wrap gap-2">
              {onEdit && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                >
                  Edit Award
                </Button>
              )}

              {onDelete && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={onDelete}
                >
                  Delete Award
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Award Amount
            </p>

            <p className="mt-1 text-xl font-bold text-tenderhub-navy">
              {formatAmount(awardAmount, currencyCode)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Award Date
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {formatDate(awardDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </p>

            <div className="mt-1">
              <Badge variant={statusVariants[status]} dot>
                {statusLabels[status]}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Awarded Bid
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Bid and vendor information associated with this award.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Bid
            </p>

            {bidHref ? (
              <button
                type="button"
                onClick={() => navigateTo(defaultBidHref)}
                className="mt-1 text-left text-sm font-semibold text-tenderhub-navy underline-offset-4 hover:underline"
              >
                {bidNumber || bidId}
              </button>
            ) : (
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {bidNumber || bidId}
              </p>
            )}

            {bidTitle && (
              <p className="mt-1 text-sm text-gray-600">
                {bidTitle}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Vendor
            </p>

            {vendorHref ? (
              <button
                type="button"
                onClick={() => navigateTo(defaultVendorHref)}
                className="mt-1 text-left text-sm font-semibold text-tenderhub-navy underline-offset-4 hover:underline"
              >
                {vendorName || vendorId}
              </button>
            ) : (
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {vendorName || vendorId}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Solicitation
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Procurement opportunity associated with this award.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Solicitation
            </p>

            {solicitationHref ? (
              <button
                type="button"
                onClick={() => navigateTo(defaultSolicitationHref)}
                className="mt-1 text-left text-sm font-semibold text-tenderhub-navy underline-offset-4 hover:underline"
              >
                {solicitationNumber || solicitationId}
              </button>
            ) : (
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {solicitationNumber || solicitationId}
              </p>
            )}

            {solicitationTitle && (
              <p className="mt-1 text-sm text-gray-600">
                {solicitationTitle}
              </p>
            )}
          </div>

          {lotId && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Lot
              </p>

              {lotHref ? (
                <button
                  type="button"
                  onClick={() => navigateTo(defaultLotHref!)}
                  className="mt-1 text-left text-sm font-semibold text-tenderhub-navy underline-offset-4 hover:underline"
                >
                  {lotNumber !== null && lotNumber !== undefined
                    ? `Lot ${lotNumber}`
                    : lotTitle || lotId}
                </button>
              ) : (
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {lotNumber !== null && lotNumber !== undefined
                    ? `Lot ${lotNumber}`
                    : lotTitle || lotId}
                </p>
              )}

              {lotTitle &&
                lotNumber !== null &&
                lotNumber !== undefined && (
                  <p className="mt-1 text-sm text-gray-600">
                    {lotTitle}
                  </p>
                )}
            </div>
          )}
        </div>
      </Card>

      {notes && (
        <Card>
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Notes
            </h2>

            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-600">
              {notes}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}