import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  FileText,
  MapPin,
  Send,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

type VendorBidPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VendorBidPage({
  params,
}: VendorBidPageProps) {
  const { id } = await params;

  const bid = await prisma.bid.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      vendorId: true,
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
        },
      },
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
          bidSecurityAmount: true,
          applicationFeeRequired: true,
          applicationFeeAmount: true,
          procurement: {
            select: {
              id: true,
              title: true,
              referenceNumber: true,
              country: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
              currency: {
                select: {
                  id: true,
                  code: true,
                  symbol: true,
                },
              },
              department: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!bid) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <FileText className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Bid Not Found
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                The requested bid could not be found.
              </p>

              <Link
                href="/dashboard/vendor/bids"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Bids
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const status = String(bid.status).toUpperCase();

  const statusClasses =
    status === "DRAFT"
      ? "bg-slate-100 text-slate-700"
      : status === "SUBMITTED"
        ? "bg-blue-50 text-blue-700"
        : status === "UNDER_EVALUATION"
          ? "bg-amber-50 text-amber-700"
          : status === "AWARDED"
            ? "bg-green-50 text-green-700"
            : status === "REJECTED"
              ? "bg-red-50 text-red-700"
              : "bg-slate-100 text-slate-700";

  const currency = bid.solicitation.procurement.currency?.code ?? "";

  const isDraft = status === "DRAFT";

  const isClosed =
    !!bid.solicitation.closingDate &&
    bid.solicitation.closingDate.getTime() <= Date.now();

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <Link
            href="/dashboard/vendor/bids"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-tenderhub-navy"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Bids
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
                  {bid.solicitation.solicitationNumber}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-bold text-slate-900 sm:text-3xl">
                {bid.title}
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                {bid.solicitation.title}
              </p>
            </div>

            {isDraft && !isClosed && (
              <Link
                href={`/dashboard/vendor/bids/new?solicitationId=${bid.solicitation.id}`}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-medium text-white transition hover:opacity-90"
              >
                Continue Bid
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <DollarSign className="h-4 w-4" />
                <p className="text-sm">Bid Amount</p>
              </div>

              <p className="mt-2 text-xl font-bold text-slate-900">
                {currency} {Number(bid.totalAmount).toLocaleString()}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <FileText className="h-4 w-4" />
                <p className="text-sm">Bid Status</p>
              </div>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {status.replace(/_/g, " ")}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <CalendarDays className="h-4 w-4" />
                <p className="text-sm">Created</p>
              </div>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {bid.createdAt.toLocaleDateString()}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 text-slate-500">
                <Send className="h-4 w-4" />
                <p className="text-sm">Submitted</p>
              </div>

              <p className="mt-2 text-lg font-bold text-slate-900">
                {bid.submittedAt
                  ? bid.submittedAt.toLocaleDateString()
                  : "Not submitted"}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Bid Information
                </h2>
              </div>

              <div className="grid gap-6 p-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Bid Title
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {bid.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Vendor
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {bid.vendor.companyName}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Amount
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {currency} {Number(bid.totalAmount).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Solicitation Number
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {bid.solicitation.solicitationNumber}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Procurement Method
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {bid.solicitation.procurementMethod}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Solicitation Type
                  </p>

                  <p className="mt-1 font-medium text-slate-900">
                    {bid.solicitation.type}
                  </p>
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
                <h3 className="text-lg font-semibold text-slate-900">
                  {bid.solicitation.title}
                </h3>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  {bid.solicitation.solicitationNumber}
                </p>

                {bid.solicitation.description && (
                  <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-600">
                    {bid.solicitation.description}
                  </p>
                )}

                <Link
                  href={`/dashboard/vendor/solicitations/${bid.solicitation.id}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-tenderhub-navy hover:underline"
                >
                  View Full Solicitation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Bid Timeline
                </h2>
              </div>

              <div className="p-6">
                <div className="relative space-y-7 before:absolute before:left-[9px] before:top-2 before:h-[calc(100%-16px)] before:w-px before:bg-slate-200">
                  <div className="relative flex gap-4">
                    <div className="z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy">
                      <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        Bid Created
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {bid.createdAt.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {bid.submittedAt ? (
                    <div className="relative flex gap-4">
                      <div className="z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-600">
                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                      </div>

                      <div>
                        <p className="font-medium text-slate-900">
                          Bid Submitted
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {bid.submittedAt.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="relative flex gap-4">
                      <div className="z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200">
                        <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                      </div>

                      <div>
                        <p className="font-medium text-slate-900">
                          Awaiting Submission
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          Complete the bid before submitting.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="relative flex gap-4">
                    <div className="z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200">
                      <Clock3 className="h-3.5 w-3.5 text-slate-500" />
                    </div>

                    <div>
                      <p className="font-medium text-slate-900">
                        Current Status
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {status.replace(/_/g, " ")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Solicitation Dates
                </h2>
              </div>

              <div className="space-y-5 p-6">
                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Published
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {bid.solicitation.publishedAt
                        ? bid.solicitation.publishedAt.toLocaleDateString()
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-slate-400" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Opening
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {bid.solicitation.openingDate
                        ? bid.solicitation.openingDate.toLocaleString()
                        : "Not specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock3 className="mt-0.5 h-4 w-4 text-slate-400" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Closing
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {bid.solicitation.closingDate
                        ? bid.solicitation.closingDate.toLocaleString()
                        : "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="border-b border-slate-200 p-6">
                <h2 className="font-semibold text-slate-900">
                  Procurement
                </h2>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Procurement
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {bid.solicitation.procurement.title}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Reference
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {bid.solicitation.procurement.referenceNumber}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 text-slate-400" />

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Country
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {bid.solicitation.procurement.country?.name ??
                        "Not specified"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Department
                  </p>

                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {bid.solicitation.procurement.department?.name ??
                      "Not specified"}
                  </p>
                </div>
              </div>
            </Card>

            {(bid.solicitation.bidSecurityRequired ||
              bid.solicitation.applicationFeeRequired) && (
              <Card>
                <div className="border-b border-slate-200 p-6">
                  <h2 className="font-semibold text-slate-900">
                    Financial Requirements
                  </h2>
                </div>

                <div className="space-y-4 p-6">
                  {bid.solicitation.bidSecurityRequired && (
                    <div className="rounded-lg bg-amber-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                        Bid Security
                      </p>

                      <p className="mt-1 font-semibold text-amber-900">
                        Required
                      </p>

                      {bid.solicitation.bidSecurityAmount && (
                        <p className="mt-1 text-sm text-amber-800">
                          Amount:{" "}
                          {Number(
                            bid.solicitation.bidSecurityAmount,
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {bid.solicitation.applicationFeeRequired && (
                    <div className="rounded-lg bg-slate-50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Application Fee
                      </p>

                      <p className="mt-1 font-semibold text-slate-900">
                        Required
                      </p>

                      {bid.solicitation.applicationFeeAmount && (
                        <p className="mt-1 text-sm text-slate-600">
                          Amount:{" "}
                          {Number(
                            bid.solicitation.applicationFeeAmount,
                          ).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {isDraft && !isClosed && (
              <Card>
                <div className="p-6">
                  <h2 className="font-semibold text-slate-900">
                    Continue Your Bid
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Your bid is still in draft status. Continue working on it
                    before the solicitation closes.
                  </p>

                  <Link
                    href={`/dashboard/vendor/bids/new?solicitationId=${bid.solicitation.id}`}
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-3 text-sm font-medium text-white transition hover:opacity-90"
                  >
                    Continue Bid
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </Card>
            )}

            <Card>
              <div className="p-6">
                <Link
                  href={`/dashboard/vendor/solicitations/${bid.solicitation.id}`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  View Solicitation
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}