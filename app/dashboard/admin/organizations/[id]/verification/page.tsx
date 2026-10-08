"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";

type VerificationStatus =
  | "NOT_SUBMITTED"
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_INFORMATION"
  | "APPROVED"
  | "REJECTED";

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
  description: string | null;
  required: boolean;
  status: CheckStatus;
  documentId: string | null;
  checkedAt: string | null;
  checkedById: string | null;
  notes: string | null;
};

type OrganizationDocument = {
  id: string;
  name: string;
  category: string;
  fileUrl: string;
  mimeType: string | null;
  fileSize: number | null;
  status: string;
  issuedAt: string | null;
  expiryDate: string | null;
  rejectionReason: string | null;
  uploadedAt: string;
};

type Organization = {
  id: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  organizationType: string;
  registrationNumber: string | null;
  taxNumber: string | null;
  country: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  verification: {
    id: string;
    status: VerificationStatus;
    submittedAt: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
    adminNotes: string | null;
    checks: VerificationCheck[];
  } | null;
  documents: OrganizationDocument[];
};

type ApiResponse = {
  organization: Organization;
};

type Tab =
  | "overview"
  | "documents"
  | "compliance"
  | "verification";

const statusLabels: Record<VerificationStatus, string> = {
  NOT_SUBMITTED: "Not submitted",
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under review",
  NEEDS_INFORMATION: "Needs information",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const checkStatusLabels: Record<CheckStatus, string> = {
  PENDING: "Pending",
  PASSED: "Passed",
  FAILED: "Failed",
  NEEDS_INFORMATION: "Needs information",
  NOT_APPLICABLE: "Not applicable",
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

function formatFileSize(bytes: number | null) {
  if (!bytes) {
    return "—";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusClass(status: VerificationStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800";

    case "REJECTED":
      return "bg-red-100 text-red-800";

    case "NEEDS_INFORMATION":
      return "bg-yellow-100 text-yellow-800";

    case "UNDER_REVIEW":
      return "bg-blue-100 text-blue-800";

    case "SUBMITTED":
      return "bg-purple-100 text-purple-800";

    case "DRAFT":
      return "bg-gray-100 text-gray-800";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function checkStatusClass(status: CheckStatus) {
  switch (status) {
    case "PASSED":
      return "bg-green-100 text-green-800";

    case "FAILED":
      return "bg-red-100 text-red-800";

    case "NEEDS_INFORMATION":
      return "bg-yellow-100 text-yellow-800";

    case "NOT_APPLICABLE":
      return "bg-gray-100 text-gray-700";

    default:
      return "bg-blue-100 text-blue-800";
  }
}

function documentStatusClass(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-green-100 text-green-800";

    case "REJECTED":
      return "bg-red-100 text-red-800";

    case "PENDING":
      return "bg-yellow-100 text-yellow-800";

    case "EXPIRED":
      return "bg-red-100 text-red-800";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function OrganizationVerificationReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  /*
   * IMPORTANT:
   * Read the Next.js route params directly with use().
   *
   * We intentionally do NOT store the route id in state and do NOT
   * use an effect depending on the params Promise. That prevents
   * unnecessary rerenders/refetches of this page.
   */
  const { id: organizationId } = use(params);

  const [organization, setOrganization] =
    useState<Organization | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] = useState(false);

  const [activeTab, setActiveTab] =
    useState<Tab>("overview");

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [adminNotes, setAdminNotes] = useState("");

  const [checkNotes, setCheckNotes] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    let cancelled = false;

    async function loadOrganization() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `/api/admin/organizations/${organizationId}/verification`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Failed to load verification"
          );
        }

        const result = data as ApiResponse;

        if (cancelled) {
          return;
        }

        setOrganization(result.organization);

        setRejectionReason(
          result.organization.verification?.rejectionReason ||
            ""
        );

        setAdminNotes(
          result.organization.verification?.adminNotes || ""
        );

        const notes: Record<string, string> = {};

        result.organization.verification?.checks.forEach(
          (check) => {
            notes[check.id] = check.notes || "";
          }
        );

        setCheckNotes(notes);
      } catch (err) {
        if (cancelled) {
          return;
        }

        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load verification"
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadOrganization();

    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  async function refreshOrganization() {
    if (!organizationId) {
      return;
    }

    const response = await fetch(
      `/api/admin/organizations/${organizationId}/verification`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || "Failed to refresh verification"
      );
    }

    const result = data as ApiResponse;

    setOrganization(result.organization);

    setRejectionReason(
      result.organization.verification?.rejectionReason ||
        ""
    );

    setAdminNotes(
      result.organization.verification?.adminNotes || ""
    );

    const notes: Record<string, string> = {};

    result.organization.verification?.checks.forEach(
      (check) => {
        notes[check.id] = check.notes || "";
      }
    );

    setCheckNotes(notes);
  }

  async function performReviewAction(
    action:
      | "START_REVIEW"
      | "REQUEST_INFORMATION"
      | "APPROVE"
      | "REJECT"
  ) {
    if (!organizationId) {
      return;
    }

    if (!organization?.verification) {
      alert(
        "This organization has not submitted a verification application yet."
      );
      return;
    }

    const currentStatus =
      organization.verification.status;

    if (
      action === "START_REVIEW" &&
      currentStatus !== "SUBMITTED"
    ) {
      alert(
        "The organization must submit its verification application before review can begin."
      );
      return;
    }

    if (
      (action === "APPROVE" ||
        action === "REJECT") &&
      currentStatus !== "UNDER_REVIEW"
    ) {
      alert(
        "This action is only available while the verification application is under review."
      );
      return;
    }

    if (
      action === "REQUEST_INFORMATION" &&
      currentStatus !== "UNDER_REVIEW"
    ) {
      alert(
        "Information can only be requested while the verification application is under review."
      );
      return;
    }

    if (
      action === "REJECT" &&
      rejectionReason.trim().length === 0
    ) {
      alert("Please provide a rejection reason.");
      setActiveTab("verification");
      return;
    }

    if (
      action === "REQUEST_INFORMATION" &&
      adminNotes.trim().length === 0
    ) {
      alert("Please specify the information required.");
      setActiveTab("verification");
      return;
    }

    if (action === "APPROVE") {
      const checks =
        organization.verification.checks || [];

      const failedRequiredChecks = checks.filter(
        (check) =>
          check.required &&
          check.status !== "PASSED" &&
          check.status !== "NOT_APPLICABLE"
      );

      if (failedRequiredChecks.length > 0) {
        alert(
          `There are ${failedRequiredChecks.length} required verification check(s) that are not passed.`
        );
        setActiveTab("compliance");
        return;
      }
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/admin/organizations/${organizationId}/verification/review`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            rejectionReason:
              rejectionReason.trim() || null,
            adminNotes:
              adminNotes.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to perform review action"
        );
      }

      await refreshOrganization();

      alert(
        data?.message ||
          "Review updated successfully."
      );
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to perform review action"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function updateCheck(
    checkId: string,
    status: CheckStatus
  ) {
    if (!organizationId) {
      return;
    }

    if (!organization?.verification) {
      alert(
        "There is no verification application to review."
      );
      return;
    }

    if (
      organization.verification.status !==
      "UNDER_REVIEW"
    ) {
      alert(
        "Verification checks can only be updated while the application is under review."
      );
      return;
    }

    try {
      setActionLoading(true);

      const response = await fetch(
        `/api/admin/organizations/${organizationId}/verification/checks/${checkId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status,
            notes: checkNotes[checkId] || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update verification check"
        );
      }

      await refreshOrganization();
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to update verification check"
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function saveCheckNotes(checkId: string) {
    if (
      !organizationId ||
      !organization?.verification
    ) {
      return;
    }

    if (
      organization.verification.status !==
      "UNDER_REVIEW"
    ) {
      alert(
        "Reviewer notes can only be updated while the application is under review."
      );
      return;
    }

    const currentCheck =
      organization.verification.checks.find(
        (check) => check.id === checkId
      );

    if (!currentCheck) {
      return;
    }

    await updateCheck(checkId, currentCheck.status);
  }

  const summary = useMemo(() => {
    const checks =
      organization?.verification?.checks || [];

    const passed = checks.filter(
      (check) =>
        check.status === "PASSED" ||
        check.status === "NOT_APPLICABLE"
    ).length;

    const pending = checks.filter(
      (check) =>
        check.status === "PENDING" ||
        check.status === "NEEDS_INFORMATION"
    ).length;

    const failed = checks.filter(
      (check) => check.status === "FAILED"
    ).length;

    const required = checks.filter(
      (check) => check.required
    ).length;

    const passedRequired = checks.filter(
      (check) =>
        check.required &&
        (check.status === "PASSED" ||
          check.status === "NOT_APPLICABLE")
    ).length;

    const approvedDocuments =
      organization?.documents.filter(
        (document) =>
          document.status === "APPROVED"
      ).length || 0;

    return {
      totalChecks: checks.length,
      passed,
      pending,
      failed,
      required,
      passedRequired,
      totalDocuments:
        organization?.documents.length || 0,
      approvedDocuments,
    };
  }, [organization]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-5 w-48 rounded bg-gray-200" />
            <div className="h-8 w-80 rounded bg-gray-200" />
            <div className="h-4 w-96 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h1 className="text-lg font-semibold">
            Unable to load verification
          </h1>

          <p className="mt-2 text-sm">
            {error}
          </p>

          <Link
            href="/dashboard/admin/organizations"
            className="mt-4 inline-block text-sm font-medium underline"
          >
            Back to Organizations
          </Link>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-white p-6">
          Organization not found.
        </div>
      </div>
    );
  }

  const verification =
    organization.verification;

  const checks =
    verification?.checks || [];

  const hasApplication =
    Boolean(verification);

  const isSubmitted =
    verification?.status === "SUBMITTED";

  const isUnderReview =
    verification?.status === "UNDER_REVIEW";

  const isApproved =
    verification?.status === "APPROVED";

  const isRejected =
    verification?.status === "REJECTED";

  const isNeedsInformation =
    verification?.status ===
    "NEEDS_INFORMATION";

  const isDraft =
    verification?.status === "DRAFT";

  const canApprove =
    isUnderReview &&
    summary.failed === 0 &&
    summary.pending === 0 &&
    summary.passedRequired ===
      summary.required;

  return (
    <div className="space-y-6 p-6">
      {/* Back */}
      <Link
        href="/dashboard/admin/organizations"
        className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        ← Back to Organization Management
      </Link>

      {/* Header */}
      <section className="rounded-xl border bg-white shadow-sm">
        <div className="p-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization.name}
                </h1>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    verification
                      ? statusClass(
                          verification.status
                        )
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {verification
                    ? statusLabels[
                        verification.status
                      ]
                    : "Not submitted"}
                </span>
              </div>

              <p className="mt-2 text-sm text-gray-600">
                Organization verification and
                compliance review workspace
              </p>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <span>
                  <strong className="text-gray-900">
                    Registered
                  </strong>{" "}
                  {formatDate(
                    verification?.submittedAt
                  )}
                </span>

                <span>
                  <strong className="text-gray-900">
                    Reg:
                  </strong>{" "}
                  {organization.registrationNumber ||
                    "—"}
                </span>

                <span>
                  <strong className="text-gray-900">
                    Country:
                  </strong>{" "}
                  {organization.country?.name ||
                    "—"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {isSubmitted && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() =>
                    performReviewAction(
                      "START_REVIEW"
                    )
                  }
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Start Review
                </button>
              )}

              {isUnderReview && (
                <>
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      performReviewAction(
                        "REQUEST_INFORMATION"
                      )
                    }
                    className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Request Information
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      performReviewAction(
                        "REJECT"
                      )
                    }
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    disabled={
                      actionLoading ||
                      !canApprove
                    }
                    onClick={() =>
                      performReviewAction(
                        "APPROVE"
                      )
                    }
                    className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Approve Organization
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 divide-x border-t md:grid-cols-4">
          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Compliance
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.passed}
            </p>

            <p className="text-xs text-gray-500">
              Passed
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Pending
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.pending}
            </p>

            <p className="text-xs text-gray-500">
              Awaiting review
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Failed
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.failed}
            </p>

            <p className="text-xs text-gray-500">
              Exceptions
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Documents
            </p>

            <p className="mt-2 text-2xl font-bold text-gray-900">
              {summary.totalDocuments}
            </p>

            <p className="text-xs text-gray-500">
              {summary.approvedDocuments} approved
            </p>
          </div>
        </div>
      </section>

      {/* State messages */}
      {!hasApplication && (
        <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <h2 className="font-semibold text-yellow-900">
            Verification application not submitted
          </h2>

          <p className="mt-1 text-sm text-yellow-800">
            This organization has not submitted an
            organization verification application yet.
          </p>
        </section>
      )}

      {isDraft && (
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="font-semibold text-gray-900">
            Verification application is still a draft
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Review actions become available after the
            organization submits the application.
          </p>
        </section>
      )}

      {isSubmitted && (
        <section className="rounded-xl border border-purple-200 bg-purple-50 p-5">
          <h2 className="font-semibold text-purple-900">
            Application ready for review
          </h2>

          <p className="mt-1 text-sm text-purple-800">
            The organization has submitted its
            application and is ready for
            administrative review.
          </p>
        </section>
      )}

      {isUnderReview && (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <h2 className="font-semibold text-blue-900">
            Verification review in progress
          </h2>

          <p className="mt-1 text-sm text-blue-800">
            Complete the compliance checks and
            supporting review before approving the
            organization.
          </p>
        </section>
      )}

      {isNeedsInformation && (
        <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-5">
          <h2 className="font-semibold text-yellow-900">
            Additional information requested
          </h2>

          <p className="mt-1 text-sm text-yellow-800">
            The organization must respond and resubmit
            before verification can continue.
          </p>

          {verification?.adminNotes && (
            <div className="mt-4 rounded-lg border border-yellow-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Information requested
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {verification.adminNotes}
              </p>
            </div>
          )}
        </section>
      )}

      {isApproved && (
        <section className="rounded-xl border border-green-200 bg-green-50 p-5">
          <h2 className="font-semibold text-green-900">
            Organization approved
          </h2>

          <p className="mt-1 text-sm text-green-800">
            This organization has completed the
            verification workflow and has been
            approved.
          </p>
        </section>
      )}

      {isRejected && (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="font-semibold text-red-900">
            Verification application rejected
          </h2>

          {verification?.rejectionReason && (
            <div className="mt-3 rounded-lg border border-red-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-gray-500">
                Rejection reason
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {verification.rejectionReason}
              </p>
            </div>
          )}
        </section>
      )}

      {/* Tabs */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex overflow-x-auto border-b">
          {(
            [
              ["overview", "Overview"],
              ["documents", "Documents"],
              ["compliance", "Compliance"],
              ["verification", "Verification"],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setActiveTab(value)
              }
              className={`whitespace-nowrap border-b-2 px-5 py-4 text-sm font-medium transition ${
                activeTab === value
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-900"
              }`}
            >
              {label}

              {value === "documents" && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {summary.totalDocuments}
                </span>
              )}

              {value === "compliance" && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {summary.totalChecks}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <section>
                <h2 className="text-lg font-semibold text-gray-900">
                  Organization Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Registered organization details
                  submitted to TenderHub.
                </p>

                <div className="mt-6 grid gap-x-8 gap-y-6 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Organization name
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {organization.name || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Legal name
                    </p>

                    <p className="mt-1 text-gray-900">
                      {organization.legalName || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Organization type
                    </p>

                    <p className="mt-1 text-gray-900">
                      {organization.organizationType ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Registration number
                    </p>

                    <p className="mt-1 text-gray-900">
                      {organization.registrationNumber ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Tax number
                    </p>

                    <p className="mt-1 text-gray-900">
                      {organization.taxNumber || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Country
                    </p>

                    <p className="mt-1 text-gray-900">
                      {organization.country?.name ||
                        "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Email
                    </p>

                    <p className="mt-1 text-gray-900">
                      {organization.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Phone
                    </p>

                    <p className="mt-1 text-gray-900">
                      {organization.phone || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Website
                    </p>

                    {organization.website ? (
                      <a
                        href={organization.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 block break-all text-blue-600 hover:underline"
                      >
                        {organization.website}
                      </a>
                    ) : (
                      <p className="mt-1 text-gray-900">
                        —
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2 lg:col-span-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Address
                    </p>

                    <p className="mt-1 text-gray-900">
                      {organization.address || "—"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Organization Account
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Verification and account information.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs uppercase text-gray-500">
                      Verification status
                    </p>

                    <p className="mt-2 font-semibold text-gray-900">
                      {verification
                        ? statusLabels[
                            verification.status
                          ]
                        : "Not submitted"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs uppercase text-gray-500">
                      Submitted
                    </p>

                    <p className="mt-2 font-semibold text-gray-900">
                      {formatDate(
                        verification?.submittedAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <p className="text-xs uppercase text-gray-500">
                      Reviewed
                    </p>

                    <p className="mt-2 font-semibold text-gray-900">
                      {formatDate(
                        verification?.reviewedAt
                      )}
                    </p>
                  </div>
                </div>
              </section>

              <section className="border-t pt-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Verification Progress
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {summary.passed} of{" "}
                      {summary.totalChecks} checks
                      passed.
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-xs uppercase text-gray-500">
                      Required checks
                    </p>

                    <p className="text-xl font-bold text-gray-900">
                      {summary.passedRequired} /{" "}
                      {summary.required}
                    </p>
                  </div>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-green-600 transition-all"
                    style={{
                      width:
                        summary.totalChecks > 0
                          ? `${
                              (summary.passed /
                                summary.totalChecks) *
                              100
                            }%`
                          : "0%",
                    }}
                  />
                </div>
              </section>
            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === "documents" && (
            <section>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Submitted Documents
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Documents supplied by the organization
                  for verification.
                </p>
              </div>

              {organization.documents.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
                  No verification documents have
                  been submitted.
                </div>
              ) : (
                <div className="mt-6 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-3 py-3">
                          Document
                        </th>

                        <th className="px-3 py-3">
                          Category
                        </th>

                        <th className="px-3 py-3">
                          Status
                        </th>

                        <th className="px-3 py-3">
                          Uploaded
                        </th>

                        <th className="px-3 py-3">
                          Size
                        </th>

                        <th className="px-3 py-3">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {organization.documents.map(
                        (document) => (
                          <tr
                            key={document.id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-3 py-4">
                              <p className="font-medium text-gray-900">
                                {document.name}
                              </p>

                              {document.mimeType && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {document.mimeType}
                                </p>
                              )}
                            </td>

                            <td className="px-3 py-4 text-sm text-gray-700">
                              {document.category}
                            </td>

                            <td className="px-3 py-4">
                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${documentStatusClass(
                                  document.status
                                )}`}
                              >
                                {document.status}
                              </span>
                            </td>

                            <td className="px-3 py-4 text-sm text-gray-700">
                              {formatDate(
                                document.uploadedAt
                              )}
                            </td>

                            <td className="px-3 py-4 text-sm text-gray-700">
                              {formatFileSize(
                                document.fileSize
                              )}
                            </td>

                            <td className="px-3 py-4">
                              <a
                                href={
                                  document.fileUrl
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-medium text-blue-600 hover:underline"
                              >
                                View document
                              </a>
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* COMPLIANCE */}
          {activeTab === "compliance" && (
            <section>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Compliance Requirements
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Review each organization verification
                    requirement and its supporting evidence.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
                    {summary.passed} Passed
                  </span>

                  <span className="rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-800">
                    {summary.pending} Pending
                  </span>

                  <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-800">
                    {summary.failed} Failed
                  </span>
                </div>
              </div>

              {checks.length === 0 ? (
                <div className="mt-6 rounded-lg border border-dashed p-8 text-center text-sm text-gray-500">
                  No verification checks have been
                  generated yet.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {checks.map((check, index) => {
                    const supportingDocument =
                      check.documentId
                        ? organization.documents.find(
                            (document) =>
                              document.id ===
                              check.documentId
                          )
                        : null;

                    return (
                      <div
                        key={check.id}
                        className="rounded-xl border bg-white p-5"
                      >
                        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold text-gray-400">
                                #{index + 1}
                              </span>

                              <h3 className="font-semibold text-gray-900">
                                {check.name}
                              </h3>

                              {check.required && (
                                <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                                  Required
                                </span>
                              )}

                              <span
                                className={`rounded-full px-2 py-1 text-xs font-medium ${checkStatusClass(
                                  check.status
                                )}`}
                              >
                                {
                                  checkStatusLabels[
                                    check.status
                                  ]
                                }
                              </span>
                            </div>

                            <p className="mt-3 text-sm leading-6 text-gray-600">
                              {check.description ||
                                "No additional description provided."}
                            </p>

                            <p className="mt-2 text-xs text-gray-500">
                              Category: {check.category}
                            </p>

                            {supportingDocument && (
                              <div className="mt-4 rounded-lg border bg-gray-50 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                  Supporting document
                                </p>

                                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">
                                      {
                                        supportingDocument.name
                                      }
                                    </p>

                                    <span
                                      className={`mt-1 inline-block rounded-full px-2 py-1 text-xs font-medium ${documentStatusClass(
                                        supportingDocument.status
                                      )}`}
                                    >
                                      {
                                        supportingDocument.status
                                      }
                                    </span>
                                  </div>

                                  <a
                                    href={
                                      supportingDocument.fileUrl
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-blue-600 hover:underline"
                                  >
                                    View document
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 lg:w-auto">
                            <button
                              type="button"
                              disabled={
                                actionLoading ||
                                !isUnderReview
                              }
                              onClick={() =>
                                updateCheck(
                                  check.id,
                                  "PASSED"
                                )
                              }
                              className="rounded-md bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Pass
                            </button>

                            <button
                              type="button"
                              disabled={
                                actionLoading ||
                                !isUnderReview
                              }
                              onClick={() =>
                                updateCheck(
                                  check.id,
                                  "FAILED"
                                )
                              }
                              className="rounded-md bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Fail
                            </button>

                            <button
                              type="button"
                              disabled={
                                actionLoading ||
                                !isUnderReview
                              }
                              onClick={() =>
                                updateCheck(
                                  check.id,
                                  "NEEDS_INFORMATION"
                                )
                              }
                              className="rounded-md bg-yellow-500 px-3 py-2 text-xs font-medium text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Need Info
                            </button>

                            <button
                              type="button"
                              disabled={
                                actionLoading ||
                                !isUnderReview
                              }
                              onClick={() =>
                                updateCheck(
                                  check.id,
                                  "NOT_APPLICABLE"
                                )
                              }
                              className="rounded-md bg-gray-600 px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              N/A
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 border-t pt-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Reviewer notes
                          </label>

                          <textarea
                            value={
                              checkNotes[check.id] ||
                              ""
                            }
                            onChange={(event) =>
                              setCheckNotes(
                                (current) => ({
                                  ...current,
                                  [check.id]:
                                    event.target.value,
                                })
                              )
                            }
                            disabled={!isUnderReview}
                            rows={3}
                            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                            placeholder="Add notes about this verification check..."
                          />

                          <button
                            type="button"
                            disabled={
                              actionLoading ||
                              !isUnderReview
                            }
                            onClick={() =>
                              saveCheckNotes(
                                check.id
                              )
                            }
                            className="mt-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Save Notes
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* VERIFICATION */}
          {activeTab === "verification" && (
            <section className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Verification Review
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Record administrative review notes and
                  make the final verification decision.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500">
                    Verification status
                  </p>

                  <p className="mt-2 font-semibold text-gray-900">
                    {verification
                      ? statusLabels[
                          verification.status
                        ]
                      : "Not submitted"}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500">
                    Verification ID
                  </p>

                  <p className="mt-2 break-all font-mono text-xs text-gray-900">
                    {verification?.id || "—"}
                  </p>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="text-xs uppercase text-gray-500">
                    Required checks
                  </p>

                  <p className="mt-2 font-semibold text-gray-900">
                    {summary.passedRequired} /{" "}
                    {summary.required}
                  </p>
                </div>
              </div>

              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Reviewer / administrative notes
                </label>

                <textarea
                  value={adminNotes}
                  onChange={(event) =>
                    setAdminNotes(
                      event.target.value
                    )
                  }
                  disabled={
                    !isUnderReview &&
                    !isSubmitted
                  }
                  rows={6}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Enter administrative review notes..."
                />

                <p className="mt-2 text-xs text-gray-500">
                  These notes are sent with the review
                  decision.
                </p>
              </div>

              <div className="border-t pt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Rejection reason
                </label>

                <p className="mt-1 text-xs text-gray-500">
                  Required when rejecting an organization.
                </p>

                <textarea
                  value={rejectionReason}
                  onChange={(event) =>
                    setRejectionReason(
                      event.target.value
                    )
                  }
                  disabled={!isUnderReview}
                  rows={5}
                  className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Explain why the verification application is being rejected..."
                />
              </div>

              <div className="border-t pt-6">
                <h3 className="text-base font-semibold text-gray-900">
                  Review Actions
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  These actions change the
                  organization's verification status.
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  {!hasApplication && (
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      No review actions are available
                      because the organization has not
                      submitted a verification application.
                    </div>
                  )}

                  {hasApplication && isDraft && (
                    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                      This application is still a draft.
                    </div>
                  )}

                  {hasApplication && isSubmitted && (
                    <button
                      type="button"
                      disabled={actionLoading}
                      onClick={() =>
                        performReviewAction(
                          "START_REVIEW"
                        )
                      }
                      className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Start Review
                    </button>
                  )}

                  {hasApplication && isUnderReview && (
                    <>
                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          performReviewAction(
                            "REQUEST_INFORMATION"
                          )
                        }
                        className="rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Request Information
                      </button>

                      <button
                        type="button"
                        disabled={actionLoading}
                        onClick={() =>
                          performReviewAction(
                            "REJECT"
                          )
                        }
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Reject Organization
                      </button>

                      <button
                        type="button"
                        disabled={
                          actionLoading ||
                          !canApprove
                        }
                        onClick={() =>
                          performReviewAction(
                            "APPROVE"
                          )
                        }
                        className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve Organization
                      </button>
                    </>
                  )}

                  {hasApplication &&
                    isNeedsInformation && (
                      <div className="w-full rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                        Waiting for the organization to
                        provide the requested information
                        and resubmit its verification
                        application.
                      </div>
                    )}

                  {hasApplication && isApproved && (
                    <div className="w-full rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                      This organization has been approved.
                    </div>
                  )}

                  {hasApplication && isRejected && (
                    <div className="w-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                      This verification application is
                      rejected. No further review action
                      is available from this application
                      state.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
