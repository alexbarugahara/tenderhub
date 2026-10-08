import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileSearch,
  Filter,
  MapPin,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorOpportunitiesPage() {
  const solicitations = await prisma.solicitation.findMany({
    where: {
      status: "PUBLISHED",
    },
    select: {
      id: true,
      solicitationNumber: true,
      title: true,
      description: true,
      type: true,
      procurementMethod: true,
      publishedAt: true,
      openingDate: true,
      closingDate: true,
      estimatedValue: true,
      applicationFeeRequired: true,
      applicationFeeAmount: true,
      procurement: {
        select: {
          id: true,
          title: true,
          referenceNumber: true,
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
        },
      },
      lots: {
        select: {
          id: true,
        },
      },
      bids: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      closingDate: "asc",
    },
  });

  const openOpportunities = solicitations.filter(
    (solicitation) =>
      !solicitation.closingDate ||
      solicitation.closingDate.getTime() > Date.now(),
  );

  const withClosingDate = openOpportunities.filter(
    (solicitation) => solicitation.closingDate,
  );

  const totalEstimatedValue = openOpportunities.reduce(
    (total, solicitation) =>
      total + Number(solicitation.estimatedValue ?? 0),
    0,
  );

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/dashboard/vendor"
              className="text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
            >
              ← Back to Dashboard
            </Link>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-tenderhub-navy text-white">
                <FileSearch className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Opportunities
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                  Discover published procurement opportunities available to
                  vendors.
                </p>
              </div>
            </div>
          </div>

          <Link
            href="/dashboard/vendor/solicitations"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            My Solicitations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-6">
              <p className="text-sm text-slate-500">
                Open Opportunities
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {openOpportunities.length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm text-slate-500">
                With Closing Dates
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {withClosingDate.length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm text-slate-500">
                Total Lots
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {openOpportunities.reduce(
                  (total, solicitation) =>
                    total + solicitation.lots.length,
                  0,
                )}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm text-slate-500">
                Published Value
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {totalEstimatedValue.toLocaleString()}
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col gap-4 border-b border-slate-200 p-6 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                placeholder="Search opportunities..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>

          {openOpportunities.length === 0 ? (
            <div className="p-12 text-center">
              <FileSearch className="mx-auto h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No open opportunities
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are currently no published procurement opportunities
                available for bidding.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {openOpportunities.map((solicitation) => {
                const currency =
                  solicitation.procurement.currency?.code ?? "";

                const closingDate = solicitation.closingDate;

                return (
                  <div
                    key={solicitation.id}
                    className="p-6 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                            Published
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {solicitation.type}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {solicitation.procurementMethod}
                          </span>
                        </div>

                        <Link
                          href={`/dashboard/vendor/opportunities/${solicitation.id}`}
                          className="mt-3 block text-lg font-semibold text-slate-900 transition hover:text-tenderhub-navy"
                        >
                          {solicitation.title}
                        </Link>

                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {solicitation.solicitationNumber}
                        </p>

                        {solicitation.description && (
                          <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-slate-600">
                            {solicitation.description}
                          </p>
                        )}

                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />

                            {solicitation.procurement.country?.name ??
                              "Country not specified"}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />

                            {closingDate
                              ? `Closes ${closingDate.toLocaleDateString()}`
                              : "No closing date"}
                          </span>

                          <span>
                            {solicitation.lots.length}{" "}
                            {solicitation.lots.length === 1
                              ? "lot"
                              : "lots"}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-4 xl:w-56">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Estimated Value
                          </p>

                          <p className="mt-2 text-lg font-bold text-slate-900">
                            {solicitation.estimatedValue
                              ? `${currency} ${Number(
                                  solicitation.estimatedValue,
                                ).toLocaleString()}`
                              : "Not specified"}
                          </p>
                        </div>

                        {solicitation.applicationFeeRequired && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                              Application Fee
                            </p>

                            <p className="mt-2 font-semibold text-amber-900">
                              {solicitation.applicationFeeAmount
                                ? Number(
                                    solicitation.applicationFeeAmount,
                                  ).toLocaleString()
                                : "Required"}
                            </p>
                          </div>
                        )}

                        <Link
                          href={`/dashboard/vendor/opportunities/${solicitation.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          View Opportunity
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <p className="text-xs text-slate-400">
                        Procurement:{" "}
                        <span className="font-medium text-slate-500">
                          {solicitation.procurement.referenceNumber}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}