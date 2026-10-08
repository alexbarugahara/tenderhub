"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type VerificationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_INFORMATION"
  | "APPROVED"
  | "REJECTED"
  | string;

type Organization = {
  id: string;
  name: string;
  legalName?: string | null;
  type?: string | null;
};

type VerificationCheck = {
  id: string;
  code: string;
  name: string;
  status:
    | "PENDING"
    | "PASSED"
    | "FAILED"
    | "NEEDS_INFORMATION"
    | "NOT_APPLICABLE"
    | string;
  required: boolean;
};

type VerificationDocument = {
  id?: string;
  category?: string | null;
  name?: string | null;
  status?: string | null;
};

type Verification = {
  id: string;
  status: VerificationStatus;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  checks: VerificationCheck[];
};

type VerificationResponse = {
  organization: Organization;
  verification: Verification | null;
  documents: VerificationDocument[];
};

function getStatusLabel(status?: string | null) {
  if (!status) {
    return "Not started";
  }

  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClass(status?: string | null) {
  switch (status) {
    case "APPROVED":
      return "border-green-200 bg-green-50 text-green-700";

    case "UNDER_REVIEW":
    case "SUBMITTED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "NEEDS_INFORMATION":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";

    case "DRAFT":
      return "border-slate-200 bg-slate-100 text-slate-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function getStepStatusClass(status: "COMPLETED" | "IN_PROGRESS" | "ACTION") {
  switch (status) {
    case "COMPLETED":
      return "border-green-200 bg-green-50 text-green-700";

    case "IN_PROGRESS":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "ACTION":
      return "border-amber-200 bg-amber-50 text-amber-700";

    default:
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function getStepStatusLabel(
  status: "COMPLETED" | "IN_PROGRESS" | "ACTION"
) {
  switch (status) {
    case "COMPLETED":
      return "Completed";

    case "IN_PROGRESS":
      return "In progress";

    case "ACTION":
      return "Action required";

    default:
      return "Not started";
  }
}

export default function VerificationPage() {
  const [data, setData] = useState<VerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadVerification() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/organization/verification",
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result?.error ||
              "Failed to load organization verification."
          );
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load organization verification."
        );
      } finally {
        setLoading(false);
      }
    }

    loadVerification();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading organization verification...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const verification = data?.verification;
  const checks = verification?.checks ?? [];

  const requiredChecks = checks.filter(
    (check) => check.required
  );

  const passedRequiredChecks = requiredChecks.filter(
    (check) => check.status === "PASSED"
  );

  const requiredProgress =
    requiredChecks.length > 0
      ? Math.round(
          (passedRequiredChecks.length /
            requiredChecks.length) *
            100
        )
      : 0;

  const documents = data?.documents ?? [];
  const documentCount = documents.length;

  const hasRegistrationEvidence = documents.some((document) =>
    [
      "BUSINESS_REGISTRATION",
      "CERTIFICATE_OF_INCORPORATION",
      "CERTIFICATE_OF_FORMATION",
      "GOVERNMENT_REGISTRATION",
    ].includes(document.category ?? "")
  );

  const organizationInformationComplete =
    Boolean(data?.organization?.name?.trim()) &&
    Boolean(data?.organization?.legalName?.trim()) &&
    Boolean(data?.organization?.type?.trim());

  const evidenceSubmitted = documentCount > 0;

  const currentStatus = verification?.status ?? "DRAFT";

  /*
   * Workflow status
   *
   * Step 1:
   * The requirements are available and the verification checks have
   * been created. We do not pretend that the user "reviewed" the
   * page because the current API does not persist page-visit tracking.
   *
   * Step 2:
   * Administrator checks are available once verification checks exist.
   *
   * Step 3:
   * This is completed when supporting evidence has actually been
   * submitted. It is intentionally separate from administrator
   * verification.
   */

  const stepOneStatus: "COMPLETED" | "IN_PROGRESS" | "ACTION" =
    requiredChecks.length > 0
      ? "COMPLETED"
      : "IN_PROGRESS";

  const stepTwoStatus: "COMPLETED" | "IN_PROGRESS" | "ACTION" =
    checks.length > 0
      ? "COMPLETED"
      : "IN_PROGRESS";

  const stepThreeStatus: "COMPLETED" | "IN_PROGRESS" | "ACTION" =
    evidenceSubmitted
      ? "COMPLETED"
      : "ACTION";

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link
            href="/dashboard/organization"
            className="hover:text-slate-900"
          >
            Organization
          </Link>

          <span>/</span>

          <span className="text-slate-700">
            Verification & Compliance
          </span>
        </div>

        {/* Header */}
        <div className="mt-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Organization Verification
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                Organization Verification
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Complete your verification application by reviewing the
                requirements, understanding the administrator checks, and
                submitting supporting evidence for review.
              </p>
            </div>

            <span
              className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide ${getStatusClass(
                currentStatus
              )}`}
            >
              {getStatusLabel(currentStatus)}
            </span>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Organization summary */}
        {data?.organization && (
          <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Organization
                </p>

                <h2 className="mt-1 text-xl font-semibold text-slate-900">
                  {data.organization.name}
                </h2>

                {data.organization.legalName && (
                  <p className="mt-1 text-sm text-slate-500">
                    {data.organization.legalName}
                  </p>
                )}
              </div>

              <div className="text-sm text-slate-500">
                <p>
                  Verification status:{" "}
                  <span className="font-semibold text-slate-800">
                    {getStatusLabel(currentStatus)}
                  </span>
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Verification progress */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Verification progress
              </p>

              <h2 className="mt-1 text-xl font-semibold text-slate-900">
                Track evidence and administrator verification separately
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Submitted documents show that TenderHub has received your
                evidence. A requirement is only considered verified after an
                authorized administrator reviews it and records a verification
                result.
              </p>
            </div>
          </div>

          {/* Two progress cards */}
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {/* Evidence submitted */}
            <div className="rounded-xl border border-green-200 bg-green-50/60 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
                    Evidence submission
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    Supporting documents received
                  </h3>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg font-bold text-green-700">
                  {documentCount}
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {documentCount === 0
                  ? "No supporting documents have been submitted yet."
                  : `${documentCount} supporting document${
                      documentCount === 1 ? "" : "s"
                    } currently submitted with this verification file.`}
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-green-600 transition-all"
                  style={{
                    width: documentCount > 0 ? "100%" : "0%",
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-medium text-green-700">
                  {documentCount > 0
                    ? "Evidence submitted"
                    : "No evidence submitted"}
                </span>

                <Link
                  href="/dashboard/organization/verification/documents"
                  className="font-semibold text-[#071A33] hover:underline"
                >
                  View documents →
                </Link>
              </div>
            </div>

            {/* Requirements verified */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Administrator verification
                  </p>

                  <h3 className="mt-1 text-lg font-semibold text-slate-900">
                    Requirements verified
                  </h3>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">
                    {requiredProgress}%
                  </div>

                  <div className="text-xs text-slate-500">
                    verified
                  </div>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                {passedRequiredChecks.length} of{" "}
                {requiredChecks.length} required checks have been passed by
                an authorized administrator.
              </p>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full bg-[#D4AF37] transition-all"
                  style={{
                    width: `${requiredProgress}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">
                  {requiredProgress === 100
                    ? "All required checks passed"
                    : "Pending administrator verification"}
                </span>

                <Link
                  href="/dashboard/organization/verification/administrator-checks"
                  className="font-semibold text-[#071A33] hover:underline"
                >
                  View checks →
                </Link>
              </div>
            </div>
          </div>

          {/* Clear status summary */}
          <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-wrap items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                i
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Evidence received and verification are different stages.
                </p>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Your submitted documents can be received immediately, but
                  the corresponding requirements remain pending until an
                  authorized TenderHub administrator reviews the evidence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Three-step workflow */}
        <section className="mt-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Verification workflow
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              Complete your verification application in three steps
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Follow the workflow below. Each step reflects the current state
              of your verification file. Evidence submitted in Step 3 is
              reviewed separately by authorized TenderHub administrators.
            </p>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            {/* Step 1 */}
            <Link
              href="/dashboard/organization/verification/requirements"
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                    stepOneStatus === "COMPLETED"
                      ? "bg-green-600 text-white"
                      : "bg-[#071A33] text-white"
                  }`}
                >
                  {stepOneStatus === "COMPLETED" ? "✓" : "1"}
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStepStatusClass(
                    stepOneStatus
                  )}`}
                >
                  {getStepStatusLabel(stepOneStatus)}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                Verification Requirements
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Review the legal, registration, address, representative,
                ownership and licensing information that may be required.
              </p>

              <div className="mt-5 text-sm font-semibold text-[#071A33]">
                Review requirements →
              </div>
            </Link>

            {/* Step 2 */}
            <Link
              href="/dashboard/organization/verification/administrator-checks"
              className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-400 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                    stepTwoStatus === "COMPLETED"
                      ? "bg-green-600 text-white"
                      : "bg-[#071A33] text-white"
                  }`}
                >
                  {stepTwoStatus === "COMPLETED" ? "✓" : "2"}
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStepStatusClass(
                    stepTwoStatus
                  )}`}
                >
                  {getStepStatusLabel(stepTwoStatus)}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                Administrator Checks
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                See the checks TenderHub administrators perform when reviewing
                your organization's verification application.
              </p>

              <div className="mt-5 text-sm font-semibold text-[#071A33]">
                View administrator checks →
              </div>
            </Link>

            {/* Step 3 */}
            <Link
              href="/dashboard/organization/verification/documents"
              className={`group rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                stepThreeStatus === "COMPLETED"
                  ? "border-green-200 hover:border-green-400"
                  : "border-[#D4AF37]/50 hover:border-[#D4AF37]"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold ${
                    stepThreeStatus === "COMPLETED"
                      ? "bg-green-600 text-white"
                      : "bg-[#071A33] text-white"
                  }`}
                >
                  {stepThreeStatus === "COMPLETED" ? "✓" : "3"}
                </div>

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStepStatusClass(
                    stepThreeStatus
                  )}`}
                >
                  {getStepStatusLabel(stepThreeStatus)}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                Supporting Documents
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Enter your organization information and upload the documents
                that provide evidence for the applicable requirements.
              </p>

              <div className="mt-5 text-sm font-semibold text-[#071A33]">
                {stepThreeStatus === "COMPLETED"
                  ? "View submitted evidence →"
                  : "Provide evidence →"}
              </div>
            </Link>
          </div>
        </section>

        {/* Application status */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Application status
            </p>

            <h2 className="mt-1 text-xl font-semibold text-slate-900">
              {verification
                ? getStatusLabel(verification.status)
                : "Verification not yet submitted"}
            </h2>
          </div>

          {!verification && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm leading-6 text-blue-800">
                Your organization has not submitted a verification application
                yet. You can review the requirements and begin providing your
                information and supporting evidence.
              </p>
            </div>
          )}

          {verification?.status === "DRAFT" && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm leading-6 text-slate-700">
                Your verification information is being prepared. Continue to
                the Supporting Documents section to complete your organization
                information and submit your verification application.
              </p>
            </div>
          )}

          {(verification?.status === "SUBMITTED" ||
            verification?.status === "UNDER_REVIEW") && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm leading-6 text-blue-800">
                Your verification application has been submitted and is
                currently awaiting administrator review. Evidence received
                during submission does not automatically become verified.
              </p>
            </div>
          )}

          {verification?.status === "NEEDS_INFORMATION" && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm leading-6 text-amber-800">
                Additional information or evidence is required before your
                verification can be completed. Review the administrator checks
                and supporting documents sections for details.
              </p>

              {verification.adminNotes && (
                <div className="mt-3 rounded-lg bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                    Administrator note
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    {verification.adminNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {verification?.status === "APPROVED" && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
              <p className="text-sm leading-6 text-green-800">
                Your organization has been verified by TenderHub.
              </p>
            </div>
          )}

          {verification?.status === "REJECTED" && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm leading-6 text-red-800">
                Your verification application was not approved.
              </p>

              {verification.rejectionReason && (
                <div className="mt-3 rounded-lg bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-900">
                    Reason
                  </p>

                  <p className="mt-1 text-sm text-red-800">
                    {verification.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Important distinction */}
        <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="font-semibold text-amber-900">
            Evidence is not the same as verification
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            Uploading a document records that TenderHub has received evidence
            for the applicable requirement. It does not automatically verify
            the organization. A requirement becomes verified only after an
            authorized TenderHub administrator reviews the evidence and records
            the appropriate verification result.
          </p>
        </section>

        {/* Primary action */}
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          <Link
            href="/dashboard/organization/verification/requirements"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Review Requirements
          </Link>

          <Link
            href="/dashboard/organization/verification/documents"
            className="rounded-lg bg-[#071A33] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Continue to Documents →
          </Link>
        </div>
      </div>
    </main>
  );
}