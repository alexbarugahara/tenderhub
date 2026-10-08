import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

function formatEnum(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDecimal(value: unknown) {
  if (value === null || value === undefined) {
    return "Not specified";
  }

  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(numericValue);
}

function formatDate(value: Date | null) {
  if (!value) {
    return "Not planned";
  }

  return value.toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function statusClasses(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";

    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";

    case "COMPLETED":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";

    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";

    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

function solicitationStatusClasses(status: string) {
  switch (status) {
    case "DRAFT":
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";

    case "PUBLISHED":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";

    case "OPEN":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";

    case "CLOSED":
      return "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200";

    case "EVALUATION":
    case "UNDER_EVALUATION":
      return "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200";

    case "AWARDED":
      return "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200";

    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";

    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

function lotStatusClasses(status: string) {
  switch (status) {
    case "OPEN":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200";

    case "CLOSED":
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";

    case "AWARDED":
      return "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200";

    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200";

    default:
      return "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200";
  }
}

function solicitationTypeLabel(type: string) {
  switch (type) {
    case "RFP":
      return "RFP — Request for Proposals";

    case "RFQ":
      return "RFQ — Request for Quotations";

    case "EOI":
      return "EOI — Expression of Interest";

    case "ITT":
      return "ITT — Invitation to Tender";

    case "ITB":
      return "ITB — Invitation to Bid";

    case "IFB":
      return "IFB — Invitation for Bids";

    case "RFI":
      return "RFI — Request for Information";

    default:
      return formatEnum(type);
  }
}

export default async function ProcurementsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const organizationMember = await prisma.organizationMember.findFirst({
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
    },
  });

  if (!organization) {
    notFound();
  }

  const procurements = await prisma.procurement.findMany({
    where: {
      organizationId: organization.id,
    },

    include: {
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
          type: true,
          status: true,
          openingDate: true,
          closingDate: true,

          // IMPORTANT:
          // Requirements can belong directly to the solicitation.
          requirements: {
            select: {
              id: true,
            },
          },

          lots: {
            select: {
              id: true,
              number: true,
              title: true,
              estimatedValue: true,
              status: true,

              _count: {
                select: {
                  requirements: true,
                  bids: true,
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

    orderBy: {
      createdAt: "desc",
    },
  });

  const totalProcurements = procurements.length;

  const activeProcurements = procurements.filter(
    (procurement) => procurement.status === "ACTIVE",
  ).length;

  const draftProcurements = procurements.filter(
    (procurement) => procurement.status === "DRAFT",
  ).length;

  const completedProcurements = procurements.filter(
    (procurement) => procurement.status === "COMPLETED",
  ).length;

  const totalSolicitations = procurements.reduce(
    (total, procurement) => total + procurement.solicitations.length,
    0,
  );

  const totalLots = procurements.reduce(
    (total, procurement) =>
      total +
      procurement.solicitations.reduce(
        (solicitationTotal, solicitation) =>
          solicitationTotal + solicitation.lots.length,
        0,
      ),
    0,
  );

  return (
    <div className="space-y-8">
      <PageHeader organizationName={organization.name} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <MetricCard
          label="Total"
          value={totalProcurements}
          description="All procurements"
        />

        <MetricCard
          label="Active"
          value={activeProcurements}
          description="Currently active"
        />

        <MetricCard
          label="Draft"
          value={draftProcurements}
          description="Still being prepared"
        />

        <MetricCard
          label="Completed"
          value={completedProcurements}
          description="Completed procurements"
        />

        <MetricCard
          label="Solicitations"
          value={totalSolicitations}
          description="Linked solicitations"
        />

        <MetricCard
          label="Lots"
          value={totalLots}
          description="Across solicitations"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Procurement Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Procurement records and their linked solicitations and lots for{" "}
              {organization.name}.
            </p>
          </div>

          <Link
            href="/dashboard/organization/procurements/new"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            New Procurement
          </Link>
        </div>

        {procurements.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              📋
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No procurements found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              This organization has not created any procurement records yet.
            </p>

            <Link
              href="/dashboard/organization/procurements/new"
              className="mt-5 inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Create Procurement
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1500px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Procurement</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Method</TableHeader>
                  <TableHeader>Department</TableHeader>
                  <TableHeader>Estimated Value</TableHeader>
                  <TableHeader>Solicitations & Lots</TableHeader>
                  <TableHeader>Planned End</TableHeader>
                  <TableHeader>Action</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {procurements.map((procurement) => (
                  <tr
                    key={procurement.id}
                    className="align-top transition hover:bg-slate-50"
                  >
                    <TableCell>
                      <div className="min-w-[240px]">
                        <Link
                          href={`/dashboard/organization/procurements/${procurement.id}`}
                          className="font-medium text-slate-900 hover:text-tenderhub-navy hover:underline"
                        >
                          {procurement.title}
                        </Link>

                        <p className="mt-1 font-mono text-xs text-slate-500">
                          {procurement.referenceNumber}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                          procurement.status,
                        )}`}
                      >
                        {formatEnum(procurement.status)}
                      </span>
                    </TableCell>

                    <TableCell>
                      {formatEnum(procurement.procurementMethod)}
                    </TableCell>

                    <TableCell>
                      {procurement.department ? (
                        <div>
                          <p className="font-medium text-slate-700">
                            {procurement.department.name}
                          </p>

                          {procurement.department.code && (
                            <p className="mt-1 text-xs text-slate-400">
                              {procurement.department.code}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Not assigned</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatDecimal(procurement.estimatedValue)}
                        </p>

                        {procurement.currency?.code && (
                          <p className="mt-1 text-xs text-slate-400">
                            {procurement.currency.code}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {procurement.solicitations.length === 0 ? (
                        <span className="text-slate-400">
                          No solicitations
                        </span>
                      ) : (
                        <div className="min-w-[430px] space-y-3">
                          {procurement.solicitations
                            .slice(0, 3)
                            .map((solicitation) => {
                              const lotCount = solicitation.lots.length;

                              // A requirement can belong either directly to
                              // the solicitation or to a lot.
                              const solicitationRequirementCount =
                                solicitation.requirements.length;

                              const lotRequirementCount =
                                solicitation.lots.reduce(
                                  (total, lot) =>
                                    total + lot._count.requirements,
                                  0,
                                );

                              const requirementCount =
                                solicitationRequirementCount +
                                lotRequirementCount;

                              return (
                                <div
                                  key={solicitation.id}
                                  className="rounded-lg border border-slate-200 bg-slate-50 p-3"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <Link
                                        href={`/dashboard/organization/solicitations/${solicitation.id}`}
                                        className="font-medium text-tenderhub-navy hover:underline"
                                      >
                                        {solicitation.solicitationNumber}
                                      </Link>

                                      <p className="mt-0.5 truncate text-xs text-slate-600">
                                        {solicitation.title}
                                      </p>
                                    </div>

                                    <span
                                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${solicitationStatusClasses(
                                        solicitation.status,
                                      )}`}
                                    >
                                      {formatEnum(solicitation.status)}
                                    </span>
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                                    <span className="font-medium text-slate-600">
                                      {solicitationTypeLabel(
                                        solicitation.type,
                                      )}
                                    </span>

                                    <span className="text-slate-300">•</span>

                                    <span className="font-semibold text-slate-600">
                                      {lotCount}{" "}
                                      {lotCount === 1 ? "Lot" : "Lots"}
                                    </span>

                                    <span className="text-slate-300">•</span>

                                    <span className="font-semibold text-slate-600">
                                      {requirementCount}{" "}
                                      {requirementCount === 1
                                        ? "Requirement"
                                        : "Requirements"}
                                    </span>
                                  </div>

                                  {lotCount === 0 ? (
                                    <div className="mt-3 rounded-md border border-dashed border-slate-300 bg-white px-3 py-2">
                                      <p className="text-xs text-slate-400">
                                        No lots configured yet.
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="mt-3 space-y-2">
                                      {solicitation.lots
                                        .slice(0, 4)
                                        .map((lot) => (
                                          <Link
                                            key={lot.id}
                                            href={`/dashboard/organization/solicitations/${solicitation.id}/lots/${lot.id}`}
                                            className="block rounded-md border border-slate-200 bg-white p-2.5 transition hover:border-slate-300 hover:bg-slate-50"
                                          >
                                            <div className="flex items-start justify-between gap-3">
                                              <div className="min-w-0">
                                                <p className="text-xs font-semibold text-slate-900">
                                                  Lot {lot.number} —{" "}
                                                  {lot.title}
                                                </p>

                                                <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                                  <span>
                                                    {lot._count.requirements}{" "}
                                                    {lot._count.requirements ===
                                                    1
                                                      ? "requirement"
                                                      : "requirements"}
                                                  </span>

                                                  <span className="text-slate-300">
                                                    •
                                                  </span>

                                                  <span>
                                                    {lot._count.bids}{" "}
                                                    {lot._count.bids === 1
                                                      ? "bid"
                                                      : "bids"}
                                                  </span>

                                                  {lot.estimatedValue !==
                                                    null && (
                                                    <>
                                                      <span className="text-slate-300">
                                                        •
                                                      </span>

                                                      <span>
                                                        Est.{" "}
                                                        {formatDecimal(
                                                          lot.estimatedValue,
                                                        )}
                                                      </span>
                                                    </>
                                                  )}
                                                </div>
                                              </div>

                                              <span
                                                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${lotStatusClasses(
                                                  lot.status,
                                                )}`}
                                              >
                                                {formatEnum(lot.status)}
                                              </span>
                                            </div>
                                          </Link>
                                        ))}

                                      {lotCount > 4 && (
                                        <Link
                                          href={`/dashboard/organization/solicitations/${solicitation.id}`}
                                          className="block text-xs font-medium text-tenderhub-navy hover:underline"
                                        >
                                          View all {lotCount} lots
                                        </Link>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                          {procurement.solicitations.length > 3 && (
                            <Link
                              href={`/dashboard/organization/procurements/${procurement.id}`}
                              className="text-xs font-medium text-tenderhub-navy hover:underline"
                            >
                              + {procurement.solicitations.length - 3} more{" "}
                              {procurement.solicitations.length - 3 === 1
                                ? "solicitation"
                                : "solicitations"}
                            </Link>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {formatDate(procurement.plannedEndDate)}
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/dashboard/organization/procurements/${procurement.id}`}
                        className="font-medium text-tenderhub-navy hover:underline"
                      >
                        View
                      </Link>
                    </TableCell>
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
            Procurement Planning
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Procurement-level planning information for {organization.name}.
          </p>
        </div>

        {procurements.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No planning records available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1300px] divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Procurement</TableHeader>
                  <TableHeader>Reference</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Start</TableHeader>
                  <TableHeader>End</TableHeader>
                  <TableHeader>Method</TableHeader>
                  <TableHeader>Department</TableHeader>
                  <TableHeader>Solicitations</TableHeader>
                  <TableHeader>Lots</TableHeader>
                  <TableHeader>View Procurement</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {procurements.map((procurement) => {
                  const solicitationCount = procurement.solicitations.length;

                  const lotCount = procurement.solicitations.reduce(
                    (total, solicitation) =>
                      total + solicitation.lots.length,
                    0,
                  );

                  return (
                    <tr
                      key={procurement.id}
                      className="transition hover:bg-slate-50"
                    >
                      <TableCell>
                        <Link
                          href={`/dashboard/organization/procurements/${procurement.id}`}
                          className="font-medium text-slate-900 hover:text-tenderhub-navy hover:underline"
                        >
                          {procurement.title}
                        </Link>
                      </TableCell>

                      <TableCell>
                        <span className="font-mono text-xs text-slate-600">
                          {procurement.referenceNumber}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(
                            procurement.status,
                          )}`}
                        >
                          {formatEnum(procurement.status)}
                        </span>
                      </TableCell>

                      <TableCell>
                        {formatDate(procurement.plannedStartDate)}
                      </TableCell>

                      <TableCell>
                        {formatDate(procurement.plannedEndDate)}
                      </TableCell>

                      <TableCell>
                        {formatEnum(procurement.procurementMethod)}
                      </TableCell>

                      <TableCell>
                        {procurement.department?.name ?? (
                          <span className="text-slate-400">
                            Not assigned
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-slate-700">
                          {solicitationCount}
                        </span>
                      </TableCell>

                      <TableCell>
                        <span className="font-semibold text-slate-700">
                          {lotCount}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Link
                          href={`/dashboard/organization/procurements/${procurement.id}`}
                          className="font-medium text-tenderhub-navy hover:underline"
                        >
                          View Procurement
                        </Link>
                      </TableCell>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function PageHeader({
  organizationName,
}: {
  organizationName: string;
}) {
  return (
    <div>
      <Link
        href="/dashboard/organization"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Organization Dashboard
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        Procurements
      </h1>

      <p className="mt-1 text-sm text-slate-600">
        Manage the procurement pipeline for {organizationName}.
      </p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
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

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="px-6 py-4 text-sm text-slate-600">{children}</td>
  );
}
