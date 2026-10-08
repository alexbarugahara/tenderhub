import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date | null) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
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

function getStatusClasses(status: string) {
  const normalized = status.toUpperCase();

  if (
    normalized === "COMPLETED" ||
    normalized === "APPROVED" ||
    normalized === "PASSED"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    normalized === "IN_PROGRESS" ||
    normalized === "PENDING" ||
    normalized === "STARTED"
  ) {
    return "bg-amber-50 text-amber-700";
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "REJECTED" ||
    normalized === "FAILED"
  ) {
    return "bg-red-50 text-red-700";
  }

  if (normalized === "DRAFT") {
    return "bg-slate-100 text-slate-600";
  }

  return "bg-blue-50 text-blue-700";
}

export default async function OrganizationEvaluationDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  const evaluation = await prisma.evaluation.findUnique({
    where: {
      id,
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
          phone: true,
        },
      },

      bid: {
        select: {
          id: true,
          bidNumber: true,
          title: true,
          summary: true,
          status: true,
          totalAmount: true,
          submittedAt: true,
          lockedAt: true,
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
              type: true,
              procurementMethod: true,
              openingDate: true,
              closingDate: true,
              estimatedValue: true,

              procurement: {
                select: {
                  id: true,
                  title: true,
                  referenceNumber: true,
                  organization: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },

              evaluationCriteria: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  weight: true,
                  maxScore: true,
                  sortOrder: true,
                },
                orderBy: {
                  sortOrder: "asc",
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
          weightedScore: true,
          comment: true,
          criterionId: true,
          criterion: {
            select: {
              id: true,
              name: true,
              description: true,
              weight: true,
              maxScore: true,
              sortOrder: true,
            },
          },
        },
        orderBy: {
          criterion: {
            sortOrder: "asc",
          },
        },
      },
    },
  });

  if (!evaluation) {
    notFound();
  }

  const solicitation = evaluation.bid.solicitation;
  const criteria = solicitation.evaluationCriteria;

  const scoredCriterionIds = new Set(
    evaluation.scores.map((score) => score.criterionId),
  );

  const unscoredCriteria = criteria.filter(
    (criterion) => !scoredCriterionIds.has(criterion.id),
  );

  const totalMaximumScore = criteria.reduce(
    (total, criterion) => total + Number(criterion.maxScore),
    0,
  );

  const scoreTotal = evaluation.scores.reduce(
    (total, score) => total + Number(score.score),
    0,
  );

  const scorePercentage =
    totalMaximumScore > 0
      ? (scoreTotal / totalMaximumScore) * 100
      : null;

  const weightedScore = evaluation.scores.reduce(
    (total, score) => total + Number(score.weightedScore),
    0,
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link
            href="/dashboard/organization"
            className="hover:text-tenderhub-navy"
          >
            Organization
          </Link>

          <span>/</span>

          <Link
            href="/dashboard/organization/evaluations"
            className="hover:text-tenderhub-navy"
          >
            Evaluations
          </Link>

          <span>/</span>

          <span className="text-slate-700">
            {evaluation.bid.bidNumber}
          </span>
        </div>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Evaluation
              </h1>

              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                  evaluation.status,
                )}`}
              >
                {formatLabel(evaluation.status)}
              </span>
            </div>

            <p className="mt-2 text-sm font-medium text-slate-500">
              {evaluation.bid.bidNumber} ·{" "}
              {solicitation.solicitationNumber}
            </p>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Evaluation of the bid submitted by{" "}
              <span className="font-semibold text-slate-800">
                {evaluation.bid.vendor.companyName}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/organization/solicitations/${solicitation.id}`}
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              View Solicitation
            </Link>

            <Link
              href="/dashboard/organization/evaluations"
              className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              All Evaluations
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Total Score"
          value={Number(evaluation.totalScore).toFixed(2)}
          detail="Recorded evaluation score"
        />

        <MetricCard
          label="Raw Score"
          value={scoreTotal.toFixed(2)}
          detail={`Maximum ${totalMaximumScore.toFixed(2)}`}
        />

        <MetricCard
          label="Score %"
          value={
            scorePercentage === null
              ? "—"
              : `${scorePercentage.toFixed(2)}%`
          }
          detail="Based on scored criteria"
        />

        <MetricCard
          label="Weighted Score"
          value={weightedScore.toFixed(2)}
          detail="Configured criterion weights"
        />

        <MetricCard
          label="Criteria"
          value={criteria.length.toString()}
          detail={`${evaluation.scores.length} scored`}
        />

        <MetricCard
          label="Pending"
          value={unscoredCriteria.length.toString()}
          detail="Unscored criteria"
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Evaluation Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Current evaluation status and recorded assessment.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <InfoItem
              label="Evaluation Status"
              value={formatLabel(evaluation.status)}
            />

            <InfoItem
              label="Recorded Total Score"
              value={Number(evaluation.totalScore).toFixed(2)}
            />

            <InfoItem
              label="Started"
              value={formatDate(evaluation.startedAt)}
            />

            <InfoItem
              label="Completed"
              value={formatDate(evaluation.completedAt)}
            />

            <InfoItem
              label="Created"
              value={formatDate(evaluation.createdAt)}
            />

            <InfoItem
              label="Last Updated"
              value={formatDate(evaluation.updatedAt)}
            />
          </div>

          {evaluation.comments ? (
            <div className="mt-6 rounded-lg bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Evaluator Comments
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {evaluation.comments}
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Evaluator
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Person assigned to this evaluation.
          </p>

          <div className="mt-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
              {evaluation.evaluator.name
                .split(" ")
                .map((part) => part.charAt(0))
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              {evaluation.evaluator.name}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {evaluation.evaluator.email}
            </p>

            {evaluation.evaluator.phone ? (
              <p className="mt-1 text-sm text-slate-500">
                {evaluation.evaluator.phone}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-900">
            Bid Being Evaluated
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Submission information associated with this evaluation.
          </p>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <InfoItem
              label="Bid Number"
              value={evaluation.bid.bidNumber}
            />

            <InfoItem
              label="Bid Status"
              value={formatLabel(evaluation.bid.status)}
            />

            <InfoItem
              label="Vendor"
              value={evaluation.bid.vendor.companyName}
            />

            <InfoItem
              label="Total Amount"
              value={Number(evaluation.bid.totalAmount).toLocaleString(
                "en-US",
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )}
            />

            <InfoItem
              label="Submitted"
              value={formatDate(evaluation.bid.submittedAt)}
            />

            <InfoItem
              label="Locked"
              value={formatDate(evaluation.bid.lockedAt)}
            />
          </div>

          {evaluation.bid.title ? (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bid Title
              </p>

              <p className="mt-2 text-sm font-medium text-slate-800">
                {evaluation.bid.title}
              </p>
            </div>
          ) : null}

          {evaluation.bid.summary ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Bid Summary
              </p>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {evaluation.bid.summary}
              </p>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Solicitation
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Number
              </p>

              <Link
                href={`/dashboard/organization/solicitations/${solicitation.id}`}
                className="mt-1 block text-sm font-semibold text-tenderhub-navy hover:underline"
              >
                {solicitation.solicitationNumber}
              </Link>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Title
              </p>

              <p className="mt-1 text-sm text-slate-800">
                {solicitation.title}
              </p>
            </div>

            <InfoItem
              label="Type"
              value={formatLabel(solicitation.type)}
            />

            <InfoItem
              label="Method"
              value={formatLabel(solicitation.procurementMethod)}
            />

            <InfoItem
              label="Closing"
              value={formatDate(solicitation.closingDate)}
            />

            <InfoItem
              label="Estimated Value"
              value={
                solicitation.estimatedValue !== null
                  ? Number(
                      solicitation.estimatedValue,
                    ).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
                  : "Not specified"
              }
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Evaluation Scorecard
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Scores recorded against each configured evaluation
              criterion.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              {evaluation.scores.length} scored
            </span>

            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {unscoredCriteria.length} pending
            </span>
          </div>
        </div>

        {criteria.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-medium text-slate-700">
              No evaluation criteria configured
            </p>

            <p className="mt-1 text-sm text-slate-500">
              This solicitation does not currently have evaluation
              criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>#</TableHeader>
                  <TableHeader>Criterion</TableHeader>
                  <TableHeader>Weight</TableHeader>
                  <TableHeader>Maximum</TableHeader>
                  <TableHeader>Score</TableHeader>
                  <TableHeader>Percentage</TableHeader>
                  <TableHeader>Comments</TableHeader>
                  <TableHeader>Status</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {criteria.map((criterion) => {
                  const recordedScore = evaluation.scores.find(
                    (score) => score.criterionId === criterion.id,
                  );

                  const numericScore = recordedScore
                    ? Number(recordedScore.score)
                    : null;

                  const maximumScore = Number(criterion.maxScore);

                  const percentage =
                    numericScore !== null && maximumScore > 0
                      ? (numericScore / maximumScore) * 100
                      : null;

                  return (
                    <tr
                      key={criterion.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-5 text-sm font-semibold text-slate-700">
                        {criterion.sortOrder}
                      </td>

                      <td className="px-6 py-5">
                        <p className="text-sm font-semibold text-slate-900">
                          {criterion.name}
                        </p>

                        {criterion.description ? (
                          <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                            {criterion.description}
                          </p>
                        ) : null}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {Number(criterion.weight).toFixed(2)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {Number(criterion.maxScore).toFixed(2)}
                      </td>

                      <td className="px-6 py-5 text-sm font-bold text-slate-900">
                        {numericScore !== null
                          ? numericScore.toFixed(2)
                          : "—"}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {percentage !== null
                          ? `${percentage.toFixed(2)}%`
                          : "—"}
                      </td>

                      <td className="px-6 py-5">
                        <p className="max-w-sm text-sm leading-6 text-slate-500">
                          {recordedScore?.comment ||
                            "No comments recorded"}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        {recordedScore ? (
                          <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            Scored
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Scoring Summary
          </h2>

          <div className="mt-6 space-y-5">
            <ScoreSummaryRow
              label="Recorded total score"
              value={Number(evaluation.totalScore).toFixed(2)}
            />

            <ScoreSummaryRow
              label="Calculated raw score"
              value={scoreTotal.toFixed(2)}
            />

            <ScoreSummaryRow
              label="Maximum available score"
              value={totalMaximumScore.toFixed(2)}
            />

            <ScoreSummaryRow
              label="Score percentage"
              value={
                scorePercentage === null
                  ? "Not available"
                  : `${scorePercentage.toFixed(2)}%`
              }
            />

            <ScoreSummaryRow
              label="Weighted score"
              value={weightedScore.toFixed(2)}
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Evaluation Timeline
          </h2>

          <div className="mt-6 space-y-5">
            <TimelineItem
              title="Evaluation Created"
              date={evaluation.createdAt}
              description="Evaluation record was created."
            />

            <TimelineItem
              title="Evaluation Started"
              date={evaluation.startedAt}
              description="Evaluation work was started."
            />

            <TimelineItem
              title="Evaluation Completed"
              date={evaluation.completedAt}
              description="Evaluation was marked as completed."
            />

            <TimelineItem
              title="Last Updated"
              date={evaluation.updatedAt}
              description="Evaluation record was most recently updated."
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Evaluation Workflow
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-4">
          <WorkflowCard
            number="1"
            title="Review Bid"
            description="Review the submitted vendor bid and supporting information."
          />

          <WorkflowCard
            number="2"
            title="Score Criteria"
            description="Record scores and comments against the configured criteria."
          />

          <WorkflowCard
            number="3"
            title="Complete"
            description="Complete the evaluation after the applicable criteria have been assessed."
          />

          <WorkflowCard
            number="4"
            title="Award Decision"
            description="Use completed evaluation results as part of the subsequent award process."
          />
        </div>
      </section>
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

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium leading-6 text-slate-800">
        {value}
      </p>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function ScoreSummaryRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-600">{label}</span>

      <span className="text-sm font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function TimelineItem({
  title,
  date,
  description,
}: {
  title: string;
  date: Date | null;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-tenderhub-gold" />

      <div>
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-sm text-slate-700">
          {formatDate(date)}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function WorkflowCard({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
        {number}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}