import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorCompliancePage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <div className="p-10 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Sign In Required
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Please sign in to view your vendor verification requirements.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      vendor: {
        select: {
          id: true,
          companyName: true,
          verifiedAt: true,
          requirementSet: {
            select: {
              code: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!user?.vendor) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <div className="p-10 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Application Required
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Your vendor onboarding application must be created before
                verification requirements can be displayed.
              </p>

              <Link
                href="/dashboard/vendor/onboarding"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                Continue Vendor Onboarding
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const application = await prisma.vendorApplication.findUnique({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      approvedAt: true,
      rejectedAt: true,
      adminNotes: true,
      rejectionReason: true,
      requirementSet: {
        select: {
          code: true,
          name: true,
          description: true,
        },
      },
      requirements: {
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
              validityDays: true,
              allowedDocumentCategories: true,
            },
          },
          evidence: {
            select: {
              id: true,
              name: true,
              category: true,
              status: true,
              expiryDate: true,
              uploadedAt: true,
              rejectionReason: true,
            },
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
        orderBy: [
          {
            required: "desc",
          },
          {
            name: "asc",
          },
        ],
      },
    },
  });

  if (!application) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <div className="p-10 text-center">
              <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Onboarding Not Started
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                Start your vendor onboarding application to receive the
                requirements needed for TenderHub approval.
              </p>

              <Link
                href="/dashboard/vendor/onboarding"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                Start Onboarding
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const now = new Date();

  const requiredRecords = application.requirements.filter(
    (record) => record.required,
  );

  const satisfiedRequiredCount = requiredRecords.filter(
    (record) =>
      record.status === "SATISFIED" ||
      record.status === "NOT_APPLICABLE",
  ).length;

  const outstandingCount = application.requirements.filter(
    (record) =>
      record.status === "OUTSTANDING" ||
      record.status === "SUBMITTED",
  ).length;

  const underReviewCount = application.requirements.filter(
    (record) => record.status === "UNDER_REVIEW",
  ).length;

  const needsInformationCount = application.requirements.filter(
    (record) => record.status === "NEEDS_INFORMATION",
  ).length;

  const rejectedCount = application.requirements.filter(
    (record) => record.status === "REJECTED",
  ).length;

  const satisfiedCount = application.requirements.filter(
    (record) =>
      record.status === "SATISFIED" ||
      record.status === "NOT_APPLICABLE",
  ).length;

  const complianceRate =
    requiredRecords.length > 0
      ? Math.round(
          (satisfiedRequiredCount / requiredRecords.length) * 100,
        )
      : 0;

  const verificationComplete =
    requiredRecords.length > 0 &&
    satisfiedRequiredCount === requiredRecords.length;

  const acceptedEvidenceCount = application.requirements.reduce(
    (total, requirement) =>
      total +
      requirement.evidence.filter(
        (evidence) => evidence.status === "ACCEPTED",
      ).length,
    0,
  );

  const pendingEvidenceCount = application.requirements.reduce(
    (total, requirement) =>
      total +
      requirement.evidence.filter(
        (evidence) => evidence.status === "PENDING",
      ).length,
    0,
  );

  const rejectedEvidenceCount = application.requirements.reduce(
    (total, requirement) =>
      total +
      requirement.evidence.filter(
        (evidence) => evidence.status === "REJECTED",
      ).length,
    0,
  );

  function getStatusLabel(status: string) {
    switch (status) {
      case "SATISFIED":
        return "Satisfied";
      case "NOT_APPLICABLE":
        return "Not Applicable";
      case "SUBMITTED":
        return "Submitted";
      case "UNDER_REVIEW":
        return "Under Review";
      case "NEEDS_INFORMATION":
        return "Needs Information";
      case "REJECTED":
        return "Rejected";
      default:
        return "Outstanding";
    }
  }

  function getStatusClasses(status: string) {
    switch (status) {
      case "SATISFIED":
        return "bg-green-50 text-green-700";
      case "NOT_APPLICABLE":
        return "bg-slate-100 text-slate-700";
      case "UNDER_REVIEW":
        return "bg-blue-50 text-blue-700";
      case "SUBMITTED":
        return "bg-amber-50 text-amber-700";
      case "NEEDS_INFORMATION":
        return "bg-orange-50 text-orange-700";
      case "REJECTED":
        return "bg-red-50 text-red-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  function getApplicationStatusClasses(status: string) {
    switch (status) {
      case "APPROVED":
        return "bg-green-50 text-green-700";
      case "UNDER_REVIEW":
        return "bg-blue-50 text-blue-700";
      case "NEEDS_INFORMATION":
        return "bg-orange-50 text-orange-700";
      case "REJECTED":
        return "bg-red-50 text-red-700";
      case "SUBMITTED":
        return "bg-amber-50 text-amber-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-tenderhub-gold">
              Vendor Verification
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Verification Center
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Complete your TenderHub vendor verification requirements and
              monitor the review of your supporting evidence.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-tenderhub-navy px-3 py-1.5 text-xs font-semibold text-white">
                {user.vendor.companyName}
              </span>

              {application.requirementSet && (
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
                  {application.requirementSet.name}
                </span>
              )}

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${getApplicationStatusClasses(
                  application.status,
                )}`}
              >
                {application.status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <Link
            href="/dashboard/vendor/documents"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            <FileCheck2 className="h-4 w-4" />
            Manage Documents
          </Link>
        </div>

        {/* Verification progress */}
        <Card>
          <div className="p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Verification Progress
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {application.status === "APPROVED"
                      ? "Your vendor application has been approved."
                      : verificationComplete
                        ? "All required verification requirements have been satisfied."
                        : `${satisfiedRequiredCount} of ${requiredRecords.length} required requirements satisfied.`}
                  </p>
                </div>
              </div>

              <div className="min-w-[220px]">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600">
                    Completion
                  </span>

                  <span className="font-bold text-slate-900">
                    {complianceRate}%
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-tenderhub-gold transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(0, complianceRate),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {satisfiedCount}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Satisfied
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Clock3 className="h-5 w-5" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {outstandingCount}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Outstanding
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Clock3 className="h-5 w-5" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {underReviewCount}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Under Review
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {needsInformationCount}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Needs Information
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {rejectedCount}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Rejected
              </p>
            </div>
          </Card>
        </div>

        {/* Requirements */}
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Verification Requirements
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {application.requirements.length} requirement
                  {application.requirements.length === 1 ? "" : "s"} assigned
                  to your vendor application.
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <ShieldCheck className="h-4 w-4 text-slate-500" />

                <span className="text-sm font-semibold text-slate-700">
                  {complianceRate}% complete
                </span>
              </div>
            </div>

            {application.requirements.length === 0 ? (
              <div className="p-10 text-center">
                <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />

                <h3 className="mt-4 font-semibold text-slate-900">
                  No Verification Requirements
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Your vendor application does not have any verification
                  requirements assigned yet.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {application.requirements.map((record) => {
                  const status = String(record.status).toUpperCase();

                  const latestEvidence = record.evidence[0];

                  const expiryDates = record.evidence
                    .map((evidence) => evidence.expiryDate)
                    .filter(
                      (date): date is Date => date instanceof Date,
                    );

                  const nearestExpiry =
                    expiryDates.length > 0
                      ? expiryDates.reduce((nearest, current) =>
                          current < nearest ? current : nearest,
                        )
                      : null;

                  const daysUntilExpiry = nearestExpiry
                    ? Math.ceil(
                        (nearestExpiry.getTime() - now.getTime()) /
                          (1000 * 60 * 60 * 24),
                      )
                    : null;

                  const expired =
                    daysUntilExpiry !== null && daysUntilExpiry < 0;

                  const expiringSoon =
                    daysUntilExpiry !== null &&
                    daysUntilExpiry >= 0 &&
                    daysUntilExpiry <= 30;

                  return (
                    <Link
                      key={record.id}
                      href={`/dashboard/vendor/compliance/${record.id}`}
                      className="block p-6 transition hover:bg-slate-50"
                    >
                      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {record.name}
                            </h3>

                            {record.required && (
                              <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700">
                                Required
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                            {String(record.category).replace(/_/g, " ")}
                          </p>

                          {record.description && (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                              {record.description}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
                            <span>
                              Evidence: {record.evidence.length}
                            </span>

                            {latestEvidence && (
                              <span>
                                Latest evidence: {latestEvidence.name}
                              </span>
                            )}

                            {nearestExpiry && (
                              <span>
                                Expires:{" "}
                                {nearestExpiry.toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <div className="text-right">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                                status,
                              )}`}
                            >
                              {getStatusLabel(status)}
                            </span>

                            {expired && (
                              <p className="mt-2 text-xs font-medium text-red-600">
                                Evidence expired
                              </p>
                            )}

                            {!expired && expiringSoon && (
                              <p className="mt-2 text-xs font-medium text-orange-600">
                                {daysUntilExpiry} day
                                {daysUntilExpiry === 1 ? "" : "s"} remaining
                              </p>
                            )}
                          </div>

                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Verification Overview
                </h2>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      Required completion
                    </span>

                    <span className="font-semibold text-slate-900">
                      {complianceRate}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-tenderhub-gold transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, complianceRate),
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Total requirements
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {application.requirements.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Required requirements
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {requiredRecords.length}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Required satisfied
                    </span>

                    <span className="text-sm font-semibold text-green-700">
                      {satisfiedRequiredCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Accepted evidence
                    </span>

                    <span className="text-sm font-semibold text-slate-900">
                      {acceptedEvidenceCount}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Pending evidence
                    </span>

                    <span className="text-sm font-semibold text-amber-700">
                      {pendingEvidenceCount}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                  <FileCheck2 className="h-5 w-5" />
                </div>

                <h2 className="mt-4 font-semibold text-slate-900">
                  Submit Supporting Documents
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Upload the business documents required for vendor
                  verification. Uploaded evidence remains pending until
                  reviewed by TenderHub administrators.
                </p>

                <Link
                  href="/dashboard/vendor/documents"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-tenderhub-navy hover:underline"
                >
                  Manage Documents
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Attention Required
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {application.status === "APPROVED"
                        ? "Your vendor application has been approved. Keep your supporting documents current."
                        : needsInformationCount > 0
                          ? `${needsInformationCount} requirement${
                              needsInformationCount === 1 ? "" : "s"
                            } ${
                              needsInformationCount === 1
                                ? "needs"
                                : "need"
                            } additional information.`
                          : rejectedCount > 0
                            ? `${rejectedCount} requirement${
                                rejectedCount === 1 ? "" : "s"
                              } ${
                                rejectedCount === 1
                                  ? "has"
                                  : "have"
                              } been rejected and may require replacement evidence.`
                            : rejectedEvidenceCount > 0
                              ? `${rejectedEvidenceCount} submitted evidence item${
                                  rejectedEvidenceCount === 1
                                    ? ""
                                    : "s"
                                } ${
                                  rejectedEvidenceCount === 1
                                    ? "has"
                                    : "have"
                                } been rejected.`
                              : pendingEvidenceCount > 0
                                ? `${pendingEvidenceCount} evidence item${
                                    pendingEvidenceCount === 1
                                      ? ""
                                      : "s"
                                  } ${
                                    pendingEvidenceCount === 1
                                      ? "is"
                                      : "are"
                                  } awaiting administrator verification.`
                                : outstandingCount > 0
                                  ? `${outstandingCount} requirement${
                                      outstandingCount === 1
                                        ? ""
                                        : "s"
                                    } ${
                                      outstandingCount === 1
                                        ? "is"
                                        : "are"
                                    } still outstanding.`
                                  : "There are currently no verification issues requiring immediate attention."}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}