import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

interface ProcurementEvaluationsPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(date: Date | null) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatDateTime(date: Date | null) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatScore(value: number | null) {
  if (value === null) {
    return "—";
  }

  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 2,
  });
}

function getStatusClasses(status: string) {
  const normalized = status.toUpperCase();

  if (
    normalized === "COMPLETED" ||
    normalized === "COMPLETE" ||
    normalized === "APPROVED"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    normalized === "IN_PROGRESS" ||
    normalized === "STARTED" ||
    normalized === "ACTIVE"
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (normalized === "PENDING" || normalized === "DRAFT") {
    return "bg-amber-50 text-amber-700";
  }

  if (normalized === "REJECTED" || normalized === "CANCELLED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default async function ProcurementEvaluationsPage({
  params,
}: ProcurementEvaluationsPageProps) {
  const { id } = await params;

  const procurement = await prisma.procurement.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      referenceNumber: true,
      solicitations: {
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,
          openingDate: true,
          closingDate: true,
          evaluationCriteria: {
            select: {
              id: true,
              name: true,
              description: true,
              weight: true,
              maxScore: true,
              sortOrder: true,
              createdAt: true,
              updatedAt: true,
              scores: {
                select: {
                  id: true,
                  score: true,
                  weightedScore: true,
                  comment: true,
                  evaluationId: true,
                  createdAt: true,
                  updatedAt: true,
                },
              },
            },
            orderBy: {
              sortOrder: "asc",
            },
          },
          bids: {
            select: {
              id: true,
              bidNumber: true,
              title: true,
              status: true,
              totalAmount: true,
              submittedAt: true,
              vendor: {
                select: {
                  id: true,
                  companyName: true,
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
                  createdAt: true,
                  updatedAt: true,
                  evaluator: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                  scores: {
                    select: {
                      id: true,
                      criterionId: true,
                      score: true,
                      weightedScore: true,
                      comment: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
                orderBy: {
                  createdAt: "desc",
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
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

  const allEvaluations = procurement.solicitations.flatMap(
    (solicitation) =>
      solicitation.bids.flatMap((bid) =>
        bid.evaluations.map((evaluation) => ({
          ...evaluation,
          bid: {
            id: bid.id,
            bidNumber: bid.bidNumber,
            title: bid.title,
            status: bid.status,
            totalAmount: bid.totalAmount,
            submittedAt: bid.submittedAt,
            vendor: bid.vendor,
          },
          solicitation: {
            id: solicitation.id,
            solicitationNumber: solicitation.solicitationNumber,
            title: solicitation.title,
          },
        })),
      ),
  );

  const allCriteria = procurement.solicitations.flatMap(
    (solicitation) =>
      solicitation.evaluationCriteria.map((criterion) => ({
        ...criterion,
        solicitation: {
          id: solicitation.id,
          solicitationNumber: solicitation.solicitationNumber,
          title: solicitation.title,
        },
      })),
  );

  const completedEvaluations = allEvaluations.filter((evaluation) => {
    const status = evaluation.status.toUpperCase();

    return (
      status === "COMPLETED" ||
      status === "COMPLETE" ||
      status === "APPROVED"
    );
  }).length;

  const activeEvaluations = allEvaluations.filter((evaluation) => {
    const status = evaluation.status.toUpperCase();

    return (
      status === "IN_PROGRESS" ||
      status === "STARTED" ||
      status === "ACTIVE"
    );
  }).length;

  const pendingEvaluations = allEvaluations.filter((evaluation) => {
    const status = evaluation.status.toUpperCase();

    return status === "PENDING" || status === "DRAFT";
  }).length;

  const totalEvaluatedBids = new Set(
    allEvaluations.map((evaluation) => evaluation.bid.id),
  ).size;

  const scores = allEvaluations
    .map((evaluation) => evaluation.totalScore)
    .filter((score) => score !== null)
    .map((score) => Number(score));

  const averageScore =
    scores.length > 0
      ? scores.reduce((sum, score) => sum + score, 0) / scores.length
      : null;

  const recentEvaluations = [...allEvaluations]
    .sort(
      (first, second) =>
        second.updatedAt.getTime() - first.updatedAt.getTime(),
    )
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href={`/dashboard/organization/procurements/${procurement.id}`}
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Procurement Details
          </Link>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Procurement Evaluations
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            {procurement.title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Reference: {procurement.referenceNumber}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/organization/procurements/${procurement.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Procurement Overview
          </Link>

          <Link
            href="/dashboard/organization/evaluations"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            All Evaluations
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Evaluations"
          value={allEvaluations.length.toString()}
          detail="Evaluation records"
        />

        <MetricCard
          label="Evaluated Bids"
          value={totalEvaluatedBids.toString()}
          detail="Unique bids evaluated"
        />

        <MetricCard
          label="Completed"
          value={completedEvaluations.toString()}
          detail="Completed evaluations"
        />

        <MetricCard
          label="In Progress"
          value={activeEvaluations.toString()}
          detail="Active evaluations"
        />

        <MetricCard
          label="Pending"
          value={pendingEvaluations.toString()}
          detail="Pending evaluations"
        />

        <MetricCard
          label="Average Score"
          value={formatScore(averageScore)}
          detail="Across scored evaluations"
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Evaluation Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Recent evaluation records associated with bids in this
            procurement.
          </p>
        </div>

        {recentEvaluations.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
              E
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No evaluations yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Evaluation records will appear here when bids within this
              procurement are assigned for evaluation.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bid
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Vendor
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Solicitation
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Evaluator
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Score
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Updated
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {recentEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/evaluations/${evaluation.id}`}
                        className="font-semibold text-slate-900 hover:text-tenderhub-navy"
                      >
                        {evaluation.bid.bidNumber}
                      </Link>

                      {evaluation.bid.title ? (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {evaluation.bid.title}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      {evaluation.bid.vendor.companyName}
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-slate-800">
                        {evaluation.solicitation.solicitationNumber}
                      </p>

                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {evaluation.solicitation.title}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-slate-800">
                        {evaluation.evaluator.name}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {evaluation.evaluator.email}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          evaluation.status,
                        )}`}
                      >
                        {formatLabel(evaluation.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                      {formatScore(Number(evaluation.totalScore))}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {formatDateTime(evaluation.updatedAt)}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/dashboard/organization/evaluations/${evaluation.id}`}
                        className="text-sm font-semibold text-tenderhub-navy hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Evaluation Criteria
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Criteria configured for the solicitations under this
            procurement.
          </p>
        </div>

        {allCriteria.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No evaluation criteria have been configured yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Criterion
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Solicitation
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Weight
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Maximum Score
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Scores Recorded
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Created
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {allCriteria.map((criterion) => (
                  <tr key={criterion.id} className="hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900">
                        {criterion.name}
                      </p>

                      {criterion.description ? (
                        <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
                          {criterion.description}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-slate-800">
                        {criterion.solicitation.solicitationNumber}
                      </p>

                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {criterion.solicitation.title}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      {formatScore(Number(criterion.weight))}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      {formatScore(Number(criterion.maxScore))}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      {criterion.scores.length}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {formatDate(criterion.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Solicitation Evaluation Summary
          </h2>

          <div className="mt-5 space-y-4">
            {procurement.solicitations.map((solicitation) => {
              const solicitationEvaluations = allEvaluations.filter(
                (evaluation) =>
                  evaluation.solicitation.id === solicitation.id,
              );

              const solicitationScores = solicitationEvaluations
                .map((evaluation) => evaluation.totalScore)
                .filter((score) => score !== null)
                .map((score) => Number(score));

              const solicitationAverage =
                solicitationScores.length > 0
                  ? solicitationScores.reduce(
                      (sum, score) => sum + score,
                      0,
                    ) / solicitationScores.length
                  : null;

              return (
                <div
                  key={solicitation.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {solicitation.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {solicitation.solicitationNumber}
                      </p>
                    </div>

                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                        solicitation.status,
                      )}`}
                    >
                      {formatLabel(solicitation.status)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <SummaryValue
                      label="Criteria"
                      value={solicitation.evaluationCriteria.length.toString()}
                    />

                    <SummaryValue
                      label="Evaluations"
                      value={solicitationEvaluations.length.toString()}
                    />

                    <SummaryValue
                      label="Avg. Score"
                      value={formatScore(solicitationAverage)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Evaluation Workflow
          </h2>

          <div className="mt-5 space-y-5">
            <WorkflowStep
              number="1"
              title="Configure Criteria"
              description="Define the evaluation criteria, weights, and maximum scores for each solicitation."
            />

            <WorkflowStep
              number="2"
              title="Assign Evaluations"
              description="Associate submitted bids with evaluation records and evaluators."
            />

            <WorkflowStep
              number="3"
              title="Score Bids"
              description="Evaluators record criterion-level scores and comments against each assigned bid."
            />

            <WorkflowStep
              number="4"
              title="Complete Evaluation"
              description="Completed evaluations provide the scoring information used in the subsequent award process."
            />
          </div>
        </div>
      </section>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Evaluation Timeline
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          The evaluation records above retain their configured start and
          completion dates for audit and workflow tracking.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TimelineValue
            label="Evaluations Started"
            value={formatDate(
              allEvaluations
                .map((evaluation) => evaluation.startedAt)
                .filter((date): date is Date => date !== null)
                .sort((a, b) => a.getTime() - b.getTime())[0] || null,
            )}
          />

          <TimelineValue
            label="Latest Start"
            value={formatDate(
              allEvaluations
                .map((evaluation) => evaluation.startedAt)
                .filter((date): date is Date => date !== null)
                .sort((a, b) => b.getTime() - a.getTime())[0] || null,
            )}
          />

          <TimelineValue
            label="First Completion"
            value={formatDate(
              allEvaluations
                .map((evaluation) => evaluation.completedAt)
                .filter((date): date is Date => date !== null)
                .sort((a, b) => a.getTime() - b.getTime())[0] || null,
            )}
          />

          <TimelineValue
            label="Latest Completion"
            value={formatDate(
              allEvaluations
                .map((evaluation) => evaluation.completedAt)
                .filter((date): date is Date => date !== null)
                .sort((a, b) => b.getTime() - a.getTime())[0] || null,
            )}
          />
        </div>
      </div>

      <div>
        <Link
          href={`/dashboard/organization/procurements/${procurement.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to Procurement
        </Link>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function SummaryValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function TimelineValue({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function WorkflowStep({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
        {number}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}