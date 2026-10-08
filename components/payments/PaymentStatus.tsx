"use client";

import React from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export type PaymentStatusValue =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "REFUNDED";

export interface PaymentStatusData {
  id?: string;
  status: PaymentStatusValue;
  amount?: number;
  currency?: string | null;
  provider?: string | null;
  transactionId?: string | null;
  reference?: string | null;
  description?: string | null;
  paidAt?: string | Date | null;
  createdAt?: string | Date | null;
  failureReason?: string | null;
}

export interface PaymentStatusProps {
  payment: PaymentStatusData;
  onRetry?: () => void;
  onContinue?: () => void;
  onCancel?: () => void;
  className?: string;
}

function formatAmount(
  amount?: number,
  currency?: string | null,
): string {
  if (
    amount === undefined ||
    !Number.isFinite(amount)
  ) {
    return "—";
  }

  if (!currency) {
    return amount.toFixed(2);
  }

  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
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
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(
  status: PaymentStatusValue,
): string {
  return status.replaceAll("_", " ");
}

function getStatusVariant(
  status: PaymentStatusValue,
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
      return "default";

    default:
      return "default";
  }
}

function getStatusMessage(
  status: PaymentStatusValue,
): string {
  switch (status) {
    case "PENDING":
      return "Your payment has been initiated and is waiting to be processed.";

    case "PROCESSING":
      return "Your payment is currently being processed.";

    case "COMPLETED":
      return "Your payment was completed successfully.";

    case "FAILED":
      return "The payment could not be completed.";

    case "CANCELLED":
      return "This payment was cancelled.";

    case "REFUNDED":
      return "This payment has been refunded.";

    default:
      return "Payment status updated.";
  }
}

export default function PaymentStatus({
  payment,
  onRetry,
  onContinue,
  onCancel,
  className = "",
}: PaymentStatusProps) {
  const isSuccessful =
    payment.status === "COMPLETED";

  const isFailed =
    payment.status === "FAILED";

  return (
    <div className={`space-y-5 ${className}`}>
      <Card>
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold ${
              isSuccessful
                ? "bg-green-100 text-green-700"
                : isFailed
                  ? "bg-red-100 text-red-700"
                  : "bg-tenderhub-gold/15 text-tenderhub-navy"
            }`}
            aria-hidden="true"
          >
            {isSuccessful
              ? "✓"
              : isFailed
                ? "!"
                : "…"}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <h2 className="text-xl font-semibold text-tenderhub-navy">
              Payment{" "}
              {getStatusLabel(payment.status)}
            </h2>

            <Badge
              variant={getStatusVariant(
                payment.status,
              )}
            >
              {getStatusLabel(payment.status)}
            </Badge>
          </div>

          <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
            {getStatusMessage(payment.status)}
          </p>

          {payment.failureReason && (
            <div
              role="alert"
              className="mt-5 w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-left text-sm text-red-700"
            >
              <span className="font-semibold">
                Reason:
              </span>{" "}
              {payment.failureReason}
            </div>
          )}
        </div>
      </Card>

      <Card>
        <div className="border-b border-gray-200 pb-4">
          <h3 className="text-base font-semibold text-gray-900">
            Payment Details
          </h3>
        </div>

        <dl className="divide-y divide-gray-100">
          {payment.description && (
            <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm text-gray-500">
                Description
              </dt>

              <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                {payment.description}
              </dd>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm text-gray-500">
              Amount
            </dt>

            <dd className="text-sm font-semibold text-gray-900 sm:col-span-2">
              {formatAmount(
                payment.amount,
                payment.currency,
              )}
            </dd>
          </div>

          {payment.provider && (
            <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm text-gray-500">
                Payment Provider
              </dt>

              <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                {payment.provider}
              </dd>
            </div>
          )}

          {payment.reference && (
            <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm text-gray-500">
                Reference
              </dt>

              <dd className="break-all font-mono text-sm text-gray-900 sm:col-span-2">
                {payment.reference}
              </dd>
            </div>
          )}

          {payment.transactionId && (
            <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm text-gray-500">
                Transaction ID
              </dt>

              <dd className="break-all font-mono text-sm text-gray-900 sm:col-span-2">
                {payment.transactionId}
              </dd>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
            <dt className="text-sm text-gray-500">
              Created
            </dt>

            <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
              {formatDate(payment.createdAt)}
            </dd>
          </div>

          {payment.paidAt && (
            <div className="grid grid-cols-1 gap-1 py-4 sm:grid-cols-3 sm:gap-4">
              <dt className="text-sm text-gray-500">
                Paid At
              </dt>

              <dd className="text-sm font-medium text-gray-900 sm:col-span-2">
                {formatDate(payment.paidAt)}
              </dd>
            </div>
          )}
        </dl>
      </Card>

      {(onRetry || onContinue || onCancel) && (
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Close
            </Button>
          )}

          {isFailed && onRetry && (
            <Button
              type="button"
              variant="primary"
              onClick={onRetry}
            >
              Try Again
            </Button>
          )}

          {isSuccessful && onContinue && (
            <Button
              type="button"
              variant="primary"
              onClick={onContinue}
            >
              Continue
            </Button>
          )}
        </div>
      )}
    </div>
  );
}