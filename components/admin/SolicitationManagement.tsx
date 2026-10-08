"use client";

import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";

export type ManagedSolicitationStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "OPEN"
  | "UNDER_EVALUATION"
  | "AWARDED"
  | "CLOSED"
  | "CANCELLED"
  | "SUSPENDED"
  | "ARCHIVED";

export interface ManagedSolicitation {
  id: string;
  solicitationNumber: string;
  title: string;
  description?: string | null;
  status: ManagedSolicitationStatus;
  type?: string | null;
  procurementMethod?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  procurementId?: string | null;
  publishedAt?: string | Date | null;
  openingDate?: string | Date | null;
  closingDate?: string | Date | null;
  estimatedValue?: number | null;
  currency?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface SolicitationManagementProps {
  solicitations?: ManagedSolicitation[];
  loading?: boolean;
  error?: string | null;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onView?: (
    solicitation: ManagedSolicitation,
  ) => void;
  onEdit?: (
    solicitation: ManagedSolicitation,
  ) => void;
  onPublish?: (
    solicitation: ManagedSolicitation,
  ) => void;
  onSuspend?: (
    solicitation: ManagedSolicitation,
  ) => void;
  onCancel?: (
    solicitation: ManagedSolicitation,
  ) => void;
  onCreate?: () => void;
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

function formatValue(
  value?: number | null,
  currency?: string | null,
): string {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  if (!currency) {
    return value.toLocaleString("en-US");
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString(
      "en-US",
    )}`;
  }
}

function getStatusVariant(
  status: ManagedSolicitationStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "OPEN":
    case "PUBLISHED":
    case "AWARDED":
      return "success";

    case "DRAFT":
    case "UNDER_EVALUATION":
    case "SUSPENDED":
      return "warning";

    case "CANCELLED":
      return "danger";

    case "CLOSED":
    case "ARCHIVED":
    default:
      return "default";
  }
}

function getStatusLabel(
  status: ManagedSolicitationStatus,
): string {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default function SolicitationManagement({
  solicitations = [],
  loading = false,
  error = null,
  page = 1,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onPublish,
  onSuspend,
  onCancel,
  onCreate,
  className = "",
}: SolicitationManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<
      ManagedSolicitationStatus | "ALL"
    >("ALL");

  const filteredSolicitations = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return solicitations.filter(
      (solicitation) => {
        const matchesStatus =
          statusFilter === "ALL" ||
          solicitation.status ===
            statusFilter;

        if (!matchesStatus) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          solicitation.solicitationNumber,
          solicitation.title,
          solicitation.description,
          solicitation.type,
          solicitation.procurementMethod,
          solicitation.organizationName,
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
    solicitations,
    search,
    statusFilter,
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
      <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Solicitation Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage solicitations across
            the platform.
          </p>
        </div>

        {onCreate && (
          <Button
            type="button"
            variant="primary"
            onClick={onCreate}
          >
            Create Solicitation
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label
            htmlFor="solicitation-management-search"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Search
          </label>

          <input
            id="solicitation-management-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Number, title, organization..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          />
        </div>

        <div>
          <label
            htmlFor="solicitation-management-status"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Status
          </label>

          <select
            id="solicitation-management-status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | ManagedSolicitationStatus
                  | "ALL",
              )
            }
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="DRAFT">
              Draft
            </option>

            <option value="PUBLISHED">
              Published
            </option>

            <option value="OPEN">
              Open
            </option>

            <option value="UNDER_EVALUATION">
              Under Evaluation
            </option>

            <option value="AWARDED">
              Awarded
            </option>

            <option value="CLOSED">
              Closed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>

            <option value="SUSPENDED">
              Suspended
            </option>

            <option value="ARCHIVED">
              Archived
            </option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        {filteredSolicitations.length === 0 ? (
          <div className="py-10">
            <EmptyState
              title={
                solicitations.length === 0
                  ? "No solicitations found"
                  : "No matching solicitations"
              }
              description={
                solicitations.length === 0
                  ? "Solicitations will appear here once they are created."
                  : "Try changing your search or status filter."
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
                    Solicitation
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Organization
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Type / Method
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
                    Closing
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
                {filteredSolicitations.map(
                  (solicitation) => (
                    <tr
                      key={solicitation.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-64">
                          <p className="font-mono text-xs font-semibold text-tenderhub-gold">
                            {
                              solicitation.solicitationNumber
                            }
                          </p>

                          <p className="mt-1 font-medium text-gray-900">
                            {solicitation.title}
                          </p>

                          {solicitation.description && (
                            <p className="mt-1 max-w-72 truncate text-sm text-gray-500">
                              {
                                solicitation.description
                              }
                            </p>
                          )}

                          {solicitation.estimatedValue !==
                            undefined &&
                            solicitation.estimatedValue !==
                              null && (
                              <p className="mt-1 text-xs text-gray-400">
                                Estimated:{" "}
                                {formatValue(
                                  solicitation.estimatedValue,
                                  solicitation.currency,
                                )}
                              </p>
                            )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="min-w-40 text-sm text-gray-700">
                          {solicitation.organizationName ||
                            solicitation.organizationId ||
                            "—"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="min-w-36">
                          <p className="text-sm text-gray-700">
                            {solicitation.type ||
                              "—"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            {solicitation.procurementMethod ||
                              "—"}
                          </p>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <Badge
                          variant={getStatusVariant(
                            solicitation.status,
                          )}
                        >
                          {getStatusLabel(
                            solicitation.status,
                          )}
                        </Badge>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="text-sm text-gray-700">
                          {formatDate(
                            solicitation.closingDate,
                          )}
                        </p>

                        {solicitation.openingDate && (
                          <p className="mt-1 text-xs text-gray-400">
                            Opens{" "}
                            {formatDate(
                              solicitation.openingDate,
                            )}
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
                                onView(
                                  solicitation,
                                )
                              }
                            >
                              View
                            </Button>
                          )}

                          {onEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onEdit(
                                  solicitation,
                                )
                              }
                            >
                              Edit
                            </Button>
                          )}

                          {onPublish &&
                            solicitation.status ===
                              "DRAFT" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onPublish(
                                    solicitation,
                                  )
                                }
                              >
                                Publish
                              </Button>
                            )}

                          {onSuspend &&
                            (solicitation.status ===
                              "OPEN" ||
                              solicitation.status ===
                                "PUBLISHED") && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onSuspend(
                                    solicitation,
                                  )
                                }
                              >
                                Suspend
                              </Button>
                            )}

                          {onCancel &&
                            solicitation.status !==
                              "CANCELLED" &&
                            solicitation.status !==
                              "CLOSED" &&
                            solicitation.status !==
                              "ARCHIVED" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onCancel(
                                    solicitation,
                                  )
                                }
                              >
                                Cancel
                              </Button>
                            )}
                        </div>
                      </td>
                    </tr>
                  ),
                )}
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
