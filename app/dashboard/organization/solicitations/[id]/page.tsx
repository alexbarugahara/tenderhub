import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import SolicitationWorkflow from "@/components/solicitations/SolicitationWorkflow";
import PublishSolicitationButton from "@/components/solicitations/PublishSolicitationButton";
import {
  getSolicitationTypeConfig,
  getSolicitationTypeLabel,
} from "@/lib/solicitations/types";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: Date | null | undefined) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(date: Date | null | undefined) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAmount(value: unknown) {
  if (value === null || value === undefined) {
    return "Not specified";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not specified";
  }

  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatScore(value: unknown) {
  const score = Number(value);

  if (!Number.isFinite(score)) {
    return "0.00";
  }

  return score.toFixed(2);
}

function getStatusClasses(status: string) {
  switch (status) {
    case "OPEN":
    case "PUBLISHED":
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700";

    case "DRAFT":
    case "PENDING":
    case "UNDER_EVALUATION":
    case "PENDING_SIGNATURE":
      return "bg-amber-50 text-amber-700";

    case "CLOSED":
    case "COMPLETED":
    case "AWARDED":
    case "APPROVED":
    case "ACCEPTED":
      return "bg-blue-50 text-blue-700";

    case "CANCELLED":
    case "SUSPENDED":
    case "REJECTED":
    case "DECLINED":
    case "TERMINATED":
      return "bg-red-50 text-red-700";

    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default async function OrganizationSolicitationDetailsPage({
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
      publishedAt: true,
      openingDate: true,
      closingDate: true,
      bidSecurityRequired: true,
      bidSecurityAmount: true,
      applicationFeeRequired: true,
      applicationFeeAmount: true,
      createdAt: true,
      updatedAt: true,

      /*
       * Parent Procurement
       *
       * Only the minimum context needed to identify
       * the parent procurement is displayed here.
       *
       * Procurement-specific details remain on the
       * Procurement page.
       */
      procurement: {
        select: {
          id: true,
          title: true,
          referenceNumber: true,
        },
      },

      /*
       * Lots
       */
      lots: {
        select: {
          id: true,
          number: true,
          title: true,
          description: true,
          estimatedValue: true,
          status: true,
          createdAt: true,
          updatedAt: true,

          bids: {
            select: {
              id: true,
              status: true,
              totalAmount: true,
              submittedAt: true,
            },
          },

          /*
           * Used only to calculate the number of
           * lot-specific requirements.
           */
          requirements: {
            select: {
              id: true,
              isMandatory: true,
            },
          },
        },

        orderBy: {
          number: "asc",
        },
      },

      /*
       * Solicitation-wide requirements.
       *
       * lotId === null means the requirement applies
       * to the entire solicitation.
       */
      requirements: {
        where: {
          lotId: null,
        },

        select: {
          id: true,
          title: true,
          description: true,
          type: true,
          isMandatory: true,
          sortOrder: true,
          createdAt: true,
        },

        orderBy: {
          sortOrder: "asc",
        },
      },

      /*
       * Documents
       */
      documents: {
        select: {
          id: true,
          name: true,
          category: true,
          fileUrl: true,
          mimeType: true,
          fileSize: true,
          version: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "asc",
        },
      },

      /*
       * Evaluation criteria
       */
      evaluationCriteria: {
        select: {
          id: true,
          name: true,
          description: true,
          weight: true,
          maxScore: true,
          sortOrder: true,
          createdAt: true,
        },

        orderBy: {
          sortOrder: "asc",
        },
      },

      /*
       * Bids
       */
      bids: {
        select: {
          id: true,
          bidNumber: true,
          status: true,
          title: true,
          summary: true,
          totalAmount: true,
          submittedAt: true,
          lockedAt: true,
          createdAt: true,

          vendor: {
            select: {
              id: true,
              companyName: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      },

      /*
       * Awards
       */
      awards: {
        select: {
          id: true,
          awardNumber: true,
          status: true,
          awardAmount: true,
          awardDate: true,
          notes: true,

          vendor: {
            select: {
              id: true,
              companyName: true,
            },
          },

          bid: {
            select: {
              id: true,
              bidNumber: true,
            },
          },

          lot: {
            select: {
              id: true,
              number: true,
              title: true,
            },
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      },

      /*
       * Notices
       */
      notices: {
        select: {
          id: true,
          title: true,
          type: true,
          publishedAt: true,
          createdAt: true,
        },

        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!solicitation) {
    notFound();
  }

  const typeConfig = getSolicitationTypeConfig(solicitation.type);

  const typeCode = typeConfig?.shortLabel ?? solicitation.type;

  const typeName =
    typeConfig?.label ?? getSolicitationTypeLabel(solicitation.type);

  const typeDescription =
    typeConfig?.description ?? "Procurement solicitation.";

  const solicitationTypeDisplay = `${typeCode} — ${typeName}`;

  const submittedBids = solicitation.bids.filter(
    (bid) => bid.submittedAt !== null,
  );

  const awardedBids = solicitation.bids.filter(
    (bid) => bid.status === "AWARDED",
  );

  const mandatorySolicitationRequirements =
    solicitation.requirements.filter(
      (requirement) => requirement.isMandatory,
    );

  const totalLotRequirements = solicitation.lots.reduce(
    (total, lot) => total + lot.requirements.length,
    0,
  );

  const mandatoryLotRequirements = solicitation.lots.reduce(
    (total, lot) =>
      total +
      lot.requirements.filter((requirement) => requirement.isMandatory)
        .length,
    0,
  );

  const totalRequirements =
    solicitation.requirements.length + totalLotRequirements;

  const totalMandatoryRequirements =
    mandatorySolicitationRequirements.length + mandatoryLotRequirements;

  const totalLotValue = solicitation.lots.reduce(
    (total, lot) =>
      total + (lot.estimatedValue ? Number(lot.estimatedValue) : 0),
    0,
  );

  const totalBidValue = submittedBids.reduce(
    (total, bid) => total + Number(bid.totalAmount),
    0,
  );

  const totalAwardValue = solicitation.awards.reduce(
    (total, award) => total + Number(award.awardAmount),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
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

        <span className="text-slate-700">
          {solicitation.solicitationNumber}
        </span>
      </div>

      {/* Solicitation Header */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {solicitation.title}
              </h1>

              <StatusBadge status={solicitation.status} />
            </div>

            <p className="mt-2 text-sm font-bold text-tenderhub-navy">
              {solicitationTypeDisplay}
            </p>

            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
              {solicitation.description || typeDescription}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            {solicitation.status === "DRAFT" ? (
              <>
                <Link
                  href={`/dashboard/organization/solicitations/${solicitation.id}/edit`}
                  className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
                >
                  Edit Solicitation
                </Link>

                <PublishSolicitationButton
                  solicitationId={solicitation.id}
                />
              </>
            ) : null}

            <Link
              href="/dashboard/organization/solicitations"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              All Solicitations
            </Link>
          </div>
        </div>

        {/* Compact Parent Procurement Reference */}
        <div className="mt-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Parent Procurement
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              {solicitation.procurement.referenceNumber}
              <span className="mx-2 text-slate-400">—</span>
              {solicitation.procurement.title}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Procurement details are managed from the Procurement module.
            </p>
          </div>

          <Link
            href={`/dashboard/organization/procurements/${solicitation.procurement.id}`}
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Procurement
          </Link>
        </div>
      </section>

      {/* Draft Preparation */}
      <section className="rounded-xl border border-tenderhub-gold/30 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/70 px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-tenderhub-navy">
                Draft Preparation
              </h2>

              {solicitation.status === "DRAFT" ? (
                <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  Draft
                </span>
              ) : null}
            </div>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              Prepare this solicitation before publishing. Configure its
              requirements, lots, documents, and evaluation criteria.
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
          <DraftPreparationCard
            number="01"
            title="Configure Requirements"
            description={
              solicitation.requirements.length > 0
                ? `${solicitation.requirements.length} solicitation-wide requirement${
                    solicitation.requirements.length === 1 ? "" : "s"
                  } configured`
                : "Define requirements that apply across the solicitation."
            }
            href={`/dashboard/organization/solicitations/${solicitation.id}/requirements`}
            configured={solicitation.requirements.length > 0}
          />

          <DraftPreparationCard
            number="02"
            title="Configure Lots"
            description={
              solicitation.lots.length > 0
                ? `${solicitation.lots.length} lot${
                    solicitation.lots.length === 1 ? "" : "s"
                  } configured`
                : "Divide the solicitation into lots."
            }
            href={`/dashboard/organization/solicitations/${solicitation.id}/lots`}
            configured={solicitation.lots.length > 0}
          />

          <DraftPreparationCard
            number="03"
            title="Upload Documents"
            description={
              solicitation.documents.length > 0
                ? `${solicitation.documents.length} document${
                    solicitation.documents.length === 1 ? "" : "s"
                  } attached`
                : "Attach solicitation and supporting documents."
            }
            href={`/dashboard/organization/solicitations/${solicitation.id}/documents`}
            configured={solicitation.documents.length > 0}
          />

          <DraftPreparationCard
            number="04"
            title="Configure Evaluation Criteria"
            description={
              solicitation.evaluationCriteria.length > 0
                ? `${solicitation.evaluationCriteria.length} evaluation criteria configured`
                : "Define how responses will be evaluated."
            }
            href={`/dashboard/organization/solicitations/${solicitation.id}/evaluation-criteria`}
            configured={solicitation.evaluationCriteria.length > 0}
          />
        </div>
      </section>

      {/* Solicitation Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <MetricCard
          label="Bids"
          value={solicitation.bids.length.toString()}
          detail={`${submittedBids.length} submitted`}
        />

        <MetricCard
          label="Lots"
          value={solicitation.lots.length.toString()}
          detail="Configured lots"
        />

        <MetricCard
          label="Requirements"
          value={totalRequirements.toString()}
          detail={`${totalMandatoryRequirements} mandatory`}
        />

        <MetricCard
          label="Documents"
          value={solicitation.documents.length.toString()}
          detail="Attached documents"
        />

        <MetricCard
          label="Criteria"
          value={solicitation.evaluationCriteria.length.toString()}
          detail="Evaluation criteria"
        />

        <MetricCard
          label="Awards"
          value={solicitation.awards.length.toString()}
          detail={`${awardedBids.length} awarded bids`}
        />
      </div>

      {/* Solicitation Information */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Solicitation Information
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Core details specific to this solicitation.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Solicitation Number"
            value={solicitation.solicitationNumber}
          />

          <InfoItem
            label="Solicitation Type"
            value={solicitationTypeDisplay}
          />

          <InfoItem
            label="Status"
            value={formatLabel(solicitation.status)}
          />

          <InfoItem
            label="Opening Date"
            value={formatDate(solicitation.openingDate)}
          />

          <InfoItem
            label="Closing Date"
            value={formatDate(solicitation.closingDate)}
          />

          <InfoItem
            label="Published"
            value={formatDate(solicitation.publishedAt)}
          />

          <InfoItem
            label="Created"
            value={formatDate(solicitation.createdAt)}
          />

          <InfoItem
            label="Last Updated"
            value={formatDate(solicitation.updatedAt)}
          />
        </div>
      </section>

      {/* Schedule + Financial Settings */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Schedule</h2>

          <div className="mt-5 space-y-4">
            <TimelineItem
              title="Created"
              date={solicitation.createdAt}
              description="Solicitation record created."
            />

            <TimelineItem
              title="Published"
              date={solicitation.publishedAt}
              description="Opportunity publication date."
            />

            <TimelineItem
              title="Opening"
              date={solicitation.openingDate}
              description="Bid or response opening date and time."
            />

            <TimelineItem
              title="Closing"
              date={solicitation.closingDate}
              description="Submission closing date and time."
            />

            <TimelineItem
              title="Last Updated"
              date={solicitation.updatedAt}
              description="Most recent record update."
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Financial Settings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Financial settings specific to this solicitation.
          </p>

          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <InfoItem
              label="Bid Security"
              value={
                solicitation.bidSecurityRequired
                  ? formatAmount(solicitation.bidSecurityAmount)
                  : "Not required"
              }
            />

            <InfoItem
              label="Application Fee"
              value={
                solicitation.applicationFeeRequired
                  ? formatAmount(solicitation.applicationFeeAmount)
                  : "Not required"
              }
            />

            <InfoItem
              label="Total Lot Value"
              value={formatAmount(totalLotValue)}
            />

            <InfoItem
              label="Submitted Bid Value"
              value={formatAmount(totalBidValue)}
            />

            <InfoItem
              label="Award Value"
              value={formatAmount(totalAwardValue)}
            />
          </div>
        </div>
      </section>

      {/* Lots */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          title="Lots"
          description="Lots configured under this solicitation."
          count={solicitation.lots.length}
        />

        {solicitation.lots.length === 0 ? (
          <EmptySection message="No lots have been configured for this solicitation." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Lot</TableHeader>
                  <TableHeader>Title</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Estimated Value</TableHeader>
                  <TableHeader>Requirements</TableHeader>
                  <TableHeader>Bids</TableHeader>
                  <TableHeader>Updated</TableHeader>
                  <TableHeader>Action</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {solicitation.lots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {lot.number}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-800">
                        {lot.title}
                      </p>

                      {lot.description ? (
                        <p className="mt-1 max-w-md truncate text-xs text-slate-500">
                          {lot.description}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={lot.status} />
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {formatAmount(lot.estimatedValue)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {lot.requirements.length}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {lot.bids.length}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatShortDate(lot.updatedAt)}
                    </td>

                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/organization/solicitations/${solicitation.id}/lots/${lot.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        View Lot
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Solicitation-wide Requirements */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          title="Solicitation-wide Requirements"
          description="Requirements that apply across the entire solicitation and are not tied to a specific lot."
          count={solicitation.requirements.length}
        />

        {solicitation.requirements.length === 0 ? (
          <EmptySection message="No solicitation-wide requirements have been configured." />
        ) : (
          <div className="divide-y divide-slate-100">
            {solicitation.requirements.map((requirement) => (
              <div
                key={requirement.id}
                className="flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-start sm:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {requirement.title}
                    </h3>

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      {formatLabel(requirement.type)}
                    </span>

                    {requirement.isMandatory ? (
                      <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                        Mandatory
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                        Optional
                      </span>
                    )}
                  </div>

                  {requirement.description ? (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                      {requirement.description}
                    </p>
                  ) : null}
                </div>

                <span className="shrink-0 text-xs text-slate-400">
                  {formatShortDate(requirement.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-slate-100 px-6 py-4">
          <Link
            href={`/dashboard/organization/solicitations/${solicitation.id}/requirements`}
            className="inline-flex items-center text-sm font-semibold text-tenderhub-navy hover:underline"
          >
            Configure Solicitation-wide Requirements
            <span className="ml-1">→</span>
          </Link>
        </div>
      </section>

      {/* Documents */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          title="Documents"
          description="Documents attached to this solicitation."
          count={solicitation.documents.length}
        />

        {solicitation.documents.length === 0 ? (
          <EmptySection message="No solicitation documents have been uploaded." />
        ) : (
          <div className="divide-y divide-slate-100">
            {solicitation.documents.map((document) => (
              <div
                key={document.id}
                className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {document.name}
                  </h3>

                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                    <span>{formatLabel(document.category)}</span>

                    {document.mimeType ? (
                      <span>{document.mimeType}</span>
                    ) : null}

                    {document.fileSize !== null ? (
                      <span>
                        {Math.ceil(document.fileSize / 1024)} KB
                      </span>
                    ) : null}

                    <span>Version {document.version}</span>
                  </div>
                </div>

                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Open Document
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Evaluation Criteria */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          title="Evaluation Criteria"
          description="Criteria configured for bid evaluation."
          count={solicitation.evaluationCriteria.length}
        />

        {solicitation.evaluationCriteria.length === 0 ? (
          <EmptySection message="No evaluation criteria have been configured." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Order</TableHeader>
                  <TableHeader>Criterion</TableHeader>
                  <TableHeader>Weight</TableHeader>
                  <TableHeader>Maximum Score</TableHeader>
                  <TableHeader>Description</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {solicitation.evaluationCriteria.map((criterion) => (
                  <tr key={criterion.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {criterion.sortOrder}
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {criterion.name}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatScore(criterion.weight)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-700">
                      {formatScore(criterion.maxScore)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {criterion.description || "No description"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bid Register */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <SectionHeader
          title="Bid Register"
          description="Bids associated with this solicitation."
          count={solicitation.bids.length}
        />

        {solicitation.bids.length === 0 ? (
          <EmptySection message="No bids have been submitted or created for this solicitation." />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Bid</TableHeader>
                  <TableHeader>Vendor</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Amount</TableHeader>
                  <TableHeader>Submitted</TableHeader>
                  <TableHeader>Locked</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {solicitation.bids.map((bid) => (
                  <tr key={bid.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {bid.bidNumber}
                      </p>

                      {bid.title ? (
                        <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                          {bid.title}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-6 py-4 text-sm font-medium text-slate-800">
                      {bid.vendor.companyName}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={bid.status} />
                    </td>

                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                      {formatAmount(bid.totalAmount)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(bid.submittedAt)}
                    </td>

                    <td className="px-6 py-4 text-sm text-slate-500">
                      {formatDate(bid.lockedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Awards + Notices */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            title="Awards"
            description="Awards recorded against this solicitation."
            count={solicitation.awards.length}
          />

          {solicitation.awards.length === 0 ? (
            <EmptySection message="No awards have been recorded for this solicitation." />
          ) : (
            <div className="divide-y divide-slate-100">
              {solicitation.awards.map((award) => (
                <div key={award.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {award.awardNumber}
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {award.vendor.companyName}
                      </p>
                    </div>

                    <StatusBadge status={award.status} />
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <InfoItem
                      label="Award Amount"
                      value={formatAmount(award.awardAmount)}
                    />

                    <InfoItem
                      label="Award Date"
                      value={formatShortDate(award.awardDate)}
                    />

                    <InfoItem
                      label="Bid"
                      value={award.bid.bidNumber}
                    />

                    <InfoItem
                      label="Lot"
                      value={
                        award.lot
                          ? `${award.lot.number} — ${award.lot.title}`
                          : "Not specified"
                      }
                    />
                  </div>

                  {award.notes ? (
                    <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                      {award.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <SectionHeader
            title="Notices"
            description="Notices associated with this solicitation."
            count={solicitation.notices.length}
          />

          {solicitation.notices.length === 0 ? (
            <EmptySection message="No notices have been recorded for this solicitation." />
          ) : (
            <div className="divide-y divide-slate-100">
              {solicitation.notices.map((notice) => (
                <div key={notice.id} className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">
                        {notice.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatLabel(notice.type)}
                      </p>
                    </div>

                    <span className="text-xs text-slate-400">
                      {formatShortDate(notice.publishedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Solicitation Workflow */}
      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6">
          <SolicitationWorkflow type={solicitation.type} />
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
        status,
      )}`}
    >
      {formatLabel(status)}
    </span>
  );
}

function DraftPreparationCard({
  number,
  title,
  description,
  href,
  configured,
}: {
  number: string;
  title: string;
  description: string;
  href: string;
  configured: boolean;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-tenderhub-gold hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-tenderhub-navy text-xs font-bold text-white">
          {number}
        </span>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            configured
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {configured ? "Configured" : "Needs setup"}
        </span>
      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900 group-hover:text-tenderhub-navy">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

      <div className="mt-4 flex items-center text-sm font-semibold text-tenderhub-navy">
        Configure
        <span className="ml-1 transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </Link>
  );
}

function MetricCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">{detail}</p>
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

function TimelineItem({
  title,
  date,
  description,
}: {
  title: string;
  date: Date | null | undefined;
  description: string;
}) {
  return (
    <div className="relative flex gap-4">
      <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-tenderhub-navy" />

      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-900">{title}</p>

        <p className="mt-1 text-sm text-slate-700">{formatDate(date)}</p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  count,
}: {
  title: string;
  description: string;
  count: number;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>

      <span className="shrink-0 text-sm font-medium text-slate-500">
        {count} {count === 1 ? "record" : "records"}
      </span>
    </div>
  );
}

function EmptySection({ message }: { message: string }) {
  return (
    <div className="px-6 py-10 text-center">
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}