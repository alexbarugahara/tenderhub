import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(date: Date | null | undefined) {
  if (!date) return "Not specified";

  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(date: Date | null | undefined) {
  if (!date) return "Not specified";

  return new Intl.DateTimeFormat("en-UG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatMoney(
  amount: number | string | null | undefined,
  currency?: {
    code: string;
    symbol: string | null;
    decimals: number;
  } | null,
) {
  if (amount == null) return "Not specified";

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: currency?.code ?? "UGX",
    minimumFractionDigits: currency?.decimals ?? 0,
    maximumFractionDigits: currency?.decimals ?? 2,
  }).format(numericAmount);
}

function isClosingSoon(closingDate: Date | null) {
  if (!closingDate) return false;

  const difference = closingDate.getTime() - Date.now();
  const days = difference / (1000 * 60 * 60 * 24);

  return days >= 0 && days <= 7;
}

export default async function SolicitationDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const solicitation = await prisma.solicitation.findFirst({
    where: {
      id,
      status: {
        in: ["PUBLISHED", "OPEN"],
      },
    },

    include: {
      organization: {
        include: {
          country: true,
          currency: true,
        },
      },

      procurement: {
        include: {
          department: true,
          country: true,
          currency: true,
        },
      },

      currency: true,

      classifications: {
        include: {
          classification: true,
        },
      },

      lots: {
        orderBy: {
          number: "asc",
        },
        include: {
          requirements: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      },

      requirements: {
        where: {
          lotId: null,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },

      documents: {
        orderBy: {
          createdAt: "asc",
        },
      },

      evaluationCriteria: {
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
  });

  if (!solicitation) {
    notFound();
  }

  const closingSoon = isClosingSoon(solicitation.closingDate);

  const documentRequirements = solicitation.requirements.filter(
    (requirement) => requirement.type === "DOCUMENT",
  );

  const nonDocumentRequirements = solicitation.requirements.filter(
    (requirement) => requirement.type !== "DOCUMENT",
  );

  const totalEvaluationWeight = solicitation.evaluationCriteria.reduce(
    (total, criterion) => total + Number(criterion.weight),
    0,
  );

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ======================================================
          HERO
      ====================================================== */}
      <section className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Link
            href="/solicitations"
            className="inline-flex items-center text-sm font-medium text-gray-600 transition hover:text-[#071A33]"
          >
            ← Back to solicitations
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  {formatEnum(solicitation.status)}
                </span>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {formatEnum(solicitation.type)}
                </span>

                <span className="text-sm text-gray-500">
                  {formatEnum(solicitation.procurementMethod)}
                </span>

                {closingSoon && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                    Closing soon
                  </span>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#071A33] sm:text-4xl">
                {solicitation.title}
              </h1>

              <p className="mt-3 text-sm text-gray-500">
                Solicitation No.{" "}
                <span className="font-semibold text-gray-700">
                  {solicitation.solicitationNumber}
                </span>
              </p>

              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Organization
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {solicitation.organization.name}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Procurement
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {formatEnum(solicitation.procurementMethod)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Opening
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {formatDateTime(solicitation.openingDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Closing
                  </p>
                  <p className="mt-1 font-semibold text-gray-800">
                    {formatDateTime(solicitation.closingDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Submission card */}
            <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">
                Submission deadline
              </p>

              <p className="mt-2 text-xl font-bold text-[#071A33]">
                {formatDate(solicitation.closingDate)}
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {formatDateTime(solicitation.closingDate)}
              </p>

              <div className="my-6 border-t" />

              <p className="text-sm font-medium text-gray-500">
                Application fee
              </p>

              {solicitation.applicationFeeRequired ? (
                <p className="mt-2 text-2xl font-bold text-[#071A33]">
                  {formatMoney(
                    solicitation.applicationFeeAmount == null
                      ? null
                      : Number(solicitation.applicationFeeAmount),
                    solicitation.currency,
                  )}
                </p>
              ) : (
                <p className="mt-2 text-2xl font-bold text-green-600">
                  Free
                </p>
              )}

              <Link
                href={`/dashboard/vendor/bids/new?solicitationId=${solicitation.id}`}
                className="mt-6 block w-full rounded-xl bg-[#071A33] px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#10294b]"
              >
                Submit a Bid
              </Link>

              <p className="mt-3 text-center text-xs text-gray-500">
                Vendor authentication may be required to submit a bid.
              </p>
            </aside>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
          <div className="space-y-8">
            {/* ==================================================
                DESCRIPTION
            ================================================== */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-[#071A33]">
                Solicitation overview
              </h2>

              <div className="mt-5 whitespace-pre-line text-sm leading-7 text-gray-700">
                {solicitation.description}
              </div>
            </section>

            {/* ==================================================
                PROCUREMENT INFORMATION
            ================================================== */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-[#071A33]">
                Procurement information
              </h2>

              <dl className="mt-6 grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Procurement reference
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {solicitation.procurement.referenceNumber}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Solicitation number
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {solicitation.solicitationNumber}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Solicitation type
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {formatEnum(solicitation.type)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Procurement method
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {formatEnum(solicitation.procurementMethod)}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Estimated value
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {formatMoney(
                      solicitation.estimatedValue == null
                        ? null
                        : Number(solicitation.estimatedValue),
                      solicitation.currency,
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Currency
                  </dt>
                  <dd className="mt-1 font-medium text-gray-900">
                    {solicitation.currency?.code ?? "Not specified"}
                  </dd>
                </div>

                {solicitation.procurement.department && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Department
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {solicitation.procurement.department.name}
                    </dd>
                  </div>
                )}

                {solicitation.procurement.country && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Country
                    </dt>
                    <dd className="mt-1 font-medium text-gray-900">
                      {solicitation.procurement.country.name}
                    </dd>
                  </div>
                )}
              </dl>
            </section>

            {/* ==================================================
                BID SECURITY
            ================================================== */}
            {solicitation.bidSecurityRequired && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
                <h2 className="text-xl font-bold text-[#071A33]">
                  Bid security
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-700">
                  Bid security is required for this solicitation.
                </p>

                {solicitation.bidSecurityAmount != null && (
                  <p className="mt-4 text-xl font-bold text-[#071A33]">
                    {formatMoney(
                      Number(solicitation.bidSecurityAmount),
                      solicitation.currency,
                    )}
                  </p>
                )}
              </section>
            )}

            {/* ==================================================
                LOTS
            ================================================== */}
            {solicitation.lots.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold text-[#071A33]">
                  Lots
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  This solicitation is divided into{" "}
                  {solicitation.lots.length}{" "}
                  {solicitation.lots.length === 1 ? "lot" : "lots"}.
                </p>

                <div className="mt-6 space-y-4">
                  {solicitation.lots.map((lot) => (
                    <div
                      key={lot.id}
                      className="rounded-xl border border-gray-200 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                            Lot {lot.number}
                          </p>

                          <h3 className="mt-1 text-lg font-semibold text-gray-900">
                            {lot.title}
                          </h3>
                        </div>

                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          {formatEnum(lot.status)}
                        </span>
                      </div>

                      {lot.description && (
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {lot.description}
                        </p>
                      )}

                      {lot.estimatedValue != null && (
                        <p className="mt-4 text-sm">
                          <span className="text-gray-500">
                            Estimated value:{" "}
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatMoney(
                              Number(lot.estimatedValue),
                              solicitation.currency,
                            )}
                          </span>
                        </p>
                      )}

                      {lot.requirements.length > 0 && (
                        <div className="mt-5 border-t pt-4">
                          <p className="text-sm font-semibold text-gray-900">
                            Lot requirements
                          </p>

                          <div className="mt-3 space-y-2">
                            {lot.requirements.map((requirement) => (
                              <div
                                key={requirement.id}
                                className="flex items-start gap-3 text-sm"
                              >
                                <span className="mt-1 text-[#D4AF37]">
                                  •
                                </span>

                                <div>
                                  <span className="font-medium text-gray-800">
                                    {requirement.title}
                                  </span>

                                  {requirement.isMandatory && (
                                    <span className="ml-2 text-xs font-semibold text-red-600">
                                      Mandatory
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ==================================================
                REQUIREMENTS
            ================================================== */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-[#071A33]">
                Requirements
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Review these requirements carefully before submitting a bid.
              </p>

              {nonDocumentRequirements.length === 0 ? (
                <div className="mt-6 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
                  No additional requirements have been specified.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {nonDocumentRequirements.map((requirement) => (
                    <div
                      key={requirement.id}
                      className="rounded-xl border border-gray-200 p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wide text-[#D4AF37]">
                            {formatEnum(requirement.type)}
                          </span>

                          <h3 className="mt-1 font-semibold text-gray-900">
                            {requirement.title}
                          </h3>
                        </div>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            requirement.isMandatory
                              ? "bg-red-50 text-red-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {requirement.isMandatory
                            ? "Mandatory"
                            : "Optional"}
                        </span>
                      </div>

                      {requirement.description && (
                        <p className="mt-3 text-sm leading-6 text-gray-600">
                          {requirement.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ==================================================
                DOCUMENT REQUIREMENTS
            ================================================== */}
            {documentRequirements.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold text-[#071A33]">
                  Required documents
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Documents that may need to accompany your bid.
                </p>

                <div className="mt-6 divide-y rounded-xl border border-gray-200">
                  {documentRequirements.map((requirement) => (
                    <div
                      key={requirement.id}
                      className="flex items-start justify-between gap-4 p-4"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {requirement.title}
                        </p>

                        {requirement.description && (
                          <p className="mt-1 text-sm text-gray-500">
                            {requirement.description}
                          </p>
                        )}
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          requirement.isMandatory
                            ? "bg-red-50 text-red-600"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {requirement.isMandatory ? "Required" : "Optional"}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ==================================================
                SOLICITATION DOCUMENTS
            ================================================== */}
            {solicitation.documents.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold text-[#071A33]">
                  Solicitation documents
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Download the official documents published with this
                  solicitation.
                </p>

                <div className="mt-6 space-y-3">
                  {solicitation.documents.map((document) => (
                    <a
                      key={document.id}
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-4 transition hover:border-[#D4AF37] hover:bg-gray-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-gray-900">
                          {document.name}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatEnum(document.category)}
                          {document.fileSize != null
                            ? ` • ${(Number(document.fileSize) / (1024 * 1024)).toFixed(2)} MB`
                            : ""}
                        </p>
                      </div>

                      <span className="shrink-0 text-sm font-semibold text-[#071A33]">
                        Download →
                      </span>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* ==================================================
                CLASSIFICATIONS
            ================================================== */}
            {solicitation.classifications.length > 0 && (
              <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                <h2 className="text-xl font-bold text-[#071A33]">
                  Classifications
                </h2>

                <div className="mt-5 flex flex-wrap gap-3">
                  {solicitation.classifications.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3"
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        {item.classification.type}
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {item.classification.code}
                      </p>

                      <p className="text-sm text-gray-600">
                        {item.classification.name}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ==================================================
                EVALUATION CRITERIA
            ================================================== */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-[#071A33]">
                    Evaluation criteria
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Bids will be assessed using the criteria below.
                  </p>
                </div>

                {solicitation.evaluationCriteria.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-500">
                      Total weighting:{" "}
                    </span>
                    <span className="font-bold text-[#071A33]">
                      {totalEvaluationWeight}%
                    </span>
                  </div>
                )}
              </div>

              {solicitation.evaluationCriteria.length === 0 ? (
                <div className="mt-6 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
                  Evaluation criteria have not been specified.
                </div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-xl border border-gray-200">
                  <div className="hidden grid-cols-[1fr_2fr_110px] gap-4 bg-gray-50 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 sm:grid">
                    <span>Criterion</span>
                    <span>Description</span>
                    <span className="text-right">Weight</span>
                  </div>

                  {solicitation.evaluationCriteria.map((criterion) => (
                    <div
                      key={criterion.id}
                      className="grid gap-3 border-t border-gray-200 px-5 py-4 sm:grid-cols-[1fr_2fr_110px] sm:gap-4"
                    >
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 sm:hidden">
                          Criterion
                        </p>

                        <p className="font-medium text-gray-900">
                          {criterion.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 sm:hidden">
                          Description
                        </p>

                        <p className="text-sm text-gray-600">
                          {criterion.description ||
                            "No description provided."}
                        </p>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 sm:hidden">
                          Weight
                        </p>

                        <p className="font-semibold text-[#071A33]">
                          {Number(criterion.weight)}%
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          Max {Number(criterion.maxScore)} points
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ==================================================
                APPLICATION FEE
            ================================================== */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-[#071A33]">
                Application fee
              </h2>

              {solicitation.applicationFeeRequired ? (
                <div className="mt-5">
                  <p className="text-3xl font-bold text-[#071A33]">
                    {formatMoney(
                      solicitation.applicationFeeAmount == null
                        ? null
                        : Number(solicitation.applicationFeeAmount),
                      solicitation.currency,
                    )}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    An application fee is required to submit a bid for this
                    solicitation.
                  </p>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="text-2xl font-bold text-green-600">
                    No application fee
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    There is no application fee specified for this
                    solicitation.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* ====================================================
              RIGHT SIDEBAR
          ==================================================== */}
          <aside className="space-y-6">
            {/* Organization */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#071A33]">
                Procuring organization
              </h2>

              <div className="mt-5">
                {solicitation.organization.logo ? (
                  <img
                    src={solicitation.organization.logo}
                    alt={solicitation.organization.name}
                    className="h-16 w-16 rounded-xl border object-contain p-2"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[#071A33] text-xl font-bold text-white">
                    {solicitation.organization.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  {solicitation.organization.name}
                </h3>

                {solicitation.organization.organizationType && (
                  <p className="mt-1 text-sm text-gray-500">
                    {formatEnum(
                      solicitation.organization.organizationType,
                    )}
                  </p>
                )}
              </div>

              {solicitation.organization.description && (
                <p className="mt-5 text-sm leading-6 text-gray-600">
                  {solicitation.organization.description}
                </p>
              )}

              <div className="mt-6 space-y-4 border-t pt-5 text-sm">
                {solicitation.organization.address && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Address
                    </p>

                    <p className="mt-1 text-gray-700">
                      {solicitation.organization.address}
                    </p>
                  </div>
                )}

                {solicitation.organization.country && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Country
                    </p>

                    <p className="mt-1 text-gray-700">
                      {solicitation.organization.country.name}
                    </p>
                  </div>
                )}

                {solicitation.organization.email && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Email
                    </p>

                    <a
                      href={`mailto:${solicitation.organization.email}`}
                      className="mt-1 block break-all text-[#071A33] hover:underline"
                    >
                      {solicitation.organization.email}
                    </a>
                  </div>
                )}

                {solicitation.organization.phone && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Phone
                    </p>

                    <p className="mt-1 text-gray-700">
                      {solicitation.organization.phone}
                    </p>
                  </div>
                )}

                {solicitation.organization.website && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Website
                    </p>

                    <a
                      href={solicitation.organization.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block break-all text-[#071A33] hover:underline"
                    >
                      {solicitation.organization.website}
                    </a>
                  </div>
                )}
              </div>
            </section>

            {/* Key information */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#071A33]">
                Key information
              </h2>

              <dl className="mt-5 space-y-4 text-sm">
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500">Status</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {formatEnum(solicitation.status)}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500">Type</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {formatEnum(solicitation.type)}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500">Method</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {formatEnum(solicitation.procurementMethod)}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500">Lots</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {solicitation.lots.length}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500">Requirements</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {solicitation.requirements.length}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500">Documents</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {solicitation.documents.length}
                  </dd>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <dt className="text-gray-500">Published</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {formatDate(solicitation.publishedAt)}
                  </dd>
                </div>
              </dl>
            </section>

            {/* Submission costs */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#071A33]">
                Submission costs
              </h2>

              <div className="mt-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-gray-500">
                    Application fee
                  </span>

                  <span className="text-right font-semibold text-gray-900">
                    {solicitation.applicationFeeRequired
                      ? formatMoney(
                          solicitation.applicationFeeAmount == null
                            ? null
                            : Number(solicitation.applicationFeeAmount),
                          solicitation.currency,
                        )
                      : "Free"}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-4">
                  <span className="text-sm text-gray-500">
                    Bid security
                  </span>

                  <span className="text-right font-semibold text-gray-900">
                    {solicitation.bidSecurityRequired
                      ? formatMoney(
                          solicitation.bidSecurityAmount == null
                            ? null
                            : Number(solicitation.bidSecurityAmount),
                          solicitation.currency,
                        )
                      : "Not required"}
                  </span>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* ======================================================
            BOTTOM CTA
        ====================================================== */}
        <section className="mt-10 overflow-hidden rounded-2xl bg-[#071A33] px-6 py-8 text-white sm:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-[#D4AF37]">
                {solicitation.solicitationNumber}
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Ready to submit your bid?
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
                Review the solicitation requirements, documents, lots and
                evaluation criteria before submitting your response.
              </p>
            </div>

            <Link
              href={`/dashboard/vendor/bids/new?solicitationId=${solicitation.id}`}
              className="shrink-0 rounded-xl bg-[#D4AF37] px-6 py-3 text-sm font-bold text-[#071A33] transition hover:brightness-95"
            >
              Submit a Bid →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}