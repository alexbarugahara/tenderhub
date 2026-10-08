import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  FileText,
  Gavel,
  User,
} from "lucide-react";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{
    id: string;
    bidId: string;
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
    month: "long",
    day: "numeric",
  }).format(date);
}

function statusClasses(status: string) {
  switch (status) {
    case "COMPLIANT":
    case "AWARDED":
      return "bg-green-50 text-green-700";
    case "NON_COMPLIANT":
    case "REJECTED":
      return "bg-red-50 text-red-700";
    case "UNDER_REVIEW":
      return "bg-amber-50 text-amber-700";
    case "SHORTLISTED":
      return "bg-purple-50 text-purple-700";
    case "EVALUATED":
      return "bg-indigo-50 text-indigo-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default async function BidDetailPage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const { id, bidId } = await params;

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

  const bid = await prisma.bid.findFirst({
    where: {
      id: bidId,
      solicitation: {
        procurementId: id,
        organizationId: membership.organizationId,
      },
    },
    select: {
      id: true,
      bidNumber: true,
      status: true,
      title: true,
      summary: true,
      totalAmount: true,
      submittedAt: true,
      lockedAt: true,
      withdrawalReason: true,

      vendor: {
        select: {
          id: true,
          companyName: true,
          legalName: true,
          email: true,
          phone: true,
          website: true,
          registrationNumber: true,
          taxNumber: true,
        },
      },

      submittedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      solicitation: {
        select: {
          id: true,
          title: true,
          solicitationNumber: true,
          status: true,
          closingDate: true,
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
          description: true,
        },
      },

      documents: {
        select: {
          id: true,
          name: true,
          category: true,
          status: true,
          uploadedAt: true,
          reviewedAt: true,
          rejectionReason: true,
          fileUrl: true,
        },
        orderBy: {
          uploadedAt: "desc",
        },
      },

      requirementResponses: {
        select: {
          id: true,
          response: true,
          booleanValue: true,
          numericValue: true,
          evidenceUrl: true,
          compliant: true,
          reviewerComment: true,
          reviewedAt: true,
          requirement: {
            select: {
              id: true,
              title: true,
              type: true,
              isMandatory: true,
            },
          },
        },
      },

      evaluations: {
        select: {
          id: true,
          status: true,
          totalScore: true,
          comments: true,
          startedAt: true,
          completedAt: true,
          evaluator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!bid) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <Link
          href={`/dashboard/organization/procurements/${id}/bids`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bids
        </Link>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-[#071A33] p-3">
                  <Gavel className="h-6 w-6 text-[#D4AF37]" />
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    {bid.solicitation.solicitationNumber}
                  </p>

                  <h1 className="text-2xl font-bold text-[#071A33]">
                    {bid.bidNumber}
                  </h1>
                </div>
              </div>

              {bid.title && (
                <p className="mt-4 text-lg font-medium text-gray-900">
                  {bid.title}
                </p>
              )}

              <p className="mt-2 text-sm text-gray-500">
                {bid.solicitation.title}
              </p>
            </div>

            <span
              className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-semibold ${statusClasses(
                bid.status
              )}`}
            >
              {bid.status.replaceAll("_", " ")}
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Bid Amount
            </p>

            <p className="mt-2 text-2xl font-bold text-[#071A33]">
              {formatAmount(
                bid.totalAmount,
                bid.solicitation.currency?.code
              )}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Submitted
            </p>

            <p className="mt-2 text-lg font-semibold text-gray-900">
              {formatDate(bid.submittedAt)}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Locked
            </p>

            <p className="mt-2 text-lg font-semibold text-gray-900">
              {formatDate(bid.lockedAt)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-[#071A33]" />

              <h2 className="text-lg font-semibold text-[#071A33]">
                Vendor
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Company
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {bid.vendor.companyName}
                </p>
              </div>

              {bid.vendor.legalName && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Legal Name
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {bid.vendor.legalName}
                  </p>
                </div>
              )}

              {bid.vendor.email && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Email
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {bid.vendor.email}
                  </p>
                </div>
              )}

              {bid.vendor.phone && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Phone
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {bid.vendor.phone}
                  </p>
                </div>
              )}

              {bid.vendor.registrationNumber && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Registration Number
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    {bid.vendor.registrationNumber}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#071A33]" />

              <h2 className="text-lg font-semibold text-[#071A33]">
                Solicitation
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Solicitation Number
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {bid.solicitation.solicitationNumber}
                </p>
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Title
                </p>

                <p className="mt-1 text-sm text-gray-700">
                  {bid.solicitation.title}
                </p>
              </div>

              {bid.lot && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Lot
                  </p>

                  <p className="mt-1 text-sm text-gray-700">
                    Lot {bid.lot.number} — {bid.lot.title}
                  </p>
                </div>
              )}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Closing Date
                </p>

                <p className="mt-1 flex items-center gap-2 text-sm text-gray-700">
                  <Calendar className="h-4 w-4" />
                  {formatDate(bid.solicitation.closingDate)}
                </p>
              </div>
            </div>
          </section>
        </div>

        {bid.summary && (
          <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-[#071A33]">
              Bid Summary
            </h2>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {bid.summary}
            </p>
          </section>
        )}

        <section className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#071A33]">
              Bid Documents
            </h2>
          </div>

          {bid.documents.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No documents have been attached to this bid.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {bid.documents.map((document) => (
                <div
                  key={document.id}
                  className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />

                    <div>
                      <p className="font-medium text-gray-900">
                        {document.name}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {document.category} ·{" "}
                        {document.status.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>

                  <a
                    href={document.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-semibold text-[#071A33] hover:underline"
                  >
                    View Document
                  </a>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#071A33]">
              Requirement Responses
            </h2>
          </div>

          {bid.requirementResponses.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No requirement responses are available for this bid.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {bid.requirementResponses.map((response) => (
                <div key={response.id} className="p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {response.compliant === true && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}

                        <h3 className="font-medium text-gray-900">
                          {response.requirement.title}
                        </h3>
                      </div>

                      <p className="mt-1 text-xs text-gray-500">
                        {response.requirement.type.replaceAll(
                          "_",
                          " "
                        )}
                        {response.requirement.isMandatory
                          ? " · Mandatory"
                          : " · Optional"}
                      </p>
                    </div>

                    {response.compliant !== null && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          response.compliant
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {response.compliant
                          ? "Compliant"
                          : "Non-Compliant"}
                      </span>
                    )}
                  </div>

                  {response.response && (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">
                      {response.response}
                    </p>
                  )}

                  {response.reviewerComment && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Reviewer Comment
                      </p>

                      <p className="mt-1 text-sm text-gray-700">
                        {response.reviewerComment}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-[#071A33]">
              Evaluations
            </h2>
          </div>

          {bid.evaluations.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              This bid has not been evaluated yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {bid.evaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {evaluation.evaluator.name ||
                        evaluation.evaluator.email}
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      {evaluation.status.replaceAll("_", " ")}
                    </p>

                    {evaluation.comments && (
                      <p className="mt-2 text-sm text-gray-600">
                        {evaluation.comments}
                      </p>
                    )}
                  </div>

                  <div className="text-left lg:text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Total Score
                    </p>

                    <p className="mt-1 text-xl font-bold text-[#071A33]">
                      {String(evaluation.totalScore)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {bid.withdrawalReason && (
          <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-6">
            <h2 className="text-lg font-semibold text-red-800">
              Withdrawal Reason
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {bid.withdrawalReason}
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
