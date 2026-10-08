"use client";

import React from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type LotStatusValue =
  | "OPEN"
  | "CLOSED"
  | "AWARDED"
  | "CANCELLED";

export interface LotCardProps {
  id: string;
  number: number | string;
  title: string;
  description?: string | null;
  status: LotStatusValue;
  estimatedValue?: string | number | null;
  currencyCode?: string | null;
  solicitationNumber?: string | null;
  solicitationTitle?: string | null;
  href?: string;
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

export default function LotCard({
  id,
  number,
  title,
  description,
  status,
  estimatedValue,
  currencyCode,
  solicitationNumber,
  solicitationTitle,
  href,
  className = "",
}: LotCardProps) {
  /*
   * Lots are managed within their parent solicitation.
   *
   * The parent LotList should normally provide a valid solicitation-based
   * href. If it does not, we do not send the user to the old/non-existent
   * /dashboard/organization/lots/[id] route.
   */
  const lotHref = href;

  return (
    <Card
      padding="none"
      className={`overflow-hidden transition-shadow duration-200 hover:shadow-lg ${className}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Lot {number}
            </p>

            {lotHref ? (
              <Link
                href={lotHref}
                className="mt-1 block text-lg font-semibold text-tenderhub-navy transition-colors hover:text-tenderhub-gold"
              >
                {title}
              </Link>
            ) : (
              <p className="mt-1 block text-lg font-semibold text-tenderhub-navy">
                {title}
              </p>
            )}
          </div>

          <Badge variant={getStatusVariant(status)}>
            {formatStatus(status)}
          </Badge>
        </div>

        {(solicitationNumber || solicitationTitle) && (
          <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Solicitation
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
        )}

        {description && (
          <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">
            {description}
          </p>
        )}

        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Estimated Value
          </p>

          <p className="mt-1 text-base font-semibold text-tenderhub-navy">
            {formatValue(estimatedValue, currencyCode)}
          </p>
        </div>

        {lotHref && (
          <div className="mt-5">
            <Link href={lotHref} className="block">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
              >
                View Lot
              </Button>
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}
