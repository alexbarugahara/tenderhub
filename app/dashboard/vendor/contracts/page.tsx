import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSignature,
  Search,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorContractsPage() {
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
        <div className="mx-auto max-w-6xl">
          <Card>
            <div className="p-10 text-center">
              <FileSignature className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Profile Required
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Create or complete a vendor profile to view your contracts.
              </p>

              <Link
                href="/dashboard/vendor/profile"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                Go to Vendor Profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const contracts = await prisma.contract.findMany({
    where: {
      vendorId: user.vendor.id,
    },
    select: {
      id: true,
      contractNumber: true,
      title: true,
      description: true,
      status: true,
      contractValue: true,
      startDate: true,
      endDate: true,
      signedAt: true,
      completedAt: true,
      terminatedAt: true,
      terminationReason: true,
      createdAt: true,
      updatedAt: true,

      award: {
        select: {
          id: true,
          awardNumber: true,
          status: true,
          awardAmount: true,
          awardDate: true,

          bid: {
            select: {
              id: true,
              bidNumber: true,
              title: true,
              totalAmount: true,
              status: true,
              submittedAt: true,

              currency: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                },
              },

              solicitation: {
                select: {
                  id: true,
                  solicitationNumber: true,
                  title: true,
                  status: true,

                  procurement: {
                    select: {
                      id: true,
                      title: true,
                      referenceNumber: true,
                      status: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const now = new Date();

  const activeCount = contracts.filter(
    (contract) => contract.status === "ACTIVE",
  ).length;

  const completedCount = contracts.filter(
    (contract) => contract.status === "COMPLETED",
  ).length;

  const pendingCount = contracts.filter(
    (contract) =>
      contract.status === "DRAFT" ||
      contract.status === "PENDING_SIGNATURE",
  ).length;

  const terminatedCount = contracts.filter(
    (contract) =>
      contract.status === "TERMINATED" || contract.status === "EXPIRED",
  ).length;

  const expiringSoonCount = contracts.filter((contract) => {
    if (!contract.endDate) {
      return false;
    }

    const daysUntilEnd = Math.ceil(
      (contract.endDate.getTime() - now.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return daysUntilEnd >= 0 && daysUntilEnd <= 90;
  }).length;

  const formatAmount = (
    value: unknown,
    currencyCode: string | null | undefined,
  ) => {
    if (value === null || value === undefined) {
      return "Value not specified";
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return String(value);
    }

    const formattedValue = numericValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return currencyCode
      ? `${currencyCode} ${formattedValue}`
      : formattedValue;
  };

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-tenderhub-gold">
              Vendor Contracts
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Contracts
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Review contracts awarded to your organization and monitor their
              status, value, and important dates.
            </p>
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              placeholder="Search contracts..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <FileSignature className="h-5 w-5" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {contracts.length}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Total Contracts
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {activeCount}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Active
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <Clock3 className="h-5 w-5" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {pendingCount}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Pending
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {completedCount}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Completed
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <span className="text-2xl font-bold text-slate-900">
                  {expiringSoonCount}
                </span>
              </div>

              <p className="mt-4 text-sm font-medium text-slate-600">
                Ending in 90 Days
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div>
              <h2 className="font-semibold text-slate-900">
                Your Contracts
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Contracts associated with {user.vendor.companyName}
              </p>
            </div>
          </div>

          {contracts.length === 0 ? (
            <div className="p-12 text-center">
              <FileSignature className="mx-auto h-12 w-12 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No Contracts Yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Contracts awarded to your vendor organization will appear
                here.
              </p>

              <Link
                href="/dashboard/vendor/opportunities"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                Browse Opportunities
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {contracts.map((contract) => {
                const status = String(contract.status).toUpperCase();

                const statusClasses =
                  status === "ACTIVE"
                    ? "bg-green-50 text-green-700"
                    : status === "COMPLETED"
                      ? "bg-blue-50 text-blue-700"
                      : status === "TERMINATED" || status === "EXPIRED"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700";

                const daysUntilEnd = contract.endDate
                  ? Math.ceil(
                      (contract.endDate.getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24),
                    )
                  : null;

                const solicitation = contract.award?.bid?.solicitation;
                const procurement = solicitation?.procurement;
                const currencyCode = contract.award?.bid?.currency?.code;

                return (
                  <Link
                    key={contract.id}
                    href={`/dashboard/vendor/contracts/${contract.id}`}
                    className="block p-6 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses}`}
                          >
                            {status.replace(/_/g, " ")}
                          </span>

                          <span className="text-xs font-medium text-slate-400">
                            {contract.contractNumber}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-semibold text-slate-900">
                          {contract.title}
                        </h3>

                        {contract.description && (
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                            {contract.description}
                          </p>
                        )}

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
                          <div>
                            <p className="text-xs text-slate-400">
                              Contract Value
                            </p>

                            <p className="mt-1 font-medium text-slate-700">
                              {formatAmount(
                                contract.contractValue,
                                currencyCode,
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Start Date
                            </p>

                            <p className="mt-1 font-medium text-slate-700">
                              {contract.startDate
                                ? contract.startDate.toLocaleDateString()
                                : "Not specified"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              End Date
                            </p>

                            <p className="mt-1 font-medium text-slate-700">
                              {contract.endDate
                                ? contract.endDate.toLocaleDateString()
                                : "Not specified"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-400">
                              Procurement
                            </p>

                            <p className="mt-1 truncate font-medium text-slate-700">
                              {procurement?.referenceNumber ??
                                procurement?.title ??
                                "Not specified"}
                            </p>
                          </div>
                        </div>

                        {(solicitation ||
                          contract.award ||
                          daysUntilEnd !== null) && (
                          <div className="mt-5 flex flex-wrap gap-2">
                            {solicitation && (
                              <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                                Solicitation:{" "}
                                {solicitation.solicitationNumber}
                              </span>
                            )}

                            {contract.award && (
                              <span className="rounded-md bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                                Award: {contract.award.awardNumber}
                              </span>
                            )}

                            {daysUntilEnd !== null &&
                              daysUntilEnd >= 0 &&
                              daysUntilEnd <= 90 && (
                                <span className="rounded-md bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700">
                                  Ends in {daysUntilEnd} day
                                  {daysUntilEnd === 1 ? "" : "s"}
                                </span>
                              )}

                            {daysUntilEnd !== null &&
                              daysUntilEnd < 0 && (
                                <span className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700">
                                  End date passed
                                </span>
                              )}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2 text-sm font-medium text-tenderhub-navy">
                        View Contract
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        {terminatedCount > 0 && (
          <Card>
            <div className="flex items-start gap-3 p-6">
              <XCircle className="mt-0.5 h-5 w-5 text-red-600" />

              <div>
                <h2 className="font-semibold text-slate-900">
                  Contract Status Notice
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  You have {terminatedCount} contract
                  {terminatedCount === 1 ? "" : "s"} marked as terminated or
                  expired. Open the relevant contract to review its details.
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}