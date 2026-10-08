import Link from "next/link";
import { notFound } from "next/navigation";

import EditProcurementForm from "./EditProcurementForm";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface EditProcurementPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProcurementPage({
  params,
}: EditProcurementPageProps) {
  const { id } = await params;

  const procurement = await prisma.procurement.findUnique({
    where: { id },
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
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!procurement) {
    notFound();
  }

  const [departments, countries, currencies] = await Promise.all([
    prisma.department.findMany({
      where: {
        organizationId: procurement.organizationId,
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.country.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.currency.findMany({
      select: {
        id: true,
        code: true,
        name: true,
      },
      orderBy: {
        code: "asc",
      },
    }),
  ]);

  const organizationOptions = [
    {
      value: procurement.organization.id,
      label: procurement.organization.name,
    },
  ];

  const departmentOptions = departments.map((department) => ({
    value: department.id,
    label: department.code
      ? `${department.name} (${department.code})`
      : department.name,
  }));

  const countryOptions = countries.map((country) => ({
    value: country.id,
    label: `${country.name} (${country.code})`,
  }));

  const currencyOptions = currencies.map((currency) => ({
    value: currency.id,
    label: `${currency.code} — ${currency.name}`,
  }));

  const initialValues = {
    organizationId: procurement.organizationId,
    departmentId: procurement.departmentId ?? "",
    countryId: procurement.countryId ?? "",
    currencyId: procurement.currencyId ?? "",
    title: procurement.title,
    description: procurement.description ?? "",
    referenceNumber: procurement.referenceNumber,
    status: procurement.status,
    procurementMethod: procurement.procurementMethod,
    estimatedValue:
      procurement.estimatedValue !== null
        ? procurement.estimatedValue.toString()
        : "",
    plannedStartDate: procurement.plannedStartDate
      ? procurement.plannedStartDate.toISOString().split("T")[0]
      : "",
    plannedEndDate: procurement.plannedEndDate
      ? procurement.plannedEndDate.toISOString().split("T")[0]
      : "",
  };

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/dashboard/organization/procurements/${procurement.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Procurement Details
        </Link>

        <div className="mt-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Edit Procurement
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            Update the core information for {procurement.title}.
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Reference: {procurement.referenceNumber}
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Procurement Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Update the planning and identification details for this
            procurement.
          </p>
        </div>

        <div className="p-6">
          <EditProcurementForm
            procurementId={procurement.id}
            initialValues={initialValues}
            organizationOptions={organizationOptions}
            departmentOptions={departmentOptions}
            countryOptions={countryOptions}
            currencyOptions={currencyOptions}
          />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/dashboard/organization/procurements/${procurement.id}`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          Cancel
        </Link>

        <Link
          href={`/dashboard/organization/procurements/${procurement.id}/lots`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Manage Lots
        </Link>

        <Link
          href={`/dashboard/organization/procurements/${procurement.id}/requirements`}
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Manage Requirements
        </Link>
      </div>
    </div>
  );
}

