"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type ContractDetailsStatusValue =
  | "DRAFT"
  | "PENDING_SIGNATURE"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "TERMINATED"
  | "EXPIRED";

export interface ContractDetailsProps {
  id: string;
  awardId: string;
  vendorId: string;
  organizationId?: string | null;
  contractNumber: string;
  title: string;
  description?: string | null;
  status: ContractDetailsStatusValue;
  contractValue: number | string;
  startDate: Date | string;
  endDate: Date | string;
  signedDate?: Date | string | null;
  completedDate?: Date | string | null;
  terminatedDate?: Date | string | null;
  terminationReason?: string | null;

  vendorName?: string | null;
  organizationName?: string | null;
  awardNumber?: string | null;
  currencyCode?: string | null;

  awardHref?: string;
  vendorHref?: string;
  organizationHref?: string;

  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

const statusLabels: Record<
  ContractDetailsStatusValue,
  string
> = {
  DRAFT: "Draft",
  PENDING_SIGNATURE: "Pending Signature",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  TERMINATED: "Terminated",
  EXPIRED: "Expired",
};

const statusVariants: Record<
  ContractDetailsStatusValue,
  "default" | "info" | "success" | "warning" | "danger"
> = {
  DRAFT: "default",
  PENDING_SIGNATURE: "warning",
  ACTIVE: "success",
  ON_HOLD: "warning",
  COMPLETED: "success",
  TERMINATED: "danger",
  EXPIRED: "default",
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

function navigateTo(href: string) {
  window.location.href = href;
}

export default function ContractDetails({
  id,
  awardId,
  vendorId,
  organizationId,
  contractNumber,
  title,
  description,
  status,
  contractValue,
  startDate,
  endDate,
  signedDate,
  completedDate,
  terminatedDate,
  terminationReason,
  vendorName,
  organizationName,
  awardNumber,
  currencyCode,
  awardHref,
  vendorHref,
  organizationHref,
  showActions = true,
  onEdit,
  onDelete,
  className = "",
}: ContractDetailsProps) {
  const defaultAwardHref =
    awardHref || `/dashboard/organization/awards/${awardId}`;

  const defaultVendorHref =
    vendorHref || `/dashboard/vendor/profile`;

  const defaultOrganizationHref = organizationId
    ? organizationHref || `/dashboard/organization`
    : null;

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {contractNumber}
              </span>

              <Badge variant={statusVariants[status]}>
                {statusLabels[status]}
              </Badge>
            </div>

            <h1 className="mt-2 text-2xl font-bold text-tenderhub-navy">
              {title}
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Contract ID: {id}
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
                  Edit Contract
                </Button>
              )}

              {onDelete && (
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  onClick={onDelete}
                >
                  Delete Contract
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Contract Value
            </p>

            <p className="mt-1 text-xl font-bold text-tenderhub-navy">
              {formatAmount(contractValue, currencyCode)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Start Date
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatDate(startDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              End Date
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatDate(endDate)}
            </p>
          </div>
        </div>
      </Card>

      {description && (
        <Card>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Contract Description
          </h2>

          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
            {description}
          </p>
        </Card>
      )}

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Contract Parties
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Organizations and vendors associated with this contract.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Organization
            </p>

            {organizationId && organizationHref ? (
              <button
                type="button"
                onClick={() =>
                  navigateTo(defaultOrganizationHref!)
                }
                className="mt-1 text-left text-sm font-semibold text-tenderhub-navy underline-offset-4 hover:underline"
              >
                {organizationName || organizationId}
              </button>
            ) : (
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {organizationName || organizationId || "—"}
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
            Award
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Award that established this contract.
          </p>
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Award Number
          </p>

          {awardHref ? (
            <button
              type="button"
              onClick={() => navigateTo(defaultAwardHref)}
              className="mt-1 text-left text-sm font-semibold text-tenderhub-navy underline-offset-4 hover:underline"
            >
              {awardNumber || awardId}
            </button>
          ) : (
            <p className="mt-1 text-sm font-semibold text-gray-900">
              {awardNumber || awardId}
            </p>
          )}
        </div>
      </Card>

      <Card>
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Contract Dates
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Signed
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {formatDate(signedDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Completed
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {formatDate(completedDate)}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Terminated
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {formatDate(terminatedDate)}
            </p>
          </div>
        </div>
      </Card>

      {status === "TERMINATED" && terminationReason && (
        <Card>
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
              Termination Reason
            </p>

            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-red-700">
              {terminationReason}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
