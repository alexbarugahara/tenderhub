import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

type ApplicationRequirementStatus =
  | "OUTSTANDING"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SATISFIED"
  | "REJECTED"
  | "NEEDS_INFORMATION"
  | "NOT_APPLICABLE";

type ApplicationStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "NEEDS_INFORMATION"
  | "APPROVED"
  | "REJECTED"
  | "WITHDRAWN";

function getApplicationStatusLabel(
  status: ApplicationStatus | "NOT_STARTED" | "READY_FOR_REVIEW"
) {
  switch (status) {
    case "APPROVED":
      return "Approved";

    case "READY_FOR_REVIEW":
      return "Ready for review";

    case "SUBMITTED":
      return "Submitted";

    case "UNDER_REVIEW":
      return "Under review";

    case "NEEDS_INFORMATION":
      return "Information required";

    case "REJECTED":
      return "Rejected";

    case "WITHDRAWN":
      return "Withdrawn";

    case "NOT_STARTED":
      return "Not started";

    case "DRAFT":
    default:
      return "In progress";
  }
}

function getApplicationStatusClasses(
  status: ApplicationStatus | "NOT_STARTED" | "READY_FOR_REVIEW"
) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "READY_FOR_REVIEW":
    case "SUBMITTED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "UNDER_REVIEW":
      return "border-indigo-200 bg-indigo-50 text-indigo-700";

    case "NEEDS_INFORMATION":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";

    case "WITHDRAWN":
      return "border-slate-200 bg-slate-50 text-slate-600";

    case "NOT_STARTED":
      return "border-slate-200 bg-slate-50 text-slate-600";

    default:
      return "border-amber-200 bg-amber-50 text-amber-700";
  }
}

function getRequirementStatus(status: ApplicationRequirementStatus) {
  switch (status) {
    case "SATISFIED":
      return {
        label: "Satisfied",
        classes:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: <CheckCircle2 className="h-4 w-4" />,
      };

    case "NOT_APPLICABLE":
      return {
        label: "Not applicable",
        classes:
          "border-slate-200 bg-slate-50 text-slate-600",
        icon: <CheckCircle2 className="h-4 w-4" />,
      };

    case "SUBMITTED":
      return {
        label: "Evidence submitted",
        classes:
          "border-blue-200 bg-blue-50 text-blue-700",
        icon: <FileCheck2 className="h-4 w-4" />,
      };

    case "UNDER_REVIEW":
      return {
        label: "Under review",
        classes:
          "border-indigo-200 bg-indigo-50 text-indigo-700",
        icon: <Clock3 className="h-4 w-4" />,
      };

    case "REJECTED":
      return {
        label: "Rejected",
        classes:
          "border-red-200 bg-red-50 text-red-700",
        icon: <XCircle className="h-4 w-4" />,
      };

    case "NEEDS_INFORMATION":
      return {
        label: "Information required",
        classes:
          "border-amber-200 bg-amber-50 text-amber-700",
        icon: <AlertCircle className="h-4 w-4" />,
      };

    case "OUTSTANDING":
    default:
      return {
        label: "Outstanding",
        classes:
          "border-slate-200 bg-slate-50 text-slate-600",
        icon: <FileCheck2 className="h-4 w-4" />,
      };
  }
}

function getEvidenceStatus(
  status: string,
  expiryDate: Date | null
) {
  if (
    expiryDate &&
    expiryDate.getTime() < Date.now() &&
    status !== "REJECTED"
  ) {
    return {
      label: "Expired",
      classes:
        "border-red-200 bg-red-50 text-red-700",
    };
  }

  switch (status) {
    case "ACCEPTED":
      return {
        label: "Accepted",
        classes:
          "border-emerald-200 bg-emerald-50 text-emerald-700",
      };

    case "REJECTED":
      return {
        label: "Rejected",
        classes:
          "border-red-200 bg-red-50 text-red-700",
      };

    case "EXPIRED":
      return {
        label: "Expired",
        classes:
          "border-red-200 bg-red-50 text-red-700",
      };

    case "PENDING":
    default:
      return {
        label: "Pending verification",
        classes:
          "border-blue-200 bg-blue-50 text-blue-700",
      };
  }
}

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-UG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getDaysUntilExpiry(date: Date) {
  return Math.ceil(
    (date.getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );
}

export default async function VendorOnboardingStatusPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  if (session.user.role !== "VENDOR") {
    return null;
  }

  const [vendor, application] = await Promise.all([
    prisma.vendor.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        companyName: true,
        legalName: true,
        email: true,
        registrationNumber: true,
        taxNumber: true,
        verifiedAt: true,

        documents: {
          orderBy: {
            uploadedAt: "desc",
          },
          select: {
            id: true,
            name: true,
            category: true,
            status: true,
            uploadedAt: true,
            expiryDate: true,
            rejectionReason: true,
          },
        },
      },
    }),

    prisma.vendorApplication.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        reviewedAt: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        adminNotes: true,
        createdAt: true,

        requirements: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            requirementId: true,
            code: true,
            name: true,
            description: true,
            category: true,
            required: true,
            status: true,
            notes: true,
            reviewedAt: true,

            requirement: {
              select: {
                id: true,
                code: true,
                name: true,
                description: true,
                required: true,
                active: true,
                validityDays: true,
                allowedDocumentCategories: true,
              },
            },

            evidence: {
              orderBy: {
                uploadedAt: "desc",
              },
              select: {
                id: true,
                name: true,
                category: true,
                fileUrl: true,
                status: true,
                issuedAt: true,
                expiryDate: true,
                rejectionReason: true,
                uploadedAt: true,
                reviewedAt: true,
              },
            },
          },
        },

        evidence: {
          orderBy: {
            uploadedAt: "desc",
          },
          select: {
            id: true,
            name: true,
            category: true,
            status: true,
            issuedAt: true,
            expiryDate: true,
            rejectionReason: true,
            uploadedAt: true,
            reviewedAt: true,
          },
        },
      },
    }),
  ]);

  if (!vendor) {
    return (
      <main className="space-y-6">
        <Card className="p-8">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-slate-400" />

            <h1 className="mt-4 text-xl font-semibold text-slate-950">
              Vendor profile required
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
              Complete your vendor profile before continuing with TenderHub
              vendor onboarding.
            </p>

            <Link
              href="/dashboard/vendor/profile"
              className="mt-5 inline-flex items-center rounded-lg bg-[#071A33] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0b2748]"
            >
              Complete vendor profile
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  const requirements = application?.requirements ?? [];

  const activeRequirements = requirements.filter(
    (record) => record.requirement.active
  );

  const requiredRequirements = activeRequirements.filter(
    (record) =>
      record.required && record.requirement.required
  );

  const satisfiedRequired = requiredRequirements.filter(
    (record) =>
      record.status === "SATISFIED" ||
      record.status === "NOT_APPLICABLE"
  );

  const rejectedRequired = requiredRequirements.filter(
    (record) => record.status === "REJECTED"
  );

  const needsInformationRequired =
    requiredRequirements.filter(
      (record) => record.status === "NEEDS_INFORMATION"
    );

  const underReviewRequired = requiredRequirements.filter(
    (record) => record.status === "UNDER_REVIEW"
  );

  const submittedRequired = requiredRequirements.filter(
    (record) => record.status === "SUBMITTED"
  );

  const outstandingRequired = requiredRequirements.filter(
    (record) => record.status === "OUTSTANDING"
  );

  const completionPercentage =
    requiredRequirements.length > 0
      ? Math.round(
          (satisfiedRequired.length /
            requiredRequirements.length) *
            100
        )
      : 0;

  const profileComplete =
    Boolean(vendor.companyName) &&
    Boolean(vendor.email) &&
    Boolean(vendor.registrationNumber) &&
    Boolean(vendor.taxNumber);

  const applicationReadyForReview =
    Boolean(application) &&
    profileComplete &&
    requiredRequirements.length > 0 &&
    satisfiedRequired.length ===
      requiredRequirements.length;

  let onboardingStatus:
    | ApplicationStatus
    | "NOT_STARTED"
    | "READY_FOR_REVIEW";

  if (vendor.verifiedAt) {
    onboardingStatus = "APPROVED";
  } else if (applicationReadyForReview) {
    onboardingStatus = "READY_FOR_REVIEW";
  } else if (application) {
    onboardingStatus = application.status;
  } else {
    onboardingStatus = "NOT_STARTED";
  }

  const applicationStatusLabel =
    getApplicationStatusLabel(onboardingStatus);

  const evidenceCount = vendor.documents.length;

  const acceptedEvidence = application
    ? application.evidence.filter(
        (item) => item.status === "ACCEPTED"
      ).length
    : 0;

  const pendingEvidence = application
    ? application.evidence.filter(
        (item) => item.status === "PENDING"
      ).length
    : 0;

  const rejectedEvidence = application
    ? application.evidence.filter(
        (item) => item.status === "REJECTED"
      ).length
    : 0;

  const expiredEvidence = application
    ? application.evidence.filter((item) => {
        if (!item.expiryDate) return false;

        return item.expiryDate.getTime() < Date.now();
      }).length
    : 0;

  const actionRequiredCount =
    rejectedRequired.length +
    needsInformationRequired.length +
    outstandingRequired.length;

  return (
    <main className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/vendor/onboarding"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Vendor onboarding
        </Link>

        <div className="mt-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                Onboarding Status
              </h1>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Track your TenderHub vendor approval progress, submitted
                evidence, requirement decisions and outstanding actions.
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-sm font-medium ${getApplicationStatusClasses(
                onboardingStatus
              )}`}
            >
              {onboardingStatus === "APPROVED" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : onboardingStatus === "READY_FOR_REVIEW" ? (
                <ShieldCheck className="h-4 w-4" />
              ) : onboardingStatus === "REJECTED" ? (
                <XCircle className="h-4 w-4" />
              ) : onboardingStatus === "NEEDS_INFORMATION" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}

              {applicationStatusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Approved banner */}
      {vendor.verifiedAt && (
        <Card className="border-emerald-200 bg-emerald-50 p-6">
          <div className="flex gap-4">
            <div className="rounded-full bg-white p-2">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>

            <div>
              <h2 className="font-semibold text-emerald-900">
                Your vendor account has been approved
              </h2>

              <p className="mt-1 text-sm leading-6 text-emerald-800">
                TenderHub has completed your vendor onboarding approval.
                You can now participate in procurement opportunities subject
                to the requirements of each individual solicitation.
              </p>

              <p className="mt-2 text-xs text-emerald-700">
                Approved on {formatDate(vendor.verifiedAt)}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Application information */}
      {application?.status === "NEEDS_INFORMATION" && (
        <Card className="border-amber-200 bg-amber-50 p-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <div>
              <h2 className="font-semibold text-amber-900">
                Additional information is required
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                TenderHub administrators have requested additional
                information or corrections before your application can
                proceed.
              </p>

              {application.adminNotes && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                    Administrator note
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {application.adminNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Rejected application */}
      {application?.status === "REJECTED" && (
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div>
              <h2 className="font-semibold text-red-900">
                Vendor application rejected
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-800">
                Your TenderHub vendor application was not approved.
                Review the reason below and follow the available onboarding
                instructions.
              </p>

              {application.rejectionReason && (
                <div className="mt-3 rounded-lg border border-red-200 bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                    Rejection reason
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {application.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* No application */}
      {!application && (
        <Card className="border-blue-200 bg-blue-50 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />

              <div>
                <h2 className="font-semibold text-blue-900">
                  Vendor onboarding has not started
                </h2>

                <p className="mt-1 text-sm leading-6 text-blue-800">
                  Complete your vendor onboarding application and provide
                  the required evidence for TenderHub administrator review.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/vendor/onboarding"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#071A33] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0b2748]"
            >
              Start onboarding
            </Link>
          </div>
        </Card>
      )}

      {/* Progress */}
      <Card className="p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              TenderHub vendor approval
            </p>

            <h2 className="mt-1 text-lg font-semibold text-slate-950">
              {vendor.companyName ||
                vendor.legalName ||
                "Vendor"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {satisfiedRequired.length} of{" "}
              {requiredRequirements.length} required requirements
              satisfied.
            </p>

            {application?.submittedAt && (
              <p className="mt-1 text-xs text-slate-400">
                Application submitted on{" "}
                {formatDate(application.submittedAt)}
              </p>
            )}
          </div>

          <div className="w-full max-w-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Completion
              </span>

              <span className="text-sm font-semibold text-slate-950">
                {completionPercentage}%
              </span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#D4AF37] transition-all"
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Required
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {requiredRequirements.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Satisfied
          </p>

          <p className="mt-1 text-2xl font-semibold text-emerald-700">
            {satisfiedRequired.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Under review
          </p>

          <p className="mt-1 text-2xl font-semibold text-blue-700">
            {underReviewRequired.length +
              submittedRequired.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Action required
          </p>

          <p className="mt-1 text-2xl font-semibold text-red-700">
            {actionRequiredCount}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Documents
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {evidenceCount}
          </p>
        </Card>
      </div>

      {/* Evidence summary */}
      {application && (
        <Card className="p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-semibold text-slate-950">
                Evidence overview
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Evidence is reviewed by TenderHub administrators. Uploading
                a document does not automatically satisfy a requirement.
              </p>
            </div>

            <Link
              href="/dashboard/vendor/onboarding/documents"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <FileCheck2 className="h-4 w-4" />
              Manage evidence
            </Link>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Accepted
              </p>

              <p className="mt-1 text-xl font-semibold text-emerald-700">
                {acceptedEvidence}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Pending verification
              </p>

              <p className="mt-1 text-xl font-semibold text-blue-700">
                {pendingEvidence}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Rejected
              </p>

              <p className="mt-1 text-xl font-semibold text-red-700">
                {rejectedEvidence}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Expired
              </p>

              <p className="mt-1 text-xl font-semibold text-red-700">
                {expiredEvidence}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Profile check */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-950">
              Vendor profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Core registration information required for TenderHub approval.
            </p>
          </div>

          {profileComplete ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
              <AlertCircle className="h-3.5 w-3.5" />
              Incomplete
            </span>
          )}
        </div>

        {!profileComplete && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm leading-6 text-amber-800">
              Your company name, email, registration number and tax number
              should be completed before the application can be approved.
            </p>

            <Link
              href="/dashboard/vendor/profile"
              className="mt-3 inline-flex items-center text-sm font-medium text-amber-900 underline underline-offset-4"
            >
              Update vendor profile
            </Link>
          </div>
        )}
      </Card>

      {/* Requirements */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-950">
            Requirement status
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current status of the TenderHub requirements associated with your
            vendor application.
          </p>
        </div>

        {!application ? (
          <div className="px-6 py-12 text-center">
            <FileCheck2 className="mx-auto h-9 w-9 text-slate-400" />

            <h3 className="mt-3 font-semibold text-slate-950">
              No application yet
            </h3>

            <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
              Your TenderHub onboarding requirements will appear here once
              your vendor application has been initialized.
            </p>
          </div>
        ) : activeRequirements.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileCheck2 className="mx-auto h-9 w-9 text-slate-400" />

            <h3 className="mt-3 font-semibold text-slate-950">
              No requirements initialized
            </h3>

            <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
              Your onboarding requirements have not yet been initialized for
              this application.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {activeRequirements.map((record) => {
              const status = getRequirementStatus(
                record.status as ApplicationRequirementStatus
              );

              const latestEvidence =
                record.evidence[0] ?? null;

              const evidenceStatus = latestEvidence
                ? getEvidenceStatus(
                    latestEvidence.status,
                    latestEvidence.expiryDate
                  )
                : null;

              const isExpiringSoon =
                latestEvidence?.expiryDate &&
                latestEvidence.expiryDate.getTime() >=
                  Date.now() &&
                getDaysUntilExpiry(
                  latestEvidence.expiryDate
                ) <= 30;

              return (
                <div
                  key={record.id}
                  className="px-6 py-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-slate-950">
                          {record.name}
                        </h3>

                        {record.required && (
                          <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                            Required
                          </span>
                        )}

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.classes}`}
                        >
                          {status.icon}
                          {status.label}
                        </span>
                      </div>

                      <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                        {record.code}
                      </p>

                      {record.description && (
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                          {record.description}
                        </p>
                      )}

                      {record.notes && (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Review note
                          </p>

                          <p className="mt-1 text-sm leading-6 text-slate-700">
                            {record.notes}
                          </p>
                        </div>
                      )}

                      {latestEvidence && (
                        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Evidence received
                              </p>

                              <p className="mt-1 text-sm font-medium text-slate-900">
                                {latestEvidence.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Uploaded{" "}
                                {formatDate(
                                  latestEvidence.uploadedAt
                                )}
                              </p>
                            </div>

                            {evidenceStatus && (
                              <span
                                className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium ${evidenceStatus.classes}`}
                              >
                                {isExpiringSoon
                                  ? "Expiring soon"
                                  : evidenceStatus.label}
                              </span>
                            )}
                          </div>

                          {latestEvidence.expiryDate && (
                            <p
                              className={`mt-2 text-xs ${
                                isExpiringSoon ||
                                latestEvidence.expiryDate.getTime() <
                                  Date.now()
                                  ? "font-medium text-red-600"
                                  : "text-slate-500"
                              }`}
                            >
                              Expires{" "}
                              {formatDate(
                                latestEvidence.expiryDate
                              )}
                            </p>
                          )}

                          {latestEvidence.rejectionReason && (
                            <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                              <p className="text-xs font-medium text-red-800">
                                {latestEvidence.rejectionReason}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {!latestEvidence &&
                        record.status === "OUTSTANDING" && (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-sm text-amber-800">
                              Evidence is required for this onboarding
                              requirement.
                            </p>
                          </div>
                        )}

                      {record.reviewedAt && (
                        <p className="mt-2 text-xs text-slate-400">
                          Last reviewed:{" "}
                          {formatDate(record.reviewedAt)}
                        </p>
                      )}
                    </div>

                    <Link
                      href={`/dashboard/vendor/compliance/${record.id}`}
                      className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <FileCheck2 className="h-4 w-4" />
                      View requirement
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Action guidance */}
      {!vendor.verifiedAt && (
        <Card className="border-slate-200 bg-slate-50 p-6">
          <div className="flex gap-3">
            {rejectedRequired.length > 0 ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            ) : needsInformationRequired.length > 0 ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            ) : outstandingRequired.length > 0 ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            ) : underReviewRequired.length > 0 ||
              submittedRequired.length > 0 ? (
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            ) : (
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            )}

            <div>
              <h2 className="font-semibold text-slate-950">
                {rejectedRequired.length > 0
                  ? "Action required"
                  : needsInformationRequired.length > 0
                    ? "Additional information required"
                    : outstandingRequired.length > 0
                      ? "Complete your evidence"
                      : underReviewRequired.length > 0 ||
                          submittedRequired.length > 0
                        ? "Your evidence is being reviewed"
                        : applicationReadyForReview
                          ? "Your onboarding is ready for review"
                          : "Continue your onboarding"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {rejectedRequired.length > 0
                  ? "One or more required requirements were rejected. Review the affected requirements and submit corrected evidence where necessary."
                  : needsInformationRequired.length > 0
                    ? "TenderHub administrators have requested additional information or clarification. Review the affected requirements and provide the requested evidence."
                    : outstandingRequired.length > 0
                      ? "Submit the outstanding evidence required for your TenderHub vendor approval."
                      : underReviewRequired.length > 0 ||
                          submittedRequired.length > 0
                        ? "TenderHub administrators are reviewing your submitted evidence. No further action may be required unless additional information is requested."
                        : applicationReadyForReview
                          ? "Your required onboarding requirements have been satisfied. TenderHub administrators can now complete the approval decision."
                          : "Continue completing your vendor profile and onboarding requirements."}
              </p>

              {(outstandingRequired.length > 0 ||
                rejectedRequired.length > 0 ||
                needsInformationRequired.length > 0) && (
                <Link
                  href="/dashboard/vendor/onboarding/documents"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#071A33] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0b2748]"
                >
                  <FileCheck2 className="h-4 w-4" />
                  Manage evidence
                </Link>
              )}
            </div>
          </div>
        </Card>
      )}
    </main>
  );
}