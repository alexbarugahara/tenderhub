import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export default async function DepartmentsPage() {
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
    },
  });

  if (!organization) {
    notFound();
  }

  const departments = await prisma.department.findMany({
    where: {
      organizationId: organization.id,
    },
    include: {
      _count: {
        select: {
          members: true,
          procurements: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const totalDepartments = departments.length;

  const totalMembers = departments.reduce(
    (total, department) => total + department._count.members,
    0,
  );

  const totalProcurements = departments.reduce(
    (total, department) =>
      total + department._count.procurements,
    0,
  );

  const departmentsWithCodes = departments.filter(
    (department) => Boolean(department.code),
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader organizationName={organization.name} />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Departments"
          value={totalDepartments}
          description="Organization departments"
        />

        <MetricCard
          label="Members"
          value={totalMembers}
          description="Members assigned across departments"
        />

        <MetricCard
          label="Procurements"
          value={totalProcurements}
          description="Procurements linked to departments"
        />

        <MetricCard
          label="With Codes"
          value={departmentsWithCodes}
          description="Departments with a department code"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Departments
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Organizational departments used to structure
              procurement activities and membership.
            </p>
          </div>

          <Link
            href="/dashboard/organization/departments/new"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            + Create Department
          </Link>
        </div>

        {departments.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
              🏢
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No departments found
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              This organization does not currently have any
              departments configured.
            </p>

            <Link
              href="/dashboard/organization/departments/new"
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white"
            >
              Create Your First Department
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Department</TableHeader>
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Members</TableHeader>
                  <TableHeader>Procurements</TableHeader>
                  <TableHeader>Created</TableHeader>
                  <TableHeader>Actions</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {departments.map((department) => (
                  <tr
                    key={department.id}
                    className="transition hover:bg-slate-50"
                  >
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900">
                          {department.name}
                        </p>

                        {department.description && (
                          <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                            {department.description}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {department.code ? (
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-medium text-slate-700">
                          {department.code}
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Not set
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      {department._count.members}
                    </TableCell>

                    <TableCell>
                      {department._count.procurements}
                    </TableCell>

                    <TableCell>
                      {department.createdAt.toLocaleDateString(
                        "en-UG",
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/organization/departments/${department.id}`}
                          className="font-medium text-tenderhub-navy hover:underline"
                        >
                          View
                        </Link>

                        <Link
                          href={`/dashboard/organization/departments/${department.id}/edit`}
                          className="font-medium text-slate-700 hover:text-tenderhub-navy hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </TableCell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Department Structure
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Departments provide an organizational structure for
          procurement operations. Members and procurements can be
          associated with departments, allowing organizations to
          separate responsibilities across different business units.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <InfoCard
            title="Members"
            description="Department membership is calculated from organization members assigned to each department."
          />

          <InfoCard
            title="Procurements"
            description="Procurement records can be associated with departments."
          />

          <InfoCard
            title="Department Codes"
            description="Optional department codes provide a consistent internal identifier."
          />
        </div>
      </section>
    </div>
  );
}

function PageHeader({
  organizationName,
}: {
  organizationName?: string;
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
        Departments
      </h1>

      <p className="mt-1 text-sm text-slate-600">
        {organizationName
          ? `View and manage the departments configured for ${organizationName}.`
          : "View and manage your organization departments."}
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

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
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

function TableCell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
      {children}
    </td>
  );
}