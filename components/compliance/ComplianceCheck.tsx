"use client";

import React, { useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export type ComplianceCheckStatus =
  | "PENDING"
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "EXPIRED"
  | "EXPIRING"
  | "NOT_APPLICABLE";

export interface ComplianceCheckItem {
  id: string;
  name: string;
  description?: string | null;
  status: ComplianceCheckStatus;
  checkedAt?: Date | string | null;
  checkedBy?: string | null;
  notes?: string | null;
}

export interface ComplianceCheckProps {
  item: ComplianceCheckItem;
  loading?: boolean;
  disabled?: boolean;
  onCheck?: (
    item: ComplianceCheckItem,
    status: ComplianceCheckStatus,
    notes: string,
  ) => void | Promise<void>;
  className?: string;
}

const statusLabels: Record<ComplianceCheckStatus, string> = {
  PENDING: "Pending",
  COMPLIANT: "Compliant",
  NON_COMPLIANT: "Non-Compliant",
  EXPIRED: "Expired",
  EXPIRING: "Expiring",
  NOT_APPLICABLE: "Not Applicable",
};

const statusVariants: Record<
  ComplianceCheckStatus,
  "default" | "success" | "danger" | "warning" | "info"
> = {
  PENDING: "default",
  COMPLIANT: "success",
  NON_COMPLIANT: "danger",
  EXPIRED: "danger",
  EXPIRING: "warning",
  NOT_APPLICABLE: "info",
};

function formatDate(value?: Date | string | null): string {
  if (!value) {
    return "Not recorded";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default function ComplianceCheck({
  item,
  loading = false,
  disabled = false,
  onCheck,
  className = "",
}: ComplianceCheckProps) {
  const [status, setStatus] = useState<ComplianceCheckStatus>(
    item.status,
  );
  const [notes, setNotes] = useState(item.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    if (!onCheck) {
      return;
    }

    setError(null);
    setSaving(true);

    try {
      await onCheck(item, status, notes.trim());
    } catch (checkError) {
      setError(
        checkError instanceof Error
          ? checkError.message
          : "Unable to save the compliance check.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <div className="animate-pulse space-y-5">
          <div className="h-5 w-48 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-10 w-full rounded bg-gray-200" />
          <div className="h-24 w-full rounded bg-gray-200" />
          <div className="h-10 w-32 rounded bg-gray-200" />
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              {item.name}
            </h2>

            {item.description && (
              <p className="mt-1 text-sm leading-6 text-gray-600">
                {item.description}
              </p>
            )}
          </div>

          <Badge variant={statusVariants[item.status]}>
            {statusLabels[item.status]}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Current Status
            </p>

            <div className="mt-2">
              <Badge variant={statusVariants[item.status]}>
                {statusLabels[item.status]}
              </Badge>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Last Checked
            </p>

            <p className="mt-2 text-sm font-medium text-gray-900">
              {formatDate(item.checkedAt)}
            </p>
          </div>

          {item.checkedBy && (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Checked By
              </p>

              <p className="mt-2 text-sm text-gray-900">
                {item.checkedBy}
              </p>
            </div>
          )}
        </div>

        {onCheck && (
          <section className="space-y-5 border-t border-gray-200 pt-6">
            <div>
              <h3 className="text-base font-semibold text-tenderhub-navy">
                Perform Compliance Check
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Select the result of the compliance review and record any
                relevant notes.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor={`compliance-status-${item.id}`}
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Check Result
              </label>

              <select
                id={`compliance-status-${item.id}`}
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as ComplianceCheckStatus,
                  )
                }
                disabled={disabled || saving}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="PENDING">Pending</option>
                <option value="COMPLIANT">Compliant</option>
                <option value="NON_COMPLIANT">Non-Compliant</option>
                <option value="EXPIRED">Expired</option>
                <option value="EXPIRING">Expiring</option>
                <option value="NOT_APPLICABLE">Not Applicable</option>
              </select>
            </div>

            <div>
              <label
                htmlFor={`compliance-notes-${item.id}`}
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Review Notes
              </label>

              <textarea
                id={`compliance-notes-${item.id}`}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={5}
                placeholder="Record findings, verification details, or reasons for the result."
                disabled={disabled || saving}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                variant="primary"
                disabled={disabled || saving}
                onClick={handleCheck}
              >
                {saving ? "Saving..." : "Save Compliance Check"}
              </Button>
            </div>
          </section>
        )}

        {item.notes && !onCheck && (
          <section className="border-t border-gray-200 pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Review Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {item.notes}
            </p>
          </section>
        )}
      </div>
    </Card>
  );
}