"use client";

import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";

export type ManagedComplianceStatus =
  | "PENDING"
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "EXPIRED"
  | "EXPIRING"
  | "NOT_APPLICABLE";

export type ManagedComplianceCategory =
  | "TAX"
  | "REGISTRATION"
  | "LICENSING"
  | "INSURANCE"
  | "PROFESSIONAL"
  | "FINANCIAL"
  | "EXPERIENCE"
  | "OWNERSHIP"
  | "OTHER";

export interface ManagedCompliance {
  id: string;
  name: string;
  description?: string | null;
  category?: ManagedComplianceCategory | string | null;
  status: ManagedComplianceStatus;
  mandatory?: boolean;
  vendorId?: string | null;
  vendorName?: string | null;
  vendorEmail?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  documentId?: string | null;
  documentName?: string | null;
  checkedAt?: string | Date | null;
  checkedBy?: string | null;
  expiresAt?: string | Date | null;
  notes?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface ComplianceManagementProps {
  complianceRecords: ManagedCompliance[];
  loading?: boolean;
  error?: string | null;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onView?: (record: ManagedCompliance) => void;
  onReview?: (record: ManagedCompliance) => void;
  onMarkCompliant?: (record: ManagedCompliance) => void;
  onMarkNonCompliant?: (record: ManagedCompliance) => void;
  onDelete?: (record: ManagedCompliance) => void;
  className?: string;
}

function formatDate(
  value?: string | Date | null,
): string {
  if (!value) {
    return "—";
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function getStatusVariant(
  status: ManagedComplianceStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "COMPLIANT":
      return "success";

    case "PENDING":
    case "EXPIRING":
      return "warning";

    case "NON_COMPLIANT":
    case "EXPIRED":
      return "danger";

    case "NOT_APPLICABLE":
    default:
      return "default";
  }
}

function getStatusLabel(
  status: ManagedComplianceStatus,
): string {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

function getCategoryLabel(
  category?: string | null,
): string {
  if (!category) {
    return "—";
  }

  return category
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default function ComplianceManagement({
  complianceRecords,
  loading = false,
  error = null,
  page = 1,
  totalPages,
  onPageChange,
  onView,
  onReview,
  onMarkCompliant,
  onMarkNonCompliant,
  onDelete,
  className = "",
}: ComplianceManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<
      ManagedComplianceStatus | "ALL"
    >("ALL");

  const [categoryFilter, setCategoryFilter] =
    useState<
      ManagedComplianceCategory | "ALL"
    >("ALL");

  const [mandatoryFilter, setMandatoryFilter] =
    useState<
      "ALL" | "MANDATORY" | "OPTIONAL"
    >("ALL");

  const filteredRecords = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return complianceRecords.filter(
      (record) => {
        const matchesStatus =
          statusFilter === "ALL" ||
          record.status === statusFilter;

        if (!matchesStatus) {
          return false;
        }

        const matchesCategory =
          categoryFilter === "ALL" ||
          record.category === categoryFilter;

        if (!matchesCategory) {
          return false;
        }

        const matchesMandatory =
          mandatoryFilter === "ALL" ||
          (mandatoryFilter === "MANDATORY" &&
            record.mandatory === true) ||
          (mandatoryFilter === "OPTIONAL" &&
            record.mandatory !== true);

        if (!matchesMandatory) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          record.name,
          record.description,
          record.category,
          record.vendorName,
          record.vendorEmail,
          record.vendorId,
          record.organizationName,
          record.organizationId,
          record.documentName,
          record.checkedBy,
          record.notes,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value)
              .toLowerCase()
              .includes(query),
          );
      },
    );
  }, [
    complianceRecords,
    search,
    statusFilter,
    categoryFilter,
    mandatoryFilter,
  ]);

  if (loading) {
    return (
      <Card className={className}>
        <div className="flex min-h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="border-b border-gray-200 pb-5">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Compliance Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Monitor compliance requirements and
            review vendor compliance records.
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <label
            htmlFor="compliance-management-search"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Search
          </label>

          <input
            id="compliance-management-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Requirement, vendor, document..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          />
        </div>

        <div>
          <label
            htmlFor="compliance-management-status"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Status
          </label>

          <select
            id="compliance-management-status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | ManagedComplianceStatus
                  | "ALL",
              )
            }
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          >
            <option value="ALL">
              All statuses
            </option>
            <option value="PENDING">
              Pending
            </option>
            <option value="COMPLIANT">
              Compliant
            </option>
            <option value="NON_COMPLIANT">
              Non-Compliant
            </option>
            <option value="EXPIRED">
              Expired
            </option>
            <option value="EXPIRING">
              Expiring
            </option>
            <option value="NOT_APPLICABLE">
              Not Applicable
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="compliance-management-category"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Category
          </label>

          <select
            id="compliance-management-category"
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value as
                  | ManagedComplianceCategory
                  | "ALL",
              )
            }
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          >
            <option value="ALL">
              All categories
            </option>
            <option value="TAX">
              Tax
            </option>
            <option value="REGISTRATION">
              Registration
            </option>
            <option value="LICENSING">
              Licensing
            </option>
            <option value="INSURANCE">
              Insurance
            </option>
            <option value="PROFESSIONAL">
              Professional
            </option>
            <option value="FINANCIAL">
              Financial
            </option>
            <option value="EXPERIENCE">
              Experience
            </option>
            <option value="OWNERSHIP">
              Ownership
            </option>
            <option value="OTHER">
              Other
            </option>
          </select>
        </div>

        <div>
          <label
            htmlFor="compliance-management-mandatory"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Requirement
          </label>

          <select
            id="compliance-management-mandatory"
            value={mandatoryFilter}
            onChange={(event) =>
              setMandatoryFilter(
                event.target.value as
                  | "ALL"
                  | "MANDATORY"
                  | "OPTIONAL",
              )
            }
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          >
            <option value="ALL">
              All requirements
            </option>
            <option value="MANDATORY">
              Mandatory
            </option>
            <option value="OPTIONAL">
              Optional
            </option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        {filteredRecords.length === 0 ? (
          <div className="py-10">
            <EmptyState
              title={
                complianceRecords.length === 0
                  ? "No compliance records found"
                  : "No matching compliance records"
              }
              description={
                complianceRecords.length === 0
                  ? "Compliance records will appear here when they are created."
                  : "Try changing your search or filters."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left">
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Requirement
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Vendor
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Category
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Status
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Expiry
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Last Checked
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <div className="min-w-56">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-900">
                            {record.name}
                          </p>

                          {record.mandatory && (
                            <Badge variant="warning">
                              Mandatory
                            </Badge>
                          )}
                        </div>

                        {record.description && (
                          <p className="mt-1 max-w-80 truncate text-sm text-gray-500">
                            {record.description}
                          </p>
                        )}

                        {record.documentName && (
                          <p className="mt-1 text-xs text-gray-400">
                            Document:{" "}
                            {record.documentName}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <div className="min-w-40">
                        <p className="text-sm font-medium text-gray-700">
                          {record.vendorName ||
                            record.vendorId ||
                            "—"}
                        </p>

                        {record.vendorEmail && (
                          <p className="mt-1 text-xs text-gray-500">
                            {record.vendorEmail}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="text-sm text-gray-700">
                        {getCategoryLabel(
                          record.category,
                        )}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <Badge
                        variant={getStatusVariant(
                          record.status,
                        )}
                      >
                        {getStatusLabel(
                          record.status,
                        )}
                      </Badge>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <p className="text-sm text-gray-700">
                        {formatDate(
                          record.expiresAt,
                        )}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <p className="text-sm text-gray-700">
                        {formatDate(
                          record.checkedAt,
                        )}
                      </p>

                      {record.checkedBy && (
                        <p className="mt-1 text-xs text-gray-400">
                          By {record.checkedBy}
                        </p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {onView && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onView(record)
                            }
                          >
                            View
                          </Button>
                        )}

                        {onReview && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onReview(record)
                            }
                          >
                            Review
                          </Button>
                        )}

                        {onMarkCompliant &&
                          record.status !==
                            "COMPLIANT" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onMarkCompliant(
                                  record,
                                )
                              }
                            >
                              Compliant
                            </Button>
                          )}

                        {onMarkNonCompliant &&
                          record.status !==
                            "NON_COMPLIANT" && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onMarkNonCompliant(
                                  record,
                                )
                              }
                            >
                              Non-Compliant
                            </Button>
                          )}

                        {onDelete && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              onDelete(record)
                            }
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages &&
        totalPages > 1 &&
        onPageChange && (
          <div className="mt-6 border-t border-gray-200 pt-5">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={onPageChange}
            />
          </div>
        )}
    </Card>
  );
}