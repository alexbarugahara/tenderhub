import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
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

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

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

function getVendorStatus(verifiedAt: Date | null) {
  if (verifiedAt) {
    return {
      label: "Verified",
      description: "Vendor is approved to operate on TenderHub.",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    };
  }

  return {
    label: "Not verified",
    description:
      "Vendor approval has not yet been completed.",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
  };
}

function getDocumentStatus(status: string | null | undefined) {
  const normalized = String(status ?? "PENDING").toUpperCase();

  if (
    normalized === "APPROVED" ||
    normalized === "ACCEPTED" ||
    normalized === "VERIFIED"
  ) {
    return {
      label: "Verified",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      icon: CheckCircle2,
    };
  }

  if (
    normalized === "REJECTED" ||
    normalized === "EXPIRED"
  ) {
    return {
      label: formatStatus(normalized),
      className:
        "border-red-200 bg-red-50 text-red-700",
      icon: XCircle,
    };
  }

  if (
    normalized === "UNDER_REVIEW" ||
    normalized === "REVIEW"
  ) {
    return {
      label: "Under review",
      className:
        "border-blue-200 bg-blue-50 text-blue-700",
      icon: Clock3,
    };
  }

  return {
    label: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-700",
    icon: Clock3,
  };
}

export default async function AdminVendorPage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const { id } = await params;

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
        <div className="mx-auto max-w-6xl">
          <Card>
            <div className="p-10 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-red-500" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor not found
              </h1>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                The vendor record could not be found. The vendor may
                have been removed or the identifier may be invalid.
              </p>

              <Link
                href="/dashboard/admin/vendors"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to vendors
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /*
   * The onboarding application uses VendorApplication.
   *
   * We only check whether an application exists here.
   * The detailed compliance review remains on:
   *
   * /dashboard/admin/vendor-onboarding/applications/[id]
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
    },
  });

  const vendorStatus = getVendorStatus(vendor.verifiedAt);
  const VendorStatusIcon = vendorStatus.icon;

  const verifiedDocuments = vendor.documents.filter((document) => {
    const status = String(document.status ?? "").toUpperCase();

    return (
      status === "APPROVED" ||
      status === "ACCEPTED" ||
      status === "VERIFIED"
    );
  });

  const rejectedDocuments = vendor.documents.filter((document) => {
    const status = String(document.status ?? "").toUpperCase();

    return (
      status === "REJECTED" ||
      status === "EXPIRED"
    );
  });

  const pendingDocuments =
    vendor.documents.length -
    verifiedDocuments.length -
    rejectedDocuments.length;

  const profileComplete =
    Boolean(vendor.companyName) &&
    Boolean(vendor.email) &&
    Boolean(vendor.registrationNumber) &&
    Boolean(vendor.taxNumber);

  return (
    <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* HEADER */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <Link
              href="/dashboard/admin/vendors"
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              aria-label="Back to vendors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  {vendor.companyName ||
                    vendor.legalName ||
                    "Vendor"}
                </h1>

                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${vendorStatus.className}`}
                >
                  <VendorStatusIcon className="h-3.5 w-3.5" />
                  {vendorStatus.label}
                </span>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Vendor record, business profile and verification
                overview.
              </p>

              <p className="mt-2 text-xs text-slate-400">
                Vendor ID: {vendor.id}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {application && (
              <Link
                href={`/dashboard/admin/vendor-onboarding/applications/${vendor.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
              >
                <ShieldCheck className="h-4 w-4" />
                Review onboarding
              </Link>
            )}

            {!application && (
              <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-500">
                <Clock3 className="h-4 w-4" />
                Onboarding not initialized
              </span>
            )}
          </div>
        </div>

        {/* SUMMARY */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Verification
                </p>

                <ShieldCheck className="h-5 w-5 text-tenderhub-navy" />
              </div>

              <p className="mt-3 text-xl font-bold text-slate-900">
                {vendorStatus.label}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {vendor.verifiedAt
                  ? `Verified ${formatDate(vendor.verifiedAt)}`
                  : "Approval is still required"}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Profile
                </p>

                <Building2 className="h-5 w-5 text-tenderhub-navy" />
              </div>

              <p className="mt-3 text-xl font-bold text-slate-900">
                {profileComplete
                  ? "Complete"
                  : "Incomplete"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Core vendor identity information
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Documents
                </p>

                <FileText className="h-5 w-5 text-tenderhub-navy" />
              </div>

              <p className="mt-3 text-xl font-bold text-slate-900">
                {vendor.documents.length}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {verifiedDocuments.length} verified ·{" "}
                {pendingDocuments} pending
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Onboarding
                </p>

                <FileCheck2 className="h-5 w-5 text-tenderhub-navy" />
              </div>

              <p className="mt-3 text-xl font-bold text-slate-900">
                {application
                  ? formatStatus(application.status)
                  : "Not initialized"}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                TenderHub vendor application
              </p>
            </div>
          </Card>
        </section>

        {/* PROFILE + ACCOUNT */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* BUSINESS PROFILE */}
          <Card className="lg:col-span-2">
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tenderhub-navy/5 text-tenderhub-navy">
                  <Building2 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Business profile
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Legal identity and operating information
                    supplied by the vendor.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 p-6 sm:grid-cols-2">

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
                  {vendor.registrationNumber ||
                    "Not provided"}
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

              {vendor.address && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Address
                  </p>

                  <p className="mt-1 flex items-start gap-2 text-sm text-slate-700">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    {vendor.address}
                  </p>
                </div>
              )}

              {vendor.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Description
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {vendor.description}
                  </p>
                </div>
              )}

              {vendor.portfolioDescription && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Portfolio / capability description
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {vendor.portfolioDescription}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* CONTACT / ACCOUNT */}
          <Card>
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-tenderhub-navy">
                  <UserRound className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Vendor account
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Account and contact details.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-6">

              <div className="flex items-start gap-3">
                <UserRound className="mt-0.5 h-4 w-4 text-slate-400" />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Account holder
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {vendor.user.name ||
                      vendor.user.email ||
                      "Not provided"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-slate-400" />

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Email
                  </p>

                  <p className="mt-1 break-all text-sm text-slate-700">
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

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Website
                  </p>

                  {vendor.website ? (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex max-w-full items-center gap-1 break-all text-sm font-medium text-tenderhub-navy hover:underline"
                    >
                      {vendor.website}
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    </a>
                  ) : (
                    <p className="mt-1 text-sm text-slate-700">
                      Not provided
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-400" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Account status
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {formatStatus(vendor.user.status)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Vendor created
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {formatDate(vendor.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Last updated
                  </p>

                  <p className="mt-1 text-sm text-slate-700">
                    {formatDate(vendor.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* VERIFICATION */}
        <Card>
          <div className="border-b border-slate-100 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                    vendor.verifiedAt
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <ShieldCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Verification overview
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    TenderHub approval status for this vendor.
                  </p>
                </div>
              </div>

              {application && (
                <Link
                  href={`/dashboard/admin/vendor-onboarding/applications/${vendor.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Open full verification review
                  <ExternalLink className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-3">

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Vendor approval
              </p>

              <div className="mt-3 flex items-center gap-2">
                {vendor.verifiedAt ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Clock3 className="h-5 w-5 text-amber-600" />
                )}

                <p className="text-sm font-semibold text-slate-900">
                  {vendorStatus.label}
                </p>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {vendorStatus.description}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Onboarding application
              </p>

              <p className="mt-3 text-sm font-semibold text-slate-900">
                {application
                  ? formatStatus(application.status)
                  : "Not initialized"}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                {application
                  ? application.submittedAt
                    ? `Submitted ${formatDate(
                        application.submittedAt,
                      )}`
                    : "Application has not been submitted."
                  : "No VendorApplication exists for this vendor account."}
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Profile readiness
              </p>

              <p className="mt-3 text-sm font-semibold text-slate-900">
                {profileComplete
                  ? "Core profile complete"
                  : "Information missing"}
              </p>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Core checks include company name, email,
                registration number and tax number.
              </p>
            </div>
          </div>
        </Card>

        {/* DOCUMENTS */}
        <Card>
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tenderhub-navy/5 text-tenderhub-navy">
                <FileText className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Vendor documents
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Documents currently associated with this vendor
                  record.
                </p>
              </div>
            </div>
          </div>

          {vendor.documents.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-medium text-slate-700">
                No vendor documents
              </p>

              <p className="mt-1 text-sm text-slate-500">
                No documents have been uploaded to this vendor
                record.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {vendor.documents.map((document) => {
                const documentStatus = getDocumentStatus(
                  document.status,
                );

                const DocumentStatusIcon =
                  documentStatus.icon;

                return (
                  <div
                    key={document.id}
                    className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {document.name}
                          </h3>

                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${documentStatus.className}`}
                          >
                            <DocumentStatusIcon className="h-3 w-3" />
                            {documentStatus.label}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span>
                            Category:{" "}
                            {formatStatus(document.category)}
                          </span>

                          <span>
                            Uploaded:{" "}
                            {formatDate(document.uploadedAt)}
                          </span>

                          {document.expiryDate && (
                            <span>
                              Expires:{" "}
                              {formatDate(document.expiryDate)}
                            </span>
                          )}
                        </div>

                        {document.rejectionReason && (
                          <p className="mt-2 text-xs text-red-600">
                            {document.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    {document.fileUrl && (
                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View document
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* ONBOARDING TIMELINE */}
        {application && (
          <Card>
            <div className="border-b border-slate-100 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-tenderhub-navy">
                  <FileCheck2 className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Onboarding timeline
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Key dates recorded against the vendor&apos;s
                    onboarding application.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Submitted
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDate(application.submittedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Reviewed
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDate(application.reviewedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Approved
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDate(application.approvedAt)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Rejected
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {formatDate(application.rejectedAt)}
                </p>
              </div>
            </div>

            <div className="border-t border-slate-100 p-6">
              <Link
                href={`/dashboard/admin/vendor-onboarding/applications/${vendor.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <ShieldCheck className="h-4 w-4" />
                Continue to verification review
              </Link>
            </div>
          </Card>
        )}

        {/* NO APPLICATION */}
        {!application && (
          <Card>
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <AlertCircle className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-slate-900">
                  Vendor onboarding application not initialized
                </h2>

                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                  This vendor record exists, but there is no
                  VendorApplication associated with the vendor account.
                  The detailed TenderHub verification workflow
                  requires an onboarding application before the
                  vendor can be reviewed.
                </p>

                <div className="mt-4">
                  <Link
                    href="/dashboard/admin/vendor-onboarding/applications"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to applications
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
}