import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

function formatDate(date: Date | null) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-UG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

type ApplicationStatus =
  | "APPROVED"
  | "READY_FOR_DECISION"
  | "ACTION_REQUIRED"
  | "UNDER_REVIEW"
  | "SUBMITTED"
  | "DRAFT"
  | "NOT_STARTED";

function getApplicationStatus(application: {
  status: string;
  requirements: Array<{
    required: boolean;
    status: string;
  }>;
}) {
  if (application.status === "APPROVED") {
    return "APPROVED" as ApplicationStatus;
  }

  const requiredRequirements = application.requirements.filter(
    (requirement) => requirement.required
  );

  if (
    requiredRequirements.some((requirement) =>
      ["REJECTED", "NEEDS_INFORMATION"].includes(requirement.status)
    )
  ) {
    return "ACTION_REQUIRED" as ApplicationStatus;
  }

  const allRequiredSatisfied =
    requiredRequirements.length > 0 &&
    requiredRequirements.every((requirement) =>
      ["SATISFIED", "NOT_APPLICABLE"].includes(requirement.status)
    );

  if (allRequiredSatisfied) {
    return "READY_FOR_DECISION" as ApplicationStatus;
  }

  if (
    ["UNDER_REVIEW", "SUBMITTED", "NEEDS_INFORMATION"].includes(
      application.status
    )
  ) {
    return "UNDER_REVIEW" as ApplicationStatus;
  }

  if (application.status === "DRAFT") {
    return "DRAFT" as ApplicationStatus;
  }

  return "NOT_STARTED" as ApplicationStatus;
}

function getStatusLabel(status: ApplicationStatus) {
  switch (status) {
    case "APPROVED":
      return "Approved";

    case "READY_FOR_DECISION":
      return "Ready for decision";

    case "ACTION_REQUIRED":
      return "Action required";

    case "UNDER_REVIEW":
      return "Under review";

    case "DRAFT":
      return "Draft";

    default:
      return "Not started";
  }
}

function getStatusClasses(status: ApplicationStatus) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "READY_FOR_DECISION":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "ACTION_REQUIRED":
      return "bg-red-50 text-red-700 border-red-200";

    case "UNDER_REVIEW":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "DRAFT":
      return "bg-slate-100 text-slate-700 border-slate-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

function getStatusIcon(status: ApplicationStatus) {
  switch (status) {
    case "APPROVED":
      return <CheckCircle2 className="h-4 w-4" />;

    case "READY_FOR_DECISION":
      return <ShieldCheck className="h-4 w-4" />;

    case "ACTION_REQUIRED":
      return <XCircle className="h-4 w-4" />;

    case "UNDER_REVIEW":
      return <Clock3 className="h-4 w-4" />;

    default:
      return <FileCheck2 className="h-4 w-4" />;
  }
}

export default async function VendorOnboardingApplicationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  if (session.user.role !== "ADMIN") {
    return null;
  }

  /*
   * VendorApplication is now the source of truth for vendor onboarding.
   *
   * A Vendor record may exist for approved/demo vendors, but onboarding
   * progress is determined from VendorApplication and its requirements.
   */
  const applicationsData = await prisma.vendorApplication.findMany({
    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
    select: {
      id: true,
      userId: true,
      status: true,
      companyName: true,
      legalName: true,
      email: true,
      phone: true,
      registrationNumber: true,
      taxNumber: true,
      submittedAt: true,
      createdAt: true,
      reviewedAt: true,
      approvedAt: true,
      rejectedAt: true,

      requirements: {
        select: {
          id: true,
          required: true,
          status: true,
          reviewedAt: true,
        },
      },

      evidence: {
        select: {
          id: true,
          status: true,
          uploadedAt: true,
          reviewedAt: true,
        },
      },
    },
  });

  const applications = applicationsData.map((application) => {
    const status = getApplicationStatus(application);

    const requiredRequirements = application.requirements.filter(
      (requirement) => requirement.required
    );

    const satisfiedRequirements = requiredRequirements.filter((requirement) =>
      ["SATISFIED", "NOT_APPLICABLE"].includes(requirement.status)
    ).length;

    const progress =
      requiredRequirements.length > 0
        ? Math.round(
            (satisfiedRequirements / requiredRequirements.length) * 100
          )
        : 0;

    const pendingDocuments = application.evidence.filter(
      (evidence) => evidence.status === "PENDING"
    ).length;

    const rejectedDocuments = application.evidence.filter(
      (evidence) => evidence.status === "REJECTED"
    ).length;

    const acceptedDocuments = application.evidence.filter(
      (evidence) => evidence.status === "ACCEPTED"
    ).length;

    return {
      ...application,
      status,
      progress,
      requiredRequirements: requiredRequirements.length,
      satisfiedRequirements,
      pendingDocuments,
      rejectedDocuments,
      acceptedDocuments,
    };
  });

  const total = applications.length;

  const approved = applications.filter(
    (application) => application.status === "APPROVED"
  ).length;

  const underReview = applications.filter(
    (application) => application.status === "UNDER_REVIEW"
  ).length;

  const readyForDecision = applications.filter(
    (application) => application.status === "READY_FOR_DECISION"
  ).length;

  const actionRequired = applications.filter(
    (application) => application.status === "ACTION_REQUIRED"
  ).length;

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
            <Link
              href="/dashboard/admin"
              className="hover:text-slate-900"
            >
              Admin
            </Link>

            <span>/</span>

            <span>Vendor Onboarding</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
            Vendor Onboarding Applications
          </h1>

          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Review vendor onboarding submissions, compliance evidence and
            readiness for TenderHub approval.
          </p>
        </div>

        <Link
          href="/dashboard/admin/vendor-onboarding/requirements"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ShieldCheck className="h-4 w-4" />
          Verification Requirements
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total applications</p>

              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {total}
              </p>
            </div>

            <div className="rounded-lg bg-slate-100 p-2.5">
              <Users className="h-5 w-5 text-slate-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Under review</p>

              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {underReview}
              </p>
            </div>

            <div className="rounded-lg bg-amber-50 p-2.5">
              <Clock3 className="h-5 w-5 text-amber-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">
                Ready for decision
              </p>

              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {readyForDecision}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-2.5">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Action required</p>

              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {actionRequired}
              </p>
            </div>

            <div className="rounded-lg bg-red-50 p-2.5">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Approved</p>

              <p className="mt-1 text-2xl font-semibold text-slate-950">
                {approved}
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 p-2.5">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Explanation */}
      <Card className="border-slate-200 bg-slate-50 p-5">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-lg bg-white p-2 shadow-sm">
            <FileCheck2 className="h-5 w-5 text-slate-700" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-950">
              Vendor onboarding is a review process
            </h2>

            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-600">
              A vendor becomes eligible for TenderHub participation only after
              its profile, required compliance evidence and administrative
              checks have been reviewed. Uploading a document does not
              automatically satisfy a requirement.
            </p>
          </div>
        </div>
      </Card>

      {/* Applications */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-950">
            Vendor Applications
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select a vendor application to review its onboarding evidence and
            make an approval decision.
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <Users className="h-6 w-6 text-slate-500" />
            </div>

            <h3 className="mt-4 font-semibold text-slate-950">
              No vendor applications
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Vendor applications will appear here once vendors begin the
              TenderHub onboarding process.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {applications.map((application) => (
              <div
                key={application.id}
                className="px-6 py-5 transition hover:bg-slate-50"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-base font-semibold text-slate-950">
                        {application.companyName || "Unnamed Vendor"}
                      </h3>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                          application.status
                        )}`}
                      >
                        {getStatusIcon(application.status)}

                        {getStatusLabel(application.status)}
                      </span>
                    </div>

                    <div className="mt-2 grid gap-x-6 gap-y-1 text-sm text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
                      <span>
                        Legal name:{" "}
                        <strong className="font-medium text-slate-700">
                          {application.legalName || "—"}
                        </strong>
                      </span>

                      <span>
                        Registration:{" "}
                        <strong className="font-medium text-slate-700">
                          {application.registrationNumber || "—"}
                        </strong>
                      </span>

                      <span>
                        Email:{" "}
                        <strong className="font-medium text-slate-700">
                          {application.email || "—"}
                        </strong>
                      </span>

                      <span>
                        Submitted:{" "}
                        <strong className="font-medium text-slate-700">
                          {formatDate(application.submittedAt)}
                        </strong>
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="mt-4 max-w-xl">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-600">
                          Required compliance
                        </span>

                        <span className="text-slate-500">
                          {application.satisfiedRequirements}/
                          {application.requiredRequirements} satisfied
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-[#D4AF37] transition-all"
                          style={{
                            width: `${application.progress}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Evidence summary */}
                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
                      <span className="text-slate-500">
                        Evidence received:{" "}
                        <strong className="font-medium text-slate-700">
                          {application.acceptedDocuments}
                        </strong>
                      </span>

                      {application.pendingDocuments > 0 && (
                        <span className="text-amber-700">
                          {application.pendingDocuments} evidence item
                          {application.pendingDocuments === 1 ? "" : "s"}{" "}
                          pending review
                        </span>
                      )}

                      {application.rejectedDocuments > 0 && (
                        <span className="text-red-700">
                          {application.rejectedDocuments} evidence item
                          {application.rejectedDocuments === 1 ? "" : "s"}{" "}
                          rejected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0">
                    <Link
                      href={`/dashboard/admin/vendor-onboarding/applications/${application.id}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#071A33] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#0b2748]"
                    >
                      Review application

                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}