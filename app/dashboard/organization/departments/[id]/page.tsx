import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

import MemberAssignment from "./MemberAssignment";
import ProcurementAssignment from "./ProcurementAssignment";

interface DepartmentDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DepartmentDetailsPage({
  params,
}: DepartmentDetailsPageProps) {
  const { id } = await params;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    notFound();
  }

  const department = await prisma.department.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      organizationId: true,
      name: true,
      code: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
      members: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          role: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!department) {
    notFound();
  }

  const currentUserMembership =
    await prisma.organizationMember.findFirst({
      where: {
        userId,
        organizationId: department.organizationId,
      },
      select: {
        id: true,
        role: true,
      },
    });

  if (!currentUserMembership) {
    notFound();
  }

  const [
    organizationMembers,
    organizationProcurements,
  ] = await Promise.all([
    prisma.organizationMember.findMany({
      where: {
        organizationId: department.organizationId,
        OR: [
          {
            departmentId: null,
          },
          {
            departmentId: {
              not: department.id,
            },
          },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        role: true,
        departmentId: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        department: {
          select: {
            name: true,
          },
        },
      },
    }),

    prisma.procurement.findMany({
      where: {
        organizationId: department.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        referenceNumber: true,
        status: true,
        estimatedValue: true,
        departmentId: true,
      },
    }),
  ]);

  const currentMembers = department.members.map(
    (member) => ({
      id: member.id,
      role: member.role,
      name: member.user.name,
      email: member.user.email,
    }),
  );

  const availableMembers =
    organizationMembers.map((member) => ({
      id: member.id,
      role: member.role,
      name: member.user.name,
      email: member.user.email,
      departmentName:
        member.department?.name ?? null,
    }));

  const currentProcurements =
    organizationProcurements
      .filter(
        (procurement) =>
          procurement.departmentId === department.id,
      )
      .map((procurement) => ({
        id: procurement.id,
        title: procurement.title,
        referenceNumber: procurement.referenceNumber,
        status: procurement.status,
        estimatedValue:
          procurement.estimatedValue?.toString() ?? null,
      }));

  const availableProcurements =
    organizationProcurements
      .filter(
        (procurement) =>
          procurement.departmentId !== department.id,
      )
      .map((procurement) => ({
        id: procurement.id,
        title: procurement.title,
        referenceNumber: procurement.referenceNumber,
        status: procurement.status,
        estimatedValue:
          procurement.estimatedValue?.toString() ?? null,
      }));

  const privilegedMembers = department.members.filter(
    (member) =>
      member.role === "OWNER" ||
      member.role === "ADMIN" ||
      member.role === "PROCUREMENT_MANAGER",
  ).length;

  return (
    <div className="space-y-8">
      <PageHeader
        departmentName={department.name}
        organizationName={department.organization.name}
      />

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Members"
          value={department.members.length.toString()}
          description="Members assigned to department"
        />

        <SummaryCard
          label="Privileged"
          value={privilegedMembers.toString()}
          description="Members with elevated organization roles"
        />

        <SummaryCard
          label="Procurements"
          value={currentProcurements.length.toString()}
          description="Procurements linked to department"
        />

        <SummaryCard
          label="Department Code"
          value={department.code || "—"}
          description="Internal department code"
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Department Information
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Core information about this department.
              </p>
            </div>

            <Link
              href={`/dashboard/organization/departments/${department.id}/edit`}
              className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Edit Department
            </Link>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <DetailItem
            label="Department Name"
            value={department.name}
          />

          <DetailItem
            label="Department Code"
            value={department.code || "Not provided"}
          />

          <DetailItem
            label="Organization"
            value={department.organization.name}
          />

          <DetailItem
            label="Created"
            value={department.createdAt.toLocaleDateString(
              "en-UG",
            )}
          />

          <div className="md:col-span-2">
            <DetailItem
              label="Description"
              value={
                department.description ||
                "No description provided."
              }
            />
          </div>
        </div>
      </section>

      <MemberAssignment
        departmentId={department.id}
        currentMembers={currentMembers}
        availableMembers={availableMembers}
      />

      <ProcurementAssignment
        departmentId={department.id}
        currentProcurements={currentProcurements}
        availableProcurements={availableProcurements}
      />

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Department Administration
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Department membership and procurement assignments
          are managed through the department workspace.
          Assigning or removing members and procurements
          updates the department automatically.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/organization/departments"
            className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Back to Departments
          </Link>

          <Link
            href={`/dashboard/organization/departments/${department.id}/edit`}
            className="inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Edit Department
          </Link>
        </div>
      </section>
    </div>
  );
}

function PageHeader({
  departmentName,
  organizationName,
}: {
  departmentName: string;
  organizationName: string;
}) {
  return (
    <div>
      <Link
        href="/dashboard/organization/departments"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Departments
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {departmentName}
      </h1>

      <p className="mt-1 text-sm text-slate-600">
        {organizationName}
      </p>
    </div>
  );
}

function SummaryCard({
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

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-2 break-words text-sm font-medium text-slate-900">
        {value}
      </p>
    </div>
  );
}
