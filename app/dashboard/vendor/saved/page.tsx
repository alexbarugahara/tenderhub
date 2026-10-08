import Link from "next/link";
import {
  Bookmark,
  CalendarDays,
  Clock3,
  ExternalLink,
  Search,
  Trash2,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorSavedPage() {
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      vendor: {
        select: {
          id: true,
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
              <Bookmark className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Profile Required
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                A vendor profile is required to access saved solicitations.
              </p>

              <Link
                href="/dashboard/vendor/profile"
                className="mt-6 inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                Complete Vendor Profile
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const savedSolicitations = await prisma.savedSolicitation.findMany({
    where: {
      vendorId: user.vendor.id,
    },
    select: {
      id: true,
      savedAt: true,

      solicitation: {
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

          procurement: {
            select: {
              id: true,
              title: true,
              referenceNumber: true,
            },
          },
        },
      },
    },
    orderBy: {
      savedAt: "desc",
    },
  });

  const activeSaved = savedSolicitations.filter((item) => {
    const status = String(item.solicitation.status).toUpperCase();

    return (
      status === "OPEN" ||
      status === "PUBLISHED" ||
      status === "ACTIVE"
    );
  }).length;

  const closingSoon = savedSolicitations.filter((item) => {
    const closingDate = item.solicitation.closingDate;

    if (!closingDate) {
      return false;
    }

    const now = new Date();
    const difference = closingDate.getTime() - now.getTime();
    const days = difference / (1000 * 60 * 60 * 24);

    return days >= 0 && days <= 7;
  }).length;

  const formatAmount = (value: unknown) => {
    if (value === null || value === undefined) {
      return "Not specified";
    }

    const amount = Number(value);

    if (Number.isNaN(amount)) {
      return String(value);
    }

    return amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const getStatusClasses = (status: string) => {
    const normalized = status.toUpperCase();

    if (
      normalized === "OPEN" ||
      normalized === "PUBLISHED" ||
      normalized === "ACTIVE"
    ) {
      return "bg-green-50 text-green-700";
    }

    if (
      normalized === "CLOSED" ||
      normalized === "CANCELLED" ||
      normalized === "AWARDED"
    ) {
      return "bg-slate-100 text-slate-600";
    }

    return "bg-amber-50 text-amber-700";
  };

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                  <Bookmark className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Vendor Portal
                  </p>

                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Saved Solicitations
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Keep track of procurement opportunities you want to review
                or bid on later.
              </p>
            </div>

            <Link
              href="/dashboard/vendor/opportunities"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              <Search className="h-4 w-4" />
              Browse Opportunities
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Bookmark className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Saved
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {savedSolicitations.length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <Search className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Active
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {activeSaved}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock3 className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Closing Within 7 Days
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {closingSoon}
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Saved Opportunities
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Opportunities saved by {user.vendor.companyName}.
                </p>
              </div>

              <div className="relative w-full md:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  placeholder="Search saved opportunities..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
                />
              </div>
            </div>
          </div>

          {savedSolicitations.length === 0 ? (
            <div className="p-12 text-center">
              <Bookmark className="mx-auto h-12 w-12 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No saved solicitations
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                When you find an opportunity you want to review later,
                save it and it will appear here.
              </p>

              <Link
                href="/dashboard/vendor/opportunities"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <Search className="h-4 w-4" />
                Find Opportunities
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {savedSolicitations.map((saved) => {
                const solicitation = saved.solicitation;
                const status = String(solicitation.status).toUpperCase();

                const isClosingSoon =
                  solicitation.closingDate &&
                  solicitation.closingDate.getTime() >= Date.now() &&
                  solicitation.closingDate.getTime() <=
                    Date.now() + 7 * 24 * 60 * 60 * 1000;

                return (
                  <div
                    key={saved.id}
                    className="p-6 transition hover:bg-slate-50/70"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                              status,
                            )}`}
                          >
                            {status.replace(/_/g, " ")}
                          </span>

                          <span className="text-xs font-medium text-slate-400">
                            {solicitation.solicitationNumber}
                          </span>

                          {isClosingSoon && (
                            <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                              Closing Soon
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/dashboard/vendor/solicitations/${solicitation.id}`}
                          className="mt-3 block text-lg font-semibold text-slate-900 transition hover:text-tenderhub-navy"
                        >
                          {solicitation.title}
                        </Link>

                        {solicitation.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {solicitation.description}
                          </p>
                        )}

                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Procurement
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {solicitation.procurement?.title ??
                                "Not specified"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Method
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {String(
                                solicitation.procurementMethod,
                              ).replace(/_/g, " ")}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Estimated Value
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {formatAmount(solicitation.estimatedValue)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Closing Date
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {solicitation.closingDate
                                ? solicitation.closingDate.toLocaleDateString()
                                : "Not specified"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-4 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Saved{" "}
                            {saved.savedAt.toLocaleDateString()}
                          </span>

                          {solicitation.publishedAt && (
                            <span className="inline-flex items-center gap-1.5">
                              Published{" "}
                              {solicitation.publishedAt.toLocaleDateString()}
                            </span>
                          )}

                          {solicitation.bidSecurityRequired && (
                            <span>Bid security required</span>
                          )}

                          {solicitation.applicationFeeRequired && (
                            <span>Application fee required</span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-col gap-2 sm:flex-row xl:flex-col">
                        <Link
                          href={`/dashboard/vendor/solicitations/${solicitation.id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          <ExternalLink className="h-4 w-4" />
                          View
                        </Link>

                        <button
                          type="button"
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
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
