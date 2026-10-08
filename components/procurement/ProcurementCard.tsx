"use client";

import React from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type ProcurementStatusValue =
  | "DRAFT"
  | "PLANNED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type ProcurementMethodValue =
  | "OPEN"
  | "RESTRICTED"
  | "RFQ"
  | "DIRECT"
  | "NEGOTIATED";

export interface ProcurementCardProps {
  id: string;
  referenceNumber: string;
  title: string;
  description?: string | null;
  status: ProcurementStatusValue;
  procurementMethod: ProcurementMethodValue;
  organizationName: string;
  organizationLogo?: string | null;
  departmentName?: string | null;
  countryName?: string | null;
  currencyCode?: string | null;
  estimatedValue: string | number;
  plannedStartDate?: string | Date | null;
  plannedEndDate?: string | Date | null;
  solicitationCount?: number;
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
  value: string | number,
  currencyCode?: string | null,
): string {
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

function formatLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusVariant(
  status: ProcurementStatusValue,
): "default" | "info" | "success" | "warning" | "danger" {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "PLANNED":
      return "info";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "danger";
    case "DRAFT":
      return "default";
    case "ARCHIVED":
      return "default";
    default:
      return "default";
  }
}

export default function ProcurementCard({
  id,
  referenceNumber,
  title,
  description,
  status,
  procurementMethod,
  organizationName,
  organizationLogo,
  departmentName,
  countryName,
  currencyCode,
  estimatedValue,
  plannedStartDate,
  plannedEndDate,
  solicitationCount = 0,
  href,
  showOrganization = true,
  className = "",
}: ProcurementCardProps) {
  const procurementHref = href ?? `/dashboard/organization/procurements/${id}`;

  const formattedStartDate = formatDate(plannedStartDate);
  const formattedEndDate = formatDate(plannedEndDate);

  return (
    <Card
      padding="none"
      className={`overflow-hidden transition-shadow duration-200 hover:shadow-lg ${className}`}
    >
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              {referenceNumber}
            </p>

            <Link
              href={procurementHref}
              className="mt-1 block text-lg font-semibold text-tenderhub-navy transition-colors hover:text-tenderhub-gold"
            >
              {title}
            </Link>
          </div>

          <Badge variant={getStatusVariant(status)} size="sm">
            {formatLabel(status)}
          </Badge>
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

              {departmentName && (
                <p className="truncate text-xs text-gray-500">
                  {departmentName}
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
          <Badge variant="info" size="sm">
            {formatLabel(procurementMethod)}
          </Badge>

          {countryName && (
            <Badge variant="default" size="sm">
              {countryName}
            </Badge>
          )}

          <Badge variant="default" size="sm">
            {solicitationCount}{" "}
            {solicitationCount === 1 ? "Solicitation" : "Solicitations"}
          </Badge>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Estimated Value
            </p>

            <p className="mt-1 text-sm font-semibold text-tenderhub-navy">
              {formatValue(estimatedValue, currencyCode)}
            </p>
          </div>

          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Planned Period
            </p>

            <p className="mt-1 text-sm font-medium text-gray-800">
              {formattedStartDate && formattedEndDate
                ? `${formattedStartDate} â€“ ${formattedEndDate}`
                : formattedStartDate
                  ? `From ${formattedStartDate}`
                  : formattedEndDate
                    ? `Until ${formattedEndDate}`
                    : "Not specified"}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Link href={procurementHref} className="block">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
            >
              View Procurement
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
