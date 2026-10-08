import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

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
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

function getStatusClasses(status: string) {
  switch (status) {
    case "COMPLETED":
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700";

    case "IN_PROGRESS":
      return "bg-amber-50 text-amber-700";

    case "DRAFT":
      return "bg-slate-100 text-slate-600";

    default:
      return "bg-blue-50 text-blue-700";
  }
}

export default async function OrganizationEvaluationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const organizationMember =
    await prisma.organizationMember.findFirst({
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

  if (!organizationMember) {
    notFound();
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationMember.organizationId,
    },
    select: {
      id: true,
      name: true,

      solicitations: {
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,
          closingDate: true,

          evaluationCriteria: {
            select: {
              id: true,
              name: true,
              weight: true,
              maxScore: true,
              sortOrder: true,
            },
            orderBy: {
              sortOrder: "asc",
            },
          },

          bids: {
            select: {
              id: true,
              bidNumber: true,
              status: true,
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
                      score: true,
                      weightedScore: true,
                      comment: true,
                      criterionId: true,
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

  if (!organization) {
    notFound();
  }

  const evaluations = organization.solicitations.flatMap(
    (solicitation) =>
      solicitation.bids.flatMap((bid) =>
        bid.evaluations.map((evaluation) => ({
          ...evaluation,
          bid,
          solicitation,
        })),
      ),
  );

  const completedEvaluations = evaluations.filter(
    (evaluation) =>
      evaluation.status === "COMPLETED" ||
      evaluation.status === "APPROVED",
  );

  const inProgressEvaluations = evaluations.filter(
    (evaluation) => evaluation.status === "IN_PROGRESS",
  );

  const draftEvaluations = evaluations.filter(
    (evaluation) => evaluation.status === "DRAFT",
  );

  const submittedBids = organization.solicitations.reduce(
    (total, solicitation) =>
      total +
      solicitation.bids.filter(
        (bid) => bid.submittedAt !== null,
      ).length,
    0,
  );

  const evaluatedBids = new Set(
    evaluations.map((evaluation) => evaluation.bid.id),
  );

  const pendingEvaluationBids = Math.max(
    submittedBids - evaluatedBids.size,
    0,
  );

  const totalCriteria = organization.solicitations.reduce(
    (total, solicitation) =>
      total + solicitation.evaluationCriteria.length,
    0,
  );

  const averageScore =
    completedEvaluations.length > 0
      ? completedEvaluations.reduce(
          (total, evaluation) =>
            total +
            (evaluation.totalScore !== null
              ? Number(evaluation.totalScore)
              : 0),
          0,
        ) / completedEvaluations.length
      : null;

  const evaluationCoverage =
    submittedBids > 0
      ? Math.round(
          (evaluatedBids.size / submittedBids) * 100,
        )
      : 0;

  const solicitationSummaries = organization.solicitations
    .filter(
      (solicitation) =>
        solicitation.bids.length > 0 ||
        solicitation.evaluationCriteria.length > 0,
    )
    .slice(0, 10);

  const criteria = organization.solicitations
    .flatMap((solicitation) =>
      solicitation.evaluationCriteria.map((criterion) => ({
        ...criterion,
        solicitation,
      })),
    )
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {organization.name}
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Evaluations
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Monitor bid evaluations, evaluator progress, scores,
            and evaluation criteria across your solicitations.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/organization/solicitations"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Solicitations
          </Link>

          <Link
            href="/dashboard/organization/evaluations"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Refresh
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <MetricCard
          label="Evaluations"
          value={evaluations.length.toString()}
          detail="Total evaluation records"
        />

        <MetricCard
          label="Completed"
          value={completedEvaluations.length.toString()}
          detail="Completed or approved"
        />

        <MetricCard
          label="In Progress"
          value={inProgressEvaluations.length.toString()}
          detail="Active evaluation work"
        />

        <MetricCard
          label="Draft"
          value={draftEvaluations.length.toString()}
          detail="Draft evaluations"
        />

        <MetricCard
          label="Pending Bids"
          value={pendingEvaluationBids.toString()}
          detail="Submitted bids without evaluation"
        />

        <MetricCard
          label="Criteria"
          value={totalCriteria.toString()}
          detail="Configured criteria"
        />

        <MetricCard
          label="Average Score"
          value={
            averageScore === null
              ? "—"
              : averageScore.toFixed(2)
          }
          detail="Completed evaluations"
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <SummaryCard
          title="Submitted Bids"
          value={submittedBids.toString()}
          description="Bids with a recorded submission timestamp."
        />

        <SummaryCard
          title="Evaluated Bids"
          value={evaluatedBids.size.toString()}
          description="Distinct submitted bids with an evaluation."
        />

        <SummaryCard
          title="Evaluation Coverage"
          value={`${evaluationCoverage}%`}
          description="Share of submitted bids with an evaluation."
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Evaluation Register
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Evaluation records across your organization&apos;s
              solicitations.
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {evaluations.length} record
            {evaluations.length === 1 ? "" : "s"}
          </span>
        </div>

        {evaluations.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Solicitation</TableHeader>
                  <TableHeader>Bid</TableHeader>
                  <TableHeader>Vendor</TableHeader>
                  <TableHeader>Evaluator</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Score</TableHeader>
                  <TableHeader>Started</TableHeader>
                  <TableHeader>Completed</TableHeader>
                  <TableHeader>Action</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {evaluations.map((evaluation) => (
                  <tr
                    key={evaluation.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/solicitations/${evaluation.solicitation.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-tenderhub-navy"
                      >
                        {
                          evaluation.solicitation
                            .solicitationNumber
                        }
                      </Link>

                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {evaluation.solicitation.title}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-slate-800">
                        {evaluation.bid.bidNumber}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatLabel(evaluation.bid.status)}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-700">
                      {evaluation.bid.vendor.companyName}
                    </td>

                    <td className="px-6 py-5">
                      {evaluation.evaluator ? (
                        <>
                          <p className="text-sm font-medium text-slate-800">
                            {evaluation.evaluator.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {evaluation.evaluator.email}
                          </p>
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Not assigned
                        </span>
                      )}
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
                      {evaluation.totalScore !== null
                        ? Number(
                            evaluation.totalScore,
                          ).toFixed(2)
                        : "—"}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-500">
                      {formatDate(evaluation.startedAt)}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-500">
                      {formatDate(evaluation.completedAt)}
                    </td>

                    <td className="px-6 py-5">
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
            Solicitation Evaluation Overview
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Evaluation readiness and progress by solicitation.
          </p>
        </div>

        {solicitationSummaries.length === 0 ? (
          <EmptyState message="No solicitation has bids or evaluation criteria yet." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Solicitation</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Criteria</TableHeader>
                  <TableHeader>Submitted Bids</TableHeader>
                  <TableHeader>Evaluated Bids</TableHeader>
                  <TableHeader>Pending</TableHeader>
                  <TableHeader>Closing</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {solicitationSummaries.map((solicitation) => {
                  const solicitationSubmittedBids =
                    solicitation.bids.filter(
                      (bid) => bid.submittedAt !== null,
                    );

                  const solicitationEvaluatedBids =
                    new Set(
                      solicitation.bids
                        .filter(
                          (bid) =>
                            bid.evaluations.length > 0,
                        )
                        .map((bid) => bid.id),
                    );

                  const pending =
                    solicitationSubmittedBids.length -
                    solicitationEvaluatedBids.size;

                  return (
                    <tr
                      key={solicitation.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-5">
                        <Link
                          href={`/dashboard/organization/solicitations/${solicitation.id}`}
                          className="text-sm font-semibold text-slate-900 hover:text-tenderhub-navy"
                        >
                          {
                            solicitation.solicitationNumber
                          }
                        </Link>

                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {solicitation.title}
                        </p>
                      </td>

                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            solicitation.status,
                          )}`}
                        >
                          {formatLabel(
                            solicitation.status,
                          )}
                        </span>
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {
                          solicitation
                            .evaluationCriteria.length
                        }
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-800">
                        {solicitationSubmittedBids.length}
                      </td>

                      <td className="px-6 py-5 text-sm font-semibold text-slate-800">
                        {solicitationEvaluatedBids.size}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-700">
                        {Math.max(pending, 0)}
                      </td>

                      <td className="px-6 py-5 text-sm text-slate-500">
                        {formatDate(
                          solicitation.closingDate,
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
            Evaluation Criteria
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Criteria configured across the organization&apos;s
            solicitations.
          </p>

          <div className="mt-5 space-y-3">
            {criteria.map((criterion) => (
              <div
                key={criterion.id}
                className="rounded-lg border border-slate-200 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/dashboard/organization/solicitations/${criterion.solicitation.id}`}
                      className="text-sm font-semibold text-slate-900 hover:text-tenderhub-navy"
                    >
                      {criterion.name}
                    </Link>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        criterion.solicitation
                          .solicitationNumber
                      }
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Weight{" "}
                    {Number(criterion.weight).toFixed(2)}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                  <span>
                    Max score:{" "}
                    {Number(criterion.maxScore).toFixed(2)}
                  </span>

                  <span>
                    Order: {criterion.sortOrder}
                  </span>
                </div>
              </div>
            ))}

            {criteria.length === 0 ? (
              <EmptyState message="No evaluation criteria have been configured." />
            ) : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Evaluation Workflow
          </h2>

          <div className="mt-5 space-y-5">
            <WorkflowStep
              number="1"
              title="Receive Submitted Bids"
              description="Submitted bids become available for evaluation after the applicable solicitation process reaches the evaluation stage."
            />

            <WorkflowStep
              number="2"
              title="Assign Evaluators"
              description="Evaluation records identify the evaluator responsible for reviewing each bid."
            />

            <WorkflowStep
              number="3"
              title="Score Criteria"
              description="Evaluators record scores and comments against the configured evaluation criteria."
            />

            <WorkflowStep
              number="4"
              title="Complete Evaluation"
              description="Completed evaluations provide the scores and comments needed for subsequent award decisions."
            />
          </div>
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
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
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
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  message = "No evaluation records have been created yet.",
}: {
  message?: string;
}) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
        E
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        No evaluations
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message}
      </p>
    </div>
  );
}