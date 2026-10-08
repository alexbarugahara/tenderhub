"use client";

import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";

export type OrganizationVerificationStatus =
  | "NOT_SUBMITTED"
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_INFORMATION"
  | "APPROVED"
  | "REJECTED";

export interface ManagedOrganization {
  id: string;
  name: string;
  legalName?: string | null;
  email: string;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  organizationType?: string | null;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  countryId?: string | null;
  currencyId?: string | null;
  verifiedAt?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;

  verification?: {
    id: string;
    status: OrganizationVerificationStatus;
    submittedAt?: string | Date | null;
    reviewedAt?: string | Date | null;
    rejectionReason?: string | null;
    adminNotes?: string | null;
  } | null;
}

export type OrganizationManagementStatus =
  | "ALL"
  | OrganizationVerificationStatus;

export interface OrganizationManagementProps {
  organizations?: ManagedOrganization[];
  loading?: boolean;
  error?: string | null;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onView?: (organization: ManagedOrganization) => void;
  onEdit?: (organization: ManagedOrganization) => void;
  onReview?: (organization: ManagedOrganization) => void;
  onDelete?: (organization: ManagedOrganization) => void;
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

function getVerificationStatus(
  organization: ManagedOrganization,
): OrganizationVerificationStatus {
  if (organization.verification?.status) {
    return organization.verification.status;
  }

  if (organization.verifiedAt) {
    return "APPROVED";
  }

  return "NOT_SUBMITTED";
}

function getStatusLabel(
  status: OrganizationVerificationStatus,
): string {
  switch (status) {
    case "NOT_SUBMITTED":
      return "Not submitted";

    case "DRAFT":
      return "Draft";

    case "SUBMITTED":
      return "Submitted";

    case "UNDER_REVIEW":
      return "Under review";

    case "NEEDS_INFORMATION":
      return "Needs information";

    case "APPROVED":
      return "Approved";

    case "REJECTED":
      return "Rejected";

    default:
      return status;
  }
}

function getStatusVariant(
  status: OrganizationVerificationStatus,
): "success" | "warning" | "danger" | "info" | "default" {
  switch (status) {
    case "APPROVED":
      return "success";

    case "REJECTED":
      return "danger";

    case "SUBMITTED":
      return "info";

    case "UNDER_REVIEW":
      return "info";

    case "NEEDS_INFORMATION":
      return "warning";

    case "DRAFT":
      return "warning";

    case "NOT_SUBMITTED":
      return "default";

    default:
      return "default";
  }
}

function getActionLabel(
  status: OrganizationVerificationStatus,
): string {
  switch (status) {
    case "SUBMITTED":
      return "Review";

    case "UNDER_REVIEW":
      return "Continue Review";

    case "NEEDS_INFORMATION":
      return "Review";

    case "APPROVED":
      return "View";

    case "REJECTED":
      return "Review";

    case "DRAFT":
      return "Review";

    case "NOT_SUBMITTED":
      return "View";

    default:
      return "View";
  }
}

export default function OrganizationManagement({
  organizations = [],
  loading = false,
  error = null,
  page = 1,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onReview,
  onDelete,
  onCreate,
  className = "",
}: OrganizationManagementProps) {
  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState<OrganizationManagementStatus>("ALL");

  const filteredOrganizations = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return organizations.filter(
      (organization) => {
        const status =
          getVerificationStatus(organization);

        const matchesStatus =
          statusFilter === "ALL" ||
          status === statusFilter;

        if (!matchesStatus) {
          return false;
        }

        if (!query) {
          return true;
        }

        return [
          organization.name,
          organization.legalName,
          organization.email,
          organization.phone,
          organization.website,
          organization.address,
          organization.organizationType,
          organization.registrationNumber,
          organization.taxNumber,
          status,
          getStatusLabel(status),
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
    organizations,
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
            Organization Management
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Review organizations and manage their
            verification applications.
          </p>
        </div>

        {onCreate && (
          <Button
            type="button"
            variant="primary"
            onClick={onCreate}
          >
            Add Organization
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label
            htmlFor="organization-management-search"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Search
          </label>

          <input
            id="organization-management-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Name, email, registration number..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          />
        </div>

        <div>
          <label
            htmlFor="organization-management-status"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Verification
          </label>

          <select
            id="organization-management-status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target
                  .value as OrganizationManagementStatus,
              )
            }
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          >
            <option value="ALL">
              All organizations
            </option>

            <option value="NOT_SUBMITTED">
              Not submitted
            </option>

            <option value="DRAFT">
              Draft
            </option>

            <option value="SUBMITTED">
              Submitted
            </option>

            <option value="UNDER_REVIEW">
              Under review
            </option>

            <option value="NEEDS_INFORMATION">
              Needs information
            </option>

            <option value="APPROVED">
              Approved
            </option>

            <option value="REJECTED">
              Rejected
            </option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        {filteredOrganizations.length === 0 ? (
          <div className="py-10">
            <EmptyState
              title={
                organizations.length === 0
                  ? "No organizations found"
                  : "No matching organizations"
              }
              description={
                organizations.length === 0
                  ? "Organizations will appear here once they are registered."
                  : "Try changing your search or verification filter."
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
                    Organization
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Contact
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
                    Verification
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Registered
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
                {filteredOrganizations.map(
                  (organization) => {
                    const status =
                      getVerificationStatus(
                        organization,
                      );

                    return (
                      <tr
                        key={organization.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-4">
                          <div className="min-w-56">
                            <p className="font-medium text-gray-900">
                              {organization.name}
                            </p>

                            {organization.legalName &&
                              organization.legalName !==
                                organization.name && (
                                <p className="mt-1 text-sm text-gray-500">
                                  {
                                    organization.legalName
                                  }
                                </p>
                              )}

                            {organization.registrationNumber && (
                              <p className="mt-1 text-xs text-gray-400">
                                Reg:{" "}
                                {
                                  organization.registrationNumber
                                }
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="min-w-48">
                            <p className="text-sm text-gray-900">
                              {organization.email}
                            </p>

                            {organization.phone && (
                              <p className="mt-1 text-xs text-gray-500">
                                {
                                  organization.phone
                                }
                              </p>
                            )}

                            {organization.website && (
                              <p className="mt-1 max-w-52 truncate text-xs text-gray-400">
                                {
                                  organization.website
                                }
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {organization.organizationType ||
                            "—"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <Badge
                            variant={getStatusVariant(
                              status,
                            )}
                          >
                            {getStatusLabel(
                              status,
                            )}
                          </Badge>

                          {status ===
                            "APPROVED" &&
                            organization.verifiedAt && (
                              <p className="mt-1 text-xs text-gray-400">
                                Approved{" "}
                                {formatDate(
                                  organization.verifiedAt,
                                )}
                              </p>
                            )}

                          {organization.verification
                            ?.submittedAt &&
                            status !==
                              "NOT_SUBMITTED" && (
                              <p className="mt-1 text-xs text-gray-400">
                                Submitted{" "}
                                {formatDate(
                                  organization
                                    .verification
                                    .submittedAt,
                                )}
                              </p>
                            )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                          {formatDate(
                            organization.createdAt,
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
                                    organization,
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
                                    organization,
                                  )
                                }
                              >
                                Edit
                              </Button>
                            )}

                            {onReview && (
                              <Button
                                type="button"
                                variant="primary"
                                size="sm"
                                onClick={() =>
                                  onReview(
                                    organization,
                                  )
                                }
                              >
                                {getActionLabel(
                                  status,
                                )}
                              </Button>
                            )}

                            {onDelete && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onDelete(
                                    organization,
                                  )
                                }
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  },
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