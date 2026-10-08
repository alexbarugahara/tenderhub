import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileSignature,
  FileText,
  ShieldCheck,
  Wallet,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

type VendorContractDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VendorContractDetailPage({
  params,
}: VendorContractDetailPageProps) {
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

          bid: {
            select: {
              id: true,
              bidNumber: true,
              title: true,
              totalAmount: true,

              currency: {
                select: {
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
                  publishedAt: true,
                  openingDate: true,
                  closingDate: true,

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
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <FileSignature className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Contract Not Found
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                The requested contract could not be found.
              </p>

              <Link
                href="/dashboard/vendor/contracts"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
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

  const status = String(contract.status).toUpperCase();

  const statusClasses =
    status === "ACTIVE"
      ? "bg-green-50 text-green-700"
      : status === "COMPLETED"
        ? "bg-blue-50 text-blue-700"
        : status === "TERMINATED" || status === "EXPIRED"
          ? "bg-red-50 text-red-700"
          : status === "ON_HOLD"
            ? "bg-orange-50 text-orange-700"
            : "bg-amber-50 text-amber-700";

  const now = new Date();

  const daysUntilEnd = contract.endDate
    ? Math.ceil(
        (contract.endDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const isExpired =
    status === "EXPIRED" ||
    (daysUntilEnd !== null && daysUntilEnd < 0);

  const isEndingSoon =
    daysUntilEnd !== null &&
    daysUntilEnd >= 0 &&
    daysUntilEnd <= 90 &&
    status === "ACTIVE";

  const currencyCode = contract.award.bid.currency?.code ?? null;

  const formatAmount = (
    value: unknown,
    code: string | null = currencyCode,
  ) => {
    if (value === null || value === undefined) {
      return "Not specified";
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return String(value);
    }

    return `${code ? `${code} ` : ""}${numericValue.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}`;
  };

  const completedMilestones = contract.milestones.filter(
    (milestone) =>
      String(milestone.status).toUpperCase() === "COMPLETED",
  ).length;

  const paidPayments = contract.payments.filter(
    (payment) => String(payment.status).toUpperCase() === "PAID",
  ).length;

  const totalPayments = contract.payments.length;

  const solicitation = contract.award.bid.solicitation;
  const procurement = solicitation.procurement;

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <Link
            href="/dashboard/vendor/contracts"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Contracts
          </Link>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
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

              <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                {contract.title}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Contract with {contract.vendor.companyName}
              </p>
            </div>

            {isEndingSoon && !isExpired && (
              <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-3 text-sm font-medium text-orange-700">
                <Clock3 className="h-4 w-4" />
                Ends in {daysUntilEnd} day
                {daysUntilEnd === 1 ? "" : "s"}
              </div>
            )}

            {isExpired && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                <XCircle className="h-4 w-4" />
                Contract end date has passed
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Wallet className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Contract Value
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {formatAmount(contract.contractValue)}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Milestones
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {completedMilestones}/{contract.milestones.length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CalendarDays className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Start Date
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {contract.startDate
                  ? contract.startDate.toLocaleDateString()
                  : "Not specified"}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <CalendarDays className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                End Date
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                {contract.endDate
                  ? contract.endDate.toLocaleDateString()
                  : "Not specified"}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Contract Overview
                </h2>
              </div>

              <div className="space-y-6 p-6">
                {contract.description && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Description
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                      {contract.description}
                    </p>
                  </div>
                )}

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Contract Number
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {contract.contractNumber}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Status
                    </p>

                    <span
                      className={`mt-1 inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusClasses}`}
                    >
                      {status.replace(/_/g, " ")}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Contract Value
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {formatAmount(contract.contractValue)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Currency
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {contract.award.bid.currency
                        ? `${contract.award.bid.currency.code} — ${contract.award.bid.currency.name}`
                        : "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Start Date
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {contract.startDate
                        ? contract.startDate.toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      End Date
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {contract.endDate
                        ? contract.endDate.toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>

                  {contract.signedAt && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Signed Date
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {contract.signedAt.toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {contract.completedAt && (
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Completed Date
                      </p>

                      <p className="mt-1 font-medium text-slate-900">
                        {contract.completedAt.toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                {contract.terminatedAt && (
                  <div className="rounded-lg bg-red-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-red-600">
                      Terminated
                    </p>

                    <p className="mt-1 text-sm text-red-700">
                      {contract.terminatedAt.toLocaleDateString()}
                    </p>

                    {contract.terminationReason && (
                      <p className="mt-2 text-sm leading-6 text-red-700">
                        {contract.terminationReason}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Procurement Context
                </h2>
              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Procurement
                  </p>

                  <div className="mt-2">
                    <p className="font-medium text-slate-900">
                      {procurement.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {procurement.referenceNumber}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Solicitation
                  </p>

                  <div className="mt-2">
                    <p className="font-medium text-slate-900">
                      {solicitation.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {solicitation.solicitationNumber}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Award
                  </p>

                  <div className="mt-2">
                    <p className="font-medium text-slate-900">
                      {contract.award.awardNumber}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Award amount:{" "}
                      {formatAmount(contract.award.awardAmount)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Bid
                  </p>

                  <div className="mt-2">
                    <p className="font-medium text-slate-900">
                      {contract.award.bid.bidNumber}
                    </p>

                    {contract.award.bid.title && (
                      <p className="mt-1 text-xs text-slate-500">
                        {contract.award.bid.title}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Contract Created
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {contract.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Award Date
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {contract.award.awardDate.toLocaleDateString()}
                  </p>
                </div>
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Milestones
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Contract delivery milestones and progress.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {completedMilestones}/{contract.milestones.length}{" "}
                    completed
                  </span>
                </div>
              </div>

              {contract.milestones.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock3 className="mx-auto h-9 w-9 text-slate-300" />

                  <p className="mt-3 text-sm text-slate-500">
                    No milestones have been recorded for this contract.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {contract.milestones.map((milestone) => {
                    const milestoneStatus = String(
                      milestone.status,
                    ).toUpperCase();

                    const milestoneClasses =
                      milestoneStatus === "COMPLETED"
                        ? "bg-green-50 text-green-700"
                        : milestoneStatus === "CANCELLED"
                          ? "bg-red-50 text-red-700"
                          : milestoneStatus === "DELAYED"
                            ? "bg-orange-50 text-orange-700"
                            : "bg-amber-50 text-amber-700";

                    return (
                      <div key={milestone.id} className="p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="font-medium text-slate-900">
                              {milestone.title}
                            </h3>

                            {milestone.description && (
                              <p className="mt-1 text-sm leading-6 text-slate-500">
                                {milestone.description}
                              </p>
                            )}

                            <p className="mt-3 text-xs text-slate-400">
                              Due:{" "}
                              {milestone.dueDate
                                ? milestone.dueDate.toLocaleDateString()
                                : "Not specified"}
                            </p>

                            {milestone.amount !== null &&
                              milestone.amount !== undefined && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Amount:{" "}
                                  {formatAmount(milestone.amount)}
                                </p>
                              )}

                            {milestone.completedAt && (
                              <p className="mt-1 text-xs text-green-600">
                                Completed:{" "}
                                {milestone.completedAt.toLocaleDateString()}
                              </p>
                            )}
                          </div>

                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${milestoneClasses}`}
                          >
                            {milestoneStatus.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-slate-900">
                      Contract Payments
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Payment records associated with this contract.
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {paidPayments}/{totalPayments} paid
                  </span>
                </div>
              </div>

              {contract.payments.length === 0 ? (
                <div className="p-8 text-center">
                  <Wallet className="mx-auto h-9 w-9 text-slate-300" />

                  <p className="mt-3 text-sm text-slate-500">
                    No contract payments have been recorded.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {contract.payments.map((payment) => {
                    const paymentStatus = String(
                      payment.status,
                    ).toUpperCase();

                    const paymentClasses =
                      paymentStatus === "PAID"
                        ? "bg-green-50 text-green-700"
                        : paymentStatus === "FAILED" ||
                            paymentStatus === "CANCELLED"
                          ? "bg-red-50 text-red-700"
                          : "bg-amber-50 text-amber-700";

                    return (
                      <div key={payment.id} className="p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {formatAmount(payment.amount)}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              Payment date:{" "}
                              {payment.paymentDate
                                ? payment.paymentDate.toLocaleDateString()
                                : "Not recorded"}
                            </p>

                            {payment.reference && (
                              <p className="mt-1 text-xs text-slate-500">
                                Reference: {payment.reference}
                              </p>
                            )}

                            {payment.notes && (
                              <p className="mt-1 text-xs text-slate-500">
                                {payment.notes}
                              </p>
                            )}
                          </div>

                          <span
                            className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${paymentClasses}`}
                          >
                            {paymentStatus.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Contract Documents
                </h2>
              </div>

              {contract.documents.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="mx-auto h-9 w-9 text-slate-300" />

                  <p className="mt-3 text-sm text-slate-500">
                    No documents have been attached to this contract.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {contract.documents.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                          <FileText className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">
                            {document.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {document.category}
                            {" • "}
                            {document.mimeType ?? "File"}
                            {document.fileSize
                              ? ` • ${Math.ceil(
                                  document.fileSize / 1024,
                                )} KB`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <a
                        href={document.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <Download className="h-4 w-4" />
                        Open
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Vendor
                </h2>
              </div>

              <div className="p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                  <ShieldCheck className="h-6 w-6" />
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  {contract.vendor.companyName}
                </h3>

                {contract.vendor.user.name && (
                  <p className="mt-1 text-sm text-slate-500">
                    {contract.vendor.user.name}
                  </p>
                )}

                <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
                  <div>
                    <p className="text-xs text-slate-400">Email</p>

                    <p className="mt-1 break-all text-sm font-medium text-slate-700">
                      {contract.vendor.user.email}
                    </p>
                  </div>

                  {contract.vendor.user.phone && (
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {contract.vendor.user.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Solicitation
                </h2>
              </div>

              <div className="p-6">
                <p className="font-medium text-slate-900">
                  {solicitation.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {solicitation.solicitationNumber}
                </p>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Status</span>

                    <span className="font-medium text-slate-900">
                      {String(solicitation.status).replace(/_/g, " ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Opening</span>

                    <span className="font-medium text-slate-900">
                      {solicitation.openingDate
                        ? solicitation.openingDate.toLocaleDateString()
                        : "Not specified"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">Closing</span>

                    <span className="font-medium text-slate-900">
                      {solicitation.closingDate
                        ? solicitation.closingDate.toLocaleDateString()
                        : "Not specified"}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <h2 className="font-semibold text-slate-900">
                  Procurement
                </h2>

                <p className="mt-2 font-medium text-slate-900">
                  {procurement.title}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {procurement.referenceNumber}
                </p>

                <div className="mt-4 flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-500">Status</span>

                  <span className="font-medium text-slate-900">
                    {String(procurement.status).replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Last Updated
                </p>

                <p className="mt-1 text-sm font-medium text-slate-900">
                  {contract.updatedAt.toLocaleString()}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}