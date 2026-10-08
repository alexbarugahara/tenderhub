import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import RequirementForm from "@/components/requirements/RequirementForm";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

interface LotRequirementsPageProps {
  params: Promise<{
    id: string;
    lotId: string;
  }>;
}

export default async function LotRequirementsPage({
  params,
}: LotRequirementsPageProps) {
  const {
    id: solicitationId,
    lotId,
  } = await params;

  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
    },
    select: {
      organizationId: true,
    },
  });

  if (!membership) {
    redirect("/dashboard");
  }

  const lot = await prisma.lot.findFirst({
    where: {
      id: lotId,
      solicitationId,
      solicitation: {
        organizationId: membership.organizationId,
      },
    },
    include: {
      solicitation: {
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,
          procurement: {
            select: {
              referenceNumber: true,
              title: true,
            },
          },
        },
      },
      requirements: {
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

  if (!lot) {
    notFound();
  }

  const mandatoryCount = lot.requirements.filter(
    (requirement) => requirement.isMandatory,
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href={`/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Back to Lot
        </Link>

        <div className="mt-3">
          <p className="text-sm font-medium text-gray-500">
            {lot.solicitation.solicitationNumber}
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-gray-900">
            Lot {lot.number}: Requirements
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Configure requirements that apply specifically to this lot.
          </p>
        </div>
      </div>

      {/* Lot Context */}
      <Card>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Lot Context
          </h2>

          <p className="text-sm text-gray-600">
            Solicitation:{" "}
            <span className="font-medium text-gray-900">
              {lot.solicitation.solicitationNumber}
            </span>{" "}
            — {lot.solicitation.title}
          </p>

          <p className="text-sm text-gray-600">
            Parent Procurement:{" "}
            <span className="font-medium text-gray-900">
              {lot.solicitation.procurement.referenceNumber}
            </span>{" "}
            — {lot.solicitation.procurement.title}
          </p>

          <p className="text-sm text-gray-600">
            Lot:{" "}
            <span className="font-medium text-gray-900">
              Lot {lot.number} — {lot.title}
            </span>
          </p>
        </div>
      </Card>

      {/* Add Requirement */}
      {lot.solicitation.status === "DRAFT" ? (
        <Card>
          <div className="border-b border-gray-200">
            <div className="px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Add Lot Requirement
              </h2>

              <p className="mt-1 text-sm text-gray-600">
                Add a requirement that applies specifically to Lot{" "}
                {lot.number}.
              </p>
            </div>
          </div>

          <RequirementForm
            solicitationId={lot.solicitation.id}
            lotId={lot.id}
            requirementCount={lot.requirements.length}
          />
        </Card>
      ) : (
        <Card>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
            This solicitation is no longer in Draft status. Lot
            requirements can no longer be added.
          </div>
        </Card>
      )}

      {/* Existing Lot Requirements */}
      <Card>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Lot Requirements
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Requirements specifically associated with Lot{" "}
              {lot.number}.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            {lot.requirements.length}{" "}
            {lot.requirements.length === 1
              ? "requirement"
              : "requirements"}{" "}
            · {mandatoryCount} mandatory
          </div>
        </div>

        {lot.requirements.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-gray-600">
              No requirements have been configured for this lot yet.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {lot.requirements.map((requirement) => (
              <div
                key={requirement.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {requirement.title}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {requirement.type}
                      </span>

                      {requirement.isMandatory && (
                        <Badge>Mandatory</Badge>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {requirement.description ||
                        "No description provided."}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}