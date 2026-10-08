import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  DollarSign,
  FileText,
  TrendingUp,
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
    normalized === "ACTIVE" ||
    normalized === "OPEN" ||
    normalized === "COMPLETED"
  ) {
    return "success" as const;
  }

  if (normalized === "DRAFT" || normalized === "PENDING") {
    return "warning" as const;
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "CLOSED" ||
    normalized === "REJECTED"
  ) {
    return "danger" as const;
  }

  return "default" as const;
}

export default async function ProcurementReportPage() {
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
              <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-400" />
              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Procurement Report
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

  const procurements = await prisma.procurement.findMany({
    where: {
      organizationId: membership.organizationId,
    },
    select: {
      id: true,
      title: true,
      referenceNumber: true,
      status: true,
      procurementMethod: true,
      estimatedValue: true,
      plannedStartDate: true,
      plannedEndDate: true,
      createdAt: true,
      updatedAt: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
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
          name: true,
        },
      },
      solicitations: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const totalEstimatedValue = procurements.reduce((total, procurement) => {
    if (procurement.estimatedValue === null) {
      return total;
    }

    return total + Number(procurement.estimatedValue);
  }, 0);

  const activeCount = procurements.filter(
    (procurement) => procurement.status === "ACTIVE",
  ).length;

  const draftCount = procurements.filter(
    (procurement) => procurement.status === "DRAFT",
  ).length;

  const completedCount = procurements.filter(
    (procurement) => procurement.status === "COMPLETED",
  ).length;

  const solicitationCount = procurements.reduce(
    (total, procurement) => total + procurement.solicitations.length,
    0,
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
              <BriefcaseBusiness className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Procurement Report
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Overview of procurement activity, values, methods, statuses,
                and timelines.
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Total Procurements
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {procurements.length}
                </p>
              </div>
              <BriefcaseBusiness className="h-6 w-6 text-slate-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Estimated Value
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-900">
                  {formatAmount(totalEstimatedValue)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-slate-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Active
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {activeCount}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-slate-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Solicitations
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {solicitationCount}
                </p>
              </div>
              <FileText className="h-6 w-6 text-slate-500" />
            </div>
          </Card>
        </section>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-slate-600" />
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Procurement Summary
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Current procurement portfolio breakdown.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Draft Procurements</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {draftCount}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Active Procurements</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {activeCount}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Completed Procurements
              </p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {completedCount}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Procurement Register
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Detailed procurement activity for the organization.
            </p>
          </div>

          {procurements.length === 0 ? (
            <div className="p-10 text-center">
              <BriefcaseBusiness className="mx-auto h-10 w-10 text-slate-400" />
              <h3 className="mt-4 font-semibold text-slate-900">
                No procurements found
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Procurement activity will appear here once records are
                created.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {procurements.map((procurement) => {
                const currencyCode = procurement.currency?.code
                  ? `${procurement.currency.code} `
                  : "";

                return (
                  <div
                    key={procurement.id}
                    className="p-6 transition hover:bg-slate-50"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant={getStatusVariant(procurement.status)}
                          >
                            {formatStatus(procurement.status)}
                          </Badge>

                          <span className="text-xs font-medium text-slate-500">
                            {procurement.referenceNumber}
                          </span>
                        </div>

                        <Link
                          href={`/dashboard/organization/procurements/${procurement.id}`}
                          className="mt-2 block text-lg font-semibold text-slate-900 hover:text-tenderhub-navy"
                        >
                          {procurement.title}
                        </Link>

                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                          <span>
                            Method:{" "}
                            <span className="font-medium text-slate-800">
                              {formatStatus(procurement.procurementMethod)}
                            </span>
                          </span>

                          <span>
                            Department:{" "}
                            <span className="font-medium text-slate-800">
                              {procurement.department?.name ?? "Not assigned"}
                            </span>
                          </span>

                          <span>
                            Country:{" "}
                            <span className="font-medium text-slate-800">
                              {procurement.country?.name ?? "Not specified"}
                            </span>
                          </span>

                          <span>
                            Solicitations:{" "}
                            <span className="font-medium text-slate-800">
                              {procurement.solicitations.length}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 xl:text-right">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                          Estimated Value
                        </p>
                        <p className="mt-1 text-xl font-bold text-slate-900">
                          {currencyCode}
                          {formatAmount(procurement.estimatedValue)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-3">
                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">
                            Planned Start
                          </p>
                          <p className="text-sm font-medium text-slate-800">
                            {formatDate(procurement.plannedStartDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">
                            Planned End
                          </p>
                          <p className="text-sm font-medium text-slate-800">
                            {formatDate(procurement.plannedEndDate)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="text-xs text-slate-500">
                            Created
                          </p>
                          <p className="text-sm font-medium text-slate-800">
                            {formatDate(procurement.createdAt)}
                          </p>
                        </div>
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