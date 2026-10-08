import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getRequirementStatusClasses(status: string) {
  switch (status) {
    case "SATISFIED":
    case "NOT_APPLICABLE":
      return "bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    case "NEEDS_INFORMATION":
      return "bg-amber-50 text-amber-700";

    case "UNDER_REVIEW":
    case "SUBMITTED":
      return "bg-blue-50 text-blue-700";

    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getEvidenceStatusClasses(status: string) {
  switch (status) {
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700";

    case "REJECTED":
      return "bg-red-50 text-red-700";

    case "EXPIRED":
      return "bg-amber-50 text-amber-700";

    default:
      return "bg-blue-50 text-blue-700";
  }
}

export default async function VendorDetailPage({ params }: PageProps) {
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

      user: {
        select: {
          id: true,
          image: true,
          name: true,
        },
      },

      country: {
        select: {
          id: true,
          name: true,
        },
      },

      certifications: {
        orderBy: {
          name: "asc",
        },
      },

      classifications: {
        include: {
          classification: true,
        },
        orderBy: {
          classification: {
            name: "asc",
          },
        },
      },

      documents: {
        orderBy: {
          uploadedAt: "desc",
        },
        take: 10,
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
  });

  if (!vendor) {
    notFound();
  }

  /*
   * Vendor approval is represented by VendorApplication.
   *
   * Vendor.userId is not exposed by the current Prisma result because
   * the relation is being selected through `user`.
   *
   * We therefore select user.id above and resolve the application
   * using that ID.
   */
  const application = vendor.user?.id
    ? await prisma.vendorApplication.findUnique({
        where: {
          userId: vendor.user.id,
        },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          reviewedAt: true,

          requirements: {
            orderBy: {
              createdAt: "asc",
            },
            select: {
              id: true,
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
                  status: true,
                  uploadedAt: true,
                  issuedAt: true,
                  expiryDate: true,
                  rejectionReason: true,
                },
              },
            },
          },
        },
      })
    : null;

  const classifications = vendor.classifications.map(
    (item) => item.classification
  );

  const activeCertifications = vendor.certifications.filter(
    (certification) =>
      !certification.expiryDate ||
      new Date(certification.expiryDate) >= new Date()
  );

  const activeRequirements =
    application?.requirements.filter(
      (requirement) => requirement.requirement.active
    ) ?? [];

  const requiredRequirements = activeRequirements.filter(
    (requirement) => requirement.required
  );

  const satisfiedRequired = requiredRequirements.filter(
    (requirement) =>
      requirement.status === "SATISFIED" ||
      requirement.status === "NOT_APPLICABLE"
  );

  const rejectedRequired = requiredRequirements.filter(
    (requirement) => requirement.status === "REJECTED"
  );

  const needsInformationRequired = requiredRequirements.filter(
    (requirement) => requirement.status === "NEEDS_INFORMATION"
  );

  const completionPercentage =
    requiredRequirements.length > 0
      ? Math.round(
          (satisfiedRequired.length / requiredRequirements.length) * 100
        )
      : 0;

  const initials =
    vendor.companyName
      ?.split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "V";

  const applicationApproved =
    application?.status === "APPROVED" || Boolean(vendor.verifiedAt);

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#071A33] text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="mb-8">
            <Link
              href="/vendors"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              ← Back to Vendors
            </Link>
          </div>

          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-2xl font-bold text-[#071A33]">
                {vendor.user?.image ? (
                  <img
                    src={vendor.user.image}
                    alt={vendor.companyName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {applicationApproved && (
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      ✓ Verified Vendor
                    </span>
                  )}

                  {vendor.country?.name && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                      {vendor.country.name}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {vendor.companyName}
                </h1>

                {vendor.legalName &&
                  vendor.legalName !== vendor.companyName && (
                    <p className="mt-2 text-slate-300">{vendor.legalName}</p>
                  )}

                {vendor.businessType && (
                  <p className="mt-3 text-sm text-slate-400">
                    {vendor.businessType}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/solicitations"
                className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#071A33] transition hover:bg-[#e2c65c]"
              >
                Browse Solicitations
              </Link>

              <Link
                href="/auth/register"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Join TenderHub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Column */}
          <div className="space-y-8 lg:col-span-2">
            {/* About */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-[#071A33]">
                About the Vendor
              </h2>

              <div className="mt-5">
                {vendor.description ? (
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {vendor.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    No company description has been provided.
                  </p>
                )}
              </div>
            </section>

            {/* Business Profile */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-[#071A33]">
                Business Profile
              </h2>

              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <InfoItem
                  label="Country"
                  value={vendor.country?.name || "Not specified"}
                />

                <InfoItem
                  label="Business Type"
                  value={vendor.businessType || "Not specified"}
                />

                <InfoItem
                  label="Employees"
                  value={
                    vendor.numberOfEmployees !== null &&
                    vendor.numberOfEmployees !== undefined
                      ? vendor.numberOfEmployees.toLocaleString()
                      : "Not specified"
                  }
                />

                <InfoItem
                  label="Years Operating"
                  value={
                    vendor.yearsOperating !== null &&
                    vendor.yearsOperating !== undefined
                      ? `${vendor.yearsOperating} years`
                      : "Not specified"
                  }
                />

                <InfoItem
                  label="Registration Number"
                  value={vendor.registrationNumber || "Not provided"}
                />

                <InfoItem
                  label="Tax Number"
                  value={vendor.taxNumber || "Not provided"}
                />
              </div>
            </section>

            {/* Capabilities */}
            {(vendor.portfolioDescription ||
              vendor.operatingLocations ||
              classifications.length > 0) && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold text-[#071A33]">
                  Capabilities & Classifications
                </h2>

                <div className="mt-6 space-y-6">
                  {vendor.portfolioDescription && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Portfolio
                      </h3>

                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                        {vendor.portfolioDescription}
                      </p>
                    </div>
                  )}

                  {vendor.operatingLocations && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Operating Locations
                      </h3>

                      <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                        {vendor.operatingLocations}
                      </p>
                    </div>
                  )}

                  {classifications.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        Classifications
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {classifications.map((classification) => (
                          <span
                            key={classification.id}
                            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700"
                          >
                            {classification.code} · {classification.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Certifications */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#071A33]">
                    Certifications
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Professional certifications recorded for this vendor.
                  </p>
                </div>

                {activeCertifications.length > 0 && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {activeCertifications.length} active
                  </span>
                )}
              </div>

              {vendor.certifications.length > 0 ? (
                <div className="mt-6 divide-y divide-slate-100">
                  {vendor.certifications.map((certification) => {
                    const isExpired =
                      certification.expiryDate &&
                      new Date(certification.expiryDate) < new Date();

                    return (
                      <div
                        key={certification.id}
                        className="flex flex-col gap-3 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {certification.name}
                          </h3>

                          {certification.issuingBody && (
                            <p className="mt-1 text-sm text-slate-500">
                              Issued by {certification.issuingBody}
                            </p>
                          )}

                          {certification.certificateNumber && (
                            <p className="mt-1 text-xs text-slate-400">
                              Certificate: {certification.certificateNumber}
                            </p>
                          )}
                        </div>

                        <div className="shrink-0">
                          {isExpired ? (
                            <span className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700">
                              Expired
                            </span>
                          ) : (
                            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    No certifications have been listed.
                  </p>
                </div>
              )}
            </section>

            {/* TenderHub Approval */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#071A33]">
                    TenderHub Approval
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Platform-level vendor onboarding and verification status.
                  </p>
                </div>

                {application && (
                  <span
                    className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${getRequirementStatusClasses(
                      application.status === "APPROVED"
                        ? "SATISFIED"
                        : application.status === "REJECTED"
                          ? "REJECTED"
                          : application.status === "NEEDS_INFORMATION"
                            ? "NEEDS_INFORMATION"
                            : application.status === "UNDER_REVIEW"
                              ? "UNDER_REVIEW"
                              : "SUBMITTED"
                    )}`}
                  >
                    {formatStatus(application.status)}
                  </span>
                )}
              </div>

              {application ? (
                <>
                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-600">
                        Required requirements
                      </span>

                      <span className="text-sm font-semibold text-slate-950">
                        {completionPercentage}%
                      </span>
                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-[#D4AF37]"
                        style={{
                          width: `${completionPercentage}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      {satisfiedRequired.length} of{" "}
                      {requiredRequirements.length} required requirements
                      satisfied.
                    </p>
                  </div>

                  {activeRequirements.length > 0 ? (
                    <div className="mt-6 space-y-3">
                      {activeRequirements.map((requirement) => {
                        const evidence = requirement.evidence;

                        return (
                          <div
                            key={requirement.id}
                            className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-sm font-semibold text-slate-900">
                                    {requirement.name}
                                  </h3>

                                  {requirement.required && (
                                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700">
                                      Required
                                    </span>
                                  )}
                                </div>

                                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                                  {requirement.code}
                                </p>

                                {requirement.description && (
                                  <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {requirement.description}
                                  </p>
                                )}
                              </div>

                              <span
                                className={`w-fit shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getRequirementStatusClasses(
                                  requirement.status
                                )}`}
                              >
                                {formatStatus(requirement.status)}
                              </span>
                            </div>

                            {requirement.notes && (
                              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                  Review note
                                </p>

                                <p className="mt-1 text-sm text-slate-700">
                                  {requirement.notes}
                                </p>
                              </div>
                            )}

                            {evidence.length > 0 && (
                              <div className="mt-4 border-t border-slate-200 pt-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Evidence
                                </p>

                                <div className="mt-2 space-y-2">
                                  {evidence.map((item) => (
                                    <div
                                      key={item.id}
                                      className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                                    >
                                      <div>
                                        <p className="text-sm font-medium text-slate-800">
                                          {item.name}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                          {item.category}
                                        </p>

                                        {item.expiryDate && (
                                          <p className="mt-1 text-xs text-slate-400">
                                            Expires{" "}
                                            {new Date(
                                              item.expiryDate
                                            ).toLocaleDateString("en-UG")}
                                          </p>
                                        )}
                                      </div>

                                      <span
                                        className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getEvidenceStatusClasses(
                                          item.status
                                        )}`}
                                      >
                                        {formatStatus(item.status)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
                      <p className="text-sm text-slate-500">
                        No vendor onboarding requirements are currently
                        associated with this application.
                      </p>
                    </div>
                  )}

                  {(rejectedRequired.length > 0 ||
                    needsInformationRequired.length > 0) && (
                    <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-sm leading-6 text-amber-800">
                        Some vendor onboarding requirements require additional
                        information or correction before approval can be
                        completed.
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    This vendor does not currently have a TenderHub onboarding
                    application.
                  </p>
                </div>
              )}
            </section>

            {/* Documents */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-[#071A33]">
                Submitted Documents
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Documents uploaded as part of the vendor profile.
              </p>

              {vendor.documents.length > 0 ? (
                <div className="mt-6 divide-y divide-slate-100">
                  {vendor.documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {document.name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          {document.category} · Uploaded{" "}
                          {new Date(document.uploadedAt).toLocaleDateString(
                            "en-UG"
                          )}
                        </p>

                        {document.expiryDate && (
                          <p className="mt-1 text-xs text-slate-400">
                            Expires{" "}
                            {new Date(document.expiryDate).toLocaleDateString(
                              "en-UG"
                            )}
                          </p>
                        )}
                      </div>

                      <span
                        className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getEvidenceStatusClasses(
                          document.status
                        )}`}
                      >
                        {formatStatus(document.status)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
                  <p className="text-sm text-slate-500">
                    No vendor documents have been uploaded.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Contact */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#071A33]">
                Contact Information
              </h2>

              <div className="mt-5 space-y-4">
                {vendor.email && (
                  <ContactItem
                    label="Email"
                    value={vendor.email}
                    href={`mailto:${vendor.email}`}
                  />
                )}

                {vendor.phone && (
                  <ContactItem
                    label="Phone"
                    value={vendor.phone}
                    href={`tel:${vendor.phone}`}
                  />
                )}

                {vendor.website && (
                  <ContactItem
                    label="Website"
                    value={vendor.website.replace(/^https?:\/\//, "")}
                    href={
                      vendor.website.startsWith("http")
                        ? vendor.website
                        : `https://${vendor.website}`
                    }
                    external
                  />
                )}

                {vendor.address && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Address
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {vendor.address}
                    </p>
                  </div>
                )}

                {!vendor.email &&
                  !vendor.phone &&
                  !vendor.website &&
                  !vendor.address && (
                    <p className="text-sm text-slate-500">
                      Contact information has not been provided publicly.
                    </p>
                  )}
              </div>
            </section>

            {/* Vendor Status */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#071A33]">
                Vendor Status
              </h2>

              <div className="mt-5 space-y-4">
                <StatusRow
                  label="Verification"
                  value={applicationApproved ? "Verified" : "Not verified"}
                  positive={applicationApproved}
                />

                <StatusRow
                  label="Application"
                  value={
                    application
                      ? formatStatus(application.status)
                      : "Not started"
                  }
                  positive={applicationApproved}
                />

                <StatusRow
                  label="Requirements"
                  value={
                    requiredRequirements.length > 0
                      ? `${satisfiedRequired.length}/${requiredRequirements.length} satisfied`
                      : "No requirements"
                  }
                  positive={
                    requiredRequirements.length > 0 &&
                    satisfiedRequired.length === requiredRequirements.length
                  }
                />

                <StatusRow
                  label="Certifications"
                  value={
                    vendor.certifications.length > 0
                      ? `${vendor.certifications.length} listed`
                      : "None listed"
                  }
                  positive={activeCertifications.length > 0}
                />

                <StatusRow
                  label="Documents"
                  value={`${vendor.documents.length} uploaded`}
                  positive={vendor.documents.length > 0}
                />
              </div>
            </section>

            {/* CTA */}
            <section className="rounded-3xl bg-[#071A33] p-6 text-white shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37] text-lg font-bold text-[#071A33]">
                TH
              </div>

              <h2 className="text-lg font-bold">
                Find procurement opportunities
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Explore active solicitations from organizations around the
                world and discover opportunities relevant to your business.
              </p>

              <Link
                href="/solicitations"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#071A33] transition hover:bg-slate-100"
              >
                Browse Solicitations
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function ContactItem({
  label,
  value,
  href,
  external = false,
}: {
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="mt-1 block break-all text-sm font-medium text-[#071A33] hover:underline"
      >
        {value}
      </a>
    </div>
  );
}

function StatusRow({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-slate-500">{label}</span>

      <span
        className={`text-right text-sm font-semibold ${
          positive ? "text-emerald-700" : "text-slate-700"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
