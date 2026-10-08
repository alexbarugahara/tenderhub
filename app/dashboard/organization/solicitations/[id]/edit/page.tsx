import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import EditSolicitationForm from "./EditSolicitationForm";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDateTimeLocal(date: Date | null | undefined) {
  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatAmount(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "";
  }

  return amount.toString();
}

export default async function EditSolicitationPage({
  params,
}: PageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const { id } = await params;

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
    },
    select: {
      organizationId: true,
    },
  });

  if (!membership) {
    notFound();
  }

  const solicitation = await prisma.solicitation.findFirst({
    where: {
      id,
      organizationId: membership.organizationId,
    },
    select: {
      id: true,
      solicitationNumber: true,
      title: true,
      description: true,
      status: true,
      type: true,
      openingDate: true,
      closingDate: true,
      bidSecurityRequired: true,
      bidSecurityAmount: true,
      applicationFeeRequired: true,
      applicationFeeAmount: true,

      procurement: {
        select: {
          id: true,
          title: true,
          referenceNumber: true,
          procurementMethod: true,
          estimatedValue: true,

          currency: {
            select: {
              id: true,
              code: true,
              name: true,
              symbol: true,
            },
          },
        },
      },
    },
  });

  if (!solicitation) {
    notFound();
  }

  /*
   * Core solicitation editing is intended for drafts.
   * Published/open solicitations should use the appropriate
   * workflow actions rather than unrestricted editing.
   */
  if (solicitation.status !== "DRAFT") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link
            href="/dashboard/organization"
            className="hover:text-tenderhub-navy"
          >
            Organization
          </Link>

          <span>/</span>

          <Link
            href="/dashboard/organization/solicitations"
            className="hover:text-tenderhub-navy"
          >
            Solicitations
          </Link>

          <span>/</span>

          <Link
            href={`/dashboard/organization/solicitations/${solicitation.id}`}
            className="hover:text-tenderhub-navy"
          >
            {solicitation.solicitationNumber}
          </Link>

          <span>/</span>

          <span className="text-slate-700">Edit</span>
        </div>

        <section className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-lg font-bold text-amber-900">
            Solicitation cannot be edited
          </h1>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            This solicitation is no longer in Draft status. Core solicitation
            details should not be changed through the draft editor.
          </p>

          <div className="mt-5">
            <Link
              href={`/dashboard/organization/solicitations/${solicitation.id}`}
              className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              Back to Solicitation
            </Link>
          </div>
        </section>
      </div>
    );
  }

  const currencyLabel = solicitation.procurement.currency
    ? `${solicitation.procurement.currency.code} — ${solicitation.procurement.currency.name}${
        solicitation.procurement.currency.symbol
          ? ` (${solicitation.procurement.currency.symbol})`
          : ""
      }`
    : "Not specified";

  return (
    <div className="space-y-8">
      {/* Breadcrumbs */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link
          href="/dashboard/organization"
          className="hover:text-tenderhub-navy"
        >
          Organization
        </Link>

        <span>/</span>

        <Link
          href="/dashboard/organization/solicitations"
          className="hover:text-tenderhub-navy"
        >
          Solicitations
        </Link>

        <span>/</span>

        <Link
          href={`/dashboard/organization/solicitations/${solicitation.id}`}
          className="hover:text-tenderhub-navy"
        >
          {solicitation.solicitationNumber}
        </Link>

        <span>/</span>

        <span className="text-slate-700">Edit</span>
      </div>

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Edit Solicitation
          </h1>

          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
            Draft
          </span>
        </div>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Update the solicitation-specific information. Procurement context
          remains inherited from the parent procurement.
        </p>
      </div>

      {/* Parent Procurement */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Parent Procurement
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {solicitation.procurement.title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              These values are inherited and are not edited here.
            </p>
          </div>

          <Link
            href={`/dashboard/organization/procurements/${solicitation.procurement.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Open Procurement
          </Link>
        </div>

        <div className="mt-5 grid gap-5 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoItem
            label="Procurement Reference"
            value={solicitation.procurement.referenceNumber}
          />

          <InfoItem
            label="Procurement Method"
            value={solicitation.procurement.procurementMethod}
          />

          <InfoItem
            label="Estimated Value"
            value={formatAmount(solicitation.procurement.estimatedValue)}
          />

          <InfoItem
            label="Currency"
            value={currencyLabel}
          />
        </div>
      </section>

      {/* Solicitation Form */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Solicitation Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            These are the core details specific to this solicitation.
          </p>
        </div>

        <EditSolicitationForm
          solicitationId={solicitation.id}
          initialValues={{
            solicitationNumber: solicitation.solicitationNumber,
            title: solicitation.title,
            description: solicitation.description ?? "",
            type: solicitation.type,
            openingDate: formatDateTimeLocal(
              solicitation.openingDate,
            ),
            closingDate: formatDateTimeLocal(
              solicitation.closingDate,
            ),
            bidSecurityRequired:
              solicitation.bidSecurityRequired,
            bidSecurityAmount: formatAmount(
              solicitation.bidSecurityAmount,
            ),
            applicationFeeRequired:
              solicitation.applicationFeeRequired,
            applicationFeeAmount: formatAmount(
              solicitation.applicationFeeAmount,
            ),
          }}
        />
      </section>
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
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium leading-6 text-slate-800">
        {value}
      </p>
    </div>
  );
}