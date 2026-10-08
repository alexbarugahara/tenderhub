import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileSearch,
  Search,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorSolicitationsPage() {
  const solicitations = await prisma.solicitation.findMany({
    where: {
      status: "PUBLISHED",
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
          status: true,
        },
      },
    },
    orderBy: {
      closingDate: "asc",
    },
  });

  const now = new Date();

  const openSolicitations = solicitations.filter(
    (solicitation) =>
      !solicitation.closingDate ||
      solicitation.closingDate.getTime() > now.getTime(),
  );

  const closingSoon = openSolicitations.filter((solicitation) => {
    if (!solicitation.closingDate) {
      return false;
    }

    const difference =
      solicitation.closingDate.getTime() - now.getTime();

    return difference >= 0 && difference <= 7 * 24 * 60 * 60 * 1000;
  });

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <Link
            href="/dashboard/vendor"
            className="text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
          >
            ← Back to Dashboard
          </Link>

          <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-tenderhub-navy text-white">
                <FileSearch className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Solicitations
                </h1>

                <p className="mt-1 text-sm text-slate-600">
                  Browse published solicitations and identify opportunities
                  relevant to your business.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard/vendor/opportunities"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Opportunities
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <Card>
            <div className="p-6">
              <p className="text-sm text-slate-500">
                Published Solicitations
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {solicitations.length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm text-slate-500">
                Open for Bidding
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {openSolicitations.length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <p className="text-sm text-slate-500">
                Closing Within 7 Days
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-900">
                {closingSoon.length}
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="search"
                placeholder="Search solicitations by title or reference number..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
              />
            </div>
          </div>

          {solicitations.length === 0 ? (
            <div className="p-12 text-center">
              <FileSearch className="mx-auto h-10 w-10 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No published solicitations
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                There are currently no published solicitations available to
                browse.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {solicitations.map((solicitation) => {
                const isClosed =
                  !!solicitation.closingDate &&
                  solicitation.closingDate.getTime() <= now.getTime();

                const currency =
                  solicitation.procurement.currency?.code ?? "";

                return (
                  <div
                    key={solicitation.id}
                    className="p-6 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              isClosed
                                ? "bg-slate-100 text-slate-600"
                                : "bg-green-50 text-green-700"
                            }`}
                          >
                            {isClosed ? "Closed" : "Open"}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {solicitation.type}
                          </span>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            {solicitation.procurementMethod}
                          </span>
                        </div>

                        <Link
                          href={`/dashboard/vendor/solicitations/${solicitation.id}`}
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
                          <span>
                            {solicitation.procurement.country?.name ??
                              "Country not specified"}
                          </span>

                          <span>
                            {solicitation.lots.length}{" "}
                            {solicitation.lots.length === 1
                              ? "lot"
                              : "lots"}
                          </span>

                          <span>
                            {solicitation.bids.length}{" "}
                            {solicitation.bids.length === 1
                              ? "bid"
                              : "bids"}
                          </span>

                          {solicitation.closingDate && (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-4 w-4" />
                              Closes{" "}
                              {solicitation.closingDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-4 xl:w-60">
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

                        {solicitation.bidSecurityRequired && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                              Bid Security
                            </p>

                            <p className="mt-1 text-sm font-semibold text-amber-900">
                              Required
                            </p>
                          </div>
                        )}

                        {solicitation.applicationFeeRequired && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Application Fee
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-900">
                              {solicitation.applicationFeeAmount
                                ? Number(
                                    solicitation.applicationFeeAmount,
                                  ).toLocaleString()
                                : "Required"}
                            </p>
                          </div>
                        )}

                        <Link
                          href={`/dashboard/vendor/solicitations/${solicitation.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          View Solicitation
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