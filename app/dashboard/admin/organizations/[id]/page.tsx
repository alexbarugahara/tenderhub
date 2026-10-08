"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import VerificationHeader from "@/components/admin/shared verification/VerificationHeader";
import VerificationMetrics from "@/components/admin/shared verification/VerificationMetrics";
import VerificationStatusBanner from "@/components/admin/shared verification/VerificationStatusBanner";
import VerificationTabs from "@/components/admin/shared verification/VerificationTabs";
import VerificationOverview from "@/components/admin/shared verification/VerificationOverview";
import VerificationDocuments from "@/components/admin/shared verification/VerificationDocuments";
import VerificationCompliance from "@/components/admin/shared verification/VerificationCompliance";
import VerificationDecision from "@/components/admin/shared verification/VerificationDecision";

import type {
  CheckStatus,
  VerificationApiResponse,
  VerificationCheck,
  VerificationDocument,
  VerificationOrganization,
  VerificationTab,
} from "@/components/admin/shared verification/types";

type ReviewAction =
  | "START_REVIEW"
  | "REQUEST_INFORMATION"
  | "APPROVE"
  | "REJECT";

interface AdminOrganizationDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrganizationDetailsPage({
  params,
}: AdminOrganizationDetailsPageProps) {
  const [organizationId, setOrganizationId] =
    useState<string | null>(null);

  const [organization, setOrganization] =
    useState<VerificationOrganization | null>(null);

  const [verificationSummary, setVerificationSummary] =
    useState<
      VerificationApiResponse["verificationSummary"] | null
    >(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] =
    useState(false);

  const [activeTab, setActiveTab] =
    useState<VerificationTab>("overview");

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [adminNotes, setAdminNotes] =
    useState("");

  const [checkNotes, setCheckNotes] =
    useState<Record<string, string>>({});

  /*
   * Resolve the dynamic organization route parameter.
   */
  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params;

      setOrganizationId(resolvedParams.id);
    }

    loadParams();
  }, [params]);

  /*
   * Load the organization's verification record.
   *
   * This remains connected to the existing API and therefore
   * keeps Prisma/API as the source of truth.
   */
  async function loadOrganization(id: string) {
    const response = await fetch(
      `/api/admin/organizations/${id}/verification`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error ||
          "Failed to load organization verification",
      );
    }

    const result =
      data as VerificationApiResponse;

    setOrganization(result.organization);

    setVerificationSummary(
      result.verificationSummary,
    );

    setRejectionReason(
      result.organization.verification
        ?.rejectionReason || "",
    );

    setAdminNotes(
      result.organization.verification
        ?.adminNotes || "",
    );

    const notes: Record<string, string> = {};

    result.organization.verification?.checks.forEach(
      (check: VerificationCheck) => {
        notes[check.id] = check.notes || "";
      },
    );

    setCheckNotes(notes);
  }

  /*
   * Initial verification load.
   */
  useEffect(() => {
    if (!organizationId) {
      return;
    }

    const id = organizationId;

    async function load() {
      try {
        setLoading(true);
        setError("");

        await loadOrganization(id);
      } catch (err) {
        console.error(err);

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load organization verification",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [organizationId]);

  /*
   * Refresh the organization after an action.
   */
  async function refreshOrganization() {
    if (!organizationId) {
      return;
    }

    await loadOrganization(organizationId);
  }

  /*
   * Start review / request information / approve / reject.
   */
  async function performReviewAction(
    action: ReviewAction,
  ) {
    if (!organizationId) {
      return;
    }

    if (!organization?.verification) {
      alert(
        "This organization has not submitted its verification application yet.",
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
        "The organization must submit its verification application before review can begin.",
      );

      return;
    }

    if (
      (action === "APPROVE" ||
        action === "REJECT") &&
      currentStatus !== "UNDER_REVIEW"
    ) {
      alert(
        "This action is only available while the verification application is under review.",
      );

      return;
    }

    if (
      action === "REQUEST_INFORMATION" &&
      currentStatus !== "UNDER_REVIEW"
    ) {
      alert(
        "Information can only be requested while the verification application is under review.",
      );

      return;
    }

    if (
      action === "REJECT" &&
      rejectionReason.trim().length === 0
    ) {
      alert(
        "Please provide a rejection reason.",
      );

      setActiveTab("verification");

      return;
    }

    if (
      action === "REQUEST_INFORMATION" &&
      adminNotes.trim().length === 0
    ) {
      alert(
        "Please specify the information required.",
      );

      setActiveTab("verification");

      return;
    }

    /*
     * Prevent approval when required verification
     * requirements/checks are incomplete.
     */
    if (action === "APPROVE") {
      const checks =
        organization.verification.checks || [];

      const failedRequiredChecks =
        checks.filter(
          (check: VerificationCheck) =>
            check.required &&
            check.status !== "PASSED" &&
            check.status !== "NOT_APPLICABLE",
        );

      if (
        failedRequiredChecks.length > 0
      ) {
        alert(
          `There are ${failedRequiredChecks.length} required verification requirement(s) that are not passed.`,
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
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to perform review action",
        );
      }

      await refreshOrganization();

      alert(
        data?.message ||
          "Review updated successfully.",
      );
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to perform review action",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * Update an individual verification requirement/check.
   */
  async function updateCheck(
    checkId: string,
    status: CheckStatus,
  ) {
    if (!organizationId) {
      return;
    }

    if (!organization?.verification) {
      alert(
        "There is no verification application to review.",
      );

      return;
    }

    if (
      organization.verification.status !==
      "UNDER_REVIEW"
    ) {
      alert(
        "Verification requirements can only be updated while the application is under review.",
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
            notes:
              checkNotes[checkId] || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update verification requirement",
        );
      }

      await refreshOrganization();
    } catch (err) {
      console.error(err);

      alert(
        err instanceof Error
          ? err.message
          : "Failed to update verification requirement",
      );
    } finally {
      setActionLoading(false);
    }
  }

  /*
   * Save reviewer notes for a requirement/check.
   */
  async function saveCheckNotes(
    checkId: string,
  ) {
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
        "Reviewer notes can only be updated while the application is under review.",
      );

      return;
    }

    const currentCheck =
      organization.verification.checks.find(
        (check: VerificationCheck) =>
          check.id === checkId,
      );

    if (!currentCheck) {
      return;
    }

    await updateCheck(
      checkId,
      currentCheck.status,
    );
  }

  /*
   * Calculate verification summary when the API
   * does not provide one.
   */
  const summary = useMemo(() => {
    if (verificationSummary) {
      return verificationSummary;
    }

    const checks =
      organization?.verification?.checks || [];

    const passedChecks = checks.filter(
      (check: VerificationCheck) =>
        check.status === "PASSED" ||
        check.status === "NOT_APPLICABLE",
    ).length;

    const failedChecks = checks.filter(
      (check: VerificationCheck) =>
        check.status === "FAILED",
    ).length;

    const pendingChecks = checks.filter(
      (check: VerificationCheck) =>
        check.status === "PENDING" ||
        check.status === "NEEDS_INFORMATION",
    ).length;

    const requiredChecks = checks.filter(
      (check: VerificationCheck) =>
        check.required,
    ).length;

    const requiredChecksComplete =
      checks
        .filter(
          (check: VerificationCheck) =>
            check.required,
        )
        .every(
          (check: VerificationCheck) =>
            check.status === "PASSED" ||
            check.status === "NOT_APPLICABLE",
        );

    return {
      totalChecks: checks.length,
      requiredChecks,
      passedChecks,
      failedChecks,
      pendingChecks,
      completionPercentage:
        checks.length > 0
          ? Math.round(
              (passedChecks /
                checks.length) *
                100,
            )
          : 0,
      readyForApproval:
        requiredChecksComplete &&
        failedChecks === 0 &&
        pendingChecks === 0,
    };
  }, [
    organization,
    verificationSummary,
  ]);

  const checks =
    organization?.verification?.checks || [];

  const verification =
    organization?.verification;

  /*
   * Any status other than APPROVED means that
   * verification requirements remain relevant.
   */
  const needsVerification =
    !verification ||
    verification.status !== "APPROVED";

  if (loading) {
    return (
      <main className="space-y-6 p-6">
        <div className="rounded-xl border bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-5">
            <div className="h-4 w-40 rounded bg-gray-200" />

            <div className="h-8 w-72 rounded bg-gray-200" />

            <div className="h-4 w-96 rounded bg-gray-200" />

            <div className="grid grid-cols-2 gap-4 pt-4 md:grid-cols-4">
              {Array.from({
                length: 4,
              }).map((_, index) => (
                <div
                  key={index}
                  className="h-24 rounded-lg bg-gray-100"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="space-y-6 p-6">
        <Link
          href="/dashboard/admin/organizations"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Organization Management
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h1 className="text-lg font-semibold">
            Unable to load organization
          </h1>

          <p className="mt-2 text-sm">
            {error}
          </p>
        </div>
      </main>
    );
  }

  if (!organization) {
    return (
      <main className="space-y-6 p-6">
        <Link
          href="/dashboard/admin/organizations"
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Organization Management
        </Link>

        <div className="rounded-xl border bg-white p-6 shadow-sm">
          Organization not found.
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6 p-6">
      {/* Organization Header */}
      <VerificationHeader
        name={organization.name}
        status={
          verification?.status ||
          "NOT_SUBMITTED"
        }
        backHref="/dashboard/admin/organizations"
        backLabel="Back to Organization Management"
        registeredLabel="Registered"
        registrationNumber={
          organization.registrationNumber
        }
        countryName={
          organization.country?.name
        }
        onStartReview={() =>
          performReviewAction(
            "START_REVIEW",
          )
        }
        onRequestInformation={() =>
          performReviewAction(
            "REQUEST_INFORMATION",
          )
        }
        onApprove={() =>
          performReviewAction("APPROVE")
        }
        onReject={() =>
          performReviewAction("REJECT")
        }
        actionLoading={actionLoading}
      />

      {/* Verification Metrics */}
      <VerificationMetrics
        passed={summary.passedChecks}
        pending={summary.pendingChecks}
        failed={summary.failedChecks}
        documentsApproved={
          organization.documents.filter(
            (document: VerificationDocument) =>
              document.status === "APPROVED",
          ).length
        }
        documentsTotal={
          organization.documents.length
        }
      />

      {/* Verification Status */}
      <VerificationStatusBanner
        status={
          verification?.status ||
          "NOT_SUBMITTED"
        }
        rejectionReason={
          verification?.rejectionReason
        }
        adminNotes={
          verification?.adminNotes
        }
      />

      {/* Requirements Callout */}
      {needsVerification && (
        <section className="rounded-xl border border-tenderhub-gold/30 bg-tenderhub-gold/5 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-tenderhub-gold">
                Verification Requirements
              </p>

              <h2 className="mt-1 text-lg font-semibold text-tenderhub-navy">
                Review this organization&apos;s verification requirements
              </h2>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-600">
                Review the required checks and supporting information before
                approving the organization. Requirements can be updated while
                the application is under review.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setActiveTab("compliance")
              }
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Review Requirements
            </button>
          </div>
        </section>
      )}

      {/* Verification Workspace */}
      <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
        <VerificationTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="p-6">
          {/* Overview */}
          {activeTab === "overview" && (
            <VerificationOverview
              organization={organization}
            />
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <VerificationDocuments
              documents={
                organization.documents
              }
            />
          )}

          {/* Requirements / Compliance */}
          {activeTab === "compliance" && (
            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-tenderhub-gold">
                      Verification
                    </p>

                    <h2 className="mt-1 text-xl font-semibold text-tenderhub-navy">
                      Verification Requirements
                    </h2>

                    <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-500">
                      Review the requirements assigned to this organization
                      and record the verification result for each requirement.
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm">
                    <span className="text-gray-500">
                      Progress
                    </span>

                    <div className="mt-1 font-semibold text-tenderhub-navy">
                      {summary.passedChecks} of{" "}
                      {summary.totalChecks} complete
                    </div>
                  </div>
                </div>
              </div>

              {checks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <h3 className="text-base font-semibold text-gray-900">
                    No verification requirements found
                  </h3>

                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-gray-500">
                    No verification requirements have been assigned to this
                    organization yet. Configure the organization requirements
                    from Admin Settings before starting the review.
                  </p>

                  <Link
                    href="/dashboard/admin/organization-verification-requirements"
                    className="mt-4 inline-flex items-center rounded-lg border border-tenderhub-navy px-4 py-2 text-sm font-semibold text-tenderhub-navy transition hover:bg-tenderhub-navy hover:text-white"
                  >
                    Configure Organization Requirements
                  </Link>
                </div>
              ) : (
                <VerificationCompliance
                  checks={checks}
                  onUpdateCheck={updateCheck}
                  onSaveNotes={saveCheckNotes}
                  actionLoading={
                    actionLoading
                  }
                />
              )}
            </div>
          )}

          {/* Verification Decision */}
          {activeTab === "verification" && (
            <VerificationDecision
              status={
                verification?.status ||
                "NOT_SUBMITTED"
              }
              adminNotes={adminNotes}
              rejectionReason={
                rejectionReason
              }
              adminNotesValue={
                adminNotes
              }
              rejectionReasonValue={
                rejectionReason
              }
              onAdminNotesChange={
                setAdminNotes
              }
              onRejectionReasonChange={
                setRejectionReason
              }
              onRequestInformation={() =>
                performReviewAction(
                  "REQUEST_INFORMATION",
                )
              }
              onApprove={() =>
                performReviewAction(
                  "APPROVE",
                )
              }
              onReject={() =>
                performReviewAction(
                  "REJECT",
                )
              }
              actionLoading={
                actionLoading
              }
            />
          )}
        </div>
      </section>
    </main>
  );
}