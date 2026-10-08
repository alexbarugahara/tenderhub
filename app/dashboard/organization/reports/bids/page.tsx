import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  Gavel,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Not set";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAmount(value: unknown) {
  if (value === null || value === undefined) {
    return "Not specified";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatStatus(status: string) {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusVariant(status: string) {
  const normalized = status.toUpperCase();

  if (
    normalized === "SUBMITTED" ||
    normalized === "ACCEPTED" ||
    normalized === "QUALIFIED" ||
    normalized === "EVALUATED"
  ) {
    return "success" as const;
  }

  if (
    normalized === "DRAFT" ||
    normalized === "PENDING" ||
    normalized === "UNDER_REVIEW"
  ) {
    return "warning" as const;
  }

  if (
    normalized === "REJECTED" ||
    normalized === "WITHDRAWN" ||
    normalized === "DISQUALIFIED"
  ) {
    return "danger" as const;
  }

  return "default" as const;
}

export default async function OrganizationBidReportPage() {
  const membership = await prisma.organizationMember.findFirst({
    select: {
      organizationId: true,
    },
  });

  if (!membership) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Card>
            <div className="p-8 text-center">
              <Gavel className="mx-auto h-10 w-10 text-slate-400" />
              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Bid Report
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                No organization membership was found for this account.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const bids = await prisma.bid.findMany({
    where: {
      solicitation: {
        procurement: {
          organizationId: membership.organizationId,
        },
      },
    },
    select: {
      id: true,
      title: true,
      totalAmount: true,
      status: true,
      submittedAt: true,
      createdAt: true,
      updatedAt: true,
      vendor: {
        select: {
          id: true,
          companyName: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
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
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const submittedCount = bids.filter(
    (bid) => bid.submittedAt !== null,
  ).length;

  const draftCount = bids.filter(
    (bid) => bid.status === "DRAFT",
  ).length;

  const uniqueVendorIds = new Set(
    bids.map((bid) => bid.vendor.id),
  );

  const totalBidValue = bids.reduce((total, bid) => {
    if (bid.totalAmount === null) {
      return total;
    }

    return total + Number(bid.totalAmount);
  }, 0);

  const solicitationIds = new Set(
    bids.map((bid) => bid.solicitation.id),
  );

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <Link
            href="/dashboard/organization/reports"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Reports
          </Link>

          <div className="mt-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
              <Gavel className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Bid Report
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Review bid submissions, vendor participation, values, and
                solicitation activity.
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Bids
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {bids.length}
                </p>
              </div>
              <Gavel className="h-6 w-6 text-slate-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Vendors
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {uniqueVendorIds.size}
                </p>
              </div>
              <Users className="h-6 w-6 text-slate-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Submitted
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {submittedCount}
                </p>
              </div>
              <FileText className="h-6 w-6 text-slate-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Bid Value
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatAmount(totalBidValue)}
                </p>
              </div>
              <BarChart3 className="h-6 w-6 text-slate-500" />
            </div>
          </Card>
        </section>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-slate-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Bid Activity Summary
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Current participation across your organization&apos;s
                  solicitations.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Active Solicitation Participation
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {solicitationIds.size}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Draft Bids</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {draftCount}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Average Bids per Solicitation
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {solicitationIds.size > 0
                  ? (bids.length / solicitationIds.size).toFixed(1)
                  : "0.0"}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Bid Register
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Detailed record of vendor bids submitted against your
              solicitations.
            </p>
          </div>

          {bids.length === 0 ? (
            <div className="p-10 text-center">
              <Gavel className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-4 font-semibold text-slate-900">
                No bids found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Bid activity will appear here when vendors submit bids.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {bids.map((bid) => (
                <div
                  key={bid.id}
                  className="p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={getStatusVariant(bid.status)}>
                          {formatStatus(bid.status)}
                        </Badge>

                        <span className="text-xs font-medium text-slate-500">
                          {bid.solicitation.solicitationNumber}
                        </span>
                      </div>

                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {bid.title}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-slate-400" />
                          {bid.vendor.companyName}
                        </span>

                        <span>
                          Solicitation:{" "}
                          <span className="font-medium text-slate-800">
                            {bid.solicitation.title}
                          </span>
                        </span>

                        <span>
                          Procurement:{" "}
                          <span className="font-medium text-slate-800">
                            {bid.solicitation.procurement.referenceNumber}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 xl:text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Bid Amount
                      </p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {formatAmount(bid.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">
                          Submitted
                        </p>
                        <p className="text-sm font-medium text-slate-800">
                          {formatDate(bid.submittedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">Created</p>
                        <p className="text-sm font-medium text-slate-800">
                          {formatDate(bid.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <div>
                        <p className="text-xs text-slate-500">
                          Vendor Contact
                        </p>
                        <p className="truncate text-sm font-medium text-slate-800">
                          {bid.vendor.user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/dashboard/organization/solicitations/${bid.solicitation.id}`}
                      className="text-sm font-medium text-tenderhub-navy hover:underline"
                    >
                      View solicitation →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}