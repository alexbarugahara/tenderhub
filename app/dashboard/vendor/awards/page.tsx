import Link from "next/link";
import {
  Award,
  CheckCircle2,
  Clock3,
  FileText,
  Search,
  Trophy,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorAwardsPage() {
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
        <div className="mx-auto max-w-7xl">
          <Card>
            <div className="p-10 text-center">
              <Award className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Profile Required
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                A vendor profile is required to view your awards.
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

  const awards = await prisma.award.findMany({
    where: {
      vendorId: user.vendor.id,
    },
    select: {
      id: true,
      awardNumber: true,
      status: true,
      awardAmount: true,
      awardDate: true,
      notes: true,
      createdAt: true,
      updatedAt: true,

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

      lot: {
        select: {
          id: true,
          number: true,
          title: true,
        },
      },

      bid: {
        select: {
          id: true,
          bidNumber: true,
          title: true,
          totalAmount: true,
          status: true,
          submittedAt: true,
        },
      },

      contract: {
        select: {
          id: true,
          contractNumber: true,
          title: true,
          status: true,
        },
      },
    },
    orderBy: {
      awardDate: "desc",
    },
  });

  const totalAwards = awards.length;

  const activeAwards = awards.filter(
    (award) =>
      award.status === "ACCEPTED" || award.status === "APPROVED",
  ).length;

  const completedAwards = awards.filter(
    (award) => award.contract?.status === "COMPLETED",
  ).length;

  const pendingAwards = awards.filter(
    (award) => award.status === "PENDING",
  ).length;

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
    switch (status) {
      case "ACCEPTED":
      case "APPROVED":
        return "bg-green-50 text-green-700";

      case "CANCELLED":
      case "DECLINED":
        return "bg-red-50 text-red-700";

      case "PENDING":
        return "bg-amber-50 text-amber-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                  <Trophy className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Vendor Portal
                  </p>

                  <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                    Awards
                  </h1>
                </div>
              </div>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                View procurement awards issued to your organization and track
                their status and related contracts.
              </p>
            </div>

            <Link
              href="/dashboard/vendor/opportunities"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Search className="h-4 w-4" />
              Find Opportunities
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Award className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Total Awards
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {totalAwards}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Active
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {activeAwards}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Trophy className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Completed
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {completedAwards}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock3 className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Pending
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {pendingAwards}
              </p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Award History
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Awards associated with {user.vendor.companyName}.
                </p>
              </div>

              <div className="relative w-full md:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="search"
                  placeholder="Search awards..."
                  className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
                />
              </div>
            </div>
          </div>

          {awards.length === 0 ? (
            <div className="p-12 text-center">
              <Award className="mx-auto h-12 w-12 text-slate-300" />

              <h3 className="mt-4 text-lg font-semibold text-slate-900">
                No awards yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Awards issued to your vendor organization will appear here
                once a procurement process results in an award.
              </p>

              <Link
                href="/dashboard/vendor/opportunities"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <Search className="h-4 w-4" />
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {awards.map((award) => {
                const awardStatus = award.status;

                return (
                  <div
                    key={award.id}
                    className="p-6 transition hover:bg-slate-50/70"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                              awardStatus,
                            )}`}
                          >
                            {awardStatus.replace(/_/g, " ")}
                          </span>

                          <span className="text-xs font-medium text-slate-400">
                            {award.awardNumber}
                          </span>
                        </div>

                        <Link
                          href={`/dashboard/vendor/awards/${award.id}`}
                          className="mt-3 block text-lg font-semibold text-slate-900 transition hover:text-tenderhub-navy"
                        >
                          {award.lot.title}
                        </Link>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Solicitation
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {award.solicitation.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {award.solicitation.solicitationNumber}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Procurement
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {award.solicitation.procurement.title}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {award.solicitation.procurement.referenceNumber}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Award Amount
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-700">
                              {formatAmount(award.awardAmount)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Award Date
                            </p>

                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {award.awardDate.toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full shrink-0 xl:w-64">
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-slate-400" />

                            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                              Winning Bid
                            </span>
                          </div>

                          <p className="mt-3 text-sm font-semibold text-slate-900">
                            {award.bid.title ??
                              award.bid.bidNumber}
                          </p>

                          <p className="mt-2 text-sm text-slate-600">
                            Bid amount:{" "}
                            <span className="font-semibold text-slate-900">
                              {formatAmount(award.bid.totalAmount)}
                            </span>
                          </p>

                          {award.contract ? (
                            <div className="mt-4 border-t border-slate-100 pt-4">
                              <p className="text-xs text-slate-400">
                                Contract
                              </p>

                              <Link
                                href={`/dashboard/vendor/contracts/${award.contract.id}`}
                                className="mt-1 block text-sm font-medium text-tenderhub-navy hover:underline"
                              >
                                {award.contract.contractNumber}
                              </Link>

                              <p className="mt-1 text-xs text-slate-500">
                                {award.contract.title}
                              </p>
                            </div>
                          ) : (
                            <p className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                              No contract linked yet.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/dashboard/vendor/awards/${award.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                      >
                        <Award className="h-4 w-4" />
                        View Award
                      </Link>

                      {award.contract && (
                        <Link
                          href={`/dashboard/vendor/contracts/${award.contract.id}`}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                        >
                          <FileText className="h-4 w-4" />
                          View Contract
                        </Link>
                      )}
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