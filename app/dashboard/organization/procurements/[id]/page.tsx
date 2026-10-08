import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

interface ProcurementDetailsPageProps {
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
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "DRAFT":
      return "bg-slate-100 text-slate-700 ring-slate-600/20";

    case "COMPLETED":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-red-600/20";

    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
}

function solicitationStatusClasses(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";

    case "DRAFT":
      return "bg-slate-100 text-slate-700 ring-slate-600/20";

    case "CLOSED":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";

    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-red-600/20";

    default:
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }
}

export default async function ProcurementDetailsPage({
  params,
}: ProcurementDetailsPageProps) {
  const { id } = await params;

  const procurement = await prisma.procurement.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      organizationId: true,
      departmentId: true,
      countryId: true,
      currencyId: true,
      title: true,
      description: true,
      referenceNumber: true,
      status: true,
      procurementMethod: true,
      estimatedValue: true,
      plannedStartDate: true,
      plannedEndDate: true,
      createdAt: true,
      updatedAt: true,

      organization: {
        select: {
          id: true,
          name: true,
        },
      },

      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },

      country: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },

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
          description: true,
          status: true,
          type: true,
          procurementMethod: true,
          publishedAt: true,
          openingDate: true,
          closingDate: true,
          estimatedValue: true,
          bidSecurityRequired: true,
          bidSecurityAmount: true,
          applicationFeeRequired: true,
          applicationFeeAmount: true,
          createdAt: true,
          updatedAt: true,

          currency: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },

          _count: {
            select: {
              lots: true,
              requirements: true,
              documents: true,
              evaluationCriteria: true,
              bids: true,
              awards: true,
              notices: true,
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

  const activeSolicitations = procurement.solicitations.filter(
    (solicitation) => solicitation.status === "OPEN",
  ).length;

  const closedSolicitations = procurement.solicitations.filter(
    (solicitation) => solicitation.status === "CLOSED",
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/dashboard/organization/procurements"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Procurements
          </Link>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {procurement.title}
            </h1>

            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(
                procurement.status,
              )}`}
            >
              {formatLabel(procurement.status)}
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            Reference: {procurement.referenceNumber}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {procurement.organization.name}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/organization/procurements/${procurement.id}/edit`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Edit Procurement
          </Link>

          <Link
            href={`/dashboard/organization/procurements/${procurement.id}/solicitations`}
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Manage Solicitations
          </Link>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Solicitations"
          value={procurement.solicitations.length.toString()}
          detail={`${activeSolicitations} currently open`}
        />

        <MetricCard
          label="Closed"
          value={closedSolicitations.toString()}
          detail="Closed solicitations"
        />

        <MetricCard
          label="Estimated Value"
          value={formatCurrency(
            procurement.estimatedValue,
            procurement.currency?.code,
          )}
          detail={procurement.currency?.name || "Currency not specified"}
        />

        <MetricCard
          label="Procurement Method"
          value={formatLabel(procurement.procurementMethod)}
          detail="Configured method"
        />
      </div>

      {/* Procurement information + workspace */}
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Procurement Information
            </h2>
          </div>

          <div className="grid gap-x-8 gap-y-6 p-6 sm:grid-cols-2">
            <InfoItem
              label="Organization"
              value={procurement.organization.name}
            />

            <InfoItem
              label="Reference Number"
              value={procurement.referenceNumber}
            />

            <InfoItem
              label="Department"
              value={
                procurement.department
                  ? procurement.department.code
                    ? `${procurement.department.name} (${procurement.department.code})`
                    : procurement.department.name
                  : "Not assigned"
              }
            />

            <InfoItem
              label="Country"
              value={
                procurement.country
                  ? `${procurement.country.name} (${procurement.country.code})`
                  : "Not specified"
              }
            />

            <InfoItem
              label="Currency"
              value={
                procurement.currency
                  ? `${procurement.currency.code} — ${procurement.currency.name}`
                  : "Not specified"
              }
            />

            <InfoItem
              label="Procurement Method"
              value={formatLabel(procurement.procurementMethod)}
            />

            <InfoItem
              label="Estimated Value"
              value={formatCurrency(
                procurement.estimatedValue,
                procurement.currency?.code,
              )}
            />

            <InfoItem
              label="Status"
              value={formatLabel(procurement.status)}
            />

            <InfoItem
              label="Planned Start Date"
              value={formatDate(procurement.plannedStartDate)}
            />

            <InfoItem
              label="Planned End Date"
              value={formatDate(procurement.plannedEndDate)}
            />

            <InfoItem
              label="Created"
              value={formatDateTime(procurement.createdAt)}
            />

            <InfoItem
              label="Last Updated"
              value={formatDateTime(procurement.updatedAt)}
            />
          </div>

          <div className="border-t border-slate-200 px-6 py-5">
            <h3 className="text-sm font-semibold text-slate-900">
              Description
            </h3>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {procurement.description || "No description has been provided."}
            </p>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Procurement Workspace
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Continue configuring this procurement.
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            <WorkspaceLink
              href={`/dashboard/organization/procurements/${procurement.id}/edit`}
              title="Edit procurement"
              description="Update core procurement information."
            />

            <WorkspaceLink
              href={`/dashboard/organization/procurements/${procurement.id}/lots`}
              title="Lots"
              description="Configure procurement lots."
            />

            <WorkspaceLink
              href={`/dashboard/organization/procurements/${procurement.id}/requirements`}
              title="Requirements"
              description="Define requirements for the procurement."
            />

            <WorkspaceLink
              href={`/dashboard/organization/procurements/${procurement.id}/documents`}
              title="Documents"
              description="Manage procurement documents."
            />

            <WorkspaceLink
              href={`/dashboard/organization/procurements/${procurement.id}/vendors`}
              title="Vendors"
              description="Review vendors associated with the procurement."
            />

            <WorkspaceLink
              href={`/dashboard/organization/procurements/${procurement.id}/evaluations`}
              title="Evaluations"
              description="Manage procurement evaluations."
            />

            <WorkspaceLink
              href={`/dashboard/organization/procurements/${procurement.id}/awards`}
              title="Awards"
              description="Review and manage awards."
            />

            <WorkspaceLink
              href={`/dashboard/organization/procurements/${procurement.id}/contracts`}
              title="Contracts"
              description="Manage resulting contracts."
            />
          </div>
        </section>
      </div>

      {/* Solicitations */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Solicitations
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Solicitations associated with this procurement.
            </p>
          </div>

          <Link
            href={`/dashboard/organization/solicitations?procurementId=${procurement.id}`}
            className="text-sm font-semibold text-tenderhub-navy hover:underline"
          >
            View all solicitations
          </Link>
        </div>

        {procurement.solicitations.length === 0 ? (
          <div className="p-10 text-center">
            <h3 className="text-base font-semibold text-slate-900">
              No solicitations yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              This procurement does not have any solicitations yet. Create a
              solicitation when the procurement is ready to go to market.
            </p>

            <Link
              href={`/dashboard/organization/solicitations/new?procurementId=${procurement.id}`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Create Solicitation
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Solicitation
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Closing
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Estimated Value
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Activity
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {procurement.solicitations.map((solicitation) => (
                  <tr
                    key={solicitation.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-5">
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

                        <p className="mt-1 text-xs text-slate-500">
                          {formatLabel(solicitation.type)}
                        </p>
                      </div>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${solicitationStatusClasses(
                          solicitation.status,
                        )}`}
                      >
                        {formatLabel(solicitation.status)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {formatDate(solicitation.closingDate)}
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-900">
                      {formatCurrency(
                        solicitation.estimatedValue,
                        solicitation.currency?.code ||
                          procurement.currency?.code,
                      )}
                    </td>

                    <td className="px-6 py-5">
                      <div className="space-y-1 text-xs text-slate-500">
                        <p>{solicitation._count.lots} lots</p>
                        <p>
                          {solicitation._count.requirements} requirements
                        </p>
                        <p>{solicitation._count.bids} bids</p>
                      </div>
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
      </section>

      {/* Timeline */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Timeline
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Key planning dates for this procurement.
          </p>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-3">
          <TimelineItem
            label="Created"
            date={formatDate(procurement.createdAt)}
            description="Procurement record created."
          />

          <TimelineItem
            label="Planned Start"
            date={formatDate(procurement.plannedStartDate)}
            description="Planned procurement start date."
          />

          <TimelineItem
            label="Planned End"
            date={formatDate(procurement.plannedEndDate)}
            description="Planned procurement end date."
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

      <p className="mt-1 text-xs text-slate-500">
        {detail}
      </p>
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
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 text-sm font-medium text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function WorkspaceLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-4 px-6 py-4 transition hover:bg-slate-50"
    >
      <div>
        <p className="text-sm font-semibold text-slate-900">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <span className="text-slate-400">→</span>
    </Link>
  );
}

function TimelineItem({
  label,
  date,
  description,
}: {
  label: string;
  date: string;
  description: string;
}) {
  return (
    <div className="relative rounded-lg border border-slate-200 p-5">
      <div className="h-2 w-2 rounded-full bg-tenderhub-gold" />

      <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-base font-semibold text-slate-900">
        {date}
      </p>

      <p className="mt-2 text-sm text-slate-500">
        {description}
      </p>
    </div>
  );
}