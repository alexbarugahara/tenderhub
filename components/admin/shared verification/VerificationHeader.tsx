"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileWarning,
  Info,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import type { VerificationStatus } from "./types";
import {
  formatStatus,
  verificationStatusClass,
} from "./utils";

interface VerificationHeaderProps {
  name: string;
  status: VerificationStatus | string;
  backHref: string;
  backLabel?: string;

  registeredLabel?: string | null;
  registrationNumber?: string | null;
  countryName?: string | null;

  onStartReview?: () => void;
  onRequestInformation?: () => void;
  onApprove?: () => void;
  onReject?: () => void;

  actionLoading?: boolean;
}

function StatusIcon({
  status,
}: {
  status: VerificationStatus | string;
}) {
  switch (status) {
    case "APPROVED":
      return <CheckCircle2 className="h-4 w-4" />;

    case "REJECTED":
      return <XCircle className="h-4 w-4" />;

    case "UNDER_REVIEW":
      return <ShieldCheck className="h-4 w-4" />;

    case "NEEDS_INFORMATION":
      return <FileWarning className="h-4 w-4" />;

    case "SUBMITTED":
      return <Clock3 className="h-4 w-4" />;

    default:
      return <Info className="h-4 w-4" />;
  }
}

export default function VerificationHeader({
  name,
  status,
  backHref,
  backLabel = "Back",
  registeredLabel = null,
  registrationNumber = null,
  countryName = null,
  onStartReview,
  onRequestInformation,
  onApprove,
  onReject,
  actionLoading = false,
}: VerificationHeaderProps) {
  const normalizedStatus = status as VerificationStatus;

  const canStartReview =
    normalizedStatus === "SUBMITTED" ||
    normalizedStatus === "NEEDS_INFORMATION";

  const canRequestInformation =
    normalizedStatus === "SUBMITTED" ||
    normalizedStatus === "UNDER_REVIEW";

  const canApprove =
    normalizedStatus === "UNDER_REVIEW" ||
    normalizedStatus === "SUBMITTED";

  const canReject =
    normalizedStatus === "UNDER_REVIEW" ||
    normalizedStatus === "SUBMITTED";

  return (
    <div className="space-y-5">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-tenderhub-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold text-tenderhub-navy">
                {name}
              </h1>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${verificationStatusClass(
                  status,
                )}`}
              >
                <StatusIcon status={status} />
                {formatStatus(status)}
              </span>
            </div>

            <p className="mt-2 max-w-3xl text-sm text-gray-500">
              Verification and compliance review workspace
            </p>

            {(registeredLabel ||
              registrationNumber ||
              countryName) && (
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                {registeredLabel && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Registered:
                    </span>{" "}
                    {registeredLabel}
                  </div>
                )}

                {registrationNumber && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Reg:
                    </span>{" "}
                    {registrationNumber}
                  </div>
                )}

                {countryName && (
                  <div>
                    <span className="font-medium text-gray-700">
                      Country:
                    </span>{" "}
                    {countryName}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
            {canStartReview && onStartReview && (
              <button
                type="button"
                onClick={onStartReview}
                disabled={actionLoading}
                className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Start Review
              </button>
            )}

            {canRequestInformation && onRequestInformation && (
              <button
                type="button"
                onClick={onRequestInformation}
                disabled={actionLoading}
                className="inline-flex items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileWarning className="mr-2 h-4 w-4" />
                Request Information
              </button>
            )}

            {canReject && onReject && (
              <button
                type="button"
                onClick={onReject}
                disabled={actionLoading}
                className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </button>
            )}

            {canApprove && onApprove && (
              <button
                type="button"
                onClick={onApprove}
                disabled={actionLoading}
                className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}