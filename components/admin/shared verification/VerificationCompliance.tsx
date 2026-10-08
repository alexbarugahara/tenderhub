"use client";

import {
  AlertCircle,
  CheckCircle2,
  Circle,
  FileText,
  HelpCircle,
  Save,
} from "lucide-react";
import { useState } from "react";

import type {
  CheckStatus,
  VerificationCheck,
} from "./types";

import {
  checkStatusClass,
  formatCategory,
  formatDate,
  formatStatus,
} from "./utils";

interface VerificationComplianceProps {
  checks: VerificationCheck[];
  onUpdateCheck?: (
    checkId: string,
    status: CheckStatus,
  ) => Promise<void> | void;
  onSaveNotes?: (
    checkId: string,
    notes: string,
  ) => Promise<void> | void;
  actionLoading?: boolean;
}

function StatusIcon({
  status,
}: {
  status: string;
}) {
  switch (status) {
    case "PASSED":
      return <CheckCircle2 className="h-4 w-4" />;

    case "FAILED":
      return <AlertCircle className="h-4 w-4" />;

    case "NEEDS_INFORMATION":
      return <HelpCircle className="h-4 w-4" />;

    case "NOT_APPLICABLE":
      return <Circle className="h-4 w-4" />;

    default:
      return <Circle className="h-4 w-4" />;
  }
}

function CheckCard({
  check,
  onUpdateCheck,
  onSaveNotes,
  actionLoading,
}: {
  check: VerificationCheck;
  onUpdateCheck?: (
    checkId: string,
    status: CheckStatus,
  ) => Promise<void> | void;
  onSaveNotes?: (
    checkId: string,
    notes: string,
  ) => Promise<void> | void;
  actionLoading: boolean;
}) {
  const [notes, setNotes] = useState(check.notes || "");
  const [savingNotes, setSavingNotes] = useState(false);

  async function handleSaveNotes() {
    if (!onSaveNotes) {
      return;
    }

    try {
      setSavingNotes(true);
      await onSaveNotes(check.id, notes);
    } finally {
      setSavingNotes(false);
    }
  }

  async function handleStatusChange(
    status: CheckStatus,
  ) {
    if (!onUpdateCheck || status === check.status) {
      return;
    }

    await onUpdateCheck(check.id, status);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {check.name}
            </h3>

            {check.required && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                Required
              </span>
            )}
          </div>

          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
            {check.code}
            {check.category
              ? ` • ${formatCategory(check.category)}`
              : ""}
          </p>

          {check.description && (
            <p className="mt-3 text-sm leading-6 text-gray-600">
              {check.description}
            </p>
          )}
        </div>

        <span
          className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${checkStatusClass(
            check.status,
          )}`}
        >
          <StatusIcon status={check.status} />
          {formatStatus(check.status)}
        </span>
      </div>

      {check.document && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <FileText className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />

          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Supporting document
            </p>

            <p className="mt-1 break-words text-sm font-medium text-gray-800">
              {check.document.name}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {formatStatus(check.document.status)}
            </p>
          </div>

          {check.document.fileUrl && (
            <a
              href={check.document.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto shrink-0 text-sm font-medium text-tenderhub-navy hover:underline"
            >
              View
            </a>
          )}
        </div>
      )}

      <div className="mt-5 border-t border-gray-100 pt-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Review decision
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                "PASSED",
                "FAILED",
                "NEEDS_INFORMATION",
                "NOT_APPLICABLE",
              ] as CheckStatus[]
            ).map((status) => {
              const active = check.status === status;

              return (
                <button
                  key={status}
                  type="button"
                  disabled={
                    actionLoading ||
                    !onUpdateCheck ||
                    active
                  }
                  onClick={() => handleStatusChange(status)}
                  className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                    active
                      ? checkStatusClass(status)
                      : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <StatusIcon status={status} />
                  {formatStatus(status)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor={`check-notes-${check.id}`}
            className="text-xs font-semibold uppercase tracking-wide text-gray-400"
          >
            Review notes
          </label>

          <textarea
            id={`check-notes-${check.id}`}
            value={notes}
            onChange={(event) =>
              setNotes(event.target.value)
            }
            rows={3}
            placeholder="Add notes about this compliance check..."
            className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
          />

          {onSaveNotes && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={savingNotes || actionLoading}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {savingNotes ? "Saving..." : "Save Notes"}
              </button>
            </div>
          )}
        </div>

        {(check.checkedAt || check.checkedBy) && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-400">
            {check.checkedAt && (
              <span>
                Checked: {formatDate(check.checkedAt, true)}
              </span>
            )}

            {check.checkedBy && (
              <span>
                By:{" "}
                {check.checkedBy.name ||
                  check.checkedBy.email ||
                  "Administrator"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerificationCompliance({
  checks,
  onUpdateCheck,
  onSaveNotes,
  actionLoading = false,
}: VerificationComplianceProps) {
  if (!checks.length) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
          <CheckCircle2 className="h-6 w-6" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-gray-900">
          No compliance checks
        </h3>

        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
          No compliance requirements have been configured for this
          verification record.
        </p>
      </div>
    );
  }

  const passed = checks.filter(
    (check) =>
      check.status === "PASSED" ||
      check.status === "NOT_APPLICABLE",
  ).length;

  const failed = checks.filter(
    (check) => check.status === "FAILED",
  ).length;

  const pending = checks.filter(
    (check) =>
      check.status === "PENDING" ||
      check.status === "NEEDS_INFORMATION",
  ).length;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-tenderhub-navy">
              Compliance Checks
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Review each requirement and record the administrative
              decision.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-green-50 px-3 py-1.5 font-medium text-green-700">
              {passed} Passed
            </span>

            <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
              {pending} Pending
            </span>

            <span className="rounded-full bg-red-50 px-3 py-1.5 font-medium text-red-700">
              {failed} Failed
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {checks.map((check) => (
          <CheckCard
            key={check.id}
            check={check}
            onUpdateCheck={onUpdateCheck}
            onSaveNotes={onSaveNotes}
            actionLoading={actionLoading}
          />
        ))}
      </div>
    </div>
  );
}