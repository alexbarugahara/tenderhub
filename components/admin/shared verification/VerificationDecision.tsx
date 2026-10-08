"use client";

import {
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  XCircle,
} from "lucide-react";

import type { VerificationStatus } from "./types";
import { formatStatus } from "./utils";

interface VerificationDecisionProps {
  status: VerificationStatus | string;
  rejectionReason?: string | null;
  adminNotes?: string | null;

  rejectionReasonValue: string;
  adminNotesValue: string;

  onRejectionReasonChange: (value: string) => void;
  onAdminNotesChange: (value: string) => void;

  onRequestInformation?: () => void;
  onApprove?: () => void;
  onReject?: () => void;

  actionLoading?: boolean;
}

export default function VerificationDecision({
  status,
  rejectionReason,
  adminNotes,
  rejectionReasonValue,
  adminNotesValue,
  onRejectionReasonChange,
  onAdminNotesChange,
  onRequestInformation,
  onApprove,
  onReject,
  actionLoading = false,
}: VerificationDecisionProps) {
  const normalizedStatus = status as VerificationStatus;

  const isApproved = normalizedStatus === "APPROVED";
  const isRejected = normalizedStatus === "REJECTED";

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          {isApproved ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          ) : isRejected ? (
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          ) : (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          )}

          <div>
            <h2 className="text-base font-semibold text-tenderhub-navy">
              Verification Decision
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Current status:{" "}
              <span className="font-medium text-gray-700">
                {formatStatus(status)}
              </span>
            </p>
          </div>
        </div>
      </div>

      {!isApproved && !isRejected && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <label
              htmlFor="verification-admin-notes"
              className="text-sm font-semibold text-gray-800"
            >
              Administrative Notes
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Record general observations or information relevant to the
              verification decision.
            </p>

            <textarea
              id="verification-admin-notes"
              value={adminNotesValue}
              onChange={(event) =>
                onAdminNotesChange(event.target.value)
              }
              rows={5}
              placeholder="Enter administrative notes..."
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
            />
          </div>
        </div>
      )}

      {isRejected && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-800">
                Rejection recorded
              </p>

              <p className="mt-1 text-sm text-red-700">
                {rejectionReason ||
                  "No rejection reason was recorded."}
              </p>
            </div>
          </div>
        </div>
      )}

      {!isApproved && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div>
            <label
              htmlFor="verification-rejection-reason"
              className="text-sm font-semibold text-gray-800"
            >
              Rejection Reason
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Required when rejecting the verification request.
            </p>

            <textarea
              id="verification-rejection-reason"
              value={rejectionReasonValue}
              onChange={(event) =>
                onRejectionReasonChange(event.target.value)
              }
              rows={4}
              placeholder="Enter the reason for rejection..."
              className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
            />
          </div>
        </div>
      )}

      {!isApproved && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">
                Review Actions
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Select the action that should be applied to this
                verification request.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {onRequestInformation && (
                <button
                  type="button"
                  onClick={onRequestInformation}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileWarning className="h-4 w-4" />
                  Request Information
                </button>
              )}

              {onReject && (
                <button
                  type="button"
                  onClick={onReject}
                  disabled={
                    actionLoading ||
                    !rejectionReasonValue.trim()
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              )}

              {onApprove && (
                <button
                  type="button"
                  onClick={onApprove}
                  disabled={actionLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}