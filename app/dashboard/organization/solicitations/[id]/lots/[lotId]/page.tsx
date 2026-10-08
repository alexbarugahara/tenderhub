import Link from "next/link";
import { notFound } from "next/navigation";

import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

interface LotDetailsPageProps {
  params: Promise<{
    id: string;
    lotId: string;
  }>;
}

export default async function LotDetailsPage({
  params,
}: LotDetailsPageProps) {
  const {
    id: solicitationId,
    lotId,
  } = await params;

  const lot = await prisma.lot.findFirst({
    where: {
      id: lotId,
      solicitationId,
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
      evaluationCriteria: {
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

  const solicitation = lot.solicitation;

  const currencyCode =
    solicitation.procurement.currency?.code ?? "";

  const evaluationCriteriaTotal =
    lot.evaluationCriteria.reduce(
      (sum, criterion) =>
        sum + Number(criterion.weight),
      0
    );

  const evaluationCriteriaReady =
    lot.evaluationCriteria.length > 0 &&
    Math.abs(evaluationCriteriaTotal - 100) < 0.0001;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}/lots`}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Lots
          </Link>

          <h1 className="mt-3 text-2xl font-semibold text-gray-900">
            Lot {lot.number}: {lot.title}
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            {solicitation.procurement.referenceNumber} -{" "}
            {solicitation.title}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {solicitation.status === "DRAFT" && (
            <Link
              href={`/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}/edit`}
            >
              <Button variant="primary">
                Edit Lot
              </Button>
            </Link>
          )}

          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}`}
          >
            <Button variant="secondary">
              View Solicitation
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Lot Status
            </p>

            <div className="mt-1">
              <Badge>{lot.status}</Badge>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Lot Number
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {lot.number}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">
              Currency
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {currencyCode || "Not specified"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900">
          Lot Details
        </h2>

        <div className="mt-4 space-y-5">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Title
            </p>

            <p className="mt-1 text-gray-900">
              {lot.title}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              Description
            </p>

            <p className="mt-1 whitespace-pre-wrap text-gray-900">
              {lot.description ||
                "No description provided."}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-500">
              Estimated Value
            </p>

            <p className="mt-1 text-gray-900">
              {lot.estimatedValue !== null &&
              lot.estimatedValue !== undefined
                ? `${currencyCode} ${Number(
                    lot.estimatedValue
                  ).toLocaleString()}`
                : "Not specified"}
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Lot Requirements
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Requirements specifically associated with
              Lot {lot.number}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-500">
              {lot.requirements.length}{" "}
              {lot.requirements.length === 1
                ? "requirement"
                : "requirements"}
            </span>

            <Link
              href={`/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}/requirements`}
            >
              <Button variant="primary">
                Configure Lot Requirements
              </Button>
            </Link>
          </div>
        </div>

        {lot.requirements.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-gray-600">
              No requirements have been assigned to this
              lot.
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Use Configure Lot Requirements to add them.
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
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {requirement.title}
                      </h3>

                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {requirement.type}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-gray-600">
                      {requirement.description ||
                        "No description provided."}
                    </p>
                  </div>

                  {requirement.isMandatory && (
                    <Badge>Mandatory</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Lot Evaluation Criteria
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              Evaluation criteria specifically associated
              with Lot {lot.number}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {lot.evaluationCriteria.length}{" "}
                {lot.evaluationCriteria.length === 1
                  ? "criterion"
                  : "criteria"}
              </span>

              <Badge>
                {evaluationCriteriaTotal.toFixed(2)}%
              </Badge>
            </div>

            <Link
              href={`/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}/evaluation-criteria`}
            >
              <Button variant="primary">
                Configure Lot Evaluation Criteria
              </Button>
            </Link>
          </div>
        </div>

        {lot.evaluationCriteria.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-sm text-gray-600">
              No evaluation criteria have been configured
              for this lot.
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Use Configure Lot Evaluation Criteria to add
              them.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 space-y-3">
              {lot.evaluationCriteria.map((criterion) => (
                <div
                  key={criterion.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-gray-900">
                          {criterion.name}
                        </h3>

                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          Order {criterion.sortOrder}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-gray-600">
                        {criterion.description ||
                          "No description provided."}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {Number(
                          criterion.weight
                        ).toFixed(2)}
                        %
                      </p>

                      <p className="text-xs text-gray-500">
                        Max score{" "}
                        {Number(
                          criterion.maxScore
                        ).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className={`mt-5 rounded-lg border p-4 ${
                evaluationCriteriaReady
                  ? "border-green-200 bg-green-50"
                  : "border-amber-200 bg-amber-50"
              }`}
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Weight Allocation
                  </p>

                  <p className="text-sm text-gray-600">
                    Evaluation criteria must total exactly
                    100%.
                  </p>
                </div>

                <div className="text-lg font-semibold text-gray-900">
                  {evaluationCriteriaTotal.toFixed(2)}%
                </div>
              </div>

              <p
                className={`mt-2 text-sm ${
                  evaluationCriteriaReady
                    ? "text-green-700"
                    : "text-amber-700"
                }`}
              >
                {evaluationCriteriaReady
                  ? "The lot evaluation criteria are fully weighted."
                  : "The lot evaluation criteria are not yet fully weighted."}
              </p>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}