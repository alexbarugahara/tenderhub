"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export type ComplianceStatusValue =
  | "PENDING"
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "EXPIRED"
  | "EXPIRING"
  | "NOT_APPLICABLE";

export type ComplianceCategoryValue =
  | "TAX"
  | "REGISTRATION"
  | "LICENSING"
  | "INSURANCE"
  | "PROFESSIONAL"
  | "FINANCIAL"
  | "EXPERIENCE"
  | "OWNERSHIP"
  | "OTHER";

export interface ComplianceDashboardRequirement {
  id: string;
  name: string;
  category: ComplianceCategoryValue;
  mandatory: boolean;
  status: ComplianceStatusValue;
  expiresAt?: Date | string | null;
  active?: boolean;
}

export interface ComplianceDashboardProps {
  vendorName?: string;
  requirements: ComplianceDashboardRequirement[];
  loading?: boolean;
  readOnly?: boolean;
  onRequirementClick?: (
    requirement: ComplianceDashboardRequirement,
  ) => void;
  className?: string;
}

const statusLabels: Record<ComplianceStatusValue, string> = {
  PENDING: "Pending",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  EXPIRED: "Expired",
  EXPIRING: "Expiring",
  NOT_APPLICABLE: "Not Applicable",
};

const statusVariants: Record<
  ComplianceStatusValue,
  "default" | "success" | "danger" | "warning" | "info"
> = {
  PENDING: "default",
  COMPLIANT: "success",
  NON_COMPLIANT: "danger",
  EXPIRED: "danger",
  EXPIRING: "warning",
  NOT_APPLICABLE: "info",
};

const categoryLabels: Record<ComplianceCategoryValue, string> = {
  TAX: "Tax",
  REGISTRATION: "Registration",
  LICENSING: "Licensing",
  INSURANCE: "Insurance",
  PROFESSIONAL: "Professional",
  FINANCIAL: "Financial",
  EXPERIENCE: "Experience",
  OWNERSHIP: "Ownership",
  OTHER: "Other",
};

function formatDate(value?: Date | string | null): string {
  if (!value) {
    return "No expiry date";
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

function getDaysUntilExpiry(value?: Date | string | null): number | null {
  if (!value) {
    return null;
  }

  const expiryDate = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(expiryDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  expiryDate.setHours(0, 0, 0, 0);

  const difference = expiryDate.getTime() - today.getTime();

  return Math.ceil(difference / (1000 * 60 * 60 * 24));
}

function getExpiryText(value?: Date | string | null): string | null {
  const days = getDaysUntilExpiry(value);

  if (days === null) {
    return null;
  }

  if (days < 0) {
    const absoluteDays = Math.abs(days);

    return `Expired ${absoluteDays} day${
      absoluteDays === 1 ? "" : "s"
    } ago`;
  }

  if (days === 0) {
    return "Expires today";
  }

  if (days === 1) {
    return "Expires tomorrow";
  }

  return `Expires in ${days} days`;
}

export default function ComplianceDashboard({
  vendorName,
  requirements,
  loading = false,
  readOnly = false,
  onRequirementClick,
  className = "",
}: ComplianceDashboardProps) {
  const total = requirements.length;

  const compliant = requirements.filter(
    (requirement) => requirement.status === "COMPLIANT",
  ).length;

  const pending = requirements.filter(
    (requirement) => requirement.status === "PENDING",
  ).length;

  const nonCompliant = requirements.filter(
    (requirement) => requirement.status === "NON_COMPLIANT",
  ).length;

  const expired = requirements.filter(
    (requirement) => requirement.status === "EXPIRED",
  ).length;

  const expiring = requirements.filter(
    (requirement) => requirement.status === "EXPIRING",
  ).length;

  const notApplicable = requirements.filter(
    (requirement) => requirement.status === "NOT_APPLICABLE",
  ).length;

  const applicableRequirements = requirements.filter(
    (requirement) => requirement.status !== "NOT_APPLICABLE",
  );

  const applicableCount = applicableRequirements.length;

  const complianceRate =
    applicableCount > 0
      ? Math.round((compliant / applicableCount) * 100)
      : 0;

  const mandatoryRequirements = requirements.filter(
    (requirement) => requirement.mandatory,
  );

  const mandatoryCompliant = mandatoryRequirements.filter(
    (requirement) => requirement.status === "COMPLIANT",
  ).length;

  const mandatoryIssues = mandatoryRequirements.filter(
    (requirement) =>
      requirement.status === "PENDING" ||
      requirement.status === "NON_COMPLIANT" ||
      requirement.status === "EXPIRED" ||
      requirement.status === "EXPIRING",
  ).length;

  const issueCount = pending + nonCompliant + expired + expiring;

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded bg-gray-200" />
            <div className="h-4 w-72 rounded bg-gray-200" />
            <div className="h-3 w-full rounded bg-gray-200" />
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <Card key={item}>
              <div className="animate-pulse space-y-3">
                <div className="h-4 w-24 rounded bg-gray-200" />
                <div className="h-8 w-16 rounded bg-gray-200" />
              </div>
            </Card>
          ))}
        </div>

        <Card>
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-40 rounded bg-gray-200" />
            <div className="h-12 w-full rounded bg-gray-200" />
            <div className="h-12 w-full rounded bg-gray-200" />
            <div className="h-12 w-full rounded bg-gray-200" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Compliance Overview
            </p>

            <h2 className="mt-1 text-xl font-semibold text-tenderhub-navy">
              {vendorName ? `${vendorName} Compliance` : "Vendor Compliance"}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Monitor required compliance records, their current status, and
              upcoming expirations.
            </p>
          </div>

          <div className="min-w-[220px]">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">
                Compliance rate
              </span>

              <span className="font-semibold text-tenderhub-navy">
                {complianceRate}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-tenderhub-gold transition-all"
                style={{
                  width: `${Math.min(Math.max(complianceRate, 0), 100)}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">
              {compliant} of {applicableCount} applicable requirement
              {applicableCount === 1 ? "" : "s"} compliant
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Total</p>

              <p className="mt-2 text-3xl font-semibold text-tenderhub-navy">
                {total}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Requirements tracked
              </p>
            </div>

            <Badge variant="default">All</Badge>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Compliant</p>

              <p className="mt-2 text-3xl font-semibold text-green-700">
                {compliant}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {complianceRate}% of applicable requirements
              </p>
            </div>

            <Badge variant="success">Compliant</Badge>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Issues</p>

              <p className="mt-2 text-3xl font-semibold text-red-700">
                {issueCount}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Pending, expired, expiring, or non-compliant
              </p>
            </div>

            <Badge variant={issueCount > 0 ? "danger" : "success"}>
              {issueCount > 0 ? "Attention" : "Clear"}
            </Badge>
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">
                Mandatory Issues
              </p>

              <p className="mt-2 text-3xl font-semibold text-amber-700">
                {mandatoryIssues}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {mandatoryCompliant} of {mandatoryRequirements.length}{" "}
                mandatory compliant
              </p>
            </div>

            <Badge variant={mandatoryIssues > 0 ? "warning" : "success"}>
              {mandatoryIssues > 0 ? "Review" : "Clear"}
            </Badge>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-tenderhub-navy">
              Compliance Requirements
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Review the current status of each requirement.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="success">{compliant} Compliant</Badge>

            <Badge variant="warning">
              {pending + expiring} Attention
            </Badge>

            <Badge variant="danger">
              {nonCompliant + expired} Issues
            </Badge>
          </div>
        </div>

        {requirements.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              ✓
            </div>

            <h4 className="mt-4 text-base font-semibold text-tenderhub-navy">
              No compliance requirements
            </h4>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              There are currently no compliance requirements to display.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {requirements.map((requirement) => {
              const expiryText = getExpiryText(requirement.expiresAt);

              return (
                <button
                  key={requirement.id}
                  type="button"
                  disabled={readOnly || !onRequirementClick}
                  onClick={() => onRequirementClick?.(requirement)}
                  className={`w-full py-4 text-left transition ${
                    onRequirementClick && !readOnly
                      ? "cursor-pointer hover:bg-gray-50"
                      : "cursor-default"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-medium text-gray-900">
                          {requirement.name}
                        </h4>

                        {requirement.mandatory && (
                          <Badge variant="danger">Mandatory</Badge>
                        )}

                        <Badge variant="default">
                          {categoryLabels[requirement.category]}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>
                          {requirement.active === false
                            ? "Inactive requirement"
                            : "Active requirement"}
                        </span>

                        {requirement.expiresAt && (
                          <span>
                            Expiry: {formatDate(requirement.expiresAt)}
                          </span>
                        )}

                        {expiryText && (
                          <span
                            className={
                              requirement.status === "EXPIRED" ||
                              requirement.status === "NON_COMPLIANT"
                                ? "font-medium text-red-600"
                                : requirement.status === "EXPIRING"
                                  ? "font-medium text-amber-600"
                                  : ""
                            }
                          >
                            {expiryText}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Badge variant={statusVariants[requirement.status]}>
                        {statusLabels[requirement.status]}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <p className="text-sm font-medium text-gray-500">Pending</p>

          <p className="mt-2 text-2xl font-semibold text-gray-900">
            {pending}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Requirements awaiting verification
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-500">Expiring</p>

          <p className="mt-2 text-2xl font-semibold text-amber-700">
            {expiring}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Requirements approaching expiry
          </p>
        </Card>

        <Card>
          <p className="text-sm font-medium text-gray-500">
            Not Applicable
          </p>

          <p className="mt-2 text-2xl font-semibold text-gray-700">
            {notApplicable}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Requirements not applicable to this vendor
          </p>
        </Card>
      </div>
    </div>
  );
}