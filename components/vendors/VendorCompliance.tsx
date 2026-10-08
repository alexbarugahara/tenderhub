"use client";

import React from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export type VendorComplianceStatus =
  | "PENDING"
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "EXPIRED"
  | "EXPIRING"
  | "NOT_APPLICABLE";

export interface VendorComplianceItem {
  id: string;

  /**
   * VendorComplianceRequirement fields.
   */
  name: string;
  description?: string | null;
  code?: string | null;
  category?: string | null;

  /**
   * `required` is the canonical field on
   * VendorComplianceRequirement.
   *
   * `mandatory` is retained for compatibility with
   * older callers.
   */
  required?: boolean;
  mandatory?: boolean;

  /**
   * Current VendorCompliance status.
   */
  status: VendorComplianceStatus | string;

  /**
   * Evidence/document information.
   */
  documentId?: string | null;
  documentName?: string | null;
  documentCategory?: string | null;
  documentStatus?: string | null;

  /**
   * Review information.
   */
  expiresAt?: string | Date | null;
  checkedAt?: string | Date | null;
  checkedBy?: string | null;
  notes?: string | null;
}

export interface VendorComplianceProps {
  items?: VendorComplianceItem[];

  loading?: boolean;
  checking?: boolean;

  /**
   * Whether the current user is allowed to review
   * compliance requirements.
   */
  canCheck?: boolean;

  error?: string | null;

  /**
   * Existing callback retained for compatibility.
   *
   * In the new workflow this represents an admin
   * review/check action rather than automatic approval.
   */
  onCheck?: (
    item: VendorComplianceItem,
  ) => void | Promise<void>;

  onView?: (
    item: VendorComplianceItem,
  ) => void;

  onResolve?: (
    item: VendorComplianceItem,
  ) => void;

  className?: string;
}

function formatDate(
  value?: string | Date | null,
): string {
  if (!value) {
    return "Not provided";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatStatus(
  status: string,
): string {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function getStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "default" {
  const normalized =
    status.toUpperCase();

  if (
    normalized === "COMPLIANT" ||
    normalized === "NOT_APPLICABLE"
  ) {
    return "success";
  }

  if (
    normalized === "PENDING" ||
    normalized === "EXPIRING"
  ) {
    return "warning";
  }

  if (
    normalized === "NON_COMPLIANT" ||
    normalized === "EXPIRED"
  ) {
    return "danger";
  }

  return "default";
}

function getSummary(
  items: VendorComplianceItem[],
) {
  return {
    total: items.length,

    required: items.filter(
      (item) =>
        item.required ??
        item.mandatory ??
        false,
    ).length,

    compliant: items.filter(
      (item) =>
        item.status.toUpperCase() ===
        "COMPLIANT",
    ).length,

    pending: items.filter(
      (item) =>
        item.status.toUpperCase() ===
        "PENDING",
    ).length,

    attention: items.filter(
      (item) => {
        const status =
          item.status.toUpperCase();

        return (
          status === "NON_COMPLIANT" ||
          status === "EXPIRED" ||
          status === "EXPIRING"
        );
      },
    ).length,

    notApplicable: items.filter(
      (item) =>
        item.status.toUpperCase() ===
        "NOT_APPLICABLE",
    ).length,
  };
}

function getCompletionPercentage(
  items: VendorComplianceItem[],
): number {
  const requiredItems =
    items.filter(
      (item) =>
        item.required ??
        item.mandatory ??
        false,
    );

  if (requiredItems.length === 0) {
    return items.length > 0 ? 100 : 0;
  }

  const satisfied =
    requiredItems.filter(
      (item) => {
        const status =
          item.status.toUpperCase();

        return (
          status === "COMPLIANT" ||
          status === "NOT_APPLICABLE"
        );
      },
    ).length;

  return Math.round(
    (satisfied /
      requiredItems.length) *
      100,
  );
}

function getRequirementStateMessage(
  item: VendorComplianceItem,
): string {
  const status =
    item.status.toUpperCase();

  if (status === "COMPLIANT") {
    return item.documentId
      ? "Evidence received and requirement approved."
      : "Requirement approved.";
  }

  if (status === "PENDING") {
    return item.documentId
      ? "Evidence received and awaiting admin review."
      : "Evidence is still required.";
  }

  if (status === "NON_COMPLIANT") {
    return "The submitted evidence did not satisfy this requirement.";
  }

  if (status === "EXPIRED") {
    return "The supporting evidence has expired.";
  }

  if (status === "EXPIRING") {
    return "The supporting evidence is approaching expiry.";
  }

  if (status === "NOT_APPLICABLE") {
    return "This requirement has been marked not applicable.";
  }

  return "Requirement status is awaiting review.";
}

export default function VendorCompliance({
  items = [],
  loading = false,
  checking = false,
  canCheck = true,
  error = null,
  onCheck,
  onView,
  onResolve,
  className = "",
}: VendorComplianceProps) {
  const summary =
    getSummary(items);

  const completionPercentage =
    getCompletionPercentage(items);

  return (
    <div
      className={`space-y-6 ${className}`}
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* ONBOARDING PROGRESS                                */}
      {/* -------------------------------------------------- */}

      <Card className="p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-tenderhub-navy">
                Vendor Onboarding Compliance
              </h2>

              {completionPercentage === 100 ? (
                <Badge variant="success">
                  Ready
                </Badge>
              ) : (
                <Badge variant="warning">
                  In Progress
                </Badge>
              )}
            </div>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
              Review the TenderHub requirements,
              submitted evidence, and current
              compliance status before vendor
              activation.
            </p>
          </div>

          <div className="shrink-0 text-left lg:text-right">
            <p className="text-sm text-gray-500">
              Required requirements
            </p>

            <p className="mt-1 text-2xl font-bold text-tenderhub-navy">
              {completionPercentage}%
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-tenderhub-gold transition-all duration-300"
              style={{
                width: `${completionPercentage}%`,
              }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>
              {summary.compliant} of{" "}
              {summary.required} required
              requirements satisfied
            </span>

            <span>
              {summary.attention > 0
                ? `${summary.attention} need attention`
                : "No outstanding issues"}
            </span>
          </div>
        </div>
      </Card>

      {/* -------------------------------------------------- */}
      {/* SUMMARY CARDS                                      */}
      {/* -------------------------------------------------- */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Total
          </p>

          <p className="mt-2 text-2xl font-bold text-tenderhub-navy">
            {summary.total}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Active requirements
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Required
          </p>

          <p className="mt-2 text-2xl font-bold text-tenderhub-navy">
            {summary.required}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Required for onboarding
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Compliant
          </p>

          <p className="mt-2 text-2xl font-bold text-green-700">
            {summary.compliant}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Approved requirements
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Pending
          </p>

          <p className="mt-2 text-2xl font-bold text-amber-600">
            {summary.pending}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Awaiting evidence/review
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-gray-500">
            Attention
          </p>

          <p className="mt-2 text-2xl font-bold text-red-700">
            {summary.attention}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            Issues or expiry
          </p>
        </Card>
      </div>

      {/* -------------------------------------------------- */}
      {/* REQUIREMENTS                                       */}
      {/* -------------------------------------------------- */}

      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-tenderhub-navy">
                Onboarding Requirements
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Review each TenderHub requirement,
                its evidence, and its current
                verification state.
              </p>
            </div>

            <div className="text-sm text-gray-500">
              {summary.compliant} /{" "}
              {summary.required} required
              satisfied
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : items.length === 0 ? (
          <div className="px-6 py-10">
            <EmptyState
              title="No onboarding requirements"
              description="No active TenderHub compliance requirements have been assigned to this vendor."
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((item) => {
              const normalizedStatus =
                item.status.toUpperCase();

              const required =
                item.required ??
                item.mandatory ??
                false;

              const needsAttention =
                normalizedStatus ===
                  "NON_COMPLIANT" ||
                normalizedStatus ===
                  "EXPIRED" ||
                normalizedStatus ===
                  "EXPIRING";

              const evidenceReceived =
                Boolean(item.documentId);

              return (
                <div
                  key={item.id}
                  className="px-6 py-6 transition hover:bg-gray-50"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      {/* Requirement heading */}
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {item.name}
                        </h3>

                        <Badge
                          variant={getStatusVariant(
                            item.status,
                          )}
                        >
                          {formatStatus(
                            item.status,
                          )}
                        </Badge>

                        {required && (
                          <Badge variant="default">
                            Required
                          </Badge>
                        )}

                        {!required && (
                          <Badge variant="default">
                            Optional
                          </Badge>
                        )}
                      </div>

                      {/* Requirement code */}
                      {item.code && (
                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
                          Requirement:{" "}
                          {item.code}
                        </p>
                      )}

                      {/* Description */}
                      {item.description && (
                        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600">
                          {item.description}
                        </p>
                      )}

                      {/* Requirement state */}
                      <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                        <p className="text-sm font-medium text-gray-800">
                          {getRequirementStateMessage(
                            item,
                          )}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 text-sm text-gray-600 sm:grid-cols-2 lg:grid-cols-3">
                        {item.category && (
                          <p>
                            <span className="font-medium text-gray-800">
                              Category:
                            </span>{" "}
                            {item.category}
                          </p>
                        )}

                        <p>
                          <span className="font-medium text-gray-800">
                            Evidence:
                          </span>{" "}
                          {evidenceReceived
                            ? "Received"
                            : "Not received"}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            Checked:
                          </span>{" "}
                          {formatDate(
                            item.checkedAt,
                          )}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            Expires:
                          </span>{" "}
                          {formatDate(
                            item.expiresAt,
                          )}
                        </p>

                        {item.checkedBy && (
                          <p>
                            <span className="font-medium text-gray-800">
                              Reviewed by:
                            </span>{" "}
                            {item.checkedBy}
                          </p>
                        )}

                        {item.documentName && (
                          <p className="truncate">
                            <span className="font-medium text-gray-800">
                              Evidence:
                            </span>{" "}
                            {item.documentName}
                          </p>
                        )}
                      </div>

                      {/* Evidence information */}
                      {evidenceReceived && (
                        <div className="mt-4 flex flex-col gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                              Supporting Evidence
                            </p>

                            <p className="mt-1 text-sm font-medium text-gray-800">
                              {item.documentName ||
                                "Document submitted"}
                            </p>

                            {item.documentCategory && (
                              <p className="mt-1 text-xs text-gray-500">
                                {item.documentCategory}
                              </p>
                            )}
                          </div>

                          <Badge
                            variant={
                              item.documentStatus?.toUpperCase() ===
                              "APPROVED"
                                ? "success"
                                : "warning"
                            }
                          >
                            {item.documentStatus
                              ? formatStatus(
                                  item.documentStatus,
                                )
                              : "Pending review"}
                          </Badge>
                        </div>
                      )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Review Notes
                          </p>

                          <p className="mt-1 text-sm leading-6 text-gray-700">
                            {item.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {onView && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onView(item)
                          }
                        >
                          View
                        </Button>
                      )}

                      {canCheck &&
                        onCheck &&
                        normalizedStatus !==
                          "COMPLIANT" &&
                        normalizedStatus !==
                          "NOT_APPLICABLE" && (
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={checking}
                            onClick={() =>
                              onCheck(item)
                            }
                          >
                            {checking
                              ? "Reviewing..."
                              : evidenceReceived
                                ? "Review"
                                : "Review Requirement"}
                          </Button>
                        )}

                      {needsAttention &&
                        onResolve && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onResolve(item)
                            }
                          >
                            Resolve
                          </Button>
                        )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* -------------------------------------------------- */}
      {/* WORKFLOW NOTE                                      */}
      {/* -------------------------------------------------- */}

      <div className="rounded-lg border border-blue-100 bg-blue-50 px-5 py-4">
        <p className="text-sm font-semibold text-blue-900">
          Verification workflow
        </p>

        <p className="mt-1 text-sm leading-6 text-blue-800">
          Submitted evidence is recorded as received
          and remains pending until an authorized
          TenderHub administrator reviews it. Evidence
          submission does not automatically approve the
          requirement or activate the vendor.
        </p>
      </div>
    </div>
  );
}