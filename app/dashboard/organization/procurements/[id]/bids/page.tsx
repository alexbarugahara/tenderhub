import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  FileText,
  Gavel,
  Users,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatAmount(
  amount: unknown,
  currencyCode?: string | null
) {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(date: Date | null) {
  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getStatusClasses(status: string) {
  switch (status) {
    case "SUBMITTED":
      return "bg-blue-50 text-blue-700";
    case "UNDER_REVIEW":
      return "bg-amber-50 text-amber-700";
    case "COMPLIANT":
      return "bg-green-50 text-green-700";
    case "NON_COMPLIANT":
      return "bg-red-50 text-red-700";
    case "SHORTLISTED":
      return "bg-purple-50 text-purple-700";
    case "EVALUATED":
      return "bg-indigo-50 text-indigo-700";
    case "AWARDED":
      return "bg-emerald-50 text-emerald-700";
    case "WITHDRAWN":
      return "bg-gray-100 text-gray-700";
    case "REJECTED":
      return "bg-red-50 text-red-700";
    case "DRAFT":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default async function ProcurementBidsPage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const { id } = await params;

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      organization: {
        procurements: {
          some: {
            id,
          },
        },
      },
    },
    select: {
      organizationId: true,
    },
  });

  if (!membership) {
    notFound();
  }

  const procurement = await prisma.procurement.findFirst({
    where: {
      id,
      organizationId: membership.organizationId,
    },
    select: {
      id: true,
      title: true,
      referenceNumber: true,
      status: true,
      solicitations: {
        select: {
          id: true,
          title: true,
          solicitationNumber: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!procurement) {
    notFound();
  }

  const bids = await prisma.bid.findMany({
    where: {
      solicitation: {
        procurementId: procurement.id,
        organizationId: membership.organizationId,
      },
    },
    select: {
      id: true,
      bidNumber: true,
      status: true,
      title: true,
      totalAmount: true,
      submittedAt: true,
      vendor: {
        select: {
          id: true,
          companyName: true,
          legalName: true,
        },
      },
      solicitation: {
        select: {
          id: true,
          title: true,
          solicitationNumber: true,
          currency: {
            select: {
              code: true,
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
      evaluations: {
        select: {
          id: true,
          status: true,
          totalScore: true,
        },
      },
    },
    orderBy: {
      submittedAt: "desc",
    },
  });

  const submittedBids = bids.filter(
    (bid) => bid.submittedAt !== null
  ).length;

  const evaluationCount = bids.reduce(
    (total, bid) => total + bid.evaluations.length,
    0
  );

  const awardedCount = bids.filter(
    (bid) => bid.status === "AWARDED"
  ).length;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <Link
            href={`/dashboard/organization/procurements/${procurement.id}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Procurement
          </Link>
        </div>

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Gavel className="h-6 w-6 text-[#D4AF37]" />
              <span className="text-sm font-medium text-gray-500">
                Procurement {procurement.referenceNumber}
              </span>
            </div>

            <h1 className="text-3xl font-bold text-[#071A33]">
              Bids
            </h1>

            <p className="mt-2 max-w-3xl text-gray-600">
              Review and manage bids submitted against the solicitations
              within this procurement.
            </p>

            <p className="mt-2 text-sm text-gray-500">
              {procurement.title}
            </p>
          </div>

          <Link
            href={`/dashboard/organization/procurements/${procurement.id}/solicitations`}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            View Solicitations
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Submitted Bids
                </p>
                <p className="mt-1 text-2xl font-bold text-[#071A33]">
                  {submittedBids}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Evaluations
                </p>
                <p className="mt-1 text-2xl font-bold text-[#071A33]">
                  {evaluationCount}
                </p>
              </div>

              <div className="rounded-lg bg-amber-50 p-3">
                <Gavel className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  Awarded Bids
                </p>
                <p className="mt-1 text-2xl font-bold text-[#071A33]">
                  {awardedCount}
                </p>
              </div>

              <div className="rounded-lg bg-green-50 p-3">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-[#071A33]">
              All Bids
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {bids.length} bid{bids.length === 1 ? "" : "s"} found for
              this procurement.
            </p>
          </div>

          {bids.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <Gavel className="mx-auto h-10 w-10 text-gray-400" />

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No bids yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Vendors have not submitted any bids for the
                solicitations in this procurement yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Bid
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Vendor
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Solicitation
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Lot
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Submitted
                    </th>

                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200 bg-white">
                  {bids.map((bid) => {
                    const evaluationStatus =
                      bid.evaluations.length > 0
                        ? bid.evaluations
                            .map((evaluation) => evaluation.status)
                            .join(", ")
                        : "Not evaluated";

                    return (
                      <tr
                        key={bid.id}
                        className="hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="font-semibold text-gray-900">
                            {bid.bidNumber}
                          </div>

                          {bid.title && (
                            <div className="mt-1 max-w-xs truncate text-xs text-gray-500">
                              {bid.title}
                            </div>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {bid.vendor.companyName}
                          </div>

                          {bid.vendor.legalName &&
                            bid.vendor.legalName !==
                              bid.vendor.companyName && (
                              <div className="mt-1 text-xs text-gray-500">
                                {bid.vendor.legalName}
                              </div>
                            )}
                        </td>

                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">
                            {bid.solicitation.solicitationNumber}
                          </div>

                          <div className="mt-1 max-w-xs truncate text-xs text-gray-500">
                            {bid.solicitation.title}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-700">
                          {bid.lot
                            ? `Lot ${bid.lot.number} — ${bid.lot.title}`
                            : "All / Unspecified"}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {formatAmount(
                            bid.totalAmount,
                            bid.solicitation.currency?.code
                          )}
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatDate(bid.submittedAt)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col items-start gap-1">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                                bid.status
                              )}`}
                            >
                              {bid.status.replaceAll("_", " ")}
                            </span>

                            <span className="text-xs text-gray-500">
                              {evaluationStatus.replaceAll("_", " ")}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <Link
                            href={`/dashboard/organization/procurements/${procurement.id}/bids/${bid.id}`}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-[#071A33] hover:underline"
                          >
                            View
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
