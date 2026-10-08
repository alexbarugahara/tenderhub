import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Users,
} from "lucide-react";

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

function formatScore(value: unknown) {
  if (value === null || value === undefined) {
    return "Not scored";
  }

  const score = Number(value);

  if (!Number.isFinite(score)) {
    return "Not scored";
  }

  return score.toFixed(2);
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
    case "COMPLETED":
    case "APPROVED":
      return "success" as const;

    case "IN_PROGRESS":
      return "warning" as const;

    case "DRAFT":
      return "default" as const;

    default:
      return "default" as const;
  }
}

export default async function OrganizationEvaluationReportPage() {
  const session = await auth();

  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Card>
            <div className="p-8 text-center">
              <ClipboardCheck className="mx-auto h-10 w-10 text-slate-400" />
              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Evaluation Report
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                You must be signed in to view this report.
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
  });

  if (!membership) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <Card>
            <div className="p-8 text-center">
              <ClipboardCheck className="mx-auto h-10 w-10 text-slate-400" />
              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Evaluation Report
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

  const evaluations = await prisma.evaluation.findMany({
    where: {
      bid: {
        solicitation: {
          organizationId: membership.organizationId,
        },
      },
    },
    select: {
      id: true,
      status: true,
      totalScore: true,
      comments: true,
      startedAt: true,
      completedAt: true,
      createdAt: true,
      updatedAt: true,
      evaluator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      bid: {
        select: {
          id: true,
          title: true,
          totalAmount: true,
          status: true,
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
      scores: {
        select: {
          id: true,
          score: true,
          comment: true,
          criterion: {
            select: {
              id: true,
              name: true,
              weight: true,
              maxScore: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const completedCount = evaluations.filter(
    (evaluation) =>
      evaluation.status === "COMPLETED" ||
      evaluation.status === "APPROVED",
  ).length;

  const inProgressCount = evaluations.filter(
    (evaluation) => evaluation.status === "IN_PROGRESS",
  ).length;

  const draftCount = evaluations.filter(
    (evaluation) => evaluation.status === "DRAFT",
  ).length;

  const scoredEvaluations = evaluations.filter(
    (evaluation) => evaluation.totalScore !== null,
  );

  const averageScore =
    scoredEvaluations.length > 0
      ? scoredEvaluations.reduce(
          (total, evaluation) =>
            total + Number(evaluation.totalScore),
          0,
        ) / scoredEvaluations.length
      : 0;

  const evaluatorIds = new Set(
    evaluations.map((evaluation) => evaluation.evaluator.id),
  );

  const evaluatedBidIds = new Set(
    evaluations.map((evaluation) => evaluation.bid.id),
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
              <ClipboardCheck className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Evaluation Report
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Review evaluation activity, scoring, evaluators, and assessed
                bids.
              </p>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card>
            <div className="p-5">
              <p className="text-sm font-medium text-slate-500">
                Evaluations
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {evaluations.length}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <p className="text-sm font-medium text-slate-500">
                Completed
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {completedCount}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <p className="text-sm font-medium text-slate-500">
                In Progress
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {inProgressCount}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <p className="text-sm font-medium text-slate-500">
                Evaluators
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {evaluatorIds.size}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-5">
              <p className="text-sm font-medium text-slate-500">
                Average Score
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {formatScore(averageScore)}
              </p>
            </div>
          </Card>
        </section>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-slate-600" />

              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Evaluation Summary
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Current state of evaluation activity across the organization.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:grid-cols-4">
            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Draft Evaluations
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {draftCount}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                In Progress
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {inProgressCount}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Completed
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {completedCount}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                Bids Evaluated
              </p>

              <p className="mt-2 text-2xl font-bold text-slate-900">
                {evaluatedBidIds.size}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Evaluation Register
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Detailed evaluation records and scoring information.
            </p>
          </div>

          {evaluations.length === 0 ? (
            <div className="p-10 text-center">
              <ClipboardCheck className="mx-auto h-10 w-10 text-slate-400" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No evaluations found
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Evaluation activity will appear here once bids are assessed.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {evaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="p-6 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={getStatusVariant(evaluation.status)}
                        >
                          {formatStatus(evaluation.status)}
                        </Badge>

                        <span className="text-xs font-medium text-slate-500">
                          {
                            evaluation.bid.solicitation
                              .solicitationNumber
                          }
                        </span>
                      </div>

                      <h3 className="mt-2 text-lg font-semibold text-slate-900">
                        {evaluation.bid.title ??
                          evaluation.bid.solicitation.title}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                        <span>
                          Vendor:{" "}
                          <span className="font-medium text-slate-800">
                            {evaluation.bid.vendor.companyName}
                          </span>
                        </span>

                        <span>
                          Evaluator:{" "}
                          <span className="font-medium text-slate-800">
                            {evaluation.evaluator.name ??
                              evaluation.evaluator.email}
                          </span>
                        </span>

                        <span>
                          Criteria scored:{" "}
                          <span className="font-medium text-slate-800">
                            {evaluation.scores.length}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 xl:text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        Total Score
                      </p>

                      <p className="mt-1 text-2xl font-bold text-slate-900">
                        {formatScore(evaluation.totalScore)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-slate-400" />

                      <div>
                        <p className="text-xs text-slate-500">
                          Evaluator
                        </p>

                        <p className="text-sm font-medium text-slate-800">
                          {evaluation.evaluator.name ??
                            evaluation.evaluator.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-4 w-4 text-slate-400" />

                      <div>
                        <p className="text-xs text-slate-500">
                          Started
                        </p>

                        <p className="text-sm font-medium text-slate-800">
                          {formatDate(evaluation.startedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-4 w-4 text-slate-400" />

                      <div>
                        <p className="text-xs text-slate-500">
                          Completed
                        </p>

                        <p className="text-sm font-medium text-slate-800">
                          {formatDate(evaluation.completedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-slate-400" />

                      <div>
                        <p className="text-xs text-slate-500">
                          Bid Amount
                        </p>

                        <p className="text-sm font-medium text-slate-800">
                          {formatAmount(evaluation.bid.totalAmount)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {evaluation.scores.length > 0 && (
                    <div className="mt-5 rounded-lg border border-slate-200">
                      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800">
                          Score Breakdown
                        </p>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {evaluation.scores.map((score) => (
                          <div
                            key={score.id}
                            className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-800">
                                {score.criterion.name}
                              </p>

                              <p className="text-xs text-slate-500">
                                Weight:{" "}
                                {formatScore(score.criterion.weight)}
                              </p>
                            </div>

                            <p className="text-sm font-semibold text-slate-900">
                              {formatScore(score.score)} /{" "}
                              {formatScore(score.criterion.maxScore)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <Link
                      href={`/dashboard/organization/evaluations/${evaluation.id}`}
                      className="text-sm font-medium text-tenderhub-navy hover:underline"
                    >
                      View evaluation →
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