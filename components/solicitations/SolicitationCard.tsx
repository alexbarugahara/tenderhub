"use client";

import React from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import SolicitationStatus, {
  SolicitationStatusValue,
} from "@/components/solicitations/SolicitationStatus";

export interface SolicitationCardProps {
  id: string;
  solicitationNumber: string;
  title: string;
  description?: string | null;
  status: SolicitationStatusValue;
  type?: string | null;
  procurementMethod?: string | null;
  organizationName: string;
  organizationLogo?: string | null;
  estimatedValue?: string | number | null;
  currencyCode?: string | null;
  closingDate?: string | Date | null;
  publishedAt?: string | Date | null;
  lotCount?: number;
  classificationNames?: string[];
  href?: string;
  showOrganization?: boolean;
  className?: string;
}

function formatDate(value?: string | Date | null): string | null {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatValue(
  value?: string | number | null,
  currencyCode?: string | null,
): string | null {
  if (value === null || value === undefined || value === "") {
    return null;
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

function formatLabel(value?: string | null): string | null {
  if (!value) {
    return null;
  }

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function SolicitationCard({
  id,
  solicitationNumber,
  title,
  description,
  status,
  type,
  procurementMethod,
  organizationName,
  organizationLogo,
  estimatedValue,
  currencyCode,
  closingDate,
  publishedAt,
  lotCount = 0,
  classificationNames = [],
  href,
  showOrganization = true,
  className = "",
}: SolicitationCardProps) {
  const solicitationHref = href ?? `/solicitations/${id}`;
  const formattedClosingDate = formatDate(closingDate);
  const formattedPublishedDate = formatDate(publishedAt);
  const formattedValue = formatValue(estimatedValue, currencyCode);

  const visibleClassifications = classificationNames.slice(0, 3);
  const remainingClassifications =
    classificationNames.length - visibleClassifications.length;

  return (
    <Card
      padding="none"
      className={`overflow-hidden transition-shadow duration-200 hover:shadow-lg ${className}`}
    >
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {solicitationNumber}
            </p>

            <Link
              href={solicitationHref}
              className="mt-1 block text-lg font-semibold text-tenderhub-navy transition-colors hover:text-tenderhub-gold"
            >
              {title}
            </Link>
          </div>

          <SolicitationStatus status={status} size="sm" />
        </div>

        {showOrganization && (
          <div className="mt-4 flex items-center gap-3">
            {organizationLogo ? (
              <img
                src={organizationLogo}
                alt=""
                className="h-9 w-9 rounded-md border border-gray-200 object-contain"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-tenderhub-navy text-sm font-semibold text-white">
                {organizationName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">
                {organizationName}
              </p>

              {formattedPublishedDate && (
                <p className="text-xs text-gray-500">
                  Published {formattedPublishedDate}
                </p>
              )}
            </div>
          </div>
        )}

        {description && (
          <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-600">
            {description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {type && (
            <Badge variant="default" size="sm">
              {formatLabel(type)}
            </Badge>
          )}

          {procurementMethod && (
            <Badge variant="info" size="sm">
              {formatLabel(procurementMethod)}
            </Badge>
          )}

          {lotCount > 0 && (
            <Badge variant="default" size="sm">
              {lotCount} {lotCount === 1 ? "Lot" : "Lots"}
            </Badge>
          )}
        </div>

        {visibleClassifications.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleClassifications.map((classification) => (
              <span
                key={classification}
                className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-600"
              >
                {classification}
              </span>
            ))}

            {remainingClassifications > 0 && (
              <span className="rounded-full bg-gray-50 px-2.5 py-1 text-xs text-gray-500">
                +{remainingClassifications} more
              </span>
            )}
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
          {formattedValue && (
            <div>
              <p className="text-xs text-gray-500">Estimated Value</p>
              <p className="mt-1 text-sm font-semibold text-tenderhub-navy">
                {formattedValue}
              </p>
            </div>
          )}

          {formattedClosingDate && (
            <div className="sm:text-right">
              <p className="text-xs text-gray-500">Closing Date</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formattedClosingDate}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5">
          <Link href={solicitationHref} className="block">
            <Button variant="outline" size="sm" className="w-full">
              View Solicitation
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}