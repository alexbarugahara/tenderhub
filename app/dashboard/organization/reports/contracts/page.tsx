import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  FileText,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

import { auth } from "@/auth";
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
  switch (status) {
    case "ACTIVE":
    case "COMPLETED":
      return "success" as const;

    case "DRAFT":
    case "PENDING_SIGNATURE":
    case "ON_HOLD":
      return "warning" as const;

    case "TERMINATED":
    case "EXPIRED":
      return "danger" as const;

    default:
      return "default" as const;
  }
}

export default async function OrganizationContractReportPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Card>
            <div className="p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-400" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Contract Report
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                You must be signed in to view contract reports.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
    },
    select: {
      organizationId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!membership) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Card>
            <div className="p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-400" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Contract Report
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

  const organization = await prisma.organization.findUnique({
    where: {
      id: membership.organizationId,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!organization) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Card>
            <div className="p-8 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-400" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Organization Not Found
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                The organization associated with this account could not be
                found.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const contracts = await prisma.contract.findMany({
    where: {
      organizationId: organization.id,
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

      award: {
        select: {
          id: true,
          awardNumber: true,
          awardAmount: true,
          awardDate: true,

          solicitation: {
            select: {
              id: true,
              solicitationNumber: true,
              title: true,

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
      },

      documents: {
        select: {
          id: true,
        },
      },

      milestones: {
        select: {
          id: true,
          status: true,
          dueDate: true,
        },
      },

      payments: {
        select: {
          id: true,
          amount: true,
          status: true,
          paymentDate: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  const totalContractValue = contracts.reduce(
    (total, contract) => total + Number(contract.contractValue),
    0,
  );

  const activeCount = contracts.filter(
    (contract) => contract.status === "ACTIVE",
  ).length;

  const signedCount = contracts.filter(
    (contract) => contract.signedAt !== null,
  ).length;

  const completedCount = contracts.filter(
    (contract) => contract.status === "COMPLETED",
  ).length;

  const vendorIds = new Set(
    contracts.map((contract) => contract.vendor.id),
  );

  const totalPayments = contracts.reduce((total, contract) => {
    return (
      total +
      contract.payments.reduce(
        (paymentTotal, payment) =>
          paymentTotal + Number(payment.amount),
        0,
      )
    );
  }, 0);

  const totalDocuments = contracts.reduce(
    (total, contract) => total + contract.documents.length,
    0,
  );

  const totalMilestones = contracts.reduce(
    (total, contract) => total + contract.milestones.length,
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
              <FileText className="h-6 w-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                {organization.name}
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Contract Report
              </h1>

              <p className="mt-1 text-sm text-slate-600">
                Monitor contract values, vendors, lifecycle dates, payments,
                milestones, and execution status.
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <MetricCard
            label="Contracts"
            value={contracts.length}
          />

          <MetricCard
            label="Contract Value"
            value={formatAmount(totalContractValue)}
          />

          <MetricCard
            label="Active"
            value={activeCount}
          />

          <MetricCard
            label="Signed"
            value={signedCount}
          />

          <MetricCard
            label="Vendors"
            value={vendorIds.size}
          />
        </section>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-slate-600" />

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Contract Portfolio Summary
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Overview of contract execution and financial activity.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-4">
            <SummaryMetric
              label="Completed Contracts"
              value={completedCount}
            />

            <SummaryMetric
              label="Contract Payments"
              value={formatAmount(totalPayments)}
            />

            <SummaryMetric
              label="Documents"
              value={totalDocuments}
            />

            <SummaryMetric
              label="Milestones"
              value={totalMilestones}
            />
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Contract Register
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Detailed contracts resulting from procurement awards.
            </p>
          </div>

          {contracts.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-400" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No contracts found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Contract records will appear here after awards result in
                contracts.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={getStatusVariant(contract.status)}
                        >
                          {formatStatus(contract.status)}
                        </Badge>

                        <span className="text-xs font-medium text-slate-500">
                          {contract.contractNumber}
                        </span>
                      </div>

                      <Link
                        href={`/dashboard/organization/contracts/${contract.id}`}
                        className="mt-2 block text-lg font-semibold text-slate-900 hover:text-tenderhub-navy"
                      >
                        {contract.title}
                      </Link>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-slate-400" />

                          {contract.vendor.companyName}
                        </span>

                        <span>
                          Award:{" "}
                          <span className="font-medium text-slate-800">
                            {contract.award.awardNumber}
                          </span>
                        </span>

                        <span>
                          Solicitation:{" "}
                          <span className="font-medium text-slate-800">
                            {
                              contract.award.solicitation
                                .solicitationNumber
                            }
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 xl:text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Contract Value
                      </p>

                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {formatAmount(contract.contractValue)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
                    <DateMetric
                      icon={
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                      }
                      label="Start Date"
                      value={formatDate(contract.startDate)}
                    />

                    <DateMetric
                      icon={
                        <CalendarDays className="h-4 w-4 text-slate-400" />
                      }
                      label="End Date"
                      value={formatDate(contract.endDate)}
                    />

                    <DateMetric
                      icon={
                        <CheckCircle2 className="h-4 w-4 text-slate-400" />
                      }
                      label="Signed"
                      value={formatDate(contract.signedAt)}
                    />

                    <DateMetric
                      icon={
                        <Clock className="h-4 w-4 text-slate-400" />
                      }
                      label="Milestones"
                      value={contract.milestones.length.toString()}
                    />
                  </div>

                  <div className="mt-5 grid gap-4 sm:grid-cols-3">
                    <SummaryBox
                      label="Payments"
                      value={contract.payments.length}
                    />

                    <SummaryBox
                      label="Documents"
                      value={contract.documents.length}
                    />

                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Procurement
                      </p>

                      <p className="mt-1 truncate text-sm font-semibold text-slate-900">
                        {contract.award.solicitation.procurement.title}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-4">
                    <Link
                      href={`/dashboard/organization/contracts/${contract.id}`}
                      className="text-sm font-medium text-tenderhub-navy hover:underline"
                    >
                      View contract →
                    </Link>

                    <Link
                      href={`/dashboard/organization/awards/${contract.award.id}`}
                      className="text-sm font-medium text-slate-600 hover:text-tenderhub-navy hover:underline"
                    >
                      View award →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="flex items-start gap-4 p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <DollarSign className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-slate-900">
                Contract Financial Overview
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Contract values and payment activity are summarized from
                contract records associated with this organization&apos;s
                procurement awards. Individual contract records contain
                detailed payment and milestone information.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <div className="p-5">
        <p className="text-sm font-medium text-slate-500">
          {label}
        </p>

        <p className="mt-2 text-2xl font-bold text-slate-900">
          {value}
        </p>
      </div>
    </Card>
  );
}

function SummaryMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-5">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function DateMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {icon}

      <div>
        <p className="text-xs text-slate-500">{label}</p>

        <p className="text-sm font-medium text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}