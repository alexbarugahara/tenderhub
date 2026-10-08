"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";

export interface ManagedVendor {
  id: string;
  companyName: string;
  legalName?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  registrationNumber?: string | null;
  taxNumber?: string | null;
  countryId?: string | null;
  businessType?: string | null;
  numberOfEmployees?: number | null;
  yearsOperating?: number | null;
  operatingLocations?: string | null;
  portfolioDescription?: string | null;

  verifiedAt?: string | Date | null;

  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;

  /**
   * Real VendorApplication ID.
   *
   * This is intentionally different from the Vendor ID.
   * The admin application review route must use this ID.
   */
  applicationId?: string | null;

  onboardingStatus?:
    | "NOT_STARTED"
    | "IN_PROGRESS"
    | "READY_FOR_REVIEW"
    | "APPROVED";

  totalRequirements?: number | null;
  requiredRequirements?: number | null;
  compliantRequirements?: number | null;
  pendingRequirements?: number | null;
  nonCompliantRequirements?: number | null;
  expiredRequirements?: number | null;
  expiringRequirements?: number | null;

  completionPercentage?: number | null;
  profileComplete?: boolean | null;
  readyForReview?: boolean | null;
}

export type VendorManagementOnboardingFilter =
  | "ALL"
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "APPROVED";

export interface VendorManagementProps {
  vendors?: ManagedVendor[];
  loading?: boolean;
  error?: string | null;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onView?: (vendor: ManagedVendor) => void;
  onEdit?: (vendor: ManagedVendor) => void;
  onDelete?: (vendor: ManagedVendor) => void;
  onCreate?: () => void;
  className?: string;
}

function formatDate(value?: string | Date | null): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(date);
}

function formatNumber(value?: number | null): string {
  if (
    value === undefined ||
    value === null ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toLocaleString("en-US");
}

function getOnboardingStatus(
  vendor: ManagedVendor,
):
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "READY_FOR_REVIEW"
  | "APPROVED" {
  if (vendor.onboardingStatus) {
    return vendor.onboardingStatus;
  }

  if (vendor.verifiedAt) {
    return "APPROVED";
  }

  if (vendor.readyForReview) {
    return "READY_FOR_REVIEW";
  }

  if (
    vendor.totalRequirements &&
    vendor.totalRequirements > 0
  ) {
    return "IN_PROGRESS";
  }

  return "NOT_STARTED";
}

function getStatusLabel(
  status: ManagedVendor["onboardingStatus"],
): string {
  switch (status) {
    case "APPROVED":
      return "Approved";

    case "READY_FOR_REVIEW":
      return "Ready for review";

    case "IN_PROGRESS":
      return "In progress";

    case "NOT_STARTED":
      return "Not started";

    default:
      return "Not started";
  }
}

function getStatusVariant(
  status: ManagedVendor["onboardingStatus"],
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "APPROVED":
      return "success";

    case "READY_FOR_REVIEW":
      return "warning";

    case "IN_PROGRESS":
      return "default";

    case "NOT_STARTED":
    default:
      return "danger";
  }
}

function getProgressPercentage(
  vendor: ManagedVendor,
): number {
  if (
    typeof vendor.completionPercentage === "number" &&
    Number.isFinite(vendor.completionPercentage)
  ) {
    return Math.min(
      100,
      Math.max(
        0,
        Math.round(vendor.completionPercentage),
      ),
    );
  }

  return 0;
}

function getProgressText(
  vendor: ManagedVendor,
): string {
  const percentage = getProgressPercentage(vendor);

  if (
    typeof vendor.requiredRequirements === "number" &&
    typeof vendor.compliantRequirements === "number"
  ) {
    return `${vendor.compliantRequirements}/${vendor.requiredRequirements} required`;
  }

  return `${percentage}% complete`;
}

export default function VendorManagement({
  vendors = [],
  loading = false,
  error = null,
  page = 1,
  totalPages,
  onPageChange,
  onView,
  onEdit,
  onDelete,
  onCreate,
  className = "",
}: VendorManagementProps) {
  const [search, setSearch] = useState("");

  const [
    onboardingFilter,
    setOnboardingFilter,
  ] =
    useState<VendorManagementOnboardingFilter>(
      "ALL",
    );

  const filteredVendors = useMemo(() => {
    const query = search.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const status = getOnboardingStatus(vendor);

      const matchesStatus =
        onboardingFilter === "ALL" ||
        status === onboardingFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        vendor.companyName,
        vendor.legalName,
        vendor.email,
        vendor.phone,
        vendor.website,
        vendor.address,
        vendor.registrationNumber,
        vendor.taxNumber,
        vendor.businessType,
        vendor.operatingLocations,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        );
    });
  }, [
    vendors,
    search,
    onboardingFilter,
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
            Vendor Onboarding
          </h2>

          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Review vendor onboarding progress,
            submitted evidence, compliance status,
            and vendors ready for activation.
          </p>
        </div>

        {onCreate && (
          <Button
            type="button"
            variant="primary"
            onClick={onCreate}
          >
            Add Vendor
          </Button>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div>
          <label
            htmlFor="vendor-management-search"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Search vendors
          </label>

          <input
            id="vendor-management-search"
            type="search"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Company, email, registration number..."
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          />
        </div>

        <div>
          <label
            htmlFor="vendor-management-onboarding"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Onboarding status
          </label>

          <select
            id="vendor-management-onboarding"
            value={onboardingFilter}
            onChange={(event) =>
              setOnboardingFilter(
                event.target
                  .value as VendorManagementOnboardingFilter,
              )
            }
            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
          >
            <option value="ALL">
              All vendors
            </option>

            <option value="NOT_STARTED">
              Not started
            </option>

            <option value="IN_PROGRESS">
              In progress
            </option>

            <option value="READY_FOR_REVIEW">
              Ready for review
            </option>

            <option value="APPROVED">
              Approved
            </option>
          </select>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Vendors
          </p>

          <p className="mt-1 text-xl font-semibold text-tenderhub-navy">
            {vendors.length}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            In progress
          </p>

          <p className="mt-1 text-xl font-semibold text-tenderhub-navy">
            {
              vendors.filter(
                (vendor) =>
                  getOnboardingStatus(
                    vendor,
                  ) === "IN_PROGRESS",
              ).length
            }
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Ready for review
          </p>

          <p className="mt-1 text-xl font-semibold text-tenderhub-navy">
            {
              vendors.filter(
                (vendor) =>
                  getOnboardingStatus(
                    vendor,
                  ) === "READY_FOR_REVIEW",
              ).length
            }
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Approved
          </p>

          <p className="mt-1 text-xl font-semibold text-tenderhub-navy">
            {
              vendors.filter(
                (vendor) =>
                  getOnboardingStatus(
                    vendor,
                  ) === "APPROVED",
              ).length
            }
          </p>
        </div>
      </div>

      <div className="mt-5">
        {filteredVendors.length === 0 ? (
          <div className="py-10">
            <EmptyState
              title={
                vendors.length === 0
                  ? "No vendors found"
                  : "No matching vendors"
              }
              description={
                vendors.length === 0
                  ? "Vendors will appear here once they register on TenderHub."
                  : "Try changing your search or onboarding status filter."
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
                    Vendor
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
                    Business
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Onboarding
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
                {filteredVendors.map((vendor) => {
                  const status =
                    getOnboardingStatus(vendor);

                  const percentage =
                    getProgressPercentage(
                      vendor,
                    );

                  /*
                   * IMPORTANT:
                   *
                   * applicationId is the VendorApplication.id.
                   * vendor.id is the Vendor.id.
                   *
                   * The application review route MUST receive
                   * VendorApplication.id.
                   *
                   * If there is no application yet, we instead
                   * open the vendor record.
                   */
                  const verificationHref =
                    vendor.applicationId
                      ? `/dashboard/admin/vendor-onboarding/applications/${vendor.applicationId}`
                      : `/dashboard/admin/vendors/${vendor.id}`;

                  const actionLabel =
                    vendor.applicationId
                      ? "Review"
                      : "Open Vendor";

                  return (
                    <tr
                      key={vendor.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-56">
                          <p className="font-medium text-gray-900">
                            {vendor.companyName}
                          </p>

                          {vendor.legalName &&
                            vendor.legalName !==
                              vendor.companyName && (
                              <p className="mt-1 text-sm text-gray-500">
                                {
                                  vendor.legalName
                                }
                              </p>
                            )}

                          {vendor.registrationNumber && (
                            <p className="mt-1 text-xs text-gray-400">
                              Reg:{" "}
                              {
                                vendor.registrationNumber
                              }
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="min-w-48">
                          <p className="text-sm text-gray-900">
                            {vendor.email ||
                              "—"}
                          </p>

                          {vendor.phone && (
                            <p className="mt-1 text-xs text-gray-500">
                              {vendor.phone}
                            </p>
                          )}

                          {vendor.website && (
                            <p className="mt-1 max-w-52 truncate text-xs text-gray-400">
                              {
                                vendor.website
                              }
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="min-w-40">
                          <p className="text-sm text-gray-700">
                            {vendor.businessType ||
                              "—"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Employees:{" "}
                            {formatNumber(
                              vendor.numberOfEmployees,
                            )}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Years operating:{" "}
                            {formatNumber(
                              vendor.yearsOperating,
                            )}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="min-w-52">
                          <Badge
                            variant={getStatusVariant(
                              status,
                            )}
                          >
                            {getStatusLabel(
                              status,
                            )}
                          </Badge>

                          {status !==
                            "NOT_STARTED" && (
                            <>
                              <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-gray-500">
                                  Evidence
                                </span>

                                <span className="font-medium text-gray-700">
                                  {
                                    getProgressText(
                                      vendor,
                                    )
                                  }
                                </span>
                              </div>

                              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-200">
                                <div
                                  className="h-full rounded-full bg-tenderhub-gold transition-all"
                                  style={{
                                    width: `${percentage}%`,
                                  }}
                                />
                              </div>
                            </>
                          )}

                          {status ===
                            "APPROVED" &&
                            vendor.verifiedAt && (
                              <p className="mt-2 text-xs text-gray-400">
                                Activated{" "}
                                {formatDate(
                                  vendor.verifiedAt,
                                )}
                              </p>
                            )}

                          {status ===
                            "READY_FOR_REVIEW" && (
                            <p className="mt-2 text-xs font-medium text-amber-700">
                              Application requires
                              administrator review.
                            </p>
                          )}

                          {status ===
                            "IN_PROGRESS" && (
                            <p className="mt-2 text-xs text-gray-500">
                              Vendor is completing
                              onboarding requirements.
                            </p>
                          )}

                          {status ===
                            "NOT_STARTED" && (
                            <p className="mt-2 text-xs text-gray-500">
                              No onboarding application
                              has been started.
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {formatDate(
                          vendor.createdAt,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={
                              verificationHref
                            }
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                            >
                              {actionLabel}
                            </Button>
                          </Link>

                          {onView && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onView(
                                  vendor,
                                )
                              }
                            >
                              Details
                            </Button>
                          )}

                          {onEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onEdit(
                                  vendor,
                                )
                              }
                            >
                              Edit
                            </Button>
                          )}

                          {onDelete && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                onDelete(
                                  vendor,
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
                })}
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