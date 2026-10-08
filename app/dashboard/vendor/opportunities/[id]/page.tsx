import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  MapPin,
  ShieldCheck,
  Tag,
} from "lucide-react";

import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/db/prisma";

type VendorOpportunityPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Not specified";
  }

  return date.toLocaleDateString();
}

function formatDateTime(date: Date | null) {
  if (!date) {
    return "Not specified";
  }

  return date.toLocaleString();
}

export default async function VendorOpportunityPage({
  params,
}: VendorOpportunityPageProps) {
  const { id } = await params;

  const solicitation = await prisma.solicitation.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      solicitationNumber: true,
      title: true,
      description: true,
      status: true,
      type: true,
      procurementMethod: true,
      publishedAt: true,
      openingDate: true,
      closingDate: true,
      estimatedValue: true,
      bidSecurityRequired: true,
      bidSecurityAmount: true,
      applicationFeeRequired: true,
      applicationFeeAmount: true,

      procurement: {
        select: {
          id: true,
          title: true,
          referenceNumber: true,
          description: true,
          plannedStartDate: true,
          plannedEndDate: true,

          country: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },

          currency: {
            select: {
              id: true,
              code: true,
              symbol: true,
            },
          },

          department: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },

      lots: {
        select: {
          id: true,
          number: true,
          title: true,
          description: true,
          estimatedValue: true,
          status: true,
        },
        orderBy: {
          number: "asc",
        },
      },

      requirements: {
        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          isMandatory: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
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
          version: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },

      evaluationCriteria: {
        select: {
          id: true,
          name: true,
          description: true,
          weight: true,
          maxScore: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });

  if (!solicitation) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Opportunity Not Found
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                The requested procurement opportunity could not be found.
              </p>

              <Link
                href="/dashboard/vendor/opportunities"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Opportunities
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const isClosed =
    !!solicitation.closingDate &&
    solicitation.closingDate.getTime() <= Date.now();

  const currency =
    solicitation.procurement.currency?.code ??
    solicitation.procurement.currency?.symbol ??
    "";

  const canBid =
    !isClosed &&
    (solicitation.status === "OPEN" ||
      solicitation.status === "PUBLISHED");

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <Link
            href="/dashboard/vendor/opportunities"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Opportunities
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isClosed
                      ? "bg-slate-100 text-slate-600"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {isClosed
                    ? "Closed"
                    : formatLabel(solicitation.status)}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {formatLabel(solicitation.type)}
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {formatLabel(solicitation.procurementMethod)}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                {solicitation.title}
              </h1>

              <p className="mt-2 text-sm font-medium text-slate-500">
                {solicitation.solicitationNumber}
              </p>
            </div>

            {canBid && (
              <Link
                href={`/dashboard/vendor/bids/new?solicitationId=${solicitation.id}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Prepare Bid
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <DollarSign className="h-4 w-4" />
                <p className="text-sm">Estimated Value</p>
              </div>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {solicitation.estimatedValue !== null
                  ? `${currency} ${Number(
                      solicitation.estimatedValue,
                    ).toLocaleString()}`
                  : "Not specified"}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <CalendarDays className="h-4 w-4" />
                <p className="text-sm">Opening Date</p>
              </div>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {formatDate(solicitation.openingDate)}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <Clock3 className="h-4 w-4" />
                <p className="text-sm">Closing Date</p>
              </div>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {formatDate(solicitation.closingDate)}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <FileText className="h-4 w-4" />
                <p className="text-sm">Lots</p>
              </div>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {solicitation.lots.length}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Opportunity Overview
                </h2>
              </div>

              <div className="p-6">
                {solicitation.description ? (
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {solicitation.description}
                  </p>
                ) : solicitation.procurement.description ? (
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {solicitation.procurement.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    No description has been provided for this opportunity.
                  </p>
                )}
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Procurement Details
                </h2>
              </div>

              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Procurement
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {solicitation.procurement.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Reference Number
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {solicitation.procurement.referenceNumber}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Country
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {solicitation.procurement.country?.name ??
                        "Not specified"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Department
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {solicitation.procurement.department?.name ??
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Planned Start
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {formatDate(
                      solicitation.procurement.plannedStartDate,
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Planned End
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {formatDate(
                      solicitation.procurement.plannedEndDate,
                    )}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Lots
                </h2>
              </div>

              {solicitation.lots.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  This opportunity does not have separate lots.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {solicitation.lots.map((lot) => (
                    <div key={lot.id} className="p-6">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Lot {lot.number}
                          </p>

                          <h3 className="mt-1 font-semibold text-slate-900">
                            {lot.title}
                          </h3>
                        </div>

                        {lot.estimatedValue !== null && (
                          <p className="font-semibold text-slate-900">
                            {currency}{" "}
                            {Number(
                              lot.estimatedValue,
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      {lot.description && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {lot.description}
                        </p>
                      )}

                      <span className="mt-4 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                        {formatLabel(lot.status)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Requirements
                </h2>
              </div>

              {solicitation.requirements.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  No specific requirements have been published.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {solicitation.requirements.map((requirement) => (
                    <div key={requirement.id} className="p-6">
                      <div className="flex items-start gap-3">
                        {requirement.isMandatory ? (
                          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-tenderhub-navy" />
                        ) : (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-slate-400" />
                        )}

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-medium text-slate-900">
                              {requirement.title}
                            </h3>

                            {requirement.isMandatory && (
                              <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                                Mandatory
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400">
                            {formatLabel(requirement.type)}
                          </p>

                          {requirement.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {requirement.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Evaluation Criteria
                </h2>
              </div>

              {solicitation.evaluationCriteria.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  No evaluation criteria have been published.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {solicitation.evaluationCriteria.map((criterion) => (
                    <div key={criterion.id} className="p-6">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-medium text-slate-900">
                            {criterion.name}
                          </h3>

                          {criterion.description && (
                            <p className="mt-2 text-sm leading-6 text-slate-600">
                              {criterion.description}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            Weight: {Number(criterion.weight)}
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                            Max: {Number(criterion.maxScore)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Solicitation Documents
                </h2>
              </div>

              {solicitation.documents.length === 0 ? (
                <div className="p-6 text-sm text-slate-500">
                  No documents have been published with this solicitation.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {solicitation.documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <FileText className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium text-slate-900">
                          {document.name}
                        </h3>

                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                          <span>
                            {formatLabel(document.category)}
                          </span>

                          {document.mimeType && (
                            <span>{document.mimeType}</span>
                          )}

                          {document.fileSize !== null && (
                            <span>
                              {Math.ceil(
                                document.fileSize / 1024,
                              )}{" "}
                              KB
                            </span>
                          )}

                          <span>Version {document.version}</span>
                        </div>
                      </div>

                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        View
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Submission Information
                </h2>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {formatLabel(solicitation.status)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Published
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {formatDate(solicitation.publishedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Closing Date
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {formatDateTime(solicitation.closingDate)}
                  </p>
                </div>

                {solicitation.bidSecurityRequired && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                      Bid Security
                    </p>

                    <p className="mt-1 font-semibold text-amber-900">
                      Required
                    </p>

                    {solicitation.bidSecurityAmount !== null && (
                      <p className="mt-1 text-sm text-amber-800">
                        Amount:{" "}
                        {currency}{" "}
                        {Number(
                          solicitation.bidSecurityAmount,
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {solicitation.applicationFeeRequired && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Application Fee
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      Required
                    </p>

                    {solicitation.applicationFeeAmount !== null && (
                      <p className="mt-1 text-sm text-slate-600">
                        Amount:{" "}
                        {currency}{" "}
                        {Number(
                          solicitation.applicationFeeAmount,
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}

                {canBid && (
                  <Link
                    href={`/dashboard/vendor/bids/new?solicitationId=${solicitation.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Start Bid
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-start gap-3">
                  <Tag className="mt-0.5 h-5 w-5 text-slate-500" />

                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Procurement Method
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {formatLabel(solicitation.procurementMethod)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="font-semibold text-slate-900">
                  Important Dates
                </h2>

                <div className="mt-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Published
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatDate(solicitation.publishedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Opening
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatDateTime(solicitation.openingDate)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Closing
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-900">
                        {formatDateTime(solicitation.closingDate)}
                      </p>
                    </div>
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