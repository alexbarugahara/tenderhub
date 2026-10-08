"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  FileText,
  MapPin,
} from "lucide-react";

interface SolicitationItem {
  id: string;
  solicitationNumber: string;
  title: string;
  description?: string | null;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "OPEN"
    | "UNDER_EVALUATION"
    | "AWARDED"
    | "CLOSED"
    | "CANCELLED"
    | "SUSPENDED"
    | "ARCHIVED";
  type:
    | "RFI"
    | "EOI"
    | "RFQ"
    | "RFP"
    | "ITB"
    | "ITT"
    | "IFB"
    | "OTHER";
  procurementMethod:
    | "OPEN"
    | "RESTRICTED"
    | "RFQ"
    | "DIRECT"
    | "NEGOTIATED";
  publishedAt?: string | Date | null;
  closingDate?: string | Date | null;
  estimatedValue?: number | string | null;
  currency?: {
    code: string;
    symbol?: string | null;
  } | null;
  organization?: {
    name: string;
  } | null;
  country?: {
    name: string;
  } | null;
}

interface SolicitationSectionProps {
  solicitations?: SolicitationItem[];
  title?: string;
  description?: string;
  viewAllHref?: string;
  className?: string;
}

const statusLabels: Record<SolicitationItem["status"], string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  OPEN: "Open",
  UNDER_EVALUATION: "Under Evaluation",
  AWARDED: "Awarded",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
};

const typeLabels: Record<SolicitationItem["type"], string> = {
  RFI: "RFI",
  EOI: "EOI",
  RFQ: "RFQ",
  RFP: "RFP",
  ITB: "ITB",
  ITT: "ITT",
  IFB: "IFB",
  OTHER: "Other",
};

const procurementMethodLabels: Record<
  SolicitationItem["procurementMethod"],
  string
> = {
  OPEN: "Open",
  RESTRICTED: "Restricted",
  RFQ: "Request for Quotation",
  DIRECT: "Direct",
  NEGOTIATED: "Negotiated",
};

function formatDate(value?: string | Date | null) {
  if (!value) {
    return "Not specified";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatAmount(
  value?: number | string | null,
  currency?: SolicitationItem["currency"],
) {
  if (value === null || value === undefined || value === "") {
    return "Value not specified";
  }

  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return `${currency?.symbol ?? currency?.code ?? ""}${String(value)}`;
  }

  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amount);

  if (currency?.symbol) {
    return `${currency.symbol}${formatted}`;
  }

  if (currency?.code) {
    return `${currency.code} ${formatted}`;
  }

  return formatted;
}

function getStatusClasses(status: SolicitationItem["status"]) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";

    case "PUBLISHED":
      return "bg-blue-50 text-blue-700 border-blue-200";

    case "UNDER_EVALUATION":
      return "bg-amber-50 text-amber-700 border-amber-200";

    case "AWARDED":
      return "bg-purple-50 text-purple-700 border-purple-200";

    case "CLOSED":
      return "bg-slate-100 text-slate-600 border-slate-200";

    case "CANCELLED":
    case "SUSPENDED":
      return "bg-red-50 text-red-700 border-red-200";

    default:
      return "bg-slate-50 text-slate-600 border-slate-200";
  }
}

export default function SolicitationSection({
  solicitations = [],
  title = "Latest Procurement Opportunities",
  description = "Explore recently published solicitations and find opportunities that match your organization's capabilities.",
  viewAllHref = "/solicitations",
  className = "",
}: SolicitationSectionProps) {
  const visibleSolicitations = solicitations.slice(0, 6);

  return (
    <section
      className={`bg-tenderhub-background py-16 sm:py-20 ${className}`}
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              Opportunities
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-tenderhub-navy sm:text-4xl">
              {title}
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              {description}
            </p>
          </div>

          <Link
            href={viewAllHref}
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-tenderhub-navy transition hover:text-tenderhub-gold"
          >
            View all opportunities
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {visibleSolicitations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-tenderhub-navy/5 text-tenderhub-navy">
              <FileText className="h-7 w-7" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-tenderhub-navy">
              No solicitations available
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Published procurement opportunities will appear here when they
              become available.
            </p>

            <Link
              href={viewAllHref}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-tenderhub-navy/90"
            >
              Browse Solicitations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {visibleSolicitations.map((solicitation) => (
              <Link
                key={solicitation.id}
                href={`/solicitations/${solicitation.id}`}
                className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-tenderhub-gold/40 hover:shadow-md"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {solicitation.solicitationNumber}
                      </p>

                      <h3 className="mt-2 text-lg font-semibold leading-7 text-tenderhub-navy transition group-hover:text-tenderhub-gold">
                        {solicitation.title}
                      </h3>
                    </div>

                    <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-tenderhub-gold" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${getStatusClasses(
                        solicitation.status,
                      )}`}
                    >
                      {statusLabels[solicitation.status]}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {typeLabels[solicitation.type]}
                    </span>

                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                      {procurementMethodLabels[
                        solicitation.procurementMethod
                      ]}
                    </span>
                  </div>

                  {solicitation.description && (
                    <p className="line-clamp-2 text-sm leading-6 text-slate-600">
                      {solicitation.description}
                    </p>
                  )}

                  <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <FileText className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Estimated Value
                        </p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatAmount(
                            solicitation.estimatedValue,
                            solicitation.currency,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
                        <Clock3 className="h-4 w-4" />
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">Closing Date</p>

                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {formatDate(solicitation.closingDate)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4" />

                      <span>
                        Published{" "}
                        {formatDate(solicitation.publishedAt)}
                      </span>
                    </div>

                    {solicitation.organization?.name && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />

                        <span className="truncate">
                          {solicitation.organization.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}