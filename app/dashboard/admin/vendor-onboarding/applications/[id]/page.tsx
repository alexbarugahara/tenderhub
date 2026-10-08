import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FileCheck2,
  FileText,
  Globe2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: Date | null | undefined) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-UG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function formatStatus(value: string | null | undefined) {
  if (!value) return "Pending";

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCategory(value: string | null | undefined) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRequirementStatus(
  status: string | null | undefined,
  hasEvidence: boolean,
) {
  const normalized = String(status ?? "OUTSTANDING").toUpperCase();

  if (
    normalized === "SATISFIED" ||
    normalized === "NOT_APPLICABLE"
  ) {
    return {
      label:
        normalized === "NOT_APPLICABLE"
          ? "Not applicable"
          : "Satisfied",
      description:
        normalized === "NOT_APPLICABLE"
          ? "Requirement does not apply"
          : "Requirement has been satisfied",
      className:
        normalized === "NOT_APPLICABLE"
          ? "border-slate-200 bg-slate-50 text-slate-600"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon:
        normalized === "NOT_APPLICABLE"
          ? ShieldCheck
          : CheckCircle2,
    };
  }

  if (normalized === "REJECTED") {
    return {
      label: "Rejected",
      description: "Requirement or evidence requires correction",
      className: "border-red-200 bg-red-50 text-red-700",
      icon: XCircle,
    };
  }

  if (normalized === "NEEDS_INFORMATION") {
    return {
      label: "Information required",
      description: "Additional information or evidence is required",
      className: "border-red-200 bg-red-50 text-red-700",
      icon: AlertCircle,
    };
  }

  if (
    normalized === "SUBMITTED" ||
    normalized === "UNDER_REVIEW"
  ) {
    return {
      label:
        normalized === "UNDER_REVIEW"
          ? "Under review"
          : "Evidence received",
      description:
        normalized === "UNDER_REVIEW"
          ? "Requirement is currently being reviewed"
          : "Evidence received and awaiting review",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
      icon: Clock3,
    };
  }

  if (hasEvidence) {
    return {
      label: "Evidence received",
      description: "Evidence received and awaiting review",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
      icon: Clock3,
    };
  }

  return {
    label: "Outstanding",
    description:
      "Required evidence or information has not been supplied",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
  };
}

function getEvidenceStatus(status: string | null | undefined) {
  const normalized = String(status ?? "PENDING").toUpperCase();

  if (normalized === "ACCEPTED") {
    return {
      label: "Accepted",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
    };
  }

  if (normalized === "REJECTED") {
    return {
      label: "Rejected",
      className:
        "border-red-200 bg-red-50 text-red-700",
    };
  }

  if (normalized === "EXPIRED") {
    return {
      label: "Expired",
      className:
        "border-red-200 bg-red-50 text-red-700",
    };
  }

  return {
    label: "Pending verification",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
  };
}

export default async function ReviewVendorApplicationPage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const { id } = await params;

  /*
   * The route id is the Vendor id.
   *
   * Vendor approval is represented by:
   *
   * Vendor
   *   -> VendorApplication
   *      -> VendorApplicationRequirement
   *         -> VendorApplicationEvidence
   *
   * A VendorApplication is the actual TenderHub onboarding
   * application. A Vendor is activated when verifiedAt is populated
   * after approval.
   */
  const vendor = await prisma.vendor.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      companyName: true,
      legalName: true,
      description: true,
      email: true,
      phone: true,
      website: true,
      address: true,
      registrationNumber: true,
      taxNumber: true,
      businessType: true,
      numberOfEmployees: true,
      yearsOperating: true,
      operatingLocations: true,
      portfolioDescription: true,
      verifiedAt: true,
      createdAt: true,
      updatedAt: true,

      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
        },
      },

      documents: {
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
          updatedAt: true,
        },
        orderBy: {
          uploadedAt: "desc",
        },
      },
    },
  });

  if (!vendor) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Card>
            <div className="p-10 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor application not found
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                The vendor may have been removed or the vendor
                identifier is invalid.
              </p>

              <Link
                href="/dashboard/admin/vendor-onboarding/applications"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to applications
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /*
   * Load the actual onboarding application.
   *
   * We intentionally do NOT use VendorCompliance or
   * VendorComplianceRequirement here.
   */
  const application = await prisma.vendorApplication.findUnique({
    where: {
      userId: vendor.user.id,
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

      requirements: {
        orderBy: {
          name: "asc",
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
              category: true,
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
      },

      evidence: {
        orderBy: {
          uploadedAt: "desc",
        },
        select: {
          id: true,
          requirementId: true,
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

      actions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
        select: {
          id: true,
          action: true,
          reason: true,
          notes: true,
          createdAt: true,
          performedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  /*
   * Do not fabricate requirements if the application is missing.
   */
  if (!application) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Link
            href="/dashboard/admin/vendor-onboarding/applications"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Vendor applications
          </Link>

          <Card>
            <div className="p-10 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor onboarding application not initialized
              </h1>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                This vendor record exists, but there is no
                VendorApplication associated with the vendor account.
                The new TenderHub verification workflow requires an
                onboarding application before the vendor can be reviewed.
              </p>

              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/dashboard/admin/vendor-onboarding/applications"
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to applications
                </Link>

                <Link
                  href={`/dashboard/admin/vendors/${vendor.id}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Open vendor record
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const requiredRequirements = application.requirements.filter(
    (requirement) => requirement.required,
  );

  const satisfiedRequirements = requiredRequirements.filter(
    (requirement) =>
      requirement.status === "SATISFIED" ||
      requirement.status === "NOT_APPLICABLE",
  );

  const rejectedRequirements = requiredRequirements.filter(
    (requirement) => requirement.status === "REJECTED",
  );

  const informationRequiredRequirements =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status === "NEEDS_INFORMATION",
    );

  const underReviewRequirements = requiredRequirements.filter(
    (requirement) =>
      requirement.status === "UNDER_REVIEW" ||
      requirement.status === "SUBMITTED",
  );

  const outstandingRequirements = requiredRequirements.filter(
    (requirement) => requirement.status === "OUTSTANDING",
  );

  const satisfiedRequiredCount = satisfiedRequirements.length;

  const complianceComplete =
    requiredRequirements.length > 0 &&
    satisfiedRequiredCount === requiredRequirements.length;

  const profileComplete =
    Boolean(vendor.companyName) &&
    Boolean(vendor.email) &&
    Boolean(vendor.registrationNumber) &&
    Boolean(vendor.taxNumber);

  const acceptedEvidence = application.evidence.filter(
    (evidence) => evidence.status === "ACCEPTED",
  );

  const pendingEvidence = application.evidence.filter(
    (evidence) => evidence.status === "PENDING",
  );

  const rejectedEvidence = application.evidence.filter(
    (evidence) => evidence.status === "REJECTED",
  );

  const expiredEvidence = application.evidence.filter(
    (evidence) => evidence.status === "EXPIRED",
  );

  const evidenceNeedsAttention =
    rejectedEvidence.length > 0 ||
    expiredEvidence.length > 0;

  const applicationStatus = vendor.verifiedAt
    ? "APPROVED"
    : application.status === "APPROVED"
      ? "APPROVED"
      : application.status === "REJECTED"
        ? "ACTION_REQUIRED"
        : application.status === "NEEDS_INFORMATION"
          ? "ACTION_REQUIRED"
          : rejectedRequirements.length > 0 ||
              informationRequiredRequirements.length > 0 ||
              evidenceNeedsAttention
            ? "ACTION_REQUIRED"
            : application.status === "SUBMITTED" ||
                application.status === "UNDER_REVIEW" ||
                underReviewRequirements.length > 0
              ? "UNDER_REVIEW"
              : complianceComplete && profileComplete
                ? "READY_FOR_DECISION"
                : "UNDER_REVIEW";

  const statusConfig = {
    APPROVED: {
      label: "Approved",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    },
    ACTION_REQUIRED: {
      label: "Action required",
      className:
        "border-red-200 bg-red-50 text-red-700",
      icon: AlertCircle,
    },
    UNDER_REVIEW: {
      label: "Under review",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
      icon: Clock3,
    },
    READY_FOR_DECISION: {
      label: "Ready for decision",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: ShieldCheck,
    },
  } as const;

  const currentStatus = statusConfig[applicationStatus];
  const StatusIcon = currentStatus.icon;

  const progress =
    requiredRequirements.length > 0
      ? Math.round(
          (satisfiedRequiredCount /
            requiredRequirements.length) *
            100,
        )
      : profileComplete
        ? 100
        : 0;

  const activationReady =
    profileComplete &&
    complianceComplete &&
    application.status !== "REJECTED";

  return (
    <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link
              href="/dashboard/admin/vendor-onboarding/applications"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-tenderhub-navy"
            >
              <ArrowLeft className="h-4 w-4" />
              Vendor applications
            </Link>

            <div className="mt-4 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                <Building2 className="h-7 w-7" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Review Vendor Application
                  </h1>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${currentStatus.className}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5" />
                    {currentStatus.label}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Review the vendor profile, submitted evidence and
                  TenderHub onboarding requirements before activation.
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Vendor ID: {vendor.id}
                  {" · "}
                  Application ID: {application.id}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/dashboard/admin/vendors/${vendor.id}`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Building2 className="h-4 w-4" />
              Vendor profile
            </Link>
          </div>
        </div>

        {/* SUMMARY */}
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Compliance progress
                </p>

                <ShieldCheck className="h-5 w-5 text-tenderhub-navy" />
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {progress}%
              </p>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-tenderhub-navy transition-all"
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-slate-500">
                {satisfiedRequiredCount} of{" "}
                {requiredRequirements.length} required checks
                satisfied
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Evidence
                </p>

                <FileText className="h-5 w-5 text-tenderhub-navy" />
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {application.evidence.length}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {acceptedEvidence.length} accepted ·{" "}
                {pendingEvidence.length} pending
                {rejectedEvidence.length > 0
                  ? ` · ${rejectedEvidence.length} rejected`
                  : ""}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Required checks
                </p>

                <FileCheck2 className="h-5 w-5 text-tenderhub-navy" />
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {requiredRequirements.length}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                {rejectedRequirements.length} rejected ·{" "}
                {outstandingRequirements.length} outstanding
                {underReviewRequirements.length > 0
                  ? ` · ${underReviewRequirements.length} under review`
                  : ""}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Application date
                </p>

                <Clock3 className="h-5 w-5 text-tenderhub-navy" />
              </div>

              <p className="mt-3 text-lg font-bold text-slate-900">
                {formatDate(
                  application.submittedAt ??
                    vendor.createdAt,
                )}
              </p>

              <p className="mt-2 text-xs text-slate-500">
                Status: {formatStatus(application.status)}
              </p>
            </div>
          </Card>
        </section>

        {/* PROFILE */}
        <Card>
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-tenderhub-navy">
                <Building2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Vendor profile
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Confirm the legal identity and operating information
                  supplied by the vendor.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-2">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Company name
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {vendor.companyName || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Legal name
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {vendor.legalName || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Registration number
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {vendor.registrationNumber || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Tax number
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {vendor.taxNumber || "Not provided"}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Business type
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {vendor.businessType || "Not provided"}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-slate-400" />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Email
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {vendor.email ||
                      vendor.user.email ||
                      "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-slate-400" />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Phone
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {vendor.phone ||
                      vendor.user.phone ||
                      "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe2 className="mt-0.5 h-4 w-4 text-slate-400" />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Website
                  </p>

                  {vendor.website ? (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-tenderhub-navy hover:underline"
                    >
                      {vendor.website}

                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-slate-700">
                      Not provided
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Address
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {vendor.address || "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Vendor account
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {vendor.user.name || vendor.user.email}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Account status:{" "}
                    {formatStatus(vendor.user.status)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {(vendor.description ||
            vendor.operatingLocations ||
            vendor.portfolioDescription ||
            vendor.numberOfEmployees !== null ||
            vendor.yearsOperating !== null) && (
            <div className="border-t border-slate-100 p-6">
              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Employees
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {vendor.numberOfEmployees ?? "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Years operating
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {vendor.yearsOperating ?? "Not provided"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Operating locations
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {vendor.operatingLocations ||
                      "Not provided"}
                  </p>
                </div>
              </div>

              {vendor.description && (
                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Description
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {vendor.description}
                  </p>
                </div>
              )}

              {vendor.portfolioDescription && (
                <div className="mt-5">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Portfolio / capability description
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {vendor.portfolioDescription}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* APPLICATION STATUS */}
        <Card>
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tenderhub-navy/5 text-tenderhub-navy">
                <FileCheck2 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Application status
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current state of the vendor&apos;s TenderHub onboarding
                  application.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Application
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatStatus(application.status)}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Submitted
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDate(application.submittedAt)}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Reviewed
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDate(application.reviewedAt)}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-500">
                Approved
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-900">
                {formatDate(application.approvedAt)}
              </p>
            </div>
          </div>

          {(application.adminNotes ||
            application.rejectionReason) && (
            <div className="border-t border-slate-100 p-6">
              {application.adminNotes && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Admin notes
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {application.adminNotes}
                  </p>
                </div>
              )}

              {application.rejectionReason && (
                <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-4">
                  <p className="text-xs font-semibold text-red-700">
                    Rejection reason
                  </p>

                  <p className="mt-1 text-sm leading-6 text-red-700">
                    {application.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* REQUIREMENTS */}
        <Card>
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tenderhub-navy/5 text-tenderhub-navy">
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    TenderHub requirements
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Platform-wide requirements that must be satisfied
                    before the vendor can be activated.
                  </p>
                </div>
              </div>

              <div className="text-sm">
                <span className="font-semibold text-slate-900">
                  {satisfiedRequiredCount}
                </span>

                <span className="text-slate-500">
                  {" "}
                  of {requiredRequirements.length} required checks
                  satisfied
                </span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {application.requirements.length === 0 ? (
              <div className="p-8 text-center">
                <ShieldCheck className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 text-sm font-medium text-slate-700">
                  No requirements attached to this application
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  The application has not yet been initialized with its
                  TenderHub requirement set.
                </p>
              </div>
            ) : (
              application.requirements.map((record) => {
                const latestEvidence = record.evidence[0];

                const requirementStatus = getRequirementStatus(
                  record.status,
                  record.evidence.length > 0,
                );

                const RequirementIcon =
                  requirementStatus.icon;

                return (
                  <div
                    key={record.id}
                    className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        {record.evidence.length > 0 ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <FileCheck2 className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {record.name}
                          </h3>

                          {record.required && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-600">
                              Required
                            </span>
                          )}

                          {record.requirement
                            .allowedDocumentCategories
                            .length > 0 && (
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-600">
                              Evidence supported
                            </span>
                          )}
                        </div>

                        {record.description && (
                          <p className="mt-1 max-w-3xl text-sm leading-5 text-slate-500">
                            {record.description}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>
                            Code:{" "}
                            <span className="font-medium text-slate-500">
                              {record.code}
                            </span>
                          </span>

                          <span>
                            Category:{" "}
                            {formatCategory(
                              String(record.category),
                            )}
                          </span>

                          {record.requirement.validityDays !==
                            null && (
                            <span>
                              Valid for{" "}
                              {record.requirement.validityDays} days
                            </span>
                          )}

                          {record.reviewedAt && (
                            <span>
                              Reviewed{" "}
                              {formatDate(record.reviewedAt)}
                            </span>
                          )}
                        </div>

                        {latestEvidence && (
                          <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2">
                            <div className="flex items-start gap-2">
                              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />

                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-blue-900">
                                  Evidence received
                                </p>

                                <p className="mt-0.5 text-xs leading-5 text-blue-800">
                                  {latestEvidence.name}
                                  {" · "}
                                  {formatCategory(
                                    String(
                                      latestEvidence.category,
                                    ),
                                  )}
                                  {" · "}
                                  {formatStatus(
                                    latestEvidence.status,
                                  )}
                                </p>

                                {latestEvidence.status ===
                                  "PENDING" && (
                                  <p className="mt-1 text-xs text-blue-700">
                                    Evidence has been received and is
                                    awaiting TenderHub verification.
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {!latestEvidence &&
                          record.requirement
                            .allowedDocumentCategories.length >
                            0 && (
                            <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
                              <p className="text-xs font-semibold text-amber-900">
                                Evidence outstanding
                              </p>

                              <p className="mt-0.5 text-xs leading-5 text-amber-800">
                                No supporting evidence has been submitted
                                for this requirement.
                              </p>
                            </div>
                          )}

                        {record.notes && (
                          <div className="mt-3 rounded-lg bg-slate-50 px-3 py-2">
                            <p className="text-xs font-medium text-slate-500">
                              Reviewer note
                            </p>

                            <p className="mt-1 text-sm text-slate-700">
                              {record.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${requirementStatus.className}`}
                      >
                        <RequirementIcon className="h-3.5 w-3.5" />
                        {requirementStatus.label}
                      </span>

                      <p className="mt-1 text-right text-[11px] text-slate-400">
                        {requirementStatus.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* SUPPORTING EVIDENCE */}
        <Card>
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-tenderhub-navy">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Supporting evidence
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Documents submitted by the vendor. Receipt of evidence
                  does not automatically satisfy a requirement.
                </p>
              </div>
            </div>
          </div>

          {application.evidence.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-medium text-slate-700">
                No supporting evidence submitted
              </p>

              <p className="mt-1 text-sm text-slate-500">
                The vendor has not supplied evidence for this application.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {application.evidence.map((evidence) => {
                const status = getEvidenceStatus(
                  evidence.status,
                );

                const linkedRequirement =
                  evidence.requirementId
                    ? application.requirements.find(
                        (requirement) =>
                          requirement.id ===
                          evidence.requirementId,
                      )
                    : null;

                return (
                  <div
                    key={evidence.id}
                    className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {evidence.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatCategory(
                            String(evidence.category),
                          )}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
                          <span>
                            Uploaded{" "}
                            {formatDate(evidence.uploadedAt)}
                          </span>

                          {evidence.issuedAt && (
                            <span>
                              Issued{" "}
                              {formatDate(evidence.issuedAt)}
                            </span>
                          )}

                          {evidence.expiryDate && (
                            <span>
                              Expires{" "}
                              {formatDate(evidence.expiryDate)}
                            </span>
                          )}

                          {evidence.reviewedAt && (
                            <span>
                              Reviewed{" "}
                              {formatDate(evidence.reviewedAt)}
                            </span>
                          )}
                        </div>

                        {linkedRequirement && (
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                              <FileCheck2 className="h-3 w-3" />
                              Linked to{" "}
                              {linkedRequirement.name}
                            </span>
                          </div>
                        )}

                        {evidence.status === "PENDING" && (
                          <div className="mt-3 rounded-lg border border-amber-100 bg-amber-50 p-3">
                            <p className="text-xs font-semibold text-amber-900">
                              Evidence received — pending verification
                            </p>

                            <p className="mt-1 text-xs leading-5 text-amber-800">
                              This document has been submitted but has
                              not yet been accepted by a TenderHub
                              administrator.
                            </p>
                          </div>
                        )}

                        {evidence.rejectionReason && (
                          <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                            <p className="text-xs font-semibold text-red-700">
                              Rejection reason
                            </p>

                            <p className="mt-1 text-sm text-red-700">
                              {evidence.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>

                      {evidence.fileUrl && (
                        <a
                          href={evidence.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Open
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* DECISION PANEL */}
        <Card>
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-tenderhub-navy">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Application decision
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Vendor activation should only occur after the profile
                  and all required TenderHub requirements have been
                  satisfied.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {applicationStatus === "APPROVED" ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />

                  <div>
                    <p className="font-semibold text-emerald-900">
                      Vendor approved
                    </p>

                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      This vendor has been approved for TenderHub
                      participation.
                    </p>

                    <p className="mt-2 text-xs text-emerald-700">
                      Approved{" "}
                      {formatDate(
                        vendor.verifiedAt ??
                          application.approvedAt,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : applicationStatus === "ACTION_REQUIRED" ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />

                  <div>
                    <p className="font-semibold text-red-900">
                      Review action required
                    </p>

                    <p className="mt-1 text-sm leading-6 text-red-800">
                      One or more requirements or evidence items require
                      attention before this vendor can be activated.
                    </p>
                  </div>
                </div>
              </div>
            ) : applicationStatus === "UNDER_REVIEW" ? (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-5 w-5 text-blue-600" />

                  <div>
                    <p className="font-semibold text-blue-900">
                      Application under review
                    </p>

                    <p className="mt-1 text-sm leading-6 text-blue-800">
                      Some required profile information, evidence or
                      verification checks are still outstanding or
                      awaiting review.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />

                  <div>
                    <p className="font-semibold text-emerald-900">
                      Application ready for decision
                    </p>

                    <p className="mt-1 text-sm leading-6 text-emerald-800">
                      The vendor profile and all required TenderHub
                      requirements are satisfied. The application can
                      proceed to the approval decision.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Profile
                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${
                    profileComplete
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {profileComplete
                    ? "Complete"
                    : "Incomplete"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Required checks
                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${
                    complianceComplete
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {complianceComplete
                    ? "Satisfied"
                    : "Outstanding"}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Evidence
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-700">
                  {application.evidence.length} submitted
                </p>

                {pendingEvidence.length > 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    {pendingEvidence.length} pending verification
                  </p>
                )}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Activation
                </p>

                <p
                  className={`mt-1 text-sm font-semibold ${
                    applicationStatus === "READY_FOR_DECISION" ||
                    applicationStatus === "APPROVED"
                      ? "text-emerald-700"
                      : "text-amber-700"
                  }`}
                >
                  {applicationStatus === "APPROVED"
                    ? "Active"
                    : activationReady
                      ? "Ready"
                      : "Blocked"}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/dashboard/admin/vendor-onboarding/applications"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to applications
              </Link>

              <Link
                href={`/dashboard/admin/vendors/${vendor.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                Open vendor record
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}