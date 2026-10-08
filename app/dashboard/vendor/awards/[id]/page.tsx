import Link from "next/link";
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  Trophy,
  XCircle,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

type VendorAwardDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VendorAwardDetailPage({
  params,
}: VendorAwardDetailPageProps) {
  const { id } = await params;

  const award = await prisma.award.findUnique({
    where: {
      id,
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
          contractValue: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  if (!award) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <Award className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Award Not Found
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                The requested award could not be found.
              </p>

              <Link
                href="/dashboard/vendor/awards"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Awards
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const status = String(award.status).toUpperCase();

  const statusClasses =
    status === "ACCEPTED" || status === "APPROVED"
      ? "bg-green-50 text-green-700"
      : status === "CANCELLED" || status === "DECLINED"
        ? "bg-red-50 text-red-700"
        : "bg-amber-50 text-amber-700";

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

  const procurement = award.solicitation.procurement;

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <Link
            href="/dashboard/vendor/awards"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Awards
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
                  {award.awardNumber}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                Procurement Award
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Award {award.awardNumber} issued to{" "}
                {award.vendor.companyName}
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-tenderhub-navy text-white">
              <Trophy className="h-7 w-7" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Award className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Award Number
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {award.awardNumber}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Award Status
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {status.replace(/_/g, " ")}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <CalendarDays className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Award Date
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {award.awardDate.toLocaleDateString()}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <FileText className="h-5 w-5" />
              </div>

              <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                Contract
              </p>

              <p className="mt-1 text-lg font-bold text-slate-900">
                {award.contract ? "Linked" : "Not linked"}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Award Details
                </h2>
              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Award Number
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {award.awardNumber}
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
                    Award Amount
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {formatAmount(award.awardAmount)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Award Date
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {award.awardDate.toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Created
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {award.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Last Updated
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {award.updatedAt.toLocaleDateString()}
                  </p>
                </div>

                {award.notes && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Notes
                    </p>

                    <p className="mt-2 whitespace-pre-line text-sm leading-7 text-slate-600">
                      {award.notes}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Winning Bid
                </h2>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Bid
                    </p>

                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {award.bid.title || award.bid.bidNumber}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {award.bid.bidNumber}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${
                      String(award.bid.status).toUpperCase() ===
                      "SUBMITTED"
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {String(award.bid.status).replace(/_/g, " ")}
                  </span>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Bid Amount
                    </p>

                    <p className="mt-1 text-xl font-bold text-slate-900">
                      {formatAmount(award.bid.totalAmount)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Submitted
                    </p>

                    <p className="mt-1 font-medium text-slate-900">
                      {award.bid.submittedAt
                        ? award.bid.submittedAt.toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Solicitation
                </h2>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Solicitation
                  </p>

                  <p className="mt-1 text-lg font-semibold text-slate-900">
                    {award.solicitation.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {award.solicitation.solicitationNumber}
                  </p>
                </div>

                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Status
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {String(award.solicitation.status).replace(
                        /_/g,
                        " ",
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Opening Date
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {award.solicitation.openingDate
                        ? award.solicitation.openingDate.toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Closing Date
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {award.solicitation.closingDate
                        ? award.solicitation.closingDate.toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/dashboard/vendor/solicitations/${award.solicitation.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <FileText className="h-4 w-4" />
                  View Solicitation
                </Link>
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Procurement
                </h2>
              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Procurement
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {procurement.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Reference Number
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {procurement.referenceNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {String(procurement.status).replace(/_/g, " ")}
                  </p>
                </div>
              </div>
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
                  {award.vendor.companyName}
                </h3>

                {award.vendor.user.name && (
                  <p className="mt-1 text-sm text-slate-500">
                    {award.vendor.user.name}
                  </p>
                )}

                <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
                  <div>
                    <p className="text-xs text-slate-400">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-medium text-slate-700">
                      {award.vendor.user.email}
                    </p>
                  </div>

                  {award.vendor.user.phone && (
                    <div>
                      <p className="text-xs text-slate-400">
                        Phone
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {award.vendor.user.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Contract
                </h2>
              </div>

              {award.contract ? (
                <div className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>

                  <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                    Contract Number
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {award.contract.contractNumber}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {award.contract.title}
                  </p>

                  <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-500">
                        Status
                      </span>

                      <span className="text-sm font-medium text-slate-900">
                        {String(award.contract.status).replace(
                          /_/g,
                          " ",
                        )}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-500">
                        Start
                      </span>

                      <span className="text-sm font-medium text-slate-900">
                        {award.contract.startDate
                          ? award.contract.startDate.toLocaleDateString()
                          : "Not specified"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm text-slate-500">
                        End
                      </span>

                      <span className="text-sm font-medium text-slate-900">
                        {award.contract.endDate
                          ? award.contract.endDate.toLocaleDateString()
                          : "Not specified"}
                      </span>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400">
                        Contract Value
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {formatAmount(award.contract.contractValue)}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/vendor/contracts/${award.contract.id}`}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    <FileText className="h-4 w-4" />
                    View Contract
                  </Link>
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Clock3 className="mx-auto h-9 w-9 text-slate-300" />

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    No contract has been linked to this award yet.
                  </p>
                </div>
              )}
            </Card>

            {(status === "DECLINED" || status === "CANCELLED") && (
              <Card>
                <div className="p-6">
                  <div className="flex items-start gap-3">
                    <XCircle className="mt-0.5 h-5 w-5 text-red-500" />

                    <div>
                      <h2 className="font-semibold text-slate-900">
                        Award Status
                      </h2>

                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        This award currently has a{" "}
                        {status.replace(/_/g, " ").toLowerCase()} status.
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}