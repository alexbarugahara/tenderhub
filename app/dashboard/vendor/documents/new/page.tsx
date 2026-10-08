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

function getApplicationStatusLabel(status: string) {
  switch (status) {
    case "APPROVED":
      return "Approved";

    case "UNDER_REVIEW":
      return "Under review";

    case "NEEDS_INFORMATION":
      return "Information required";

    case "SUBMITTED":
      return "Submitted";

    case "REJECTED":
      return "Rejected";

    case "WITHDRAWN":
      return "Withdrawn";

    case "DRAFT":
    default:
      return "Draft";
  }
}

function getApplicationStatusClasses(status: string) {
  switch (status) {
    case "APPROVED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "UNDER_REVIEW":
    case "SUBMITTED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    case "NEEDS_INFORMATION":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getRequirementStatus(status: string) {
  switch (status) {
    case "SATISFIED":
      return {
        label: "Verified",
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

    case "REJECTED":
      return {
        label: "Requires correction",
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

    case "UNDER_REVIEW":
      return {
        label: "Under review",
        classes:
          "border-blue-200 bg-blue-50 text-blue-700",
        icon: <Clock3 className="h-4 w-4" />,
      };

    case "SUBMITTED":
      return {
        label: "Evidence submitted",
        classes:
          "border-blue-200 bg-blue-50 text-blue-700",
        icon: <FileCheck2 className="h-4 w-4" />,
      };

    case "OUTSTANDING":
    default:
      return {
        label: "Evidence required",
        classes:
          "border-slate-200 bg-slate-50 text-slate-600",
        icon: <FileCheck2 className="h-4 w-4" />,
      };
  }
}

function getEvidenceStatusLabel(status: string) {
  switch (status) {
    case "ACCEPTED":
      return "Accepted";

    case "REJECTED":
      return "Rejected";

    case "EXPIRED":
      return "Expired";

    case "PENDING":
    default:
      return "Pending verification";
  }
}

function getEvidenceStatusClasses(status: string) {
  switch (status) {
    case "ACCEPTED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";

    case "EXPIRED":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "PENDING":
    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
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

export default async function VendorOnboardingStatusPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  if (session.user.role !== "VENDOR") {
    return null;
  }

  const vendor = await prisma.vendor.findUnique({
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
          fileUrl: true,
        },
      },
    },
  });

  if (!vendor) {
    return (
      <main className="space-y-6">
        <Card className="p-8">
          <div className="text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-slate-400" />

            <h1 className="mt-4 text-xl font-semibold text-slate-950">
              Vendor profile required
            </h1>

            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
              Complete your vendor profile before starting onboarding.
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

  /*
   * VendorApplication is now the authoritative onboarding record.
   *
   * VendorApplicationRequirement contains the status of each
   * requirement for this particular application.
   *
   * VendorApplicationEvidence contains the submitted evidence.
   */
  const application =
    await prisma.vendorApplication.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        status: true,
        companyName: true,
        legalName: true,
        registrationNumber: true,
        taxNumber: true,
        submittedAt: true,
        reviewedAt: true,
        approvedAt: true,
        rejectedAt: true,
        adminNotes: true,
        rejectionReason: true,

        requirements: {
          orderBy: [
            {
              required: "desc",
            },
            {
              name: "asc",
            },
          ],
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
      },
    });

  if (!application) {
    return (
      <main className="space-y-6">
        <div>
          <Link
            href="/dashboard/vendor/onboarding"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Vendor onboarding
          </Link>

          <div className="mt-4">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
              Onboarding Status
            </h1>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Track your TenderHub vendor approval progress,
              submitted evidence and outstanding requirements.
            </p>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50 p-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

            <div>
              <h2 className="font-semibold text-amber-900">
                Vendor onboarding has not started
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Your TenderHub vendor application has not been
                created yet. Start the onboarding process to submit
                your business information and verification evidence.
              </p>

              <Link
                href="/dashboard/vendor/onboarding"
                className="mt-4 inline-flex items-center rounded-lg bg-[#071A33] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0b2748]"
              >
                Start vendor onboarding
              </Link>
            </div>
          </div>
        </Card>
      </main>
    );
  }

  const activeRecords =
    application.requirements.filter(
      (record) => record.requirement.active,
    );

  const requiredRecords =
    activeRecords.filter(
      (record) => record.required,
    );

  const satisfiedRequired =
    requiredRecords.filter(
      (record) =>
        record.status === "SATISFIED" ||
        record.status === "NOT_APPLICABLE",
    );

  const failedRequired =
    requiredRecords.filter(
      (record) =>
        record.status === "REJECTED",
    );

  const informationRequired =
    requiredRecords.filter(
      (record) =>
        record.status === "NEEDS_INFORMATION",
    );

  const pendingRequired =
    requiredRecords.filter(
      (record) =>
        record.status === "SUBMITTED" ||
        record.status === "UNDER_REVIEW",
    );

  const missingRequired =
    requiredRecords.filter(
      (record) =>
        record.status === "OUTSTANDING",
    );

  const expiredEvidence =
    requiredRecords.filter((record) =>
      record.evidence.some(
        (evidence) =>
          evidence.status === "EXPIRED",
      ),
    );

  const completionPercentage =
    requiredRecords.length > 0
      ? Math.round(
          (satisfiedRequired.length /
            requiredRecords.length) *
            100,
        )
      : 0;

  const profileComplete =
    Boolean(
      application.companyName ||
        vendor.companyName,
    ) &&
    Boolean(vendor.email) &&
    Boolean(
      application.registrationNumber ||
        vendor.registrationNumber,
    ) &&
    Boolean(
      application.taxNumber ||
        vendor.taxNumber,
    );

  const applicationReadyForApproval =
    profileComplete &&
    requiredRecords.length > 0 &&
    satisfiedRequired.length ===
      requiredRecords.length &&
    failedRequired.length === 0 &&
    informationRequired.length === 0 &&
    missingRequired.length === 0 &&
    pendingRequired.length === 0;

  const applicationStatusLabel =
    getApplicationStatusLabel(
      application.status,
    );

  const applicationStatusClasses =
    getApplicationStatusClasses(
      application.status,
    );

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
                Track your TenderHub vendor approval progress,
                submitted evidence and outstanding requirements.
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-2 self-start rounded-full border px-3 py-1.5 text-sm font-medium ${applicationStatusClasses}`}
            >
              {application.status === "APPROVED" ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : application.status === "NEEDS_INFORMATION" ? (
                <AlertCircle className="h-4 w-4" />
              ) : application.status === "REJECTED" ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <Clock3 className="h-4 w-4" />
              )}

              {applicationStatusLabel}
            </span>
          </div>
        </div>
      </div>

      {/* Approved banner */}
      {vendor.verifiedAt &&
        application.status === "APPROVED" && (
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
                  TenderHub has completed your vendor onboarding
                  approval. You can now participate in procurement
                  opportunities subject to the requirements of each
                  individual solicitation.
                </p>

                <p className="mt-2 text-xs text-emerald-700">
                  Approved on{" "}
                  {formatDate(
                    application.approvedAt ||
                      vendor.verifiedAt,
                  )}
                </p>
              </div>
            </div>
          </Card>
        )}

      {/* Information requested */}
      {application.status ===
        "NEEDS_INFORMATION" && (
        <Card className="border-amber-200 bg-amber-50 p-6">
          <div className="flex gap-4">
            <AlertCircle className="mt-0.5 h-6 w-6 shrink-0 text-amber-700" />

            <div>
              <h2 className="font-semibold text-amber-900">
                Additional information is required
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                TenderHub administration has requested additional
                information before your vendor application can be
                completed.
              </p>

              {application.adminNotes && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-white/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                    Administrator note
                  </p>

                  <p className="mt-1 text-sm leading-6 text-amber-900">
                    {application.adminNotes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Rejected banner */}
      {application.status === "REJECTED" && (
        <Card className="border-red-200 bg-red-50 p-6">
          <div className="flex gap-4">
            <XCircle className="mt-0.5 h-6 w-6 shrink-0 text-red-700" />

            <div>
              <h2 className="font-semibold text-red-900">
                Vendor application rejected
              </h2>

              <p className="mt-1 text-sm leading-6 text-red-800">
                Your vendor application was not approved by
                TenderHub administration.
              </p>

              {application.rejectionReason && (
                <div className="mt-3 rounded-lg border border-red-200 bg-white/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
                    Reason
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-900">
                    {application.rejectionReason}
                  </p>
                </div>
              )}
            </div>
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
              {application.companyName ||
                application.legalName ||
                vendor.companyName ||
                vendor.legalName ||
                "Vendor"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {satisfiedRequired.length} of{" "}
              {requiredRecords.length} required
              requirements satisfied.
            </p>
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Required
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {requiredRecords.length}
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
            Pending review
          </p>

          <p className="mt-1 text-2xl font-semibold text-blue-700">
            {pendingRequired.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Information required
          </p>

          <p className="mt-1 text-2xl font-semibold text-amber-700">
            {informationRequired.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Action required
          </p>

          <p className="mt-1 text-2xl font-semibold text-red-700">
            {failedRequired.length +
              missingRequired.length}
          </p>
        </Card>

        <Card className="p-5">
          <p className="text-sm text-slate-500">
            Documents
          </p>

          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {vendor.documents.length}
          </p>
        </Card>
      </div>

      {/* Profile check */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold text-slate-950">
              Vendor profile
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Core registration information required for TenderHub
              approval.
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
              Your company name, email, registration number and
              tax number should be completed before the application
              can be approved.
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
            Current status of the TenderHub requirements associated
            with your vendor onboarding application.
          </p>
        </div>

        {activeRecords.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileCheck2 className="mx-auto h-9 w-9 text-slate-400" />

            <h3 className="mt-3 font-semibold text-slate-950">
              No requirements initialized
            </h3>

            <p className="mx-auto mt-1 max-w-lg text-sm text-slate-500">
              Your onboarding requirements will appear here after
              the onboarding application has been initialized.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {activeRecords.map((record) => {
              const status =
                getRequirementStatus(
                  record.status,
                );

              const latestEvidence =
                record.evidence[0] ?? null;

              return (
                <div
                  key={record.id}
                  className="px-6 py-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
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
                        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                            Review note
                          </p>

                          <p className="mt-1 text-sm leading-6 text-amber-900">
                            {record.notes}
                          </p>
                        </div>
                      )}

                      {latestEvidence && (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                          <div className="flex items-start gap-3">
                            <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-slate-800">
                                  Evidence received
                                </p>

                                <span
                                  className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${getEvidenceStatusClasses(
                                    latestEvidence.status,
                                  )}`}
                                >
                                  {getEvidenceStatusLabel(
                                    latestEvidence.status,
                                  )}
                                </span>
                              </div>

                              <p className="mt-1 text-xs text-slate-500">
                                {latestEvidence.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-400">
                                Submitted{" "}
                                {formatDate(
                                  latestEvidence.uploadedAt,
                                )}
                              </p>

                              {latestEvidence.expiryDate && (
                                <p className="mt-1 text-xs text-slate-400">
                                  Expires{" "}
                                  {formatDate(
                                    latestEvidence.expiryDate,
                                  )}
                                </p>
                              )}

                              {latestEvidence.rejectionReason && (
                                <p className="mt-2 text-xs leading-5 text-red-700">
                                  Reason:{" "}
                                  {
                                    latestEvidence.rejectionReason
                                  }
                                </p>
                              )}

                              <p className="mt-2 text-xs leading-5 text-slate-500">
                                Evidence received does not mean the
                                requirement has passed. TenderHub
                                administration must review it.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {record.reviewedAt && (
                        <p className="mt-2 text-xs text-slate-400">
                          Last reviewed:{" "}
                          {formatDate(record.reviewedAt)}
                        </p>
                      )}
                    </div>

                    <span
                      className={`inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border px-2.5 py-1 text-xs font-medium ${status.classes}`}
                    >
                      {status.icon}
                      {status.label}
                    </span>
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
            {failedRequired.length > 0 ||
            informationRequired.length > 0 ? (
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            ) : missingRequired.length > 0 ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            ) : pendingRequired.length > 0 ? (
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            ) : applicationReadyForApproval ? (
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            ) : (
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" />
            )}

            <div>
              <h2 className="font-semibold text-slate-950">
                {failedRequired.length > 0
                  ? "Action required"
                  : informationRequired.length > 0
                    ? "Additional information required"
                    : missingRequired.length > 0
                      ? "Complete your evidence"
                      : pendingRequired.length > 0
                        ? "Your evidence is being reviewed"
                        : applicationReadyForApproval
                          ? "Your onboarding is ready for review"
                          : "Continue your onboarding"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {failedRequired.length > 0
                  ? "One or more required requirements were rejected. Review the requirement status above and submit corrected evidence."
                  : informationRequired.length > 0
                    ? "TenderHub administrators have requested additional information. Review the notes above and provide the requested evidence."
                    : missingRequired.length > 0
                      ? "Submit the outstanding evidence required for your TenderHub vendor approval."
                      : pendingRequired.length > 0
                        ? "TenderHub administrators are reviewing your submitted evidence. No further action may be required unless additional information is requested."
                        : applicationReadyForApproval
                          ? "Your required onboarding requirements have been satisfied. TenderHub administrators can now complete the approval decision."
                          : "Continue completing your vendor onboarding application."}
              </p>

              {(missingRequired.length > 0 ||
                failedRequired.length > 0 ||
                informationRequired.length > 0) && (
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