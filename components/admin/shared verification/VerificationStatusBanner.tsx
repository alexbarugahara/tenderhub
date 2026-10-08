"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileWarning,
  Info,
  XCircle,
} from "lucide-react";

import type { VerificationStatus } from "./types";
import { formatStatus } from "./utils";

interface VerificationStatusBannerProps {
  status: VerificationStatus | string;
  rejectionReason?: string | null;
  adminNotes?: string | null;
}

export default function VerificationStatusBanner({
  status,
  rejectionReason,
  adminNotes,
}: VerificationStatusBannerProps) {
  const normalizedStatus = status as VerificationStatus;

  if (normalizedStatus === "APPROVED") {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

          <div>
            <p className="text-sm font-semibold text-green-800">
              Verification approved
            </p>

            <p className="mt-1 text-sm text-green-700">
              This organization has completed the verification process and is
              currently approved.
            </p>

            {adminNotes && (
              <div className="mt-3 rounded-lg border border-green-200 bg-white/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-800">
                  Admin notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-green-700">
                  {adminNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (normalizedStatus === "REJECTED") {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

          <div>
            <p className="text-sm font-semibold text-red-800">
              Verification rejected
            </p>

            <p className="mt-1 text-sm text-red-700">
              The verification request was rejected and requires further
              action before it can be approved.
            </p>

            {rejectionReason && (
              <div className="mt-3 rounded-lg border border-red-200 bg-white/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
                  Rejection reason
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                  {rejectionReason}
                </p>
              </div>
            )}

            {adminNotes && (
              <div className="mt-3 rounded-lg border border-red-200 bg-white/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
                  Admin notes
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-red-700">
                  {adminNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (normalizedStatus === "NEEDS_INFORMATION") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <FileWarning className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

          <div>
            <p className="text-sm font-semibold text-amber-800">
              Additional information required
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Additional information or documentation is required before this
              verification can be completed.
            </p>

            {adminNotes && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-white/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Admin notes
                </p>

                <p className="mt-1 whitespace-pre-wrap text-sm text-amber-700">
                  {adminNotes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (normalizedStatus === "UNDER_REVIEW") {
    return (
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

          <div>
            <p className="text-sm font-semibold text-blue-800">
              Verification under review
            </p>

            <p className="mt-1 text-sm text-blue-700">
              The verification request is currently being reviewed by an
              administrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (normalizedStatus === "SUBMITTED") {
    return (
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" />

          <div>
            <p className="text-sm font-semibold text-indigo-800">
              Verification submitted
            </p>

            <p className="mt-1 text-sm text-indigo-700">
              This verification request has been submitted and is ready for
              administrative review.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (normalizedStatus === "DRAFT") {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />

          <div>
            <p className="text-sm font-semibold text-gray-800">
              Verification draft
            </p>

            <p className="mt-1 text-sm text-gray-600">
              The verification workspace has been created but has not yet been
              submitted for review.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (normalizedStatus === "NOT_SUBMITTED") {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />

          <div>
            <p className="text-sm font-semibold text-gray-800">
              Verification not submitted
            </p>

            <p className="mt-1 text-sm text-gray-600">
              This entity has not yet submitted its verification information
              for administrative review.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" />

        <div>
          <p className="text-sm font-semibold text-gray-800">
            Verification status: {formatStatus(status)}
          </p>

          <p className="mt-1 text-sm text-gray-600">
            Review the verification details and compliance checks below.
          </p>
        </div>
      </div>
    </div>
  );
}