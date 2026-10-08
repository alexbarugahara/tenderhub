"use client";

import React, { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";

export interface BidSubmissionProps {
  bidId: string;
  bidNumber: string;
  status:
    | "DRAFT"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "COMPLIANT"
    | "NON_COMPLIANT"
    | "SHORTLISTED"
    | "EVALUATED"
    | "WITHDRAWN"
    | "REJECTED"
    | "AWARDED";
  submittedAt?: Date | string | null;
  lockedAt?: Date | string | null;
  submitLabel?: string;
  submitting?: boolean;
  error?: string | null;
  confirmationMessage?: string;
  onSubmit: (bidId: string) => void | Promise<void>;
  className?: string;
}

function formatDate(value?: Date | string | null): string {
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function BidSubmission({
  bidId,
  bidNumber,
  status,
  submittedAt,
  lockedAt,
  submitLabel = "Submit Bid",
  submitting = false,
  error = null,
  confirmationMessage,
  onSubmit,
  className = "",
}: BidSubmissionProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(
    null,
  );

  const isDraft = status === "DRAFT";
  const isSubmitted = Boolean(submittedAt);
  const isLocked = Boolean(lockedAt);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isDraft) {
      setValidationError(
        "Only a draft bid can be submitted.",
      );
      return;
    }

    if (isSubmitted || isLocked) {
      setValidationError(
        "This bid has already been submitted or locked.",
      );
      return;
    }

    if (!confirmed) {
      setValidationError(
        "Please confirm that the bid is ready for submission.",
      );
      return;
    }

    setValidationError(null);
    await onSubmit(bidId);
  }

  if (!isDraft || isSubmitted || isLocked) {
    return (
      <section
        className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
      >
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Bid Submission
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Bid {bidNumber}
          </p>
        </div>

        <div className="mt-5 rounded-lg bg-gray-50 px-4 py-4">
          <p className="text-sm font-medium text-gray-900">
            {isLocked
              ? "This bid is locked."
              : isSubmitted
                ? "This bid has been submitted."
                : "This bid is no longer in draft status."}
          </p>

          {submittedAt && (
            <p className="mt-1 text-sm text-gray-600">
              Submitted: {formatDate(submittedAt)}
            </p>
          )}

          {lockedAt && (
            <p className="mt-1 text-sm text-gray-600">
              Locked: {formatDate(lockedAt)}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div>
        <h2 className="text-lg font-semibold text-tenderhub-navy">
          Submit Bid
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Review the bid carefully before submitting it.
        </p>
      </div>

      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-4">
        <p className="text-sm font-medium text-gray-900">
          Bid {bidNumber} is ready for submission.
        </p>

        <p className="mt-1 text-sm leading-6 text-gray-700">
          Once submitted, the bid may be locked and become unavailable
          for further editing depending on the solicitation workflow.
        </p>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => {
            setConfirmed(event.target.checked);

            if (validationError) {
              setValidationError(null);
            }
          }}
          disabled={submitting}
          className="mt-1 h-4 w-4 rounded border-gray-300 text-tenderhub-navy focus:ring-tenderhub-gold"
        />

        <span className="text-sm leading-6 text-gray-700">
          I confirm that this bid is complete and ready to be submitted.
        </span>
      </label>

      {(validationError || error) && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {validationError || error}
        </div>
      )}

      {confirmationMessage && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {confirmationMessage}
        </div>
      )}

      <div className="mt-6 flex justify-end border-t border-gray-200 pt-5">
        <Button
          type="submit"
          variant="primary"
          disabled={submitting || !confirmed}
        >
          {submitting ? "Submitting..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}