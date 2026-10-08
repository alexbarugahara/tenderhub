import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldAlert,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

type VendorComplianceDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-UG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-UG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatValue(value: string) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRequirementStatusClasses(status: string) {
  switch (status) {
    case "SATISFIED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "NOT_APPLICABLE":
      return "bg-slate-100 text-slate-700 border-slate-200";

    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";

    case "NEEDS_INFORMATION":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "UNDER_REVIEW":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "SUBMITTED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "OUTSTANDING":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function getEvidenceStatusClasses(status: string) {
  switch (status) {
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "REJECTED":
      return "bg-red-50 text-red-700 border-red-200";

    case "EXPIRED":
      return "bg-orange-50 text-orange-700 border-orange-200";

    case "PENDING":
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

function getRequirementStatusMessage(status: string) {
  switch (status) {
    case "SATISFIED":
      return "TenderHub has reviewed this requirement and marked it as satisfied.";

    case "NOT_APPLICABLE":
      return "This requirement has been marked as not applicable to this vendor.";

    case "REJECTED":
      return "The submitted evidence or information does not currently satisfy this requirement.";

    case "NEEDS_INFORMATION":
      return "TenderHub requires additional information or evidence before this requirement can be satisfied.";

    case "UNDER_REVIEW":
      return "The submitted requirement is currently being reviewed by TenderHub.";

    case "SUBMITTED":
      return "The vendor has submitted information or evidence and it is awaiting administrative review.";

    case "OUTSTANDING":
    default:
      return "The vendor has not yet satisfied this onboarding requirement.";
  }
}

export default async function VendorComplianceDetailPage({
  params,
}: VendorComplianceDetailPageProps) {
  const { id } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  /*
   * The URL id is now the VendorApplicationRequirement id.
   *
   * We first resolve the requirement and then verify that it belongs
   * to the currently authenticated vendor.
   */
  const requirement = await prisma.vendorApplicationRequirement.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      applicationId: true,
      requirementId: true,
      code: true,
      name: true,
      description: true,
      category: true,
      required: true,
      status: true,
      notes: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,

      requirement: {
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          category: true,
          required: true,
          validityDays: true,
          active: true,
          allowedDocumentCategories: true,
          createdAt: true,
          updatedAt: true,
        },
      },

      application: {
        select: {
          id: true,
          userId: true,
          status: true,
          companyName: true,
          submittedAt: true,
          reviewedAt: true,
          approvedAt: true,
          rejectedAt: true,
          rejectionReason: true,
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
          mimeType: true,
          fileSize: true,
          status: true,
          issuedAt: true,
          expiryDate: true,
          rejectionReason: true,
          uploadedAt: true,
          reviewedAt: true,
        },
      },
    },
  });

  if (!requirement) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Requirement Not Found
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                The requested vendor onboarding requirement could not be
                found.
              </p>

              <Link
                href="/dashboard/vendor/compliance"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Compliance
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /*
   * Vendors may only view requirements belonging to their own application.
   */
  if (requirement.application.userId !== session.user.id) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-red-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Access Denied
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                You are not authorized to view this vendor onboarding
                requirement.
              </p>

              <Link
                href="/dashboard/vendor/compliance"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Compliance
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const status = String(requirement.status).toUpperCase();

  const now = new Date();

  const acceptedEvidence = requirement.evidence.filter(
    (evidence) => evidence.status === "ACCEPTED",
  );

  const latestAcceptedEvidence = acceptedEvidence[0] ?? null;

  const isEvidenceExpired =
    !!latestAcceptedEvidence?.expiryDate &&
    latestAcceptedEvidence.expiryDate.getTime() < now.getTime();

  const daysUntilExpiry = latestAcceptedEvidence?.expiryDate
    ? Math.ceil(
        (latestAcceptedEvidence.expiryDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const isExpiringSoon =
    daysUntilExpiry !== null &&
    daysUntilExpiry >= 0 &&
    daysUntilExpiry <= 30;

  const statusClasses = getRequirementStatusClasses(status);

  const expiryClasses = isEvidenceExpired
    ? "bg-red-50 text-red-700 border-red-200"
    : isExpiringSoon
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-emerald-50 text-emerald-700 border-emerald-200";

  const statusIsSatisfied =
    status === "SATISFIED" || status === "NOT_APPLICABLE";

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* HEADER */}
        <div>
          <Link
            href="/dashboard/vendor/compliance"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Compliance
          </Link>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${statusClasses}`}
                >
                  {formatValue(status)}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {formatValue(String(requirement.category))}
                </span>

                {requirement.required && (
                  <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
                    Required
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                {requirement.name}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {requirement.application.companyName ||
                  "Vendor onboarding application"}
              </p>
            </div>

            <div
              className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${statusClasses}`}
            >
              {statusIsSatisfied ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <ShieldAlert className="h-5 w-5" />
              )}

              {formatValue(status)}
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* REQUIREMENT */}
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Onboarding Requirement
                </h2>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Requirement
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {requirement.name}
                  </p>
                </div>

                {requirement.description && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Description
                    </p>

                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {requirement.description}
                    </p>
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Category
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatValue(String(requirement.category))}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Required
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {requirement.required ? "Yes" : "No"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Requirement Status
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {requirement.requirement.active
                        ? "Active"
                        : "Inactive"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Requirement Code
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {requirement.code}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Validity Period
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {requirement.requirement.validityDays
                        ? `${requirement.requirement.validityDays} days`
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                {requirement.requirement.allowedDocumentCategories.length >
                  0 && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Accepted Evidence Categories
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {requirement.requirement.allowedDocumentCategories.map(
                        (category) => (
                          <span
                            key={String(category)}
                            className="rounded-md bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600"
                          >
                            {formatValue(String(category))}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* STATUS */}
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Verification Status
                </h2>
              </div>

              <div className="p-6">
                <div className="flex items-start gap-3">
                  {statusIsSatisfied ? (
                    <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="mt-0.5 h-6 w-6 text-amber-600" />
                  )}

                  <div>
                    <p className="font-semibold text-slate-900">
                      {formatValue(status)}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {getRequirementStatusMessage(status)}
                    </p>
                  </div>
                </div>

                {requirement.notes && (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Review Notes
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                      {requirement.notes}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* EVIDENCE */}
            <Card>
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Verification Evidence
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Documents submitted in support of this requirement.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {requirement.evidence.length}{" "}
                    {requirement.evidence.length === 1
                      ? "item"
                      : "items"}
                  </span>
                </div>
              </div>

              {requirement.evidence.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="mx-auto h-10 w-10 text-slate-300" />

                  <h3 className="mt-3 text-sm font-semibold text-slate-900">
                    No evidence submitted
                  </h3>

                  <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">
                    No supporting document has been submitted for this
                    onboarding requirement.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {requirement.evidence.map((evidence) => (
                    <div
                      key={evidence.id}
                      className="p-6"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <FileText className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {evidence.name}
                            </h3>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatValue(String(evidence.category))}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                              <span>
                                Uploaded:{" "}
                                <strong className="font-medium text-slate-700">
                                  {formatDate(evidence.uploadedAt)}
                                </strong>
                              </span>

                              <span>
                                Expires:{" "}
                                <strong className="font-medium text-slate-700">
                                  {formatDate(evidence.expiryDate)}
                                </strong>
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`w-fit rounded-full border px-3 py-1 text-xs font-medium ${getEvidenceStatusClasses(
                            String(evidence.status),
                          )}`}
                        >
                          {formatValue(String(evidence.status))}
                        </span>
                      </div>

                      {evidence.rejectionReason && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
                          <p className="text-xs font-semibold text-red-800">
                            Rejection reason
                          </p>

                          <p className="mt-1 text-sm leading-6 text-red-700">
                            {evidence.rejectionReason}
                          </p>
                        </div>
                      )}

                      {evidence.reviewedAt && (
                        <p className="mt-3 text-xs text-slate-500">
                          Reviewed on {formatDateTime(evidence.reviewedAt)}
                        </p>
                      )}

                      <Link
                        href={`/dashboard/vendor/documents?fileUrl=${encodeURIComponent(
                          evidence.fileUrl,
                        )}`}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-tenderhub-navy hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        View supporting document
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* DATES */}
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Verification Timeline
                </h2>
              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Submitted
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatDate(requirement.application.submittedAt)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Reviewed
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatDate(requirement.reviewedAt)}
                  </p>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-slate-400" />

                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Created
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-medium text-slate-900">
                    {formatDate(requirement.createdAt)}
                  </p>
                </div>
              </div>
            </Card>

            {/* EVIDENCE EXPIRY */}
            {latestAcceptedEvidence?.expiryDate && (
              <Card>
                <div className="border-b border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-900">
                    Evidence Validity
                  </h2>
                </div>

                <div className="p-6">
                  <div
                    className={`rounded-xl border p-4 ${expiryClasses}`}
                  >
                    <div className="flex items-start gap-3">
                      {isEvidenceExpired ? (
                        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
                      ) : isExpiringSoon ? (
                        <Clock3 className="mt-0.5 h-5 w-5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                      )}

                      <div>
                        <p className="text-sm font-semibold">
                          {isEvidenceExpired
                            ? "Accepted evidence has expired."
                            : isExpiringSoon
                              ? `Accepted evidence expires in ${daysUntilExpiry} day${
                                  daysUntilExpiry === 1 ? "" : "s"
                                }.`
                              : "Accepted evidence is currently within its validity period."}
                        </p>

                        <p className="mt-1 text-xs">
                          Expiry date:{" "}
                          {formatDate(latestAcceptedEvidence.expiryDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-6">
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Application
                </h2>
              </div>

              <div className="p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Application Status
                </p>

                <span
                  className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getRequirementStatusClasses(
                    requirement.application.status,
                  )}`}
                >
                  {formatValue(requirement.application.status)}
                </span>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">
                      Submitted
                    </span>

                    <span className="font-medium text-slate-900">
                      {formatDate(requirement.application.submittedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">
                      Reviewed
                    </span>

                    <span className="font-medium text-slate-900">
                      {formatDate(requirement.application.reviewedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">
                      Approved
                    </span>

                    <span className="font-medium text-slate-900">
                      {formatDate(requirement.application.approvedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Vendor
                </h2>
              </div>

              <div className="p-6">
                <p className="font-medium text-slate-900">
                  {requirement.application.companyName ||
                    "Vendor application"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Application ID: {requirement.application.id}
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Last Updated
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {formatDateTime(requirement.updatedAt)}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}