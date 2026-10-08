"use client";

import React from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import SolicitationStatus, {
  SolicitationStatusValue,
} from "@/components/solicitations/SolicitationStatus";

export interface SolicitationDetailsProps {
  id: string;
  solicitationNumber: string;
  title: string;
  description?: string | null;
  status: SolicitationStatusValue;
  type: string;
  procurementMethod: string;
  organizationName: string;
  organizationLogo?: string | null;
  organizationWebsite?: string | null;
  currencyCode?: string | null;
  estimatedValue?: string | number | null;
  publishedAt?: string | Date | null;
  openingDate?: string | Date | null;
  closingDate?: string | Date | null;
  bidSecurityRequired?: boolean;
  bidSecurityAmount?: string | number | null;
  applicationFeeRequired?: boolean;
  applicationFeeAmount?: string | number | null;
  lotCount?: number;
  requirementCount?: number;
  documentCount?: number;
  onApply?: () => void;
  applyLabel?: string;
  showApplyButton?: boolean;
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
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

function formatLabel(value?: string | null): string {
  if (!value) {
    return "Not specified";
  }

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function SolicitationDetails({
  id,
  solicitationNumber,
  title,
  description,
  status,
  type,
  procurementMethod,
  organizationName,
  organizationLogo,
  organizationWebsite,
  currencyCode,
  estimatedValue,
  publishedAt,
  openingDate,
  closingDate,
  bidSecurityRequired = false,
  bidSecurityAmount,
  applicationFeeRequired = false,
  applicationFeeAmount,
  lotCount = 0,
  requirementCount = 0,
  documentCount = 0,
  onApply,
  applyLabel = "Submit a Bid",
  showApplyButton = true,
  className = "",
}: SolicitationDetailsProps) {
  const formattedValue = formatValue(estimatedValue, currencyCode);
  const formattedBidSecurity = formatValue(
    bidSecurityAmount,
    currencyCode,
  );
  const formattedApplicationFee = formatValue(
    applicationFeeAmount,
    currencyCode,
  );

  const formattedPublishedAt = formatDate(publishedAt);
  const formattedOpeningDate = formatDate(openingDate);
  const formattedClosingDate = formatDate(closingDate);

  const canApply = status === "OPEN";

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                {solicitationNumber}
              </span>

              <SolicitationStatus status={status} size="sm" />
            </div>

            <h1 className="mt-3 text-2xl font-bold leading-tight text-tenderhub-navy sm:text-3xl">
              {title}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="default" size="sm">
                {formatLabel(type)}
              </Badge>

              <Badge variant="info" size="sm">
                {formatLabel(procurementMethod)}
              </Badge>
            </div>
          </div>

          {showApplyButton && (
            <div className="shrink-0">
              <Button
                type="button"
                variant="primary"
                onClick={onApply}
                disabled={!canApply}
              >
                {canApply ? applyLabel : "Bidding Closed"}
              </Button>
            </div>
          )}
        </div>

        {description && (
          <div className="mt-6 border-t border-gray-100 pt-6">
            <h2 className="text-base font-semibold text-tenderhub-navy">
              Description
            </h2>

            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
              {description}
            </p>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-3">
          {organizationLogo ? (
            <img
              src={organizationLogo}
              alt=""
              className="h-12 w-12 rounded-lg border border-gray-200 object-contain"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-tenderhub-navy text-lg font-semibold text-white">
              {organizationName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Procuring Organization
            </p>

            {organizationWebsite ? (
              <a
                href={organizationWebsite}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block truncate text-base font-semibold text-tenderhub-navy hover:text-tenderhub-gold"
              >
                {organizationName}
              </a>
            ) : (
              <p className="mt-1 truncate text-base font-semibold text-tenderhub-navy">
                {organizationName}
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-tenderhub-navy">
          Solicitation Overview
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {formattedValue && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Estimated Value
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formattedValue}
              </p>
            </div>
          )}

          {formattedPublishedAt && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Published
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {formattedPublishedAt}
              </p>
            </div>
          )}

          {formattedOpeningDate && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Opening Date
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {formattedOpeningDate}
              </p>
            </div>
          )}

          {formattedClosingDate && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Closing Date
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formattedClosingDate}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Lots
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {lotCount}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Requirements
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {requirementCount}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Documents
            </p>
            <p className="mt-1 text-sm font-medium text-gray-900">
              {documentCount}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-base font-semibold text-tenderhub-navy">
          Bid Requirements
        </h2>

        <div className="mt-5 space-y-4">
          <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Bid Security
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {bidSecurityRequired
                  ? "Bid security is required for this solicitation."
                  : "No bid security is required."}
              </p>
            </div>

            <Badge
              variant={bidSecurityRequired ? "warning" : "success"}
              size="sm"
            >
              {bidSecurityRequired ? "Required" : "Not Required"}
            </Badge>
          </div>

          {bidSecurityRequired && formattedBidSecurity && (
            <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
              <span className="text-sm text-gray-600">
                Bid Security Amount
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formattedBidSecurity}
              </span>
            </div>
          )}

          <div className="flex items-start justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div>
              <p className="text-sm font-medium text-gray-800">
                Application Fee
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {applicationFeeRequired
                  ? "An application fee is required before bid submission."
                  : "No application fee is required."}
              </p>
            </div>

            <Badge
              variant={applicationFeeRequired ? "warning" : "success"}
              size="sm"
            >
              {applicationFeeRequired ? "Required" : "Not Required"}
            </Badge>
          </div>

          {applicationFeeRequired && formattedApplicationFee && (
            <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
              <span className="text-sm text-gray-600">
                Application Fee Amount
              </span>
              <span className="text-sm font-semibold text-gray-900">
                {formattedApplicationFee}
              </span>
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-between">
        <Link href="/solicitations">
          <Button type="button" variant="ghost">
            Back to Solicitations
          </Button>
        </Link>

        {showApplyButton && (
          <Button
            type="button"
            variant="primary"
            onClick={onApply}
            disabled={!canApply}
          >
            {canApply ? applyLabel : "Bidding Closed"}
          </Button>
        )}
      </div>
    </div>
  );
}