import Link from "next/link";

import { auth } from "@/auth";
import ProcurementForm from "@/components/procurement/ProcurementForm";
import { prisma } from "@/lib/db/prisma";

import { createProcurement } from "./actions";

interface NewProcurementPageProps {
  searchParams: Promise<{
    organizationId?: string;
  }>;
}

export default async function NewProcurementPage({
  searchParams,
}: NewProcurementPageProps) {
  const session = await auth();
  const params = await searchParams;

  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="space-y-8">
        <PageHeader />

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-base font-semibold text-red-900">
            Authentication required
          </h2>

          <p className="mt-2 text-sm leading-6 text-red-800">
            You must be signed in to create a procurement.
          </p>
        </div>
      </div>
    );
  }

  const requestedOrganizationId = params.organizationId;

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId,
      ...(requestedOrganizationId
        ? { organizationId: requestedOrganizationId }
        : {}),
    },
    select: {
      organizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      organizationId: "asc",
    },
  });

  if (!membership?.organization) {
    return (
      <div className="space-y-8">
        <PageHeader />

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-base font-semibold text-amber-900">
            Organization not available
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            Your account is not currently associated with an organization
            that you can use to create a procurement.
          </p>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            Contact your organization administrator if you believe this is an
            error.
          </p>
        </div>
      </div>
    );
  }

  const organization = membership.organization;

  const [departments, countries, currencies] = await Promise.all([
    prisma.department.findMany({
      where: {
        organizationId: organization.id,
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
      value: organization.id,
      label: organization.name,
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

  return (
    <div className="space-y-8">
      <PageHeader organizationName={organization.name} />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Procurement Details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the core information for the procurement. You can configure
            solicitations, lots, requirements and documents after the
            procurement record has been created.
          </p>
        </div>

        <div className="p-6">
          <ProcurementForm
            initialValues={{
              organizationId: organization.id,
            }}
            organizationOptions={organizationOptions}
            departmentOptions={departmentOptions}
            countryOptions={countryOptions}
            currencyOptions={currencyOptions}
            submitLabel="Create Procurement"
            cancelLabel="Cancel"
            onSubmit={createProcurement}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          What happens next?
        </h2>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <WorkflowStep
            number="1"
            title="Create"
            description="Create the procurement record with its core planning information."
          />

          <WorkflowStep
            number="2"
            title="Configure"
            description="Add solicitations, lots, requirements and procurement documents."
          />

          <WorkflowStep
            number="3"
            title="Publish"
            description="Prepare and publish the appropriate solicitation for vendors."
          />
        </div>
      </section>

      <div>
        <Link
          href="/dashboard/organization/procurements"
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to Procurements
        </Link>
      </div>
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
        href="/dashboard/organization/procurements"
        className="text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        ← Procurements
      </Link>

      <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        New Procurement
      </h1>

      <p className="mt-1 text-sm text-slate-600">
        {organizationName
          ? `Create a new procurement for ${organizationName}.`
          : "Create a new procurement."}
      </p>
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
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
        {number}
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}