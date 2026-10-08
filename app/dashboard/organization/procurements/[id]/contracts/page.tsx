import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

interface ProcurementAwardsPageProps {
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

function formatAmount(value: unknown) {
  if (value === null || value === undefined) {
    return "Not specified";
  }

  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getStatusClasses(status: string) {
  switch (status.toUpperCase()) {
    case "APPROVED":
    case "ACCEPTED":
      return "bg-emerald-50 text-emerald-700";
    case "PENDING":
      return "bg-amber-50 text-amber-700";
    case "DECLINED":
    case "CANCELLED":
      return "bg-red-50 text-red-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default async function ProcurementAwardsPage({
  params,
}: ProcurementAwardsPageProps) {
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
          awards: {
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
                },
              },
              bid: {
                select: {
                  id: true,
                  bidNumber: true,
                  title: true,
                  status: true,
                  totalAmount: true,
                  submittedAt: true,
                },
              },
              lot: {
                select: {
                  id: true,
                  number: true,
                  title: true,
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
            orderBy: {
              awardDate: "desc",
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

  const awards = procurement.solicitations.flatMap((solicitation) =>
    solicitation.awards.map((award) => ({
      ...award,
      solicitation: {
        id: solicitation.id,
        solicitationNumber: solicitation.solicitationNumber,
        title: solicitation.title,
      },
    })),
  );

  const approvedAwards = awards.filter(
    (award) => award.status === "APPROVED",
  ).length;

  const acceptedAwards = awards.filter(
    (award) => award.status === "ACCEPTED",
  ).length;

  const pendingAwards = awards.filter(
    (award) => award.status === "PENDING",
  ).length;

  const declinedAwards = awards.filter(
    (award) => award.status === "DECLINED",
  ).length;

  const cancelledAwards = awards.filter(
    (award) => award.status === "CANCELLED",
  ).length;

  const awardedValue = awards.reduce(
    (total, award) => total + Number(award.awardAmount),
    0,
  );

  const contractedAwards = awards.filter(
    (award) => award.contract !== null,
  ).length;

  const vendors = new Set(awards.map((award) => award.vendor.id));

  const recentAwards = [...awards]
    .sort(
      (first, second) =>
        second.awardDate.getTime() - first.awardDate.getTime(),
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
            Procurement Awards
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
            href="/dashboard/organization/awards"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            All Awards
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <MetricCard
          label="Awards"
          value={awards.length.toString()}
          detail="Award records"
        />

        <MetricCard
          label="Approved"
          value={approvedAwards.toString()}
          detail="Approved awards"
        />

        <MetricCard
          label="Accepted"
          value={acceptedAwards.toString()}
          detail="Accepted awards"
        />

        <MetricCard
          label="Pending"
          value={pendingAwards.toString()}
          detail="Pending awards"
        />

        <MetricCard
          label="Awarded Value"
          value={formatAmount(awardedValue)}
          detail="Total award value"
        />

        <MetricCard
          label="Vendors"
          value={vendors.size.toString()}
          detail="Unique awarded vendors"
        />

        <MetricCard
          label="Contracts"
          value={contractedAwards.toString()}
          detail="Awards linked to contracts"
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Award Register
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Awards recorded against bids within this procurement.
          </p>
        </div>

        {awards.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
              A
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No awards yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Awards will appear here after evaluated bids progress through
              the award workflow.
            </p>

            <Link
              href={`/dashboard/organization/procurements/${procurement.id}/evaluations`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              View Evaluations
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Award
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Vendor
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bid
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Solicitation
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Award Date
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {recentAwards.map((award) => (
                  <tr key={award.id} className="hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/awards/${award.id}`}
                        className="font-semibold text-slate-900 hover:text-tenderhub-navy"
                      >
                        {award.awardNumber}
                      </Link>

                      <p className="mt-1 text-xs text-slate-500">
                        Created {formatDate(award.createdAt)}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/vendors/${award.vendor.id}`}
                        className="text-sm font-semibold text-slate-800 hover:text-tenderhub-navy"
                      >
                        {award.vendor.companyName}
                      </Link>
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-semibold text-slate-800">
                        {award.bid.bidNumber}
                      </p>

                      {award.bid.title ? (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {award.bid.title}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-slate-800">
                        {award.solicitation.solicitationNumber}
                      </p>

                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {award.solicitation.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {award.lot.number} — {award.lot.title}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                      {formatAmount(award.awardAmount)}
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          award.status,
                        )}`}
                      >
                        {formatLabel(award.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {formatDate(award.awardDate)}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/dashboard/organization/awards/${award.id}`}
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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Award Status
          </h2>

          <div className="mt-5 space-y-3">
            <StatusRow
              label="Pending"
              value={pendingAwards}
              description="Awards awaiting a final decision."
            />

            <StatusRow
              label="Approved"
              value={approvedAwards}
              description="Awards approved by the organization."
            />

            <StatusRow
              label="Accepted"
              value={acceptedAwards}
              description="Awards accepted by the awarded vendor."
            />

            <StatusRow
              label="Declined"
              value={declinedAwards}
              description="Awards declined by the vendor."
            />

            <StatusRow
              label="Cancelled"
              value={cancelledAwards}
              description="Awards cancelled in the procurement workflow."
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Contract Transition
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Awards can progress into contracts after the award decision.
          </p>

          <div className="mt-5 space-y-4">
            {awards.filter((award) => award.contract).length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-800">
                  No contracts linked yet
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Contract records linked to awards will be displayed here.
                </p>
              </div>
            ) : (
              awards
                .filter((award) => award.contract)
                .slice(0, 5)
                .map((award) => (
                  <Link
                    key={award.contract!.id}
                    href={`/dashboard/organization/contracts/${award.contract!.id}`}
                    className="block rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {award.contract!.contractNumber}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {award.contract!.title}
                        </p>
                      </div>

                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          award.contract!.status,
                        )}`}
                      >
                        {formatLabel(award.contract!.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <SummaryValue
                        label="Value"
                        value={formatAmount(
                          award.contract!.contractValue,
                        )}
                      />

                      <SummaryValue
                        label="Start"
                        value={formatDate(
                          award.contract!.startDate,
                        )}
                      />
                    </div>
                  </Link>
                ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Award Activity
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Latest award records and their current procurement status.
          </p>
        </div>

        {recentAwards.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No award activity is available.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentAwards.map((award) => (
              <div
                key={award.id}
                className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {award.awardNumber} — {award.vendor.companyName}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {award.solicitation.solicitationNumber} ·{" "}
                    {award.bid.bidNumber}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Last updated {formatDateTime(award.updatedAt)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-slate-900">
                    {formatAmount(award.awardAmount)}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                      award.status,
                    )}`}
                  >
                    {formatLabel(award.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Award Workflow
        </h2>

        <div className="mt-5 grid gap-6 md:grid-cols-4">
          <WorkflowStep
            number="1"
            title="Evaluate"
            description="Review submitted bids against the configured evaluation criteria."
          />

          <WorkflowStep
            number="2"
            title="Award"
            description="Create an award record for the selected bid and vendor."
          />

          <WorkflowStep
            number="3"
            title="Accept"
            description="The award progresses through its approval and vendor acceptance status."
          />

          <WorkflowStep
            number="4"
            title="Contract"
            description="Accepted awards can be linked to a contract for execution and monitoring."
          />
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