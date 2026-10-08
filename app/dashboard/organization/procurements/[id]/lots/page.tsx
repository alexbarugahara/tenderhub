import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

interface ProcurementLotsPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatCurrency(
  value: unknown,
  currencyCode?: string | null,
) {
  if (value === null || value === undefined) {
    return "Not specified";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode || "USD",
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClasses(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "CLOSED":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "AWARDED":
      return "bg-purple-50 text-purple-700 ring-purple-600/20";

    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-red-600/20";

    default:
      return "bg-slate-100 text-slate-700 ring-slate-600/20";
  }
}

export default async function ProcurementLotsPage({
  params,
}: ProcurementLotsPageProps) {
  const { id } = await params;

  const procurement = await prisma.procurement.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      organizationId: true,
      title: true,
      referenceNumber: true,
      currency: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
      solicitations: {
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,
          currency: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
          lots: {
            select: {
              id: true,
              solicitationId: true,
              number: true,
              title: true,
              description: true,
              estimatedValue: true,
              status: true,
              _count: {
                select: {
                  requirements: true,
                  bids: true,
                  awards: true,
                },
              },
            },
            orderBy: {
              number: "asc",
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

  const lots = procurement.solicitations.flatMap((solicitation) =>
    solicitation.lots.map((lot) => ({
      ...lot,
      solicitation: {
        id: solicitation.id,
        solicitationNumber: solicitation.solicitationNumber,
        title: solicitation.title,
        status: solicitation.status,
        currency: solicitation.currency,
      },
    })),
  );

  const openLots = lots.filter((lot) => lot.status === "OPEN").length;
  const closedLots = lots.filter((lot) => lot.status === "CLOSED").length;
  const awardedLots = lots.filter((lot) => lot.status === "AWARDED").length;
  const cancelledLots = lots.filter(
    (lot) => lot.status === "CANCELLED",
  ).length;

  const totalEstimatedValue = lots.reduce((total, lot) => {
    if (lot.estimatedValue === null) {
      return total;
    }

    return total + Number(lot.estimatedValue);
  }, 0);

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
            Procurement Lots
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
            href={`/dashboard/organization/solicitations?procurementId=${procurement.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            Manage Solicitations
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Total Lots"
          value={lots.length.toString()}
          detail="Across all solicitations"
        />

        <MetricCard
          label="Open"
          value={openLots.toString()}
          detail="Currently open"
        />

        <MetricCard
          label="Closed"
          value={closedLots.toString()}
          detail="Closed lots"
        />

        <MetricCard
          label="Awarded"
          value={awardedLots.toString()}
          detail="Awarded lots"
        />

        <MetricCard
          label="Cancelled"
          value={cancelledLots.toString()}
          detail="Cancelled lots"
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Lot Summary
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Estimated value across configured lots:{" "}
            <span className="font-medium text-slate-700">
              {formatCurrency(
                totalEstimatedValue,
                procurement.currency?.code,
              )}
            </span>
          </p>
        </div>

        {lots.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
              +
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No lots configured
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Lots belong to solicitations. Create or open a solicitation to
              configure its lots.
            </p>

            <Link
              href={`/dashboard/organization/solicitations?procurementId=${procurement.id}`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Manage Solicitations
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {procurement.solicitations.map((solicitation) => (
              <div key={solicitation.id}>
                <div className="flex flex-col gap-3 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Link
                      href={`/dashboard/organization/solicitations/${solicitation.id}`}
                      className="font-semibold text-slate-900 hover:text-tenderhub-navy"
                    >
                      {solicitation.title}
                    </Link>

                    <p className="mt-1 text-xs text-slate-500">
                      {solicitation.solicitationNumber}
                    </p>
                  </div>

                  <span className="text-xs font-medium text-slate-500">
                    {solicitation.lots.length}{" "}
                    {solicitation.lots.length === 1 ? "lot" : "lots"}
                  </span>
                </div>

                {solicitation.lots.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-slate-500">
                    No lots have been configured for this solicitation.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                      <thead>
                        <tr className="bg-white">
                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Lot
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Status
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Estimated Value
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Requirements
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Bids
                          </th>

                          <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Awards
                          </th>

                          <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {solicitation.lots.map((lot) => (
                          <tr
                            key={lot.id}
                            className="hover:bg-slate-50"
                          >
                            <td className="px-6 py-5">
                              <div className="flex items-start gap-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-tenderhub-navy text-sm font-bold text-white">
                                  {lot.number}
                                </div>

                                <div>
                                  <p className="font-semibold text-slate-900">
                                    {lot.title}
                                  </p>

                                  <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
                                    {lot.description ||
                                      "No description provided."}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="px-6 py-5">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(
                                  lot.status,
                                )}`}
                              >
                                {formatLabel(lot.status)}
                              </span>
                            </td>

                            <td className="px-6 py-5 text-sm font-medium text-slate-900">
                              {formatCurrency(
                                lot.estimatedValue,
                                solicitation.currency?.code ||
                                  procurement.currency?.code,
                              )}
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-600">
                              {lot._count.requirements}
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-600">
                              {lot._count.bids}
                            </td>

                            <td className="px-6 py-5 text-sm text-slate-600">
                              {lot._count.awards}
                            </td>

                            <td className="px-6 py-5 text-right">
                              <Link
                                href={`/dashboard/organization/solicitations/${solicitation.id}`}
                                className="text-sm font-semibold text-tenderhub-navy hover:underline"
                              >
                                Open
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Lot Status
          </h2>

          <div className="mt-5 space-y-4">
            <StatusRow
              label="Open"
              value={openLots}
              description="Lots currently available for bidding."
            />

            <StatusRow
              label="Closed"
              value={closedLots}
              description="Lots whose bidding period has ended."
            />

            <StatusRow
              label="Awarded"
              value={awardedLots}
              description="Lots with an award recorded."
            />

            <StatusRow
              label="Cancelled"
              value={cancelledLots}
              description="Lots that have been cancelled."
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Lot Workflow
          </h2>

          <div className="mt-5 space-y-5">
            <WorkflowStep
              number="1"
              title="Configure"
              description="Define each lot under the relevant solicitation."
            />

            <WorkflowStep
              number="2"
              title="Receive Bids"
              description="Vendors can submit bids against eligible open lots."
            />

            <WorkflowStep
              number="3"
              title="Evaluate"
              description="Review and score bids according to the solicitation's evaluation process."
            />

            <WorkflowStep
              number="4"
              title="Award"
              description="Record awards for successfully evaluated lots."
            />
          </div>
        </div>
      </section>

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

function StatusRow({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>

        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      <span className="text-xl font-bold text-slate-900">{value}</span>
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