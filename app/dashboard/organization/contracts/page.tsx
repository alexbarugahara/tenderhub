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
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";

    case "PENDING_SIGNATURE":
      return "bg-amber-50 text-amber-700";

    case "DRAFT":
      return "bg-slate-100 text-slate-600";

    case "ON_HOLD":
      return "bg-orange-50 text-orange-700";

    case "COMPLETED":
      return "bg-blue-50 text-blue-700";

    case "TERMINATED":
      return "bg-red-50 text-red-700";

    case "EXPIRED":
      return "bg-purple-50 text-purple-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default async function OrganizationContractsPage() {
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
                  description: true,
                  status: true,
                  contractValue: true,
                  startDate: true,
                  endDate: true,
                  signedAt: true,
                  completedAt: true,
                  terminatedAt: true,
                  terminationReason: true,
                  createdAt: true,
                  updatedAt: true,

                  vendor: {
                    select: {
                      id: true,
                      companyName: true,
                    },
                  },

                  documents: {
                    select: {
                      id: true,
                      name: true,
                      category: true,
                      fileUrl: true,
                      mimeType: true,
                      fileSize: true,
                      createdAt: true,
                    },
                  },

                  milestones: {
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      dueDate: true,
                      amount: true,
                      status: true,
                      completedAt: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },

                  payments: {
                    select: {
                      id: true,
                      amount: true,
                      currencyId: true,
                      paymentDate: true,
                      status: true,
                      reference: true,
                      notes: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
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

  const contracts = organization.solicitations.flatMap(
    (solicitation) =>
      solicitation.awards
        .filter((award) => award.contract !== null)
        .map((award) => ({
          ...award.contract!,
          award,
          solicitation,
        })),
  );

  const activeContracts = contracts.filter(
    (contract) => contract.status === "ACTIVE",
  );

  const pendingContracts = contracts.filter(
    (contract) =>
      contract.status === "DRAFT" ||
      contract.status === "PENDING_SIGNATURE",
  );

  const completedContracts = contracts.filter(
    (contract) =>
      contract.status === "COMPLETED" ||
      contract.status === "EXPIRED",
  );

  const totalContractValue = contracts.reduce(
    (total, contract) =>
      total + Number(contract.contractValue),
    0,
  );

  const totalPaid = contracts.reduce(
    (total, contract) =>
      total +
      contract.payments
        .filter((payment) => payment.status === "PAID")
        .reduce(
          (sum, payment) => sum + Number(payment.amount),
          0,
        ),
    0,
  );

  const totalOutstanding = Math.max(
    totalContractValue - totalPaid,
    0,
  );

  const totalMilestones = contracts.reduce(
    (total, contract) =>
      total + contract.milestones.length,
    0,
  );

  const totalDocuments = contracts.reduce(
    (total, contract) =>
      total + contract.documents.length,
    0,
  );

  const distinctVendors = new Set(
    contracts.map((contract) => contract.vendor.id),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {organization.name}
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Contracts
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Manage contracts resulting from awarded solicitations,
            including values, vendors, milestones, documents, and
            payments.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/organization/awards"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Awards
          </Link>

          <Link
            href="/dashboard/organization/reports/contracts"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Contract Reports
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-7">
        <MetricCard
          label="Contracts"
          value={contracts.length.toString()}
          detail="Total linked contracts"
        />

        <MetricCard
          label="Active"
          value={activeContracts.length.toString()}
          detail="Currently active"
        />

        <MetricCard
          label="Pending"
          value={pendingContracts.length.toString()}
          detail="Draft or awaiting signature"
        />

        <MetricCard
          label="Completed"
          value={completedContracts.length.toString()}
          detail="Completed or expired"
        />

        <MetricCard
          label="Vendors"
          value={distinctVendors.size.toString()}
          detail="Contracted vendors"
        />

        <MetricCard
          label="Milestones"
          value={totalMilestones.toString()}
          detail="Recorded milestones"
        />

        <MetricCard
          label="Contract Value"
          value={formatAmount(totalContractValue)}
          detail="Combined contract value"
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <SummaryCard
          title="Contract Value"
          value={formatAmount(totalContractValue)}
          description="Combined value across all organization contracts."
        />

        <SummaryCard
          title="Paid"
          value={formatAmount(totalPaid)}
          description="Payments currently recorded as paid."
        />

        <SummaryCard
          title="Outstanding"
          value={formatAmount(totalOutstanding)}
          description="Contract value less recorded paid amounts."
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-4">
        <InfoCard
          label="Active Contracts"
          value={activeContracts.length.toString()}
          description="Contracts currently active."
        />

        <InfoCard
          label="Contracted Vendors"
          value={distinctVendors.size.toString()}
          description="Distinct vendors represented in contracts."
        />

        <InfoCard
          label="Documents"
          value={totalDocuments.toString()}
          description="Contract documents recorded."
        />

        <InfoCard
          label="Milestones"
          value={totalMilestones.toString()}
          description="Contract milestones recorded."
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Contract Register
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Contracts linked to procurement awards.
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {contracts.length} record
            {contracts.length === 1 ? "" : "s"}
          </span>
        </div>

        {contracts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Contract</TableHeader>
                  <TableHeader>Vendor</TableHeader>
                  <TableHeader>Procurement</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Value</TableHeader>
                  <TableHeader>Start</TableHeader>
                  <TableHeader>End</TableHeader>
                  <TableHeader>Milestones</TableHeader>
                  <TableHeader>Action</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/contracts/${contract.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-tenderhub-navy"
                      >
                        {contract.contractNumber}
                      </Link>

                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {contract.title}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-800">
                      {contract.vendor.companyName}
                    </td>

                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/procurements/${contract.solicitation.procurement.id}`}
                        className="text-sm font-semibold text-slate-800 hover:text-tenderhub-navy"
                      >
                        {
                          contract.solicitation.procurement
                            .referenceNumber
                        }
                      </Link>

                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {
                          contract.solicitation.procurement
                            .title
                        }
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          contract.status,
                        )}`}
                      >
                        {formatLabel(contract.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm font-semibold text-slate-900">
                      {formatAmount(contract.contractValue)}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-500">
                      {formatDate(contract.startDate)}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-500">
                      {formatDate(contract.endDate)}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {contract.milestones.length}
                    </td>

                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/contracts/${contract.id}`}
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
              Recent Contracts
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Most recently created contract records.
            </p>
          </div>

          {contracts.length === 0 ? (
            <EmptyState message="No contract activity is available yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {contracts.slice(0, 6).map((contract) => (
                <Link
                  key={contract.id}
                  href={`/dashboard/organization/contracts/${contract.id}`}
                  className="block p-5 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {contract.contractNumber}
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {contract.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {contract.vendor.companyName}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatAmount(contract.contractValue)}
                      </p>

                      <span
                        className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          contract.status,
                        )}`}
                      >
                        {formatLabel(contract.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                    <span>
                      Start: {formatDate(contract.startDate)}
                    </span>

                    <span>
                      End: {formatDate(contract.endDate)}
                    </span>

                    <span>
                      Milestones: {contract.milestones.length}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Contract Management
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Key areas for monitoring contract execution.
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-5">
              <ManagementItem
                title="Milestones"
                value={totalMilestones.toString()}
                description="Track contractual deliverables and due dates."
              />

              <ManagementItem
                title="Documents"
                value={totalDocuments.toString()}
                description="Contract documents associated with contract records."
              />

              <ManagementItem
                title="Payments"
                value={formatAmount(totalPaid)}
                description="Amount currently recorded as paid."
              />

              <ManagementItem
                title="Outstanding"
                value={formatAmount(totalOutstanding)}
                description="Remaining contract value based on recorded payments."
              />
            </div>

            <Link
              href="/dashboard/organization/reports/contracts"
              className="mt-6 inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Open Contract Report
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Contract Lifecycle
        </h2>

        <div className="mt-5 grid gap-5 md:grid-cols-4">
          <WorkflowCard
            number="1"
            title="Award"
            description="A procurement decision identifies the successful vendor."
          />

          <WorkflowCard
            number="2"
            title="Contract"
            description="The award transitions into a formal contract record."
          />

          <WorkflowCard
            number="3"
            title="Execute"
            description="Monitor milestones, documents, payments, and contract dates."
          />

          <WorkflowCard
            number="4"
            title="Close"
            description="Complete or close the contract and retain the procurement record."
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

      <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900">
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

function InfoCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function ManagementItem({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5 last:border-b-0 last:pb-0">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-sm leading-5 text-slate-500">
          {description}
        </p>
      </div>

      <span className="shrink-0 text-sm font-bold text-slate-900">
        {value}
      </span>
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
  message = "No contracts have been recorded yet.",
}: {
  message?: string;
}) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
        C
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        No contracts
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message}
      </p>
    </div>
  );
}