import Link from "next/link";

import { SolicitationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

interface SolicitationsPageProps {
  searchParams: Promise<{
    type?: string;
  }>;
}

const solicitationTypeOptions = [
  {
    value: "ALL",
    label: "All",
  },
  {
    value: "RFP",
    label: "RFP",
  },
  {
    value: "RFQ",
    label: "RFQ",
  },
  {
    value: "ITB",
    label: "ITB",
  },
  {
    value: "ITT",
    label: "ITT",
  },
  {
    value: "EOI",
    label: "EOI",
  },
  {
    value: "RFI",
    label: "RFI",
  },
] as const;

function formatDate(date: Date | null) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-UG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatAmount(
  amount: unknown,
  currencyCode?: string | null,
  currencySymbol?: string | null,
) {
  if (amount === null || amount === undefined) {
    return "Not disclosed";
  }

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return "Not disclosed";
  }

  const code = currencyCode || "UGX";

  try {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: code,
      maximumFractionDigits: 0,
    }).format(numericAmount);
  } catch {
    return `${currencySymbol || code} ${numericAmount.toLocaleString(
      "en-UG",
    )}`;
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "PUBLISHED":
      return "Published";
    case "OPEN":
      return "Open";
    case "UNDER_EVALUATION":
      return "Under Evaluation";
    case "AWARDED":
      return "Awarded";
    case "CLOSED":
      return "Closed";
    case "SUSPENDED":
      return "Suspended";
    default:
      return status.replaceAll("_", " ");
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case "RFI":
      return "Request for Information";
    case "RFQ":
      return "Request for Quotation";
    case "RFP":
      return "Request for Proposal";
    case "IFB":
      return "Invitation for Bid";
    case "ITB":
      return "Invitation to Bid";
    case "ITT":
      return "Invitation to Tender";
    case "EOI":
      return "Expression of Interest";
    case "OTHER":
      return "Other";
    default:
      return type;
  }
}

function getMethodLabel(method: string) {
  switch (method) {
    case "OPEN":
      return "Open";
    case "RESTRICTED":
      return "Restricted";
    case "REQUEST_FOR_QUOTATION":
      return "Request for Quotation";
    case "RFQ":
      return "Request for Quotation";
    case "DIRECT":
      return "Direct";
    case "NEGOTIATED":
      return "Negotiated";
    default:
      return method.replaceAll("_", " ");
  }
}

function getValidType(value?: string): SolicitationType | undefined {
  if (!value) {
    return undefined;
  }

  if (
    Object.values(SolicitationType).includes(
      value as SolicitationType,
    )
  ) {
    return value as SolicitationType;
  }

  return undefined;
}

export default async function SolicitationsPage({
  searchParams,
}: SolicitationsPageProps) {
  const params = await searchParams;

  const selectedType = getValidType(params.type);

  const solicitations = await prisma.solicitation.findMany({
    where: {
      status: {
        in: [
          "PUBLISHED",
          "OPEN",
          "UNDER_EVALUATION",
          "AWARDED",
          "CLOSED",
        ],
      },
      ...(selectedType
        ? {
            type: selectedType,
          }
        : {}),
    },
    include: {
      organization: {
        include: {
          country: true,
        },
      },
      currency: true,
      procurement: {
        include: {
          department: true,
          country: true,
          currency: true,
        },
      },
      lots: {
        select: {
          id: true,
        },
      },
      requirements: {
        select: {
          id: true,
        },
      },
      documents: {
        select: {
          id: true,
        },
      },
      evaluationCriteria: {
        select: {
          id: true,
        },
      },
    },
    orderBy: [
      {
        closingDate: "asc",
      },
      {
        publishedAt: "desc",
      },
    ],
  });

  const activeSolicitations = solicitations.filter(
    (solicitation) => {
      if (!solicitation.closingDate) {
        return true;
      }

      return solicitation.closingDate >= new Date();
    },
  );

  const pageTitle = selectedType
    ? `${getTypeLabel(selectedType)} Opportunities`
    : "Procurement Opportunities";

  const pageDescription = selectedType
    ? `Browse ${getTypeLabel(
        selectedType,
      )} procurement opportunities published by organizations on TenderHub.`
    : "Browse procurement opportunities published by organizations on TenderHub and find opportunities that match your business.";

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              Procurement opportunities
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              {pageTitle}
            </h1>

            <p className="mt-4 text-lg leading-7 text-muted-foreground">
              {pageDescription}
            </p>
          </div>
        </div>
      </section>

      {/* Type filters */}
      <section className="border-b bg-background">
        <div className="mx-auto max-w-7xl px-6 py-5 sm:px-8 lg:px-12">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 text-sm font-semibold text-muted-foreground">
              Browse by type:
            </span>

            {solicitationTypeOptions.map((option) => {
              const isSelected =
                option.value === "ALL"
                  ? !selectedType
                  : selectedType === option.value;

              const href =
                option.value === "ALL"
                  ? "/solicitations"
                  : `/solicitations?type=${option.value}`;

              return (
                <Link
                  key={option.value}
                  href={href}
                  className={
                    isSelected
                      ? "rounded-full bg-tenderhub-navy px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-full border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:border-tenderhub-navy hover:text-tenderhub-navy"
                  }
                >
                  {option.label}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Results */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
          <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {selectedType
                  ? `${getTypeLabel(selectedType)} Opportunities`
                  : "Open solicitations"}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {activeSolicitations.length}{" "}
                {activeSolicitations.length === 1
                  ? "opportunity"
                  : "opportunities"}{" "}
                currently available
              </p>
            </div>
          </div>

          {activeSolicitations.length === 0 ? (
            <div className="rounded-2xl border bg-card px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tenderhub-navy/10 text-2xl">
                📋
              </div>

              <h3 className="mt-5 text-xl font-semibold">
                No open opportunities right now
              </h3>

              <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
                {selectedType
                  ? `There are currently no active ${getTypeLabel(
                      selectedType,
                    )} opportunities available. Check back soon for new solicitations.`
                  : "There are currently no active procurement opportunities available. Check back soon for new solicitations."}
              </p>

              {selectedType ? (
                <Link
                  href="/solicitations"
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  View All Opportunities
                </Link>
              ) : (
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                >
                  Return Home
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2">
              {activeSolicitations.map((solicitation) => {
                const currencyCode =
                  solicitation.currency?.code ||
                  solicitation.procurement.currency?.code ||
                  "UGX";

                const currencySymbol =
                  solicitation.currency?.symbol ||
                  solicitation.procurement.currency?.symbol;

                return (
                  <article
                    key={solicitation.id}
                    className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* Status + Type */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          solicitation.status === "OPEN"
                            ? "bg-tenderhub-navy/10 text-tenderhub-navy"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {getStatusLabel(solicitation.status)}
                      </span>

                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {solicitation.type}
                      </span>

                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        {getMethodLabel(
                          solicitation.procurementMethod,
                        )}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="mt-5 text-xl font-bold tracking-tight group-hover:text-tenderhub-navy">
                      {solicitation.title}
                    </h3>

                    {/* Reference */}
                    <p className="mt-2 text-sm font-medium text-muted-foreground">
                      Reference:{" "}
                      {solicitation.solicitationNumber}
                    </p>

                    {/* Description */}
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {solicitation.description ||
                        "No description provided."}
                    </p>

                    {/* Details */}
                    <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Organization
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {solicitation.organization.name}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Procurement
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {solicitation.procurement
                            .referenceNumber ||
                            solicitation.procurement.title}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Estimated value
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {formatAmount(
                            solicitation.estimatedValue,
                            currencyCode,
                            currencySymbol,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Submission deadline
                        </p>

                        <p className="mt-1 text-sm font-semibold">
                          {formatDate(
                            solicitation.closingDate,
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Additional information */}
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-xs text-muted-foreground">
                      <span>
                        {solicitation.lots.length}{" "}
                        {solicitation.lots.length === 1
                          ? "lot"
                          : "lots"}
                      </span>

                      <span>
                        {solicitation.requirements.length}{" "}
                        {solicitation.requirements.length ===
                        1
                          ? "requirement"
                          : "requirements"}
                      </span>

                      <span>
                        {solicitation.documents.length}{" "}
                        {solicitation.documents.length === 1
                          ? "document"
                          : "documents"}
                      </span>

                      <span>
                        {
                          solicitation.evaluationCriteria
                            .length
                        }{" "}
                        evaluation{" "}
                        {solicitation.evaluationCriteria
                          .length === 1
                          ? "criterion"
                          : "criteria"}
                      </span>
                    </div>

                    {/* Fee / Security */}
                    {(solicitation.applicationFeeRequired ||
                      solicitation.bidSecurityRequired) && (
                      <div className="mt-5 rounded-xl bg-muted/50 p-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {solicitation.applicationFeeRequired && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Application fee
                              </p>

                              <p className="mt-1 text-sm font-semibold">
                                {formatAmount(
                                  solicitation.applicationFeeAmount,
                                  currencyCode,
                                  currencySymbol,
                                )}
                              </p>
                            </div>
                          )}

                          {solicitation.bidSecurityRequired && (
                            <div>
                              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Bid security
                              </p>

                              <p className="mt-1 text-sm font-semibold">
                                {formatAmount(
                                  solicitation.bidSecurityAmount,
                                  currencyCode,
                                  currencySymbol,
                                )}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="mt-6 flex items-center justify-between border-t pt-5">
                      <div className="text-xs text-muted-foreground">
                        {solicitation.publishedAt
                          ? `Published ${formatDate(
                              solicitation.publishedAt,
                            )}`
                          : "Not yet published"}
                      </div>

                      <Link
                        href={`/solicitations/${solicitation.id}`}
                        className="inline-flex items-center text-sm font-semibold text-tenderhub-navy hover:underline"
                      >
                        View solicitation
                        <span
                          className="ml-2"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
