"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type BidDetailsStatusValue =
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

export interface BidDetailsProps {
  id: string;
  solicitationId: string;
  lotId?: string | null;
  vendorId: string;
  submittedById: string;
  currencyId?: string | null;
  bidNumber: string;
  status: BidDetailsStatusValue;
  title?: string | null;
  summary?: string | null;
  totalAmount: number | string;
  submittedAt?: Date | string | null;
  lockedAt?: Date | string | null;
  withdrawalReason?: string | null;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
  solicitationNumber?: string | null;
  solicitationTitle?: string | null;
  vendorName?: string | null;
  lotNumber?: number | null;
  lotTitle?: string | null;
  currencyCode?: string | null;
  href?: string;
  solicitationHref?: string;
  vendorHref?: string;
  lotHref?: string;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const statusLabels: Record<BidDetailsStatusValue, string> = {
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
  BidDetailsStatusValue,
  "default" | "info" | "success" | "warning" | "danger" | "gold"
> = {
  DRAFT: "default",
  SUBMITTED: "info",
  UNDER_REVIEW: "warning",
  COMPLIANT: "success",
  NON_COMPLIANT: "danger",
  SHORTLISTED: "gold",
  EVALUATED: "info",
  WITHDRAWN: "default",
  REJECTED: "danger",
  AWARDED: "gold",
};

function formatDate(value?: Date | string | null): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

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

interface DetailItemProps {
  label: string;
  value: React.ReactNode;
}

function DetailItem({ label, value }: DetailItemProps) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-gray-900">{value || "—"}</dd>
    </div>
  );
}

function DetailLink({
  href,
  children,
}: {
  href?: string;
  children: React.ReactNode;
}) {
  if (!href) {
    return <span>{children}</span>;
  }

  return (
    <a
      href={href}
      className="font-medium text-tenderhub-navy underline-offset-2 hover:underline"
    >
      {children}
    </a>
  );
}

export default function BidDetails({
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
  createdAt,
  updatedAt,
  solicitationNumber,
  solicitationTitle,
  vendorName,
  lotNumber,
  lotTitle,
  currencyCode,
  href = `/dashboard/vendor/bids/${id}`,
  solicitationHref,
  vendorHref,
  lotHref,
  showActions = false,
  onEdit,
  onDelete,
  className = "",
}: BidDetailsProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-500">
                {bidNumber}
              </span>

              <Badge variant={statusVariants[status]} size="sm" dot>
                {statusLabels[status]}
              </Badge>
            </div>

            <h1 className="mt-2 text-2xl font-bold text-tenderhub-navy">
              {title || "Untitled Bid"}
            </h1>

            {solicitationTitle && (
              <p className="mt-2 text-sm text-gray-600">
                {solicitationNumber && (
                  <span className="font-medium">
                    {solicitationNumber} ·{" "}
                  </span>
                )}
                <DetailLink href={solicitationHref}>
                  {solicitationTitle}
                </DetailLink>
              </p>
            )}
          </div>

          <div className="shrink-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Total Bid Amount
            </p>
            <p className="mt-1 text-2xl font-bold text-tenderhub-navy">
              {formatAmount(totalAmount, currencyCode)}
            </p>
          </div>
        </div>

        {summary && (
          <div className="pt-5">
            <h2 className="text-sm font-semibold text-tenderhub-navy">
              Bid Summary
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {summary}
            </p>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-tenderhub-navy">
          Bid Information
        </h2>

        <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Bid Number" value={bidNumber} />

          <DetailItem
            label="Status"
            value={
              <Badge variant={statusVariants[status]} size="sm" dot>
                {statusLabels[status]}
              </Badge>
            }
          />

          <DetailItem
            label="Solicitation"
            value={
              solicitationTitle ? (
                <DetailLink href={solicitationHref}>
                  {solicitationNumber
                    ? `${solicitationNumber} · ${solicitationTitle}`
                    : solicitationTitle}
                </DetailLink>
              ) : (
                solicitationId
              )
            }
          />

          <DetailItem
            label="Lot"
            value={
              lotId ? (
                <DetailLink href={lotHref}>
                  {lotNumber !== null && lotNumber !== undefined
                    ? `Lot ${lotNumber}${lotTitle ? ` · ${lotTitle}` : ""}`
                    : lotTitle || lotId}
                </DetailLink>
              ) : (
                "No specific lot"
              )
            }
          />

          <DetailItem
            label="Vendor"
            value={
              vendorName ? (
                <DetailLink href={vendorHref}>{vendorName}</DetailLink>
              ) : (
                vendorId
              )
            }
          />

          <DetailItem label="Currency" value={currencyCode || currencyId} />

          <DetailItem label="Submitted By" value={submittedById} />

          <DetailItem
            label="Submitted At"
            value={formatDate(submittedAt)}
          />

          <DetailItem label="Locked At" value={formatDate(lockedAt)} />

          <DetailItem label="Created At" value={formatDate(createdAt)} />

          <DetailItem label="Updated At" value={formatDate(updatedAt)} />
        </dl>
      </Card>

      {status === "WITHDRAWN" && withdrawalReason && (
        <Card>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Withdrawal Reason
          </h2>

          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {withdrawalReason}
          </p>
        </Card>
      )}

      {showActions && (onEdit || onDelete) && (
        <Card>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={onEdit}
              >
                Edit Bid
              </Button>
            )}

            {onDelete && (
              <Button
                type="button"
                variant="danger"
                onClick={onDelete}
              >
                Delete Bid
              </Button>
            )}

            {!onEdit && !onDelete && href && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  window.location.href = href;
                }}
              >
                View Bid
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}