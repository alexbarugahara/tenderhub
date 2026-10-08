import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import SolicitationForm from "@/components/solicitations/SolicitationForm";

interface NewSolicitationPageProps {
  searchParams: Promise<{
    procurementId?: string;
  }>;
}

export default async function NewSolicitationPage({
  searchParams,
}: NewSolicitationPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const { procurementId } = await searchParams;

  /*
   * Resolve the authenticated user's organization through
   * OrganizationMember.
   */
  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      organizationId: true,
    },
  });

  if (!membership) {
    notFound();
  }

  /*
   * STEP 1
   *
   * No Procurement has been selected yet.
   * Show the user's available Procurements.
   */
  if (!procurementId) {
    const procurements = await prisma.procurement.findMany({
      where: {
        organizationId: membership.organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        referenceNumber: true,
        title: true,
        status: true,
        procurementMethod: true,
        estimatedValue: true,
        currency: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
      },
    });

    return (
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link
              href="/dashboard/organization/solicitations"
              className="hover:text-tenderhub-navy"
            >
              Solicitations
            </Link>

            <span>/</span>

            <span className="text-slate-700">New Solicitation</span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Create New Solicitation
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              First select the Procurement under which you want to create the
              solicitation.
            </p>
          </div>
        </div>

        {/* Procurement Selection */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Select Procurement
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              A solicitation must belong to an existing Procurement.
            </p>
          </div>

          {procurements.length === 0 ? (
            <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <h3 className="text-base font-semibold text-slate-900">
                No Procurements Available
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                You need to create a Procurement before you can create a
                Solicitation.
              </p>

              <div className="mt-5">
                <Link
                  href="/dashboard/organization/procurements/new"
                  className="inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                >
                  Create Procurement
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {procurements.map((procurement) => (
                <div
                  key={procurement.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-tenderhub-gold/60 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {procurement.referenceNumber}
                      </p>

                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {procurement.title}
                      </h3>

                      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                        <span>
                          <span className="font-medium text-slate-700">
                            Status:
                          </span>{" "}
                          {procurement.status}
                        </span>

                        <span>
                          <span className="font-medium text-slate-700">
                            Method:
                          </span>{" "}
                          {procurement.procurementMethod}
                        </span>

                        {procurement.currency && (
                          <span>
                            <span className="font-medium text-slate-700">
                              Currency:
                            </span>{" "}
                            {procurement.currency.code}
                            {procurement.currency.name
                              ? ` — ${procurement.currency.name}`
                              : ""}
                          </span>
                        )}

                        {procurement.estimatedValue !== null &&
                          procurement.estimatedValue !== undefined && (
                            <span>
                              <span className="font-medium text-slate-700">
                                Estimated Value:
                              </span>{" "}
                              {procurement.currency?.code
                                ? `${procurement.currency.code} `
                                : ""}
                              {procurement.estimatedValue.toLocaleString()}
                            </span>
                          )}
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Link
                        href={`/dashboard/organization/solicitations/new?procurementId=${procurement.id}`}
                        className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                      >
                        Select Procurement
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Back */}
        <div>
          <Link
            href="/dashboard/organization/solicitations"
            className="text-sm font-medium text-slate-600 hover:text-tenderhub-navy"
          >
            ← Back to Solicitations
          </Link>
        </div>
      </div>
    );
  }

  /*
   * STEP 2
   *
   * A Procurement has now been selected.
   * Load only that Procurement belonging to the user's organization.
   */
  const procurement = await prisma.procurement.findFirst({
    where: {
      id: procurementId,
      organizationId: membership.organizationId,
    },
    select: {
      id: true,
      referenceNumber: true,
      title: true,
      status: true,
      procurementMethod: true,
      estimatedValue: true,
      currency: {
        select: {
          id: true,
          code: true,
          name: true,
        },
      },
    },
  });

  if (!procurement) {
    notFound();
  }

  /*
   * A Solicitation must inherit its currency from the Procurement.
   */
  if (!procurement.currency) {
    throw new Error(
      "The selected Procurement does not have a currency configured.",
    );
  }

  /*
   * Prisma Decimal values cannot be passed directly to Client Components.
   * Convert estimatedValue to a plain number first.
   */
  const procurementForForm = {
    id: procurement.id,
    referenceNumber: procurement.referenceNumber,
    title: procurement.title,
    status: procurement.status,
    procurementMethod: procurement.procurementMethod,
    estimatedValue:
      procurement.estimatedValue !== null
        ? Number(procurement.estimatedValue)
        : null,
    currency: {
      id: procurement.currency.id,
      code: procurement.currency.code,
      name: procurement.currency.name,
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link
            href="/dashboard/organization/solicitations"
            className="hover:text-tenderhub-navy"
          >
            Solicitations
          </Link>

          <span>/</span>

          <Link
            href="/dashboard/organization/solicitations/new"
            className="hover:text-tenderhub-navy"
          >
            New Solicitation
          </Link>

          <span>/</span>

          <span className="text-slate-700">Details</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create New Solicitation
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Create a solicitation under the selected Procurement. The
            solicitation inherits its currency from the Procurement.
          </p>
        </div>
      </div>

      {/* Selected Procurement */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Procurement
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            This solicitation will be created under the selected Procurement.
          </p>
        </div>

        <div className="mt-5 rounded-lg border border-tenderhub-gold/30 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Selected Procurement
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-900">
            {procurement.referenceNumber} — {procurement.title}
          </p>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
            <span>
              <span className="font-medium text-slate-700">Method:</span>{" "}
              {procurement.procurementMethod}
            </span>

            <span>
              <span className="font-medium text-slate-700">Currency:</span>{" "}
              {procurement.currency.code}
              {procurement.currency.name
                ? ` — ${procurement.currency.name}`
                : ""}
            </span>

            {procurement.estimatedValue !== null &&
              procurement.estimatedValue !== undefined && (
                <span>
                  <span className="font-medium text-slate-700">
                    Estimated Value:
                  </span>{" "}
                  {procurement.currency.code}{" "}
                  {Number(procurement.estimatedValue).toLocaleString()}
                </span>
              )}
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Procurement Method, Estimated Value, Currency, and Organization
            are inherited from the Procurement and cannot be changed at
            solicitation level.
          </p>

          <div className="mt-4">
            <Link
              href="/dashboard/organization/solicitations/new"
              className="text-sm font-medium text-tenderhub-navy hover:underline"
            >
              ← Choose a different Procurement
            </Link>
          </div>
        </div>
      </section>

      {/* Solicitation Form */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Solicitation Details
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the core details, solicitation type, dates, value, and
            optional financial requirements.
          </p>
        </div>

        <SolicitationForm
          procurement={procurementForForm}
          initialValues={{
            procurementId: procurement.id,
          }}
        />
      </section>
    </div>
  );
}