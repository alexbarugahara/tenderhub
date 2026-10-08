"use client";

import React from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export type ContractPaymentStatus =
  | "PENDING"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface ContractPaymentItem {
  id: string;
  contractId: string;
  amount: number | string;
  currencyCode?: string | null;
  dueDate: Date | string;
  paidDate?: Date | string | null;
  status: ContractPaymentStatus;
  reference?: string | null;
  description?: string | null;
}

export interface ContractPaymentsProps {
  payments: ContractPaymentItem[];
  readOnly?: boolean;
  onAdd?: () => void;
  onEdit?: (payment: ContractPaymentItem) => void;
  onDelete?: (payment: ContractPaymentItem) => void;
  className?: string;
}

const statusLabels: Record<ContractPaymentStatus, string> = {
  PENDING: "Pending",
  PROCESSING: "Processing",
  PAID: "Paid",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

const statusVariants: Record<
  ContractPaymentStatus,
  "default" | "info" | "success" | "warning" | "danger"
> = {
  PENDING: "default",
  PROCESSING: "info",
  PAID: "success",
  FAILED: "danger",
  CANCELLED: "warning",
  REFUNDED: "warning",
};

function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAmount(
  amount: number | string,
  currencyCode?: string | null,
): string {
  const numericAmount =
    typeof amount === "number" ? amount : Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "—";
  }

  const formattedAmount = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);

  return `${currencyCode ? `${currencyCode} ` : ""}${formattedAmount}`;
}

export default function ContractPayments({
  payments,
  readOnly = false,
  onAdd,
  onEdit,
  onDelete,
  className = "",
}: ContractPaymentsProps) {
  const sortedPayments = [...payments].sort((a, b) => {
    const firstDate = new Date(a.dueDate).getTime();
    const secondDate = new Date(b.dueDate).getTime();

    if (
      Number.isNaN(firstDate) ||
      Number.isNaN(secondDate)
    ) {
      return 0;
    }

    return firstDate - secondDate;
  });

  const totalAmount = payments.reduce((total, payment) => {
    const amount =
      typeof payment.amount === "number"
        ? payment.amount
        : Number(payment.amount);

    return Number.isFinite(amount) ? total + amount : total;
  }, 0);

  const paidPayments = payments.filter(
    (payment) => payment.status === "PAID",
  );

  const paidAmount = paidPayments.reduce((total, payment) => {
    const amount =
      typeof payment.amount === "number"
        ? payment.amount
        : Number(payment.amount);

    return Number.isFinite(amount) ? total + amount : total;
  }, 0);

  return (
    <Card className={className}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Contract Payments
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Track scheduled, completed, and outstanding contract
              payments.
            </p>
          </div>

          {!readOnly && onAdd && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={onAdd}
            >
              Add Payment
            </Button>
          )}
        </div>

        {payments.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Payments
              </p>

              <p className="mt-1 text-xl font-semibold text-tenderhub-navy">
                {payments.length}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total Scheduled
              </p>

              <p className="mt-1 text-xl font-semibold text-tenderhub-navy">
                {formatAmount(
                  totalAmount,
                  payments[0]?.currencyCode,
                )}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Total Paid
              </p>

              <p className="mt-1 text-xl font-semibold text-tenderhub-navy">
                {formatAmount(
                  paidAmount,
                  paidPayments[0]?.currencyCode ||
                    payments[0]?.currencyCode,
                )}
              </p>
            </div>
          </div>
        )}

        {sortedPayments.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 px-4 py-10 text-center">
            <p className="text-sm font-medium text-gray-700">
              No payments have been recorded.
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Add payments to track the financial progress of this
              contract.
            </p>

            {!readOnly && onAdd && (
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAdd}
                >
                  Add First Payment
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Payment
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Amount
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Due Date
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Paid Date
                  </th>

                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  {!readOnly && (onEdit || onDelete) && (
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {sortedPayments.map((payment, index) => (
                  <tr key={payment.id} className="align-top">
                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-gray-900">
                        Payment {index + 1}
                      </p>

                      {payment.description && (
                        <p className="mt-1 max-w-xs text-sm text-gray-500">
                          {payment.description}
                        </p>
                      )}

                      {payment.reference && (
                        <p className="mt-1 text-xs text-gray-400">
                          Ref: {payment.reference}
                        </p>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-gray-900">
                      {formatAmount(
                        payment.amount,
                        payment.currencyCode,
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {formatDate(payment.dueDate)}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                      {formatDate(payment.paidDate)}
                    </td>

                    <td className="px-4 py-4">
                      <Badge
                        variant={statusVariants[payment.status]}
                      >
                        {statusLabels[payment.status]}
                      </Badge>
                    </td>

                    {!readOnly && (onEdit || onDelete) && (
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          {onEdit && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(payment)}
                            >
                              Edit
                            </Button>
                          )}

                          {onDelete && (
                            <Button
                              type="button"
                              variant="danger"
                              size="sm"
                              onClick={() => onDelete(payment)}
                            >
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}
