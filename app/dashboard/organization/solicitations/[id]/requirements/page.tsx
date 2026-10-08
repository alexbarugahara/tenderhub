import { revalidatePath } from "next/cache";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import RequirementForm from "@/components/requirements/RequirementForm";

export const dynamic = "force-dynamic";

interface RequirementsPageProps {
  params: Promise<{
    id: string;
  }>;
}

const REQUIREMENT_TYPE_LABELS: Record<string, string> = {
  ELIGIBILITY: "Eligibility",
  TECHNICAL: "Technical",
  FINANCIAL: "Financial",
  EXPERIENCE: "Experience",
  COMPLIANCE: "Compliance",
  DOCUMENT: "Document",
  GENERAL: "General",
};

export default async function RequirementsPage({
  params,
}: RequirementsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!membership) {
    redirect("/dashboard/organization");
  }

  const solicitation = await prisma.solicitation.findFirst({
    where: {
      id,
      organizationId: membership.organizationId,
    },
    include: {
      procurement: {
        select: {
          id: true,
          referenceNumber: true,
          title: true,
        },
      },
      requirements: {
        where: {
          lotId: null,
        },
        orderBy: [
          {
            sortOrder: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      },
    },
  });

  console.log("REQUIREMENTS DEBUG:", {
    requestedSolicitationId: id,
    userId: session.user.id,
    membershipOrganizationId: membership.organizationId,
    solicitationFound: !!solicitation,
    solicitationOrganizationId: solicitation?.organizationId,
  });

  if (!solicitation) {
    notFound();
  }

  const mandatoryCount = solicitation.requirements.filter(
    (requirement) => requirement.isMandatory,
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link
            href="/dashboard/organization"
            className="hover:text-slate-900"
          >
            Organization
          </Link>

          <span>/</span>

          <Link
            href="/dashboard/organization/solicitations"
            className="hover:text-slate-900"
          >
            Solicitations
          </Link>

          <span>/</span>

          <Link
            href={`/dashboard/organization/solicitations/${solicitation.id}`}
            className="hover:text-slate-900"
          >
            {solicitation.solicitationNumber}
          </Link>

          <span>/</span>

          <span className="font-medium text-slate-900">
            Requirements
          </span>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {solicitation.solicitationNumber}
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Solicitation-wide Requirements
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Define requirements that apply across the entire
              solicitation. Lot-specific requirements are
              configured separately within each lot.
            </p>
          </div>

          <Link
            href={`/dashboard/organization/solicitations/${solicitation.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            ← Back to Solicitation
          </Link>
        </div>

        {/* Solicitation context */}
        <div className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-5 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Solicitation
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {solicitation.solicitationNumber}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {solicitation.title}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Parent Procurement
              </p>

              <Link
                href={`/dashboard/organization/procurements/${solicitation.procurement.id}`}
                className="mt-1 block font-semibold text-slate-900 hover:underline"
              >
                {solicitation.procurement.referenceNumber}
              </Link>

              <p className="mt-1 text-sm text-slate-500">
                {solicitation.procurement.title}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Current Setup
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {solicitation.requirements.length}{" "}
                {solicitation.requirements.length === 1
                  ? "requirement"
                  : "requirements"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {mandatoryCount} mandatory
              </p>
            </div>
          </div>
        </div>

        {/* Scope notice */}
        <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4">
          <p className="text-sm font-semibold text-blue-900">
            Solicitation-wide scope
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-800">
            Requirements added here apply to the solicitation
            as a whole. They are not attached to a specific lot.
            To configure requirements for an individual lot,
            open that lot and select Configure Lot Requirements.
          </p>
        </div>

        {/* Main */}
        <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
          {/* Add */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="font-bold text-slate-900">
                Add Requirement
              </h2>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Add a requirement that every applicable vendor
                must address in their response.
              </p>
            </div>

            <RequirementForm
              solicitationId={solicitation.id}
              lotId={null}
              requirementCount={solicitation.requirements.length}
            />
          </section>

          {/* Existing */}
          <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="font-bold text-slate-900">
                  Solicitation-wide Requirements
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Requirements configured for the entire
                  solicitation.
                </p>
              </div>

              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {solicitation.requirements.length} total
              </div>
            </div>

            {solicitation.requirements.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-500">
                  ✓
                </div>

                <h3 className="mt-4 font-semibold text-slate-900">
                  No solicitation-wide requirements configured
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Use the form to add requirements that apply
                  across the entire solicitation.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {solicitation.requirements.map(
                  (requirement, index) => (
                    <div
                      key={requirement.id}
                      className="p-5"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {requirement.title}
                            </h3>

                            {requirement.isMandatory ? (
                              <span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700">
                                Mandatory
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                                Optional
                              </span>
                            )}
                          </div>

                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span>
                              {REQUIREMENT_TYPE_LABELS[
                                requirement.type
                              ] ?? requirement.type}
                            </span>

                            <span>•</span>

                            <span>
                              Applies to entire solicitation
                            </span>
                          </div>

                          {requirement.description && (
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                              {requirement.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={`/dashboard/organization/solicitations/${solicitation.id}/lots`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Configure Lots →
          </Link>

          <Link
            href={`/dashboard/organization/solicitations/${solicitation.id}/documents`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Upload Documents →
          </Link>

          <Link
            href={`/dashboard/organization/solicitations/${solicitation.id}/evaluation-criteria`}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Configure Evaluation Criteria →
          </Link>
        </div>
      </div>
    </div>
  );
}