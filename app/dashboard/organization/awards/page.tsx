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
  const normalized = status.toUpperCase();

  if (
    normalized === "APPROVED" ||
    normalized === "ACCEPTED" ||
    normalized === "ACTIVE"
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalized === "PENDING" || normalized === "DRAFT") {
    return "bg-amber-50 text-amber-700";
  }

  if (
    normalized === "CANCELLED" ||
    normalized === "DECLINED"
  ) {
    return "bg-red-50 text-red-700";
  }

  if (normalized === "COMPLETED" || normalized === "CLOSED") {
    return "bg-blue-50 text-blue-700";
  }

  return "bg-slate-100 text-slate-600";
}

export default async function OrganizationAwardsPage() {
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
          createdAt: true,

          procurement: {
            select: {
              id: true,
              title: true,
              referenceNumber: true,
            },
          },

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
                  totalAmount: true,
                  status: true,
                  submittedAt: true,
                },
              },

              lot: {
                select: {
                  id: true,
                  number: true,
                  title: true,
                  estimatedValue: true,
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

  const awards = organization.solicitations.flatMap((solicitation) =>
    solicitation.awards.map((award) => ({
      ...award,
      solicitation,
    })),
  );

  const activeAwards = awards.filter((award) => {
    return (
      award.status === "APPROVED" ||
      award.status === "ACCEPTED"
    );
  });

  const pendingAwards = awards.filter((award) => {
    return award.status === "PENDING";
  });

  const awardsWithContracts = awards.filter(
    (award) => award.contract !== null,
  );

  const totalAwardValue = awards.reduce(
    (total, award) => total + Number(award.awardAmount),
    0,
  );

  const totalContractValue = awardsWithContracts.reduce(
    (total, award) =>
      total + Number(award.contract?.contractValue ?? 0),
    0,
  );

  const distinctVendors = new Set(
    awards.map((award) => award.vendor.id),
  );

  const distinctSolicitations = new Set(
    awards.map((award) => award.solicitation.id),
  );

  const contractConversionRate =
    awards.length > 0
      ? Math.round(
          (awardsWithContracts.length / awards.length) * 100,
        )
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {organization.name}
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Awards
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review procurement awards, awarded vendors, award
            values, and the transition from evaluation to
            contracting.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/organization/evaluations"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Evaluations
          </Link>

          <Link
            href="/dashboard/organization/contracts"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Contracts
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <MetricCard
          label="Awards"
          value={awards.length.toString()}
          detail="Total award records"
        />

        <MetricCard
          label="Approved"
          value={activeAwards.length.toString()}
          detail="Approved or accepted"
        />

        <MetricCard
          label="Pending"
          value={pendingAwards.length.toString()}
          detail="Awaiting decision"
        />

        <MetricCard
          label="Vendors"
          value={distinctVendors.size.toString()}
          detail="Distinct awarded vendors"
        />

        <MetricCard
          label="Solicitations"
          value={distinctSolicitations.size.toString()}
          detail="With awards"
        />

        <MetricCard
          label="Contracts"
          value={awardsWithContracts.length.toString()}
          detail="Awards linked to contracts"
        />

        <MetricCard
          label="Award Value"
          value={formatAmount(totalAwardValue)}
          detail="Combined award value"
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <SummaryCard
          title="Total Award Value"
          value={formatAmount(totalAwardValue)}
          description="Combined value recorded on all awards."
        />

        <SummaryCard
          title="Contract Value"
          value={formatAmount(totalContractValue)}
          description="Value of contracts linked to awards."
        />

        <SummaryCard
          title="Contract Conversion"
          value={`${contractConversionRate}%`}
          description="Awards that currently have a linked contract."
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Award Register
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Awards recorded across your organization&apos;s
              solicitations.
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {awards.length} record{awards.length === 1 ? "" : "s"}
          </span>
        </div>

        {awards.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Award</TableHeader>
                  <TableHeader>Solicitation</TableHeader>
                  <TableHeader>Vendor</TableHeader>
                  <TableHeader>Bid</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Award Date</TableHeader>
                  <TableHeader>Contract</TableHeader>
                  <TableHeader>Action</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {awards.map((award) => (
                  <tr
                    key={award.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/awards/${award.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-tenderhub-navy"
                      >
                        {award.awardNumber}
                      </Link>

                      <p className="mt-1 text-xs text-slate-500">
                        Lot {award.lot.number}: {award.lot.title}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/solicitations/${award.solicitation.id}`}
                        className="text-sm font-semibold text-slate-800 hover:text-tenderhub-navy"
                      >
                        {award.solicitation.solicitationNumber}
                      </Link>

                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {award.solicitation.title}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-800">
                      {award.vendor.companyName}
                    </td>

                    <td className="px-6 py-5">
                      <p className="text-sm font-medium text-slate-800">
                        {award.bid.bidNumber}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatLabel(award.bid.status)}
                      </p>
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

                    <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                      {formatAmount(award.awardAmount)}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-500">
                      {formatDate(award.awardDate)}
                    </td>

                    <td className="px-6 py-5">
                      {award.contract ? (
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {award.contract.contractNumber}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {formatLabel(
                              award.contract.status,
                            )}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">
                          Not linked
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-5">
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
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Awards
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Most recently created award records.
            </p>
          </div>

          {awards.length === 0 ? (
            <EmptyState message="No award activity is available yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {awards.slice(0, 6).map((award) => (
                <Link
                  key={award.id}
                  href={`/dashboard/organization/awards/${award.id}`}
                  className="block p-5 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {award.awardNumber}
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {award.vendor.companyName}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {award.solicitation.solicitationNumber}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatAmount(award.awardAmount)}
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          award.status,
                        )}`}
                      >
                        {formatLabel(award.status)}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Award date: {formatDate(award.awardDate)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Contract Transition
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Awards and their transition into contracts.
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-5">
              <TransitionStep
                number="1"
                title="Award Recorded"
                value={awards.length.toString()}
                description="Award records created from procurement decisions."
              />

              <TransitionStep
                number="2"
                title="Contract Linked"
                value={awardsWithContracts.length.toString()}
                description="Awards that have an associated contract."
              />

              <TransitionStep
                number="3"
                title="Contract Value"
                value={formatAmount(totalContractValue)}
                description="Combined value of linked contracts."
              />
            </div>

            <Link
              href="/dashboard/organization/contracts"
              className="mt-6 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              View Contracts
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Award Workflow
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-4">
          <WorkflowCard
            number="1"
            title="Evaluate"
            description="Review submitted bids against the configured evaluation criteria."
          />

          <WorkflowCard
            number="2"
            title="Decide"
            description="Record the procurement award decision against the relevant bid or lot."
          />

          <WorkflowCard
            number="3"
            title="Notify"
            description="Use the award record as the basis for applicable procurement notices."
          />

          <WorkflowCard
            number="4"
            title="Contract"
            description="Transition the awarded procurement into contract management."
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
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">{detail}</p>
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

function TransitionStep({
  number,
  title,
  value,
  description,
}: {
  number: string;
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
        {number}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">
            {title}
          </h3>

          <span className="text-sm font-bold text-slate-900">
            {value}
          </span>
        </div>

        <p className="mt-1 text-sm leading-6 text-slate-500">
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

function EmptyState({
  message = "No awards have been recorded yet.",
}: {
  message?: string;
}) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
        A
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        No awards
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message}
      </p>
    </div>
  );
}