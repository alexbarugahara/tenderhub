import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Card from "@/components/ui/Card";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import EvaluationCriteriaClient from "./EvaluationCriteriaClient";

export const dynamic = "force-dynamic";

interface LotEvaluationCriteriaPageProps {
  params: Promise<{
    id: string;
    lotId: string;
  }>;
}

export default async function LotEvaluationCriteriaPage({
  params,
}: LotEvaluationCriteriaPageProps) {
  const { id: solicitationId, lotId } = await params;

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
        include: {
          procurement: {
            include: {
              currency: true,
            },
          },
        },
      },
    },
  });

  if (!lot) {
    notFound();
  }

  const criteria = await prisma.evaluationCriterion.findMany({
    where: {
      lotId,
      solicitationId: null,
    },
    orderBy: [
      {
        sortOrder: "asc",
      },
      {
        createdAt: "asc",
      },
    ],
  });

  const totalWeight = criteria.reduce(
    (total, criterion) => total + Number(criterion.weight),
    0,
  );

  const isComplete = Math.abs(totalWeight - 100) < 0.0001;

  const solicitation = lot.solicitation;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href={`/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}`}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          Back to Lot
        </Link>
      </div>

      {/* Header */}
      <section>
        <p className="text-sm font-medium text-tenderhub-gold">
          Lot {lot.number}
        </p>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
          Evaluation Criteria
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
          Configure how bids for this lot will be evaluated. These criteria
          apply only to this lot and are separate from the solicitation-level
          evaluation criteria.
        </p>
      </section>

      {/* Lot Information */}
      <Card>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Lot
            </p>

            <p className="mt-1 text-lg font-semibold text-gray-900">
              Lot {lot.number}: {lot.title}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Solicitation
              </p>

              <p className="mt-1 text-sm font-medium text-gray-900">
                {solicitation.procurement.referenceNumber}
              </p>

              <p className="mt-1 text-sm text-gray-600">
                {solicitation.title}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </p>

              <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                {solicitation.status}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Criteria Management */}
      <EvaluationCriteriaClient
        solicitationId={solicitationId}
        lotId={lotId}
        initialCriteria={criteria.map((criterion) => ({
          id: criterion.id,
          name: criterion.name,
          description: criterion.description,
          weight: Number(criterion.weight),
          maxScore: Number(criterion.maxScore),
          sortOrder: criterion.sortOrder,
        }))}
        initialTotalWeight={totalWeight}
        initialIsComplete={isComplete}
        isDraft={solicitation.status === "DRAFT"}
      />
    </div>
  );
}