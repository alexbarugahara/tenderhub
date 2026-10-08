import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  FileText,
  Plus,
  Send,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

export default async function VendorBidsPage() {
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      name: true,
      email: true,
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
              <FileText className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Profile Required
              </h1>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                A vendor profile is required before you can create and manage
                bids.
              </p>

              <Link
                href="/dashboard/vendor/profile"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                Complete Profile
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const bids = await prisma.bid.findMany({
    where: {
      vendorId: user.vendor.id,
    },
    select: {
      id: true,
      title: true,
      totalAmount: true,
      status: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
      solicitation: {
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,
          closingDate: true,
          procurement: {
            select: {
              currency: {
                select: {
                  code: true,
                  symbol: true,
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

  const draftCount = bids.filter(
    (bid) => String(bid.status).toUpperCase() === "DRAFT",
  ).length;

  const submittedCount = bids.filter(
    (bid) => String(bid.status).toUpperCase() === "SUBMITTED",
  ).length;

  const awardedCount = bids.filter(
    (bid) => String(bid.status).toUpperCase() === "AWARDED",
  ).length;

  const rejectedCount = bids.filter(
    (bid) => String(bid.status).toUpperCase() === "REJECTED",
  ).length;

  const getStatusClasses = (status: string) => {
    const normalized = status.toUpperCase();

    if (normalized === "DRAFT") {
      return "bg-slate-100 text-slate-700";
    }

    if (normalized === "SUBMITTED") {
      return "bg-blue-50 text-blue-700";
    }

    if (normalized === "UNDER_EVALUATION") {
      return "bg-amber-50 text-amber-700";
    }

    if (normalized === "AWARDED") {
      return "bg-green-50 text-green-700";
    }

    if (normalized === "REJECTED") {
      return "bg-red-50 text-red-700";
    }

    if (normalized === "WITHDRAWN") {
      return "bg-slate-100 text-slate-600";
    }

    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-tenderhub-gold">
              Vendor Workspace
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              My Bids
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Manage your draft, submitted, and completed bids.
            </p>
          </div>

          <Link
            href="/dashboard/vendor/bids/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Create Bid
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <FileText className="h-4 w-4" />
                <p className="text-sm">Total Bids</p>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {bids.length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <FileText className="h-4 w-4" />
                <p className="text-sm">Drafts</p>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {draftCount}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <Send className="h-4 w-4" />
                <p className="text-sm">Submitted</p>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {submittedCount}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <FileText className="h-4 w-4" />
                <p className="text-sm">Awarded</p>
              </div>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {awardedCount}
              </p>
            </div>
          </Card>
        </div>

        {bids.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-300" />

              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                No bids yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Browse available solicitations and start preparing your first
                bid.
              </p>

              <Link
                href="/dashboard/vendor/opportunities"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                Browse Opportunities
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="border-b border-slate-200 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    Bid Submissions
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {bids.length} bid{bids.length === 1 ? "" : "s"} in your
                    vendor account.
                  </p>
                </div>

                {rejectedCount > 0 && (
                  <span className="text-sm text-red-600">
                    {rejectedCount} rejected
                  </span>
                )}
              </div>
            </div>

            <div className="divide-y divide-slate-200">
              {bids.map((bid) => {
                const status = String(bid.status);

                return (
                  <div
                    key={bid.id}
                    className="p-6 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                              status,
                            )}`}
                          >
                            {status.replace(/_/g, " ")}
                          </span>

                          <span className="text-xs font-medium text-slate-400">
                            {bid.solicitation.solicitationNumber}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-semibold text-slate-900">
                          {bid.title}
                        </h3>

                        <Link
                          href={`/dashboard/vendor/solicitations/${bid.solicitation.id}`}
                          className="mt-1 inline-block text-sm text-slate-500 hover:text-tenderhub-navy"
                        >
                          {bid.solicitation.title}
                        </Link>

                        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                          <span>
                            Amount:{" "}
                            <strong className="font-semibold text-slate-900">
                              {bid.solicitation.procurement.currency?.code ??
                                ""}{" "}
                              {Number(
                                bid.totalAmount,
                              ).toLocaleString()}
                            </strong>
                          </span>

                          {bid.submittedAt && (
                            <span>
                              Submitted:{" "}
                              {bid.submittedAt.toLocaleDateString()}
                            </span>
                          )}

                          {bid.solicitation.closingDate && (
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5" />
                              Closes:{" "}
                              {bid.solicitation.closingDate.toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link
                        href={`/dashboard/vendor/bids/${bid.id}`}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-tenderhub-navy"
                      >
                        View Bid
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}