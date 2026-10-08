import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

interface ProcurementRequirementsPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ProcurementRequirementsPage({
  params,
}: ProcurementRequirementsPageProps) {
  const { id } = await params;

  const procurement = await prisma.procurement.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      title: true,
      referenceNumber: true,
      organizationId: true,
      solicitations: {
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,
          requirements: {
            select: {
              id: true,
              title: true,
              description: true,
              type: true,
              isMandatory: true,
              sortOrder: true,
              createdAt: true,
              updatedAt: true,
              solicitationId: true,
              lotId: true,
              lot: {
                select: {
                  id: true,
                  number: true,
                  title: true,
                },
              },
            },
            orderBy: [
              {
                isMandatory: "desc",
              },
              {
                sortOrder: "asc",
              },
              {
                createdAt: "asc",
              },
            ],
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

  const requirements = procurement.solicitations.flatMap((solicitation) =>
    solicitation.requirements.map((requirement) => ({
      ...requirement,
      solicitation: {
        id: solicitation.id,
        solicitationNumber: solicitation.solicitationNumber,
        title: solicitation.title,
      },
    })),
  );

  const mandatoryRequirements = requirements.filter(
    (requirement) => requirement.isMandatory,
  ).length;

  const optionalRequirements = requirements.filter(
    (requirement) => !requirement.isMandatory,
  ).length;

  const typeCounts = requirements.reduce<Record<string, number>>(
    (accumulator, requirement) => {
      accumulator[requirement.type] =
        (accumulator[requirement.type] || 0) + 1;

      return accumulator;
    },
    {},
  );

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
            Procurement Requirements
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Requirements"
          value={requirements.length.toString()}
          detail="Across all solicitations"
        />

        <MetricCard
          label="Mandatory"
          value={mandatoryRequirements.toString()}
          detail="Required for compliance"
        />

        <MetricCard
          label="Optional"
          value={optionalRequirements.toString()}
          detail="Non-mandatory requirements"
        />

        <MetricCard
          label="Solicitations"
          value={procurement.solicitations.length.toString()}
          detail="With requirement configuration"
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Requirements by Type
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Requirement types configured across the procurement&apos;s
            solicitations.
          </p>
        </div>

        {Object.keys(typeCounts).length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No requirement types have been configured yet.
          </div>
        ) : (
          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Object.entries(typeCounts)
              .sort(([first], [second]) => first.localeCompare(second))
              .map(([type, count]) => (
                <div
                  key={type}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {formatLabel(type)}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {count}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {count === 1 ? "requirement" : "requirements"}
                  </p>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              All Requirements
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Requirements configured under the procurement&apos;s
              solicitations.
            </p>
          </div>
        </div>

        {requirements.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
              +
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No requirements configured
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Requirements are configured at the solicitation level. Open a
              solicitation to add the requirements vendors must satisfy.
            </p>

            <Link
              href={`/dashboard/organization/solicitations?procurementId=${procurement.id}`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Manage Solicitations
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Requirement
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Requirement Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Solicitation
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Lot
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {requirements.map((requirement) => (
                  <tr key={requirement.id} className="hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <p className="font-semibold text-slate-900">
                        {requirement.title}
                      </p>

                      <p className="mt-1 max-w-lg text-xs leading-5 text-slate-500">
                        {requirement.description ||
                          "No description provided."}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-sm text-slate-700">
                        {formatLabel(requirement.type)}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          requirement.isMandatory
                            ? "bg-amber-50 text-amber-700 ring-amber-600/20"
                            : "bg-slate-100 text-slate-600 ring-slate-600/20"
                        }`}
                      >
                        {requirement.isMandatory
                          ? "Mandatory"
                          : "Optional"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/solicitations/${requirement.solicitation.id}`}
                        className="text-sm font-medium text-slate-900 hover:text-tenderhub-navy"
                      >
                        {requirement.solicitation.title}
                      </Link>

                      <p className="mt-1 text-xs text-slate-500">
                        {requirement.solicitation.solicitationNumber}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {requirement.lot
                        ? `Lot ${requirement.lot.number} — ${requirement.lot.title}`
                        : "Solicitation-wide"}
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/dashboard/organization/solicitations/${requirement.solicitation.id}`}
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

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Requirement Configuration
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <WorkflowCard
            number="1"
            title="Define"
            description="Specify what vendors must provide or demonstrate."
          />

          <WorkflowCard
            number="2"
            title="Classify"
            description="Organize requirements by their configured requirement type."
          />

          <WorkflowCard
            number="3"
            title="Apply"
            description="Apply requirements at solicitation level or to specific lots."
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