"use client";

import React from "react";
import Link from "next/link";
import LotCard, { LotStatusValue } from "@/components/lots/LotCard";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export interface LotDetailsProps {
  id: string;
  number: number | string;
  title: string;
  description?: string | null;
  status: LotStatusValue;
  estimatedValue?: string | number | null;
  currencyCode?: string | null;
  solicitationId?: string | null;
  solicitationNumber?: string | null;
  solicitationTitle?: string | null;
  href?: string;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  className?: string;
}

function formatValue(
  value?: string | number | null,
  currencyCode?: string | null,
): string {
  if (value === null || value === undefined || value === "") {
    return "Not specified";
  }

  const numericValue =
    typeof value === "number" ? value : Number.parseFloat(value);

  if (Number.isNaN(numericValue)) {
    return `${currencyCode ? `${currencyCode} ` : ""}${value}`;
  }

  return `${currencyCode ? `${currencyCode} ` : ""}${new Intl.NumberFormat(
    "en",
    {
      maximumFractionDigits: 2,
    },
  ).format(numericValue)}`;
}

function getStatusVariant(
  status: LotStatusValue,
): "default" | "info" | "success" | "warning" | "danger" | "primary" {
  switch (status) {
    case "OPEN":
      return "success";
    case "CLOSED":
      return "default";
    case "AWARDED":
      return "primary";
    case "CANCELLED":
      return "danger";
    default:
      return "default";
  }
}

function formatStatus(status: LotStatusValue): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}

export default function LotDetails({
  id,
  number,
  title,
  description,
  status,
  estimatedValue,
  currencyCode,
  solicitationId,
  solicitationNumber,
  solicitationTitle,
  href,
  showActions = false,
  onEdit,
  onDelete,
  className = "",
}: LotDetailsProps) {
  /*
   * A Lot belongs to a Solicitation.
   *
   * There is no standalone:
   * /dashboard/organization/lots/[id]
   *
   * route in TenderHub.
   *
   * If an explicit href is supplied, use it.
   * Otherwise, return to this lot's parent solicitation lots page.
   */
  const lotHref =
    href ??
    (solicitationId
      ? `/dashboard/organization/solicitations/${solicitationId}/lots`
      : undefined);

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
              Lot {number}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-tenderhub-navy">
              {title}
            </h1>
          </div>

          <Badge variant={getStatusVariant(status)}>
            {formatStatus(status)}
          </Badge>
        </div>

        {description && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="text-sm font-semibold text-tenderhub-navy">
              Description
            </h2>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-600">
              {description}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-5 border-t border-gray-100 pt-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Lot Number
            </p>

            <p className="mt-1 text-sm font-medium text-gray-900">
              {number}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Estimated Value
            </p>

            <p className="mt-1 text-sm font-semibold text-tenderhub-navy">
              {formatValue(estimatedValue, currencyCode)}
            </p>
          </div>

          {currencyCode && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Currency
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {currencyCode}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </p>

            <div className="mt-1">
              <Badge variant={getStatusVariant(status)}>
                {formatStatus(status)}
              </Badge>
            </div>
          </div>
        </div>

        {showActions && (
          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
            {onDelete && (
              <Button
                type="button"
                variant="danger"
                onClick={onDelete}
              >
                Delete Lot
              </Button>
            )}

            {onEdit && (
              <Button
                type="button"
                variant="primary"
                onClick={onEdit}
              >
                Edit Lot
              </Button>
            )}
          </div>
        )}
      </Card>

      {(solicitationId ||
        solicitationNumber ||
        solicitationTitle) && (
        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Parent Solicitation
              </p>

              {solicitationNumber && (
                <p className="mt-1 text-sm font-semibold text-tenderhub-navy">
                  {solicitationNumber}
                </p>
              )}

              {solicitationTitle && (
                <p className="mt-1 text-sm text-gray-600">
                  {solicitationTitle}
                </p>
              )}
            </div>

            {solicitationId && (
              <Link
                href={`/dashboard/organization/solicitations/${solicitationId}`}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                >
                  View Solicitation
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      <div>
        <LotCard
          id={id}
          number={number}
          title={title}
          description={description}
          status={status}
          estimatedValue={estimatedValue}
          currencyCode={currencyCode}
          solicitationNumber={solicitationNumber}
          solicitationTitle={solicitationTitle}
          href={lotHref}
          className="max-w-2xl"
        />
      </div>
    </div>
  );
}