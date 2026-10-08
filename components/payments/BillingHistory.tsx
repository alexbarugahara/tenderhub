"use client";

import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";

export type BillingPaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface BillingHistoryItem {
  id: string;
  amount: number;
  currency: string;
  status: BillingPaymentStatus;
  provider?: string | null;
  transactionId?: string | null;
  reference?: string | null;
  description?: string | null;
  paidAt?: string | Date | null;
  createdAt: string | Date;
  invoiceUrl?: string | null;
  receiptUrl?: string | null;
}

export interface BillingHistoryProps {
  payments: BillingHistoryItem[];
  loading?: boolean;
  error?: string | null;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  onView?: (payment: BillingHistoryItem) => void;
  onDownloadInvoice?: (
    payment: BillingHistoryItem,
  ) => void;
  onDownloadReceipt?: (
    payment: BillingHistoryItem,
  ) => void;
  className?: string;
}

function formatAmount(
  amount: number,
  currency: string,
): string {
  if (!Number.isFinite(amount)) {
    return "—";
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(
      "en-US",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}`;
  }
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

function getStatusLabel(
  status: BillingPaymentStatus,
): string {
  return status.replaceAll("_", " ");
}

function getStatusVariant(
  status: BillingPaymentStatus,
): "success" | "warning" | "danger" | "default" {
  switch (status) {
    case "COMPLETED":
      return "success";

    case "PENDING":
    case "PROCESSING":
      return "warning";

    case "FAILED":
    case "CANCELLED":
      return "danger";

    case "REFUNDED":
    default:
      return "default";
  }
}

export default function BillingHistory({
  payments,
  loading = false,
  error = null,
  page = 1,
  pageSize = 10,
  totalPages,
  onPageChange,
  onView,
  onDownloadInvoice,
  onDownloadReceipt,
  className = "",
}: BillingHistoryProps) {
  const [statusFilter, setStatusFilter] =
    useState<BillingPaymentStatus | "ALL">(
      "ALL",
    );

  const [search, setSearch] =
    useState("");

  const filteredPayments = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesStatus =
        statusFilter === "ALL" ||
        payment.status === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return [
        payment.description,
        payment.provider,
        payment.transactionId,
        payment.reference,
        payment.currency,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(normalizedSearch),
        );
    });
  }, [payments, search, statusFilter]);

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
            Billing History
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            View your previous payments and
            transaction records.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative">
            <label
              htmlFor="billing-history-search"
              className="sr-only"
            >
              Search payments
            </label>

            <input
              id="billing-history-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search payments..."
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 sm:w-56"
            />
          </div>

          <div>
            <label
              htmlFor="billing-history-status"
              className="sr-only"
            >
              Filter by status
            </label>

            <select
              id="billing-history-status"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | BillingPaymentStatus
                    | "ALL",
                )
              }
              className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 sm:w-44"
            >
              <option value="ALL">
                All statuses
              </option>
              <option value="PENDING">
                Pending
              </option>
              <option value="PROCESSING">
                Processing
              </option>
              <option value="COMPLETED">
                Completed
              </option>
              <option value="FAILED">
                Failed
              </option>
              <option value="CANCELLED">
                Cancelled
              </option>
              <option value="REFUNDED">
                Refunded
              </option>
            </select>
          </div>
        </div>
      </div>

      {filteredPayments.length === 0 ? (
        <div className="py-10">
          <EmptyState
            title={
              payments.length === 0
                ? "No billing history"
                : "No payments found"
            }
            description={
              payments.length === 0
                ? "Your completed and processed payments will appear here."
                : "Try changing your search or status filter."
            }
          />
        </div>
      ) : (
        <>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left">
                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Payment
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Amount
                  </th>

                  <th
                    scope="col"
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Provider
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
                    Date
                  </th>

                  <th
                    scope="col"
                    className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100 bg-white">
                {filteredPayments.map(
                  (payment) => (
                    <tr
                      key={payment.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-4 py-4">
                        <div className="min-w-48">
                          <p className="font-medium text-gray-900">
                            {payment.description ||
                              "Payment"}
                          </p>

                          {payment.reference && (
                            <p className="mt-1 break-all font-mono text-xs text-gray-500">
                              {payment.reference}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-gray-900">
                        {formatAmount(
                          payment.amount,
                          payment.currency,
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {payment.provider ||
                          "—"}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <Badge
                          variant={getStatusVariant(
                            payment.status,
                          )}
                        >
                          {getStatusLabel(
                            payment.status,
                          )}
                        </Badge>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                        {formatDate(
                          payment.paidAt ||
                            payment.createdAt,
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
                                onView(payment)
                              }
                            >
                              View
                            </Button>
                          )}

                          {payment.invoiceUrl &&
                            onDownloadInvoice && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onDownloadInvoice(
                                    payment,
                                  )
                                }
                              >
                                Invoice
                              </Button>
                            )}

                          {payment.receiptUrl &&
                            onDownloadReceipt && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onDownloadReceipt(
                                    payment,
                                  )
                                }
                              >
                                Receipt
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

          {!totalPages &&
            filteredPayments.length > pageSize && (
              <div className="mt-4 text-center text-xs text-gray-500">
                Showing {filteredPayments.length}{" "}
                payment records.
              </div>
            )}
        </>
      )}
    </Card>
  );
}