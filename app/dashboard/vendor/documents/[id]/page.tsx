import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  ShieldAlert,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

type VendorDocumentPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VendorDocumentPage({
  params,
}: VendorDocumentPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <ShieldAlert className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Sign In Required
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Please sign in to view vendor documents.
              </p>

              <Link
                href="/dashboard/vendor/documents"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Documents
              </Link>
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
          userId: true,
          companyName: true,
        },
      },
    },
  });

  if (!user?.vendor) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Profile Required
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                No vendor profile is associated with your account.
              </p>

              <Link
                href="/dashboard/vendor/onboarding"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                Continue Onboarding
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const document = await prisma.vendorDocument.findFirst({
    where: {
      id,
      vendorId: user.vendor.id,
    },
    select: {
      id: true,
      vendorId: true,
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
      vendor: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
  });

  if (!document) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Document Not Found
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                The requested document could not be found in your vendor
                profile.
              </p>

              <Link
                href="/dashboard/vendor/documents"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Documents
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  /*
   * Current verification architecture:
   *
   * VendorDocument
   *      ↓
   * VendorApplicationEvidence
   *      ↓
   * VendorApplicationRequirement
   *      ↓
   * VendorRequirement
   *
   * VendorApplicationEvidence stores the copied document information
   * used as evidence during the vendor onboarding review.
   */

  const application = await prisma.vendorApplication.findUnique({
    where: {
      userId: user.vendor.userId,
    },
    select: {
      id: true,
      status: true,
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
              active: true,
              validityDays: true,
              allowedDocumentCategories: true,
            },
          },
          evidence: {
            where: {
              fileUrl: document.fileUrl,
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
              reviewedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              uploadedAt: "desc",
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      },
    },
  });

  const linkedRequirements =
    application?.requirements.filter(
      (requirement) => requirement.evidence.length > 0,
    ) ?? [];

  const status = String(document.status).toUpperCase();

  const now = new Date();

  const isExpired =
    !!document.expiryDate &&
    document.expiryDate.getTime() < now.getTime();

  const daysUntilExpiry = document.expiryDate
    ? Math.ceil(
        (document.expiryDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const isExpiringSoon =
    daysUntilExpiry !== null &&
    daysUntilExpiry >= 0 &&
    daysUntilExpiry <= 30;

  const statusClasses =
    status === "APPROVED" ||
    status === "VERIFIED" ||
    status === "ACCEPTED"
      ? "bg-green-50 text-green-700"
      : status === "REJECTED"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

  const expiryClasses = isExpired
    ? "bg-red-50 text-red-700"
    : isExpiringSoon
      ? "bg-amber-50 text-amber-700"
      : "bg-green-50 text-green-700";

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div>
          <Link
            href="/dashboard/vendor/documents"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Link>

          <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses}`}
                >
                  {status.replace(/_/g, " ")}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {String(document.category).replace(/_/g, " ")}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                {document.name}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {document.vendor.companyName}
              </p>
            </div>

            <a
              href={document.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Download className="h-4 w-4" />
              View Document
            </a>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Document details */}
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Document Details
                </h2>
              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Document Name
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {document.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Category
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {String(document.category).replace(/_/g, " ")}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Document Status
                  </p>

                  <span
                    className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClasses}`}
                  >
                    {status.replace(/_/g, " ")}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    File Type
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {document.mimeType ?? "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    File Size
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {document.fileSize
                      ? `${Math.ceil(document.fileSize / 1024)} KB`
                      : "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Uploaded
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {document.uploadedAt.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Last Updated
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {document.updatedAt.toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Issued Date
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {document.issuedAt
                      ? document.issuedAt.toLocaleDateString()
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Expiry */}
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Expiry Information
                </h2>
              </div>

              <div className="p-6">
                {document.expiryDate ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <CalendarDays className="mt-0.5 h-5 w-5 text-slate-400" />

                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Expiry Date
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {document.expiryDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1.5 text-xs font-medium ${expiryClasses}`}
                    >
                      {isExpired
                        ? "Expired"
                        : isExpiringSoon
                          ? `Expires in ${daysUntilExpiry} day${
                              daysUntilExpiry === 1 ? "" : "s"
                            }`
                          : "Valid"}
                    </span>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No expiry date has been recorded for this document.
                  </p>
                )}
              </div>
            </Card>

            {/* Rejection */}
            {document.rejectionReason && (
              <Card>
                <div className="border-b border-red-100 bg-red-50 p-6">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5 text-red-600" />

                    <h2 className="font-semibold text-red-900">
                      Document Rejection Reason
                    </h2>
                  </div>
                </div>

                <div className="p-6">
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {document.rejectionReason}
                  </p>
                </div>
              </Card>
            )}

            {/* Evidence / requirements */}
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Verification Evidence
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Requirements for which this document has been submitted as
                  evidence.
                </p>
              </div>

              {linkedRequirements.length === 0 ? (
                <div className="p-6 text-sm leading-6 text-slate-500">
                  This document has not been linked to a vendor verification
                  requirement yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {linkedRequirements.map((requirement) => {
                    const evidence = requirement.evidence[0];

                    const requirementStatus =
                      String(requirement.status).toUpperCase();

                    const requirementStatusClasses =
                      requirementStatus === "SATISFIED"
                        ? "bg-green-50 text-green-700"
                        : requirementStatus === "REJECTED"
                          ? "bg-red-50 text-red-700"
                          : requirementStatus ===
                              "NEEDS_INFORMATION"
                            ? "bg-orange-50 text-orange-700"
                            : requirementStatus ===
                                "UNDER_REVIEW"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-amber-50 text-amber-700";

                    return (
                      <div key={requirement.id} className="p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-medium text-slate-900">
                                {requirement.name}
                              </h3>

                              {requirement.required && (
                                <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                                  Required
                                </span>
                              )}
                            </div>

                            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                              {String(requirement.category).replace(
                                /_/g,
                                " ",
                              )}
                            </p>

                            {requirement.description && (
                              <p className="mt-2 text-sm leading-6 text-slate-600">
                                {requirement.description}
                              </p>
                            )}
                          </div>

                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${requirementStatusClasses}`}
                          >
                            {requirementStatus.replace(/_/g, " ")}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="text-xs text-slate-400">
                              Evidence
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {evidence
                                ? evidence.status.replace(/_/g, " ")
                                : "Not submitted"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Review
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {requirement.reviewedAt
                                ? requirement.reviewedAt.toLocaleDateString()
                                : "Not reviewed"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Requirement
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {requirement.requirement.active
                                ? "Active"
                                : "Inactive"}
                            </p>
                          </div>
                        </div>

                        {evidence?.rejectionReason && (
                          <div className="mt-4 rounded-lg bg-red-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-red-700">
                              Evidence Rejection Reason
                            </p>

                            <p className="mt-1 text-sm leading-6 text-red-800">
                              {evidence.rejectionReason}
                            </p>
                          </div>
                        )}

                        {requirement.notes && (
                          <div className="mt-4 rounded-lg bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Review Notes
                            </p>

                            <p className="mt-1 text-sm leading-6 text-slate-600">
                              {requirement.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <FileText className="h-6 w-6" />
                </div>

                <h2 className="mt-4 font-semibold text-slate-900">
                  {document.name}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {String(document.category).replace(/_/g, " ")}
                </p>

                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                >
                  <Download className="h-4 w-4" />
                  Open Document
                </a>
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
                  {document.vendor.companyName}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Vendor ID: {document.vendor.id}
                </p>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-start gap-3">
                  {status === "APPROVED" ||
                  status === "VERIFIED" ? (
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-green-600" />
                  ) : (
                    <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600" />
                  )}

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Document Status
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {status === "APPROVED" ||
                      status === "VERIFIED"
                        ? "This document has been approved or verified."
                        : status === "REJECTED"
                          ? "This document requires attention before it can be used as verification evidence."
                          : "This document is awaiting review or verification."}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {application && (
              <Card>
                <div className="p-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Vendor Application
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {application.status.replace(/_/g, " ")}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Evidence linked to this document is reviewed as part of
                    the vendor onboarding application.
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}