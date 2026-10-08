"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CheckStatus =
  | "PENDING"
  | "PASSED"
  | "FAILED"
  | "NEEDS_INFORMATION"
  | "NOT_APPLICABLE";

type VerificationCheck = {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  required: boolean;
  status: CheckStatus;
  documentId?: string | null;
  checkedAt?: string | null;
  notes?: string | null;
};

type VerificationResponse = {
  verification: {
    id: string;
    status: string;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    rejectionReason?: string | null;
    adminNotes?: string | null;
    checks: VerificationCheck[];
  } | null;

  documents: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
  }>;
};

function getStatusLabel(status: CheckStatus) {
  switch (status) {
    case "PASSED":
      return "Verified";

    case "FAILED":
      return "Failed";

    case "NEEDS_INFORMATION":
      return "Needs information";

    case "NOT_APPLICABLE":
      return "Not applicable";

    default:
      return "Pending verification";
  }
}

function getStatusClass(status: CheckStatus) {
  switch (status) {
    case "PASSED":
      return "bg-green-50 text-green-700 border-green-200";

    case "FAILED":
      return "bg-red-50 text-red-700 border-red-200";

    case "NEEDS_INFORMATION":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "NOT_APPLICABLE":
      return "bg-slate-100 text-slate-600 border-slate-200";

    default:
      return "bg-blue-50 text-blue-700 border-blue-200";
  }
}

function getCategoryLabel(category: string) {
  return category
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function AdministratorChecksPage() {
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
              "Failed to load verification information."
          );
        }

        setData(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load verification information."
        );
      } finally {
        setLoading(false);
      }
    }

    loadVerification();
  }, []);

  const checks = data?.verification?.checks ?? [];

  const requiredChecks = checks.filter(
    (check) => check.required
  );

  const completedRequiredChecks = requiredChecks.filter(
    (check) =>
      check.status === "PASSED" ||
      check.status === "FAILED" ||
      check.status === "NOT_APPLICABLE"
  );

  const progress =
    requiredChecks.length > 0
      ? Math.round(
          (completedRequiredChecks.length /
            requiredChecks.length) *
            100
        )
      : 0;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading administrator verification checks...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link
              href="/dashboard/organization"
              className="hover:text-slate-900"
            >
              Organization
            </Link>

            <span>/</span>

            <Link
              href="/dashboard/organization/verification"
              className="hover:text-slate-900"
            >
              Verification
            </Link>

            <span>/</span>

            <span className="text-slate-700">
              Administrator Checks
            </span>
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Administrator Verification Checks
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              These are the checks TenderHub administrators perform
              after receiving your organization information and
              supporting evidence.
            </p>
          </div>
        </div>

        {/* Step navigation */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <Link
              href="/dashboard/organization/verification/requirements"
              className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step 1
              </div>

              <div className="mt-1 font-semibold text-slate-900">
                Verification Requirements
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Understand what is required.
              </div>
            </Link>

            <div className="rounded-lg bg-[#071A33] p-4 text-white">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Step 2
              </div>

              <div className="mt-1 font-semibold">
                Administrator Verification Checks
              </div>

              <div className="mt-1 text-xs text-slate-300">
                TenderHub performs these checks.
              </div>
            </div>

            <Link
              href="/dashboard/organization/verification/documents"
              className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step 3
              </div>

              <div className="mt-1 font-semibold text-slate-900">
                Supporting Documents
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Submit your evidence.
              </div>
            </Link>
          </div>
        </div>

        {/* Explanation */}
        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-900">
            You do not need to perform these checks
          </h2>

          <p className="mt-2 text-sm leading-6 text-blue-800">
            The checks below are performed by authorized TenderHub
            administrators. Your responsibility is to provide
            accurate organization information and the appropriate
            supporting evidence.
          </p>
        </div>

        {/* Progress */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Required checks
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {completedRequiredChecks.length} of{" "}
                {requiredChecks.length} required checks reviewed
              </p>
            </div>

            <div className="text-2xl font-bold text-slate-900">
              {progress}%
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#D4AF37] transition-all"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {/* Checks */}
        {!error && checks.length === 0 && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Verification checks will appear here once the
              verification application is created.
            </p>

            <div className="mt-5">
              <Link
                href="/dashboard/organization/verification/documents"
                className="inline-flex rounded-lg bg-[#071A33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Continue to Supporting Documents
              </Link>
            </div>
          </div>
        )}

        {!error && checks.length > 0 && (
          <div className="mt-8 space-y-4">
            {checks.map((check) => (
              <div
                key={check.id}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                {/* Check header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-900">
                        {check.name}
                      </h2>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                          check.status
                        )}`}
                      >
                        {getStatusLabel(check.status)}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      {getCategoryLabel(check.category)}
                    </p>

                    {check.description && (
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                        {check.description}
                      </p>
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      check.required
                        ? "bg-red-50 text-red-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {check.required
                      ? "Required"
                      : "Conditional"}
                  </span>
                </div>

                {/* What happens */}
                <div className="mt-5 rounded-lg bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-slate-400">
                      ✓
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        What happens here?
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        A TenderHub administrator reviews the
                        submitted information and supporting evidence
                        and records the outcome of this check.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Needs information */}
                {check.status === "NEEDS_INFORMATION" &&
                  check.notes && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm font-semibold text-amber-900">
                        Additional information requested
                      </p>

                      <p className="mt-1 text-sm leading-6 text-amber-800">
                        {check.notes}
                      </p>
                    </div>
                  )}

                {/* Failed */}
                {check.status === "FAILED" &&
                  check.notes && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-semibold text-red-900">
                        Administrator notes
                      </p>

                      <p className="mt-1 text-sm leading-6 text-red-800">
                        {check.notes}
                      </p>
                    </div>
                  )}

                {/* Passed */}
                {check.status === "PASSED" && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-sm font-semibold text-green-900">
                      Verification check passed
                    </p>

                    <p className="mt-1 text-sm leading-6 text-green-800">
                      The administrator has recorded this check as
                      successfully verified.
                    </p>

                    {check.checkedAt && (
                      <p className="mt-2 text-xs text-green-700">
                        Reviewed on{" "}
                        {new Date(
                          check.checkedAt
                        ).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}

                {/* Not applicable */}
                {check.status === "NOT_APPLICABLE" && (
                  <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-800">
                      Not applicable
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      This check has been marked as not applicable
                      to this organization.
                    </p>
                  </div>
                )}

                {/* Pending */}
                {check.status === "PENDING" && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900">
                      Pending administrator review
                    </p>

                    <p className="mt-1 text-sm leading-6 text-blue-800">
                      This check will remain pending until an
                      authorized TenderHub administrator reviews the
                      relevant information and evidence.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Evidence distinction */}
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-semibold text-amber-900">
            Evidence received does not automatically mean verified
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            When you submit a supporting document, TenderHub can
            identify the requirements that the document supports.
            Those requirements remain{" "}
            <strong>Pending verification</strong> until an
            authorized administrator completes the relevant check.
          </p>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap justify-between gap-3">
          <Link
            href="/dashboard/organization/verification/requirements"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Back to Requirements
          </Link>

          <Link
            href="/dashboard/organization/verification/documents"
            className="rounded-lg bg-[#071A33] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            Continue to Supporting Documents →
          </Link>
        </div>
      </div>
    </main>
  );
}
