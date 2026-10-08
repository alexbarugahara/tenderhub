"use client";

import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";

export type ManagedIntegrationStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "ERROR"
  | "PENDING";

export interface ManagedIntegration {
  id: string;
  name: string;
  provider?: string | null;
  type?: string | null;
  description?: string | null;
  status: ManagedIntegrationStatus;
  organizationId?: string | null;
  organizationName?: string | null;
  lastSyncedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
  errorMessage?: string | null;
}

export interface IntegrationManagementProps {
  integrations: ManagedIntegration[];
  loading?: boolean;
  error?: string | null;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onView?: (integration: ManagedIntegration) => void;
  onEdit?: (integration: ManagedIntegration) => void;
  onActivate?: (integration: ManagedIntegration) => void;
  onDeactivate?: (integration: ManagedIntegration) => void;
  onTest?: (integration: ManagedIntegration) => void;
  onDelete?: (integration: ManagedIntegration) => void;
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
    timeStyle: "short",
  }).format(date);
}

function getStatusVariant(
  status: ManagedIntegrationStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "ACTIVE":
      return "success";

    case "PENDING":
      return "warning";

    case "ERROR":
      return "danger";

    case "INACTIVE":
    default:
      return "default";
  }
}

function getStatusLabel(
  status: ManagedIntegrationStatus,
): string {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default function IntegrationManagement({
  integrations,
  loading = false,
  error = null,
  page = 1,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onActivate,
  onDeactivate,
  onTest,
  onDelete,
  onCreate,
  className = "",
}: IntegrationManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<
      ManagedIntegrationStatus | "ALL"
    >("ALL");

  const filteredIntegrations = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return integrations.filter(
      (integration) => {
        const matchesStatus =
          statusFilter === "ALL" ||
          integration.status ===
            statusFilter;

        if (!matchesStatus) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          integration.name,
          integration.provider,
          integration.type,
          integration.description,
          integration.organizationName,
          integration.organizationId,
          integration.errorMessage,
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
    integrations,
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
            Integration Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Monitor external integrations and their
            connection status.
          </p>
        </div>

        {onCreate && (
          <Button
            type="button"
            variant="primary"
            onClick={onCreate}
          >
            Add Integration
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label
            htmlFor="integration-management-search"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Search
          </label>

          <input
            id="integration-management-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Name, provider, organization..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          />
        </div>

        <div>
          <label
            htmlFor="integration-management-status"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Status
          </label>

          <select
            id="integration-management-status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | ManagedIntegrationStatus
                  | "ALL",
              )
            }
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          >
            <option value="ALL">
              All statuses
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>

            <option value="ERROR">
              Error
            </option>

            <option value="PENDING">
              Pending
            </option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        {filteredIntegrations.length === 0 ? (
          <div className="py-10">
            <EmptyState
              title={
                integrations.length === 0
                  ? "No integrations found"
                  : "No matching integrations"
              }
              description={
                integrations.length === 0
                  ? "External integrations will appear here once they are configured."
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
                    Integration
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
                    Type
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
                    Last Synced
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
                {filteredIntegrations.map(
                  (integration) => (
                    <tr
                      key={integration.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-52">
                          <p className="font-medium text-gray-900">
                            {integration.name}
                          </p>

                          {integration.provider && (
                            <p className="mt-1 text-sm text-gray-500">
                              {
                                integration.provider
                              }
                            </p>
                          )}

                          {integration.description && (
                            <p className="mt-1 max-w-72 truncate text-xs text-gray-400">
                              {
                                integration.description
                              }
                            </p>
                          )}

                          {integration.errorMessage && (
                            <p className="mt-1 max-w-72 truncate text-xs text-red-600">
                              {
                                integration.errorMessage
                              }
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="min-w-40 text-sm text-gray-700">
                          {integration.organizationName ||
                            integration.organizationId ||
                            "—"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span className="text-sm text-gray-700">
                          {integration.type ||
                            "—"}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <Badge
                          variant={getStatusVariant(
                            integration.status,
                          )}
                        >
                          {getStatusLabel(
                            integration.status,
                          )}
                        </Badge>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        {formatDate(
                          integration.lastSyncedAt,
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
                                  integration,
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
                                  integration,
                                )
                              }
                            >
                              Edit
                            </Button>
                          )}

                          {onTest && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onTest(
                                  integration,
                                )
                              }
                            >
                              Test
                            </Button>
                          )}

                          {onActivate &&
                            (integration.status ===
                              "INACTIVE" ||
                              integration.status ===
                                "ERROR") && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onActivate(
                                    integration,
                                  )
                                }
                              >
                                Activate
                              </Button>
                            )}

                          {onDeactivate &&
                            integration.status ===
                              "ACTIVE" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onDeactivate(
                                    integration,
                                  )
                                }
                              >
                                Deactivate
                              </Button>
                            )}

                          {onDelete && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onDelete(
                                  integration,
                                )
                              }
                            >
                              Delete
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