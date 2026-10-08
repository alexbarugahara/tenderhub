"use client";

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
  VerificationOrganization,
  VerificationTab,
} from "@/components/admin/shared verification/types";

type ReviewAction =
  | "START_REVIEW"
  | "REQUEST_INFORMATION"
  | "APPROVE"
  | "REJECT";

interface OrganizationVerificationProps {
  organizationId: string;
}

export default function OrganizationVerification({
  organizationId,
}: OrganizationVerificationProps) {
  const [organization, setOrganization] =
    useState<VerificationOrganization | null>(null);

  const [verificationSummary, setVerificationSummary] =
    useState<VerificationApiResponse["verificationSummary"] | null>(null);

  const [documents, setDocuments] = useState<
    VerificationApiResponse["documents"]
  >([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] =
    useState<VerificationTab>("overview");

  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const loadVerification = async () => {
    if (!organizationId) {
      setError("Organization ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/organizations/${organizationId}/verification`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load organization verification.",
        );
      }

      const result = data as VerificationApiResponse;

      setOrganization(result.organization);
      setVerificationSummary(result.verificationSummary);
      setDocuments(result.documents ?? []);

      setRejectionReason(
        result.verification?.rejectionReason ?? "",
      );

      setAdminNotes(
        result.verification?.adminNotes ?? "",
      );
    } catch (err) {
      console.error(
        "ORGANIZATION_VERIFICATION_LOAD_ERROR",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load organization verification.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadVerification();
  }, [organizationId]);

  const verification = organization?.verification ?? null;

  const checks = verification?.checks ?? [];

  const checkSummary = useMemo(() => {
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

    const requiredChecks = checks.filter(
      (check) => check.required,
    );

    const passedRequired = requiredChecks.filter(
      (check) =>
        check.status === "PASSED" ||
        check.status === "NOT_APPLICABLE",
    ).length;

    return {
      passed,
      failed,
      pending,
      required: requiredChecks.length,
      passedRequired,
    };
  }, [checks]);

  const documentsApproved = documents.filter(
    (document) => document.status === "APPROVED",
  ).length;

  const documentsTotal = documents.length;

  const status =
    verification?.status ?? "NOT_SUBMITTED";

  const isSubmitted = status === "SUBMITTED";
  const isUnderReview = status === "UNDER_REVIEW";

  const canApprove =
    isUnderReview &&
    checkSummary.failed === 0 &&
    checkSummary.pending === 0 &&
    checkSummary.required ===
      checkSummary.passedRequired;

  const canReject =
    isUnderReview &&
    rejectionReason.trim().length > 0;

  const handleReviewAction = async (
    action: ReviewAction,
  ) => {
    if (!organizationId) {
      return;
    }

    if (
      action === "START_REVIEW" &&
      !isSubmitted
    ) {
      setError(
        "The organization must be submitted before review can start.",
      );
      return;
    }

    if (
      action !== "START_REVIEW" &&
      !isUnderReview
    ) {
      setError(
        "This action is only available while the organization is under review.",
      );
      return;
    }

    if (
      action === "APPROVE" &&
      !canApprove
    ) {
      setError(
        "The organization cannot be approved until all required checks are passed or marked not applicable.",
      );
      return;
    }

    if (
      action === "REJECT" &&
      !canReject
    ) {
      setError(
        "A rejection reason is required.",
      );
      return;
    }

    if (
      action === "REQUEST_INFORMATION" &&
      !adminNotes.trim()
    ) {
      setError(
        "Administrative notes are required when requesting information.",
      );
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

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
              action === "REJECT"
                ? rejectionReason.trim()
                : undefined,
            adminNotes:
              adminNotes.trim() || undefined,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update verification status.",
        );
      }

      await loadVerification();
    } catch (err) {
      console.error(
        "ORGANIZATION_VERIFICATION_REVIEW_ERROR",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update verification status.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateCheck = async (
    checkId: string,
    checkStatus: CheckStatus,
  ) => {
    if (!organizationId || !checkId) {
      return;
    }

    if (!isUnderReview) {
      setError(
        "Verification checks can only be updated while the organization is under review.",
      );
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const response = await fetch(
        `/api/admin/organizations/${organizationId}/verification/checks/${checkId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: checkStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update verification check.",
        );
      }

      await loadVerification();
    } catch (err) {
      console.error(
        "ORGANIZATION_VERIFICATION_CHECK_UPDATE_ERROR",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update verification check.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveNotes = async (
    checkId: string,
    notes: string,
  ) => {
    if (!organizationId || !checkId) {
      return;
    }

    if (!isUnderReview) {
      setError(
        "Verification notes can only be updated while the organization is under review.",
      );
      return;
    }

    try {
      setActionLoading(true);
      setError(null);

      const currentCheck = checks.find(
        (check) => check.id === checkId,
      );

      if (!currentCheck) {
        throw new Error(
          "Verification check could not be found.",
        );
      }

      const response = await fetch(
        `/api/admin/organizations/${organizationId}/verification/checks/${checkId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: currentCheck.status,
            notes,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to save verification notes.",
        );
      }

      await loadVerification();
    } catch (err) {
      console.error(
        "ORGANIZATION_VERIFICATION_NOTES_ERROR",
        err,
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save verification notes.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 rounded bg-gray-200" />
            <div className="h-4 w-2/3 rounded bg-gray-200" />
            <div className="h-20 rounded bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error ||
          "Organization verification could not be loaded."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <VerificationHeader
        name={organization.name}
        status={status}
        backHref="/dashboard/admin/organizations"
        backLabel="Back to Organizations"
        registeredLabel="Organization"
        registrationNumber={
          organization.registrationNumber
        }
        countryName={
          organization.country?.name
        }
        onStartReview={
          isSubmitted
            ? () =>
                void handleReviewAction(
                  "START_REVIEW",
                )
            : undefined
        }
        onRequestInformation={
          isUnderReview
            ? () =>
                void handleReviewAction(
                  "REQUEST_INFORMATION",
                )
            : undefined
        }
        onApprove={
          isUnderReview
            ? () =>
                void handleReviewAction("APPROVE")
            : undefined
        }
        onReject={
          isUnderReview
            ? () =>
                void handleReviewAction("REJECT")
            : undefined
        }
        actionLoading={actionLoading}
      />

      <VerificationMetrics
        passed={checkSummary.passed}
        pending={checkSummary.pending}
        failed={checkSummary.failed}
        documentsApproved={documentsApproved}
        documentsTotal={documentsTotal}
      />

      <VerificationStatusBanner
        status={status}
        rejectionReason={
          verification?.rejectionReason
        }
        adminNotes={verification?.adminNotes}
      />

      <VerificationTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "overview" && (
        <VerificationOverview
          organization={organization}
        />
      )}

      {activeTab === "documents" && (
        <VerificationDocuments
          documents={documents}
        />
      )}

      {activeTab === "compliance" && (
        <VerificationCompliance
          checks={checks}
          onUpdateCheck={handleUpdateCheck}
          onSaveNotes={handleSaveNotes}
          actionLoading={actionLoading}
        />
      )}

      {activeTab === "verification" && (
        <VerificationDecision
          status={status}
          rejectionReason={
            verification?.rejectionReason
          }
          adminNotes={
            verification?.adminNotes
          }
          rejectionReasonValue={
            rejectionReason
          }
          adminNotesValue={adminNotes}
          onRejectionReasonChange={
            setRejectionReason
          }
          onAdminNotesChange={setAdminNotes}
          onRequestInformation={
            isUnderReview
              ? () =>
                  void handleReviewAction(
                    "REQUEST_INFORMATION",
                  )
              : undefined
          }
          onApprove={
            isUnderReview
              ? () =>
                  void handleReviewAction(
                    "APPROVE",
                  )
              : undefined
          }
          onReject={
            isUnderReview
              ? () =>
                  void handleReviewAction(
                    "REJECT",
                  )
              : undefined
          }
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}