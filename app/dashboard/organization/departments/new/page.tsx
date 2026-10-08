import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createDepartment } from "./actions";

export default async function NewDepartmentPage() {
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
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  if (!organizationMember?.organization) {
    notFound();
  }

  const organization = organizationMember.organization;

  return (
    <div className="space-y-8">
      <PageHeader organizationName={organization.name} />

      <section className="max-w-3xl rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Department Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Create a department to organize procurement activities,
            members, and responsibilities within your organization.
          </p>
        </div>

        <form action={createDepartment} className="space-y-6 p-6">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-semibold text-slate-900"
            >
              Department Name
              <span className="ml-1 text-red-500">*</span>
            </label>

            <p className="mt-1 text-xs text-slate-500">
              Enter the official name of the department.
            </p>

            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="e.g. Procurement and Disposal Unit"
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
            />
          </div>

          <div>
            <label
              htmlFor="code"
              className="block text-sm font-semibold text-slate-900"
            >
              Department Code
            </label>

            <p className="mt-1 text-xs text-slate-500">
              Optional internal code used to identify the department.
            </p>

            <input
              id="code"
              name="code"
              type="text"
              placeholder="e.g. PDU"
              className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm uppercase text-slate-900 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-slate-900"
            >
              Description
            </label>

            <p className="mt-1 text-xs text-slate-500">
              Optional description of the department and its
              responsibilities.
            </p>

            <textarea
              id="description"
              name="description"
              rows={5}
              placeholder="Describe the department's responsibilities..."
              className="mt-2 block w-full resize-y rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
            />
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs text-slate-500">
              Organization
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {organization.name}
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
            <Link
              href="/dashboard/organization/departments"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              Create Department
            </button>
          </div>
        </form>
      </section>

      <section className="max-w-3xl rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-sm font-semibold text-slate-900">
          About Departments
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Departments help your organization separate procurement
          responsibilities and assign members and procurements to
          the appropriate business unit.
        </p>
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
        href="/dashboard/organization/departments"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Departments
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        Create Department
      </h1>

      <p className="mt-1 text-sm text-slate-600">
        Add a new department to {organizationName}.
      </p>
    </div>
  );
}