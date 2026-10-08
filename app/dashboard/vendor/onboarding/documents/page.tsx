import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileCheck2,
  ShieldCheck,
  Upload,
  AlertCircle,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import VendorDocumentUploadForm from "@/components/vendors/VendorDocumentUploadForm";

type RequirementStatus =
  | "OUTSTANDING"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "SATISFIED"
  | "REJECTED"
  | "NEEDS_INFORMATION"
  | "NOT_APPLICABLE";

type UploadRequirementStatus =
  | "PENDING"
  | "APPROVED"
  | "OUTSTANDING";

function formatStatus(status: RequirementStatus | string) {
  switch (status) {
    case "SATISFIED":
      return "Verified";

    case "NOT_APPLICABLE":
      return "Not applicable";

    case "REJECTED":
      return "Requires correction";

    case "NEEDS_INFORMATION":
      return "Information required";

    case "UNDER_REVIEW":
      return "Under review";

    case "SUBMITTED":
      return "Evidence submitted";

    case "OUTSTANDING":
    default:
      return "Evidence required";
  }
}

function statusClasses(status: RequirementStatus | string) {
  switch (status) {
    case "SATISFIED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";

    case "NOT_APPLICABLE":
      return "border-slate-200 bg-slate-50 text-slate-600";

    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";

    case "NEEDS_INFORMATION":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "UNDER_REVIEW":
    case "SUBMITTED":
      return "border-blue-200 bg-blue-50 text-blue-700";

    default:
      return "border-slate-200 bg-slate-50 text-slate-600";
  }
}

function getUploadRequirementStatus(
  status: RequirementStatus,
): UploadRequirementStatus {
  switch (status) {
    case "SATISFIED":
    case "NOT_APPLICABLE":
      return "APPROVED";

    case "SUBMITTED":
    case "UNDER_REVIEW":
      return "PENDING";

    case "REJECTED":
    case "NEEDS_INFORMATION":
    case "OUTSTANDING":
    default:
      return "OUTSTANDING";
  }
}

function formatEvidenceStatus(status: string) {
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

function evidenceStatusClasses(status: string) {
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

function formatApplicationStatus(status: string) {
  switch (status) {
    case "APPROVED":
      return "Approved";

    case "UNDER_REVIEW":
      return "Under review";

    case "NEEDS_INFORMATION":
      return "Information required";

    case "REJECTED":
      return "Rejected";

    case "SUBMITTED":
      return "Submitted";

    case "WITHDRAWN":
      return "Withdrawn";

    case "DRAFT":
    default:
      return "Draft";
  }
}

function applicationStatusClasses(status: string) {
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

function formatDocumentCategory(category: string) {
  return category
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase(),
    );
}

export default async function VendorOnboardingDocumentsPage() {
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
          expiryDate: true,
          uploadedAt: true,
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
              Complete your vendor profile before submitting
              onboarding evidence.
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
   * The vendor application is the controlling record for
   * TenderHub vendor onboarding.
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
      },
    });

  /*
   * The global requirement catalogue is still loaded separately.
   *
   * This allows the page to remain useful even if an application
   * has not yet been initialized with its requirement snapshot.
   */
  const requirements = await prisma.vendorRequirement.findMany({
    where: {
      active: true,
    },
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
      code: true,
      name: true,
      description: true,
      category: true,
      required: true,
      active: true,
      validityDays: true,
      allowedDocumentCategories: true,
    },
  });

  /*
   * No application means there is no valid place to attach
   * VendorApplicationEvidence yet.
   */
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
              Onboarding Evidence
            </h1>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Your TenderHub vendor onboarding application must
              be created before evidence can be submitted.
            </p>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50 p-6">
          <div className="flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

            <div>
              <h2 className="font-semibold text-amber-900">
                Vendor application not started
              </h2>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                TenderHub has not created your vendor onboarding
                application yet. Start the onboarding process before
                uploading verification documents.
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

        <Card className="overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="font-semibold text-slate-950">
              TenderHub verification requirements
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              These are the platform requirements used for TenderHub
              vendor approval.
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {requirements.map((requirement) => (
              <div
                key={requirement.id}
                className="px-6 py-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">
                        {requirement.name}
                      </h3>

                      {requirement.required && (
                        <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                          Required
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                      {requirement.code}
                    </p>

                    {requirement.description && (
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                        {requirement.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-left lg:text-right">
                    {requirement.allowedDocumentCategories.length >
                    0 ? (
                      <p className="max-w-[240px] text-xs leading-5 text-slate-500 lg:text-right">
                        Accepted evidence:{" "}
                        {requirement.allowedDocumentCategories
                          .map(formatDocumentCategory)
                          .join(", ")}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Administrative check
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    );
  }

  /*
   * Application requirements are the authoritative status records.
   */
  const applicationRequirements =
    application.requirements;

  const requiredRequirements =
    applicationRequirements.filter(
      (requirement) => requirement.required,
    );

  const satisfiedRequired =
    requiredRequirements.filter(
      (requirement) =>
        requirement.status === "SATISFIED" ||
        requirement.status === "NOT_APPLICABLE",
    ).length;

  const completionPercentage =
    requiredRequirements.length > 0
      ? Math.round(
          (satisfiedRequired /
            requiredRequirements.length) *
            100,
        )
      : 0;

  const documentsForUpload =
    applicationRequirements.map((applicationRequirement) => {
      const status =
        applicationRequirement.status;

      return {
        id: applicationRequirement.requirementId,
        code: applicationRequirement.code,
        name: applicationRequirement.name,
        description:
          applicationRequirement.description,
        category: applicationRequirement.category,
        required: applicationRequirement.required,
        active:
          applicationRequirement.requirement.active,
        validityDays:
          applicationRequirement.requirement.validityDays,
        allowedDocumentCategories:
          applicationRequirement.requirement
            .allowedDocumentCategories,

        status: getUploadRequirementStatus(status),
      };
    });

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
                Onboarding Evidence
              </h1>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
                Submit the documents required for TenderHub vendor
                approval. Uploaded evidence is reviewed by TenderHub
                administrators and is not automatically approved.
              </p>
            </div>

            {vendor.verifiedAt ? (
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Vendor approved
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-700">
                <Clock3 className="h-4 w-4" />
                Approval pending
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application summary */}
      <Card className="border-slate-200 bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Vendor onboarding application
              </p>

              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-medium ${applicationStatusClasses(
                  application.status,
                )}`}
              >
                {formatApplicationStatus(
                  application.status,
                )}
              </span>
            </div>

            <h2 className="mt-2 text-lg font-semibold text-slate-950">
              {application.companyName ||
                application.legalName ||
                vendor.companyName ||
                vendor.legalName ||
                "Vendor"}
            </h2>

            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
              <span>
                Registration:{" "}
                <strong className="font-medium text-slate-700">
                  {application.registrationNumber ||
                    vendor.registrationNumber ||
                    "Not provided"}
                </strong>
              </span>

              <span>
                Tax number:{" "}
                <strong className="font-medium text-slate-700">
                  {application.taxNumber ||
                    vendor.taxNumber ||
                    "Not provided"}
                </strong>
              </span>
            </div>
          </div>

          <div className="min-w-[240px]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">
                Required compliance
              </span>

              <span className="text-sm font-semibold text-slate-950">
                {completionPercentage}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#D4AF37] transition-all"
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {satisfiedRequired} of{" "}
              {requiredRequirements.length} required
              requirements satisfied
            </p>
          </div>
        </div>
      </Card>

      {/* Evidence upload */}
      {!vendor.verifiedAt && (
        <Card className="p-6">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-lg bg-slate-100 p-2.5">
              <Upload className="h-5 w-5 text-slate-700" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-950">
                Submit evidence
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Select a TenderHub requirement and upload the
                appropriate supporting document.
              </p>
            </div>
          </div>

          <VendorDocumentUploadForm
            vendorId={vendor.id}
            requirements={documentsForUpload}
          />
        </Card>
      )}

      {/* Requirements */}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="font-semibold text-slate-950">
            TenderHub verification requirements
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            These are the global requirements used to determine
            whether a vendor can be approved on TenderHub.
          </p>
        </div>

        {applicationRequirements.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileCheck2 className="mx-auto h-9 w-9 text-slate-400" />

            <h3 className="mt-3 font-semibold text-slate-950">
              No requirements assigned
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              No onboarding requirements have been assigned to
              this vendor application yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {applicationRequirements.map(
              (applicationRequirement) => {
                const requirement =
                  applicationRequirement.requirement;

                const status =
                  applicationRequirement.status;

                const latestEvidence =
                  applicationRequirement.evidence[0] ??
                  null;

                const latestDocument =
                  latestEvidence
                    ? vendor.documents.find(
                        (document) =>
                          document.fileUrl ===
                          latestEvidence.fileUrl,
                      )
                    : null;

                return (
                  <div
                    key={applicationRequirement.id}
                    className="px-6 py-5"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">
                            {applicationRequirement.name}
                          </h3>

                          {applicationRequirement.required && (
                            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
                              Required
                            </span>
                          )}

                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-medium ${statusClasses(
                              status,
                            )}`}
                          >
                            {formatStatus(status)}
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                          {applicationRequirement.code}
                        </p>

                        {applicationRequirement.description && (
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                            {
                              applicationRequirement.description
                            }
                          </p>
                        )}

                        {applicationRequirement.notes && (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                              Administrator note
                            </p>

                            <p className="mt-1 text-sm leading-5 text-amber-900">
                              {
                                applicationRequirement.notes
                              }
                            </p>
                          </div>
                        )}

                        {latestEvidence && (
                          <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex items-start gap-3">
                              <FileCheck2 className="mt-0.5 h-4 w-4 text-slate-500" />

                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="text-sm font-medium text-slate-800">
                                    Evidence received
                                  </p>

                                  <span
                                    className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${evidenceStatusClasses(
                                      latestEvidence.status,
                                    )}`}
                                  >
                                    {formatEvidenceStatus(
                                      latestEvidence.status,
                                    )}
                                  </span>
                                </div>

                                <p className="mt-0.5 text-xs text-slate-500">
                                  {latestEvidence.name}
                                  {" · "}
                                  {formatDocumentCategory(
                                    latestEvidence.category,
                                  )}
                                </p>

                                {latestDocument && (
                                  <p className="mt-1 text-xs text-slate-500">
                                    Uploaded{" "}
                                    {latestDocument.uploadedAt.toLocaleDateString(
                                      "en-GB",
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
                                  Evidence received does not mean
                                  the requirement has passed. TenderHub
                                  administration must review it.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 text-left lg:text-right">
                        {requirement.allowedDocumentCategories
                          .length > 0 ? (
                          <>
                            <p className="text-xs font-medium text-slate-500">
                              Accepted evidence
                            </p>

                            <p className="mt-1 max-w-[220px] text-xs leading-5 text-slate-600 lg:text-right">
                              {requirement.allowedDocumentCategories
                                .map(formatDocumentCategory)
                                .join(", ")}
                            </p>
                          </>
                        ) : (
                          <p className="text-xs text-slate-400">
                            Administrative check
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </Card>

      {/* Important notice */}
      <Card className="border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

          <div>
            <h3 className="font-semibold text-amber-900">
              Important
            </h3>

            <p className="mt-1 text-sm leading-6 text-amber-800">
              Uploading evidence means that TenderHub has received
              the document. It does not mean the requirement has
              passed. An administrator will review the evidence and
              may accept it, reject it, or request further
              information.
            </p>
          </div>
        </div>
      </Card>
    </main>
  );
}