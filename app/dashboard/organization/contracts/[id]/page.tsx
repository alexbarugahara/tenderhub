import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  FileText,
  Flag,
  Gavel,
  MapPin,
  Milestone,
  Receipt,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

function formatDateTime(date: Date | null | undefined) {
  if (!date) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
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
    normalized === "COMPLETED" ||
    normalized === "PAID" ||
    normalized === "APPROVED" ||
    normalized === "ACCEPTED"
  ) {
    return "success" as const;
  }

  if (
    normalized === "DRAFT" ||
    normalized === "PENDING" ||
    normalized === "PENDING_SIGNATURE" ||
    normalized === "IN_PROGRESS" ||
    normalized === "ON_HOLD"
  ) {
    return "warning" as const;
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "TERMINATED" ||
    normalized === "DECLINED" ||
    normalized === "FAILED" ||
    normalized === "EXPIRED"
  ) {
    return "danger" as const;
  }

  return "default" as const;
}

export default async function OrganizationContractDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const contract = await prisma.contract.findUnique({
    where: {
      id,
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

      vendor: {
        select: {
          id: true,
          companyName: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },

      award: {
        select: {
          id: true,
          awardNumber: true,
          status: true,
          awardAmount: true,
          awardDate: true,
          notes: true,

          bid: {
            select: {
              id: true,
              title: true,
              totalAmount: true,
              status: true,
              submittedAt: true,
            },
          },

          solicitation: {
            select: {
              id: true,
              solicitationNumber: true,
              title: true,
              status: true,
              closingDate: true,
              openingDate: true,

              procurement: {
                select: {
                  id: true,
                  title: true,
                  referenceNumber: true,
                  status: true,
                  procurementMethod: true,
                },
              },
            },
          },

          lot: {
            select: {
              id: true,
              number: true,
              title: true,
              description: true,
            },
          },
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
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },

      milestones: {
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          amount: true,
          status: true,
          completedAt: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          dueDate: "asc",
        },
      },

      payments: {
        select: {
          id: true,
          amount: true,
          currencyId: true,
          paymentDate: true,
          status: true,
          reference: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          paymentDate: "asc",
        },
      },
    },
  });

  if (!contract) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <Card>
            <div className="p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-400" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Contract Not Found
              </h1>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                The contract you are looking for does not exist or is no
                longer available.
              </p>

              <Link
                href="/dashboard/organization/contracts"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Contracts
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const paidPayments = contract.payments.filter(
    (payment) => payment.status === "PAID",
  );

  const pendingPayments = contract.payments.filter(
    (payment) => payment.status !== "PAID",
  );

  const totalPaid = paidPayments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );

  const totalPayments = contract.payments.reduce(
    (total, payment) => total + Number(payment.amount),
    0,
  );

  const completionPercentage =
    Number(contract.contractValue) > 0
      ? Math.min(
          100,
          Math.round(
            (totalPaid / Number(contract.contractValue)) * 100,
          ),
        )
      : 0;

  const completedMilestones = contract.milestones.filter(
    (milestone) => milestone.status === "COMPLETED",
  ).length;

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <Link
            href="/dashboard/organization/contracts"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contracts
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={getStatusVariant(contract.status)}>
                  {formatStatus(contract.status)}
                </Badge>

                <span className="text-sm font-medium text-slate-500">
                  {contract.contractNumber}
                </span>
              </div>

              <h1 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
                {contract.title}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Created {formatDate(contract.createdAt)}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/organization/contracts"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <FileText className="h-4 w-4" />
                Contract Register
              </Link>

              <Link
                href={`/dashboard/organization/awards/${contract.award.id}`}
                className="inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
              >
                <Gavel className="h-4 w-4" />
                View Award
              </Link>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Contract Value
                </p>
                <CircleDollarSign className="h-5 w-5 text-slate-500" />
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatAmount(contract.contractValue)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Total contract value
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">Paid</p>
                <CheckCircle2 className="h-5 w-5 text-slate-500" />
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatAmount(totalPaid)}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {completionPercentage}% of contract value
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Milestones
                </p>
                <Milestone className="h-5 w-5 text-slate-500" />
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {completedMilestones}/{contract.milestones.length}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Completed milestones
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  Documents
                </p>
                <FileText className="h-5 w-5 text-slate-500" />
              </div>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {contract.documents.length}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Contract documents
              </p>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-slate-600" />

                <h2 className="text-lg font-semibold text-slate-900">
                  Contract Overview
                </h2>
              </div>
            </div>

            <div className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Contract Number
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {contract.contractNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </p>

                  <div className="mt-2">
                    <Badge variant={getStatusVariant(contract.status)}>
                      {formatStatus(contract.status)}
                    </Badge>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Contract Value
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {formatAmount(contract.contractValue)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Signed Date
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {formatDate(contract.signedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Start Date
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {formatDate(contract.startDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    End Date
                  </p>

                  <p className="mt-2 font-semibold text-slate-900">
                    {formatDate(contract.endDate)}
                  </p>
                </div>
              </div>

              {contract.description && (
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {contract.description}
                  </p>
                </div>
              )}

              {contract.terminationReason && (
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Termination Reason
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {contract.terminationReason}
                  </p>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-slate-600" />

                <h2 className="text-lg font-semibold text-slate-900">
                  Vendor
                </h2>
              </div>
            </div>

            <div className="p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <Building2 className="h-6 w-6" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                {contract.vendor.companyName}
              </h3>

              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3">
                  <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <div>
                    <p className="text-xs text-slate-500">Contact</p>

                    <p className="text-sm font-medium text-slate-800">
                      {contract.vendor.user.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                  <div>
                    <p className="text-xs text-slate-500">Email</p>

                    <p className="break-all text-sm font-medium text-slate-800">
                      {contract.vendor.user.email}
                    </p>
                  </div>
                </div>

                {contract.vendor.user.phone && (
                  <div className="flex items-start gap-3">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                    <div>
                      <p className="text-xs text-slate-500">Phone</p>

                      <p className="text-sm font-medium text-slate-800">
                        {contract.vendor.user.phone}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <Gavel className="h-5 w-5 text-slate-600" />

                <h2 className="text-lg font-semibold text-slate-900">
                  Award Information
                </h2>
              </div>
            </div>

            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Award Number
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {contract.award.awardNumber}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Award Status
                </p>

                <div className="mt-2">
                  <Badge variant={getStatusVariant(contract.award.status)}>
                    {formatStatus(contract.award.status)}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Award Amount
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {formatAmount(contract.award.awardAmount)}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Award Date
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  {formatDate(contract.award.awardDate)}
                </p>
              </div>
            </div>

            {contract.award.notes && (
              <div className="border-t border-slate-200 p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Award Notes
                </p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {contract.award.notes}
                </p>
              </div>
            )}
          </Card>

          <Card>
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <Flag className="h-5 w-5 text-slate-600" />

                <h2 className="text-lg font-semibold text-slate-900">
                  Procurement Context
                </h2>
              </div>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Procurement
                </p>

                <Link
                  href={`/dashboard/organization/procurements/${contract.award.solicitation.procurement.id}`}
                  className="mt-2 block font-semibold text-tenderhub-navy hover:underline"
                >
                  {contract.award.solicitation.procurement.title}
                </Link>

                <p className="mt-1 text-sm text-slate-500">
                  {contract.award.solicitation.procurement.referenceNumber}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Solicitation
                </p>

                <Link
                  href={`/dashboard/organization/solicitations/${contract.award.solicitation.id}`}
                  className="mt-2 block font-semibold text-tenderhub-navy hover:underline"
                >
                  {contract.award.solicitation.title}
                </Link>

                <p className="mt-1 text-sm text-slate-500">
                  {contract.award.solicitation.solicitationNumber}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Lot
                </p>

                <p className="mt-2 font-semibold text-slate-900">
                  Lot {contract.award.lot.number}:{" "}
                  {contract.award.lot.title}
                </p>

                {contract.award.lot.description && (
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {contract.award.lot.description}
                  </p>
                )}
              </div>
            </div>
          </Card>
        </section>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <Gavel className="h-5 w-5 text-slate-600" />

              <h2 className="text-lg font-semibold text-slate-900">
                Winning Bid
              </h2>
            </div>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Bid
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {contract.award.bid.title || "Untitled bid"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Bid Amount
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {formatAmount(contract.award.bid.totalAmount)}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Bid Status
              </p>

              <div className="mt-2">
                <Badge variant={getStatusVariant(contract.award.bid.status)}>
                  {formatStatus(contract.award.bid.status)}
                </Badge>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Submitted
              </p>

              <p className="mt-2 font-semibold text-slate-900">
                {formatDate(contract.award.bid.submittedAt)}
              </p>
            </div>
          </div>
        </Card>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <Milestone className="h-5 w-5 text-slate-600" />

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Contract Milestones
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {completedMilestones} of {contract.milestones.length}{" "}
                    completed
                  </p>
                </div>
              </div>
            </div>

            {contract.milestones.length === 0 ? (
              <div className="p-8 text-center">
                <Milestone className="mx-auto h-8 w-8 text-slate-400" />

                <p className="mt-3 text-sm text-slate-500">
                  No milestones have been recorded for this contract.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {contract.milestones.map((milestone) => (
                  <div key={milestone.id} className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="mt-1">
                        {milestone.status === "COMPLETED" ? (
                          <CheckCircle2 className="h-5 w-5 text-slate-600" />
                        ) : (
                          <Clock3 className="h-5 w-5 text-slate-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <h3 className="font-medium text-slate-900">
                            {milestone.title}
                          </h3>

                          <Badge
                            variant={getStatusVariant(milestone.status)}
                          >
                            {formatStatus(milestone.status)}
                          </Badge>
                        </div>

                        {milestone.description && (
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {milestone.description}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-500">
                          <span>
                            Due {formatDate(milestone.dueDate)}
                          </span>

                          {milestone.completedAt && (
                            <span>
                              Completed{" "}
                              {formatDate(milestone.completedAt)}
                            </span>
                          )}

                          {milestone.amount !== null &&
                            milestone.amount !== undefined && (
                              <span>
                                Amount{" "}
                                {formatAmount(milestone.amount)}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <CircleDollarSign className="h-5 w-5 text-slate-600" />

                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Contract Payments
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatAmount(totalPaid)} paid of{" "}
                    {formatAmount(totalPayments)}
                  </p>
                </div>
              </div>
            </div>

            {contract.payments.length === 0 ? (
              <div className="p-8 text-center">
                <CircleDollarSign className="mx-auto h-8 w-8 text-slate-400" />

                <p className="mt-3 text-sm text-slate-500">
                  No contract payments have been recorded.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {contract.payments.map((payment) => (
                  <div key={payment.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {formatAmount(payment.amount)}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {payment.paymentDate
                            ? `Paid/recorded ${formatDate(payment.paymentDate)}`
                            : "Payment date not recorded"}
                        </p>

                        {payment.reference && (
                          <p className="mt-1 text-xs text-slate-400">
                            Reference: {payment.reference}
                          </p>
                        )}

                        {payment.notes && (
                          <p className="mt-2 text-xs leading-5 text-slate-500">
                            {payment.notes}
                          </p>
                        )}
                      </div>

                      <Badge variant={getStatusVariant(payment.status)}>
                        {formatStatus(payment.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {pendingPayments.length > 0 && (
              <div className="border-t border-slate-200 bg-slate-50 p-5">
                <p className="text-sm text-slate-600">
                  {pendingPayments.length} payment{" "}
                  {pendingPayments.length === 1
                    ? "item remains"
                    : "items remain"}{" "}
                  outstanding.
                </p>
              </div>
            )}
          </Card>
        </section>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-slate-600" />

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Contract Documents
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Documents associated with this contract.
                </p>
              </div>
            </div>
          </div>

          {contract.documents.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className="mx-auto h-9 w-9 text-slate-400" />

              <h3 className="mt-3 font-semibold text-slate-900">
                No documents
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                No documents have been attached to this contract.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {contract.documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <FileText className="h-5 w-5" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {document.name}
                      </p>

                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>
                          Added {formatDate(document.createdAt)}
                        </span>

                        {document.category && (
                          <span>{document.category}</span>
                        )}

                        {document.mimeType && (
                          <span>{document.mimeType}</span>
                        )}

                        {document.fileSize !== null &&
                          document.fileSize !== undefined && (
                            <span>
                              {Math.max(
                                1,
                                Math.round(document.fileSize / 1024),
                              )}{" "}
                              KB
                            </span>
                          )}
                      </div>
                    </div>
                  </div>

                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <Download className="h-4 w-4" />
                    Open Document
                  </a>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-5 w-5 text-slate-600" />

              <h2 className="text-lg font-semibold text-slate-900">
                Contract Timeline
              </h2>
            </div>
          </div>

          <div className="p-6">
            <div className="relative space-y-8 before:absolute before:left-5 before:top-3 before:h-[calc(100%-1.5rem)] before:w-px before:bg-slate-200">
              <div className="relative flex gap-4">
                <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-white">
                  <FileText className="h-4 w-4" />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    Contract Created
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatDateTime(contract.createdAt)}
                  </p>
                </div>
              </div>

              {contract.signedAt && (
                <div className="relative flex gap-4">
                  <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Contract Signed
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateTime(contract.signedAt)}
                    </p>
                  </div>
                </div>
              )}

              {contract.startDate && (
                <div className="relative flex gap-4">
                  <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                    <Flag className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Contract Start
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(contract.startDate)}
                    </p>
                  </div>
                </div>
              )}

              {contract.completedAt && (
                <div className="relative flex gap-4">
                  <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-white">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Contract Completed
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateTime(contract.completedAt)}
                    </p>
                  </div>
                </div>
              )}

              {contract.terminatedAt && (
                <div className="relative flex gap-4">
                  <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                    <Flag className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Contract Terminated
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDateTime(contract.terminatedAt)}
                    </p>
                  </div>
                </div>
              )}

              {contract.endDate && (
                <div className="relative flex gap-4">
                  <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                    <MapPin className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">
                      Contract End
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(contract.endDate)}
                    </p>
                  </div>
                </div>
              )}

              <div className="relative flex gap-4">
                <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700">
                  <Clock3 className="h-4 w-4" />
                </div>

                <div>
                  <p className="font-semibold text-slate-900">
                    Last Updated
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {formatDateTime(contract.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
