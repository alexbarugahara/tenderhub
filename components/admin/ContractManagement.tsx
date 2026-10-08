"use client";

import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";

export type ManagedContractStatus =
  | "DRAFT"
  | "PENDING_SIGNATURE"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "TERMINATED"
  | "EXPIRED";

export interface ManagedContract {
  id: string;
  contractNumber: string;
  title: string;
  description?: string | null;
  status: ManagedContractStatus;
  vendorId?: string | null;
  vendorName?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
  awardId?: string | null;
  contractValue?: number | null;
  currency?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  signedAt?: string | Date | null;
  completedAt?: string | Date | null;
  terminatedAt?: string | Date | null;
  terminationReason?: string | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}

export interface ContractManagementProps {
  contracts?: ManagedContract[];
  loading?: boolean;
  error?: string | null;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onView?: (contract: ManagedContract) => void;
  onEdit?: (contract: ManagedContract) => void;
  onActivate?: (contract: ManagedContract) => void;
  onHold?: (contract: ManagedContract) => void;
  onComplete?: (contract: ManagedContract) => void;
  onTerminate?: (contract: ManagedContract) => void;
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
  status: ManagedContractStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
      return "success";

    case "DRAFT":
    case "PENDING_SIGNATURE":
    case "ON_HOLD":
      return "warning";

    case "TERMINATED":
      return "danger";

    case "EXPIRED":
    default:
      return "default";
  }
}

function getStatusLabel(
  status: ManagedContractStatus,
): string {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default function ContractManagement({
  contracts = [],
  loading = false,
  error = null,
  page = 1,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onActivate,
  onHold,
  onComplete,
  onTerminate,
  onCreate,
  className = "",
}: ContractManagementProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<
      ManagedContractStatus | "ALL"
    >("ALL");

  const filteredContracts = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return contracts.filter((contract) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        contract.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        contract.contractNumber,
        contract.title,
        contract.description,
        contract.vendorName,
        contract.vendorId,
        contract.organizationName,
        contract.organizationId,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        );
    });
  }, [
    contracts,
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
            Contract Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Monitor and manage contracts across the
            platform.
          </p>
        </div>

        {onCreate && (
          <Button
            type="button"
            variant="primary"
            onClick={onCreate}
          >
            Create Contract
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label
            htmlFor="contract-management-search"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Search
          </label>

          <input
            id="contract-management-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Number, title, vendor..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          />
        </div>

        <div>
          <label
            htmlFor="contract-management-status"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Status
          </label>

          <select
            id="contract-management-status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | ManagedContractStatus
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

            <option value="PENDING_SIGNATURE">
              Pending Signature
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="ON_HOLD">
              On Hold
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="TERMINATED">
              Terminated
            </option>

            <option value="EXPIRED">
              Expired
            </option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        {filteredContracts.length === 0 ? (
          <div className="py-10">
            <EmptyState
              title={
                contracts.length === 0
                  ? "No contracts found"
                  : "No matching contracts"
              }
              description={
                contracts.length === 0
                  ? "Contracts will appear here once they are created."
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
                    Contract
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
                    Organization
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Value
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
                    End Date
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
                {filteredContracts.map(
                  (contract) => (
                    <tr
                      key={contract.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-56">
                          <p className="font-mono text-xs font-semibold text-tenderhub-gold">
                            {contract.contractNumber}
                          </p>

                          <p className="mt-1 font-medium text-gray-900">
                            {contract.title}
                          </p>

                          {contract.description && (
                            <p className="mt-1 max-w-72 truncate text-sm text-gray-500">
                              {contract.description}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <p className="min-w-40 text-sm text-gray-700">
                          {contract.vendorName ||
                            contract.vendorId ||
                            "—"}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <p className="min-w-40 text-sm text-gray-700">
                          {contract.organizationName ||
                            contract.organizationId ||
                            "—"}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {formatValue(
                            contract.contractValue,
                            contract.currency,
                          )}
                        </p>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <Badge
                          variant={getStatusVariant(
                            contract.status,
                          )}
                        >
                          {getStatusLabel(
                            contract.status,
                          )}
                        </Badge>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <p className="text-sm text-gray-700">
                          {formatDate(
                            contract.endDate,
                          )}
                        </p>

                        {contract.startDate && (
                          <p className="mt-1 text-xs text-gray-400">
                            Starts{" "}
                            {formatDate(
                              contract.startDate,
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
                                onView(contract)
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
                                onEdit(contract)
                              }
                            >
                              Edit
                            </Button>
                          )}

                          {onActivate &&
                            (contract.status ===
                              "DRAFT" ||
                              contract.status ===
                                "PENDING_SIGNATURE") && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onActivate(
                                    contract,
                                  )
                                }
                              >
                                Activate
                              </Button>
                            )}

                          {onHold &&
                            contract.status ===
                              "ACTIVE" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onHold(contract)
                                }
                              >
                                Hold
                              </Button>
                            )}

                          {onComplete &&
                            contract.status ===
                              "ACTIVE" && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onComplete(
                                    contract,
                                  )
                                }
                              >
                                Complete
                              </Button>
                            )}

                          {onTerminate &&
                            (contract.status ===
                              "ACTIVE" ||
                              contract.status ===
                                "ON_HOLD") && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onTerminate(
                                    contract,
                                  )
                                }
                              >
                                Terminate
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
