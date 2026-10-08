"use client";

import React from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";

export type ComplianceRequirementType =
  | "TAX"
  | "REGISTRATION"
  | "LICENSING"
  | "INSURANCE"
  | "PROFESSIONAL"
  | "FINANCIAL"
  | "EXPERIENCE"
  | "OWNERSHIP"
  | "OTHER";

export type ComplianceRequirementStatus =
  | "PENDING"
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "EXPIRED"
  | "EXPIRING"
  | "NOT_APPLICABLE";

export interface ComplianceRequirementItem {
  id: string;
  name: string;
  description?: string | null;
  type: ComplianceRequirementType;
  mandatory: boolean;
  status: ComplianceRequirementStatus;
  expiresAt?: Date | string | null;
  active?: boolean;
}

export interface ComplianceRequirementsProps {
  requirements: ComplianceRequirementItem[];
  loading?: boolean;
  readOnly?: boolean;
  onAdd?: () => void;
  onEdit?: (requirement: ComplianceRequirementItem) => void;
  onDelete?: (requirement: ComplianceRequirementItem) => void;
  onView?: (requirement: ComplianceRequirementItem) => void;
  className?: string;
}

const typeLabels: Record<ComplianceRequirementType, string> = {
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

const statusLabels: Record<ComplianceRequirementStatus, string> = {
  PENDING: "Pending",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  EXPIRED: "Expired",
  EXPIRING: "Expiring",
  NOT_APPLICABLE: "Not Applicable",
};

const statusVariants: Record<
  ComplianceRequirementStatus,
  "default" | "success" | "danger" | "warning" | "info"
> = {
  PENDING: "default",
  COMPLIANT: "success",
  NON_COMPLIANT: "danger",
  EXPIRED: "danger",
  EXPIRING: "warning",
  NOT_APPLICABLE: "info",
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

function getExpiryText(value?: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  const expiryDate =
    value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(expiryDate.getTime())) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  expiryDate.setHours(0, 0, 0, 0);

  const days = Math.ceil(
    (expiryDate.getTime() - today.getTime()) /
      (1000 * 60 * 60 * 24),
  );

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

export default function ComplianceRequirements({
  requirements,
  loading = false,
  readOnly = false,
  onAdd,
  onEdit,
  onDelete,
  onView,
  className = "",
}: ComplianceRequirementsProps) {
  const mandatoryCount = requirements.filter(
    (requirement) => requirement.mandatory,
  ).length;

  const compliantCount = requirements.filter(
    (requirement) => requirement.status === "COMPLIANT",
  ).length;

  const attentionCount = requirements.filter(
    (requirement) =>
      requirement.status === "PENDING" ||
      requirement.status === "EXPIRING" ||
      requirement.status === "EXPIRED" ||
      requirement.status === "NON_COMPLIANT",
  ).length;

  if (loading) {
    return (
      <Card className={className}>
        <div className="animate-pulse space-y-5">
          <div className="flex items-center justify-between">
            <div className="h-6 w-48 rounded bg-gray-200" />
            <div className="h-10 w-28 rounded bg-gray-200" />
          </div>

          <div className="space-y-3">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-20 rounded-lg bg-gray-100"
              />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Compliance Requirements
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage the compliance requirements that vendors must satisfy.
            </p>
          </div>

          {onAdd && !readOnly && (
            <Button
              type="button"
              variant="primary"
              onClick={onAdd}
            >
              Add Requirement
            </Button>
          )}
        </div>

        {requirements.length === 0 ? (
          <EmptyState
            title="No compliance requirements"
            description="There are currently no compliance requirements to display."
          />
        ) : (
          <div className="space-y-3">
            {requirements.map((requirement) => {
              const expiryText = getExpiryText(
                requirement.expiresAt,
              );

              return (
                <div
                  key={requirement.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 transition hover:border-gray-300"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {requirement.name}
                        </h3>

                        <Badge variant="default">
                          {typeLabels[requirement.type]}
                        </Badge>

                        {requirement.mandatory && (
                          <Badge variant="danger">
                            Mandatory
                          </Badge>
                        )}

                        {requirement.active === false && (
                          <Badge variant="default">
                            Inactive
                          </Badge>
                        )}
                      </div>

                      {requirement.description && (
                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {requirement.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-500">
                        <span>
                          Expiry:{" "}
                          {formatDate(requirement.expiresAt)}
                        </span>

                        {expiryText && (
                          <span
                            className={
                              requirement.status === "EXPIRED" ||
                              requirement.status ===
                                "NON_COMPLIANT"
                                ? "font-medium text-red-600"
                                : requirement.status ===
                                    "EXPIRING"
                                  ? "font-medium text-amber-600"
                                  : ""
                            }
                          >
                            {expiryText}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                      <Badge
                        variant={statusVariants[requirement.status]}
                      >
                        {statusLabels[requirement.status]}
                      </Badge>

                      {!readOnly && (
                        <div className="flex flex-wrap gap-2">
                          {onView && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onView(requirement)
                              }
                            >
                              View
                            </Button>
                          )}

                          {onEdit && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                onEdit(requirement)
                              }
                            >
                              Edit
                            </Button>
                          )}

                          {onDelete && (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() =>
                                onDelete(requirement)
                              }
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {requirements.length > 0 && (
          <div className="grid grid-cols-2 gap-3 border-t border-gray-200 pt-5 sm:grid-cols-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">
                Total
              </p>

              <p className="mt-1 text-xl font-semibold text-tenderhub-navy">
                {requirements.length}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">
                Mandatory
              </p>

              <p className="mt-1 text-xl font-semibold text-tenderhub-navy">
                {mandatoryCount}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">
                Compliant
              </p>

              <p className="mt-1 text-xl font-semibold text-green-700">
                {compliantCount}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs font-medium text-gray-500">
                Attention
              </p>

              <p className="mt-1 text-xl font-semibold text-amber-700">
                {attentionCount}
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}