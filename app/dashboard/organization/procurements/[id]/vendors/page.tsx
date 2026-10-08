import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/db/prisma";

interface ProcurementVendorsPageProps {
  params: Promise<{
    id: string;
  }>;
}

function formatDate(date: Date | null) {
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

export default async function ProcurementVendorsPage({
  params,
}: ProcurementVendorsPageProps) {
  const { id } = await params;

  const procurement = await prisma.procurement.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      organizationId: true,
      title: true,
      referenceNumber: true,
      solicitations: {
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,
          bids: {
            select: {
              id: true,
              vendorId: true,
              status: true,
              submittedAt: true,
              createdAt: true,
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  userId: true,
                },
              },
            },
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!procurement) {
    notFound();
  }

  const vendorMap = new Map<
    string,
    {
      id: string;
      companyName: string;
      userId: string;
      bidCount: number;
      submittedBidCount: number;
      latestBidDate: Date | null;
      solicitationCount: number;
      statuses: string[];
    }
  >();

  for (const solicitation of procurement.solicitations) {
    const solicitationVendorIds = new Set<string>();

    for (const bid of solicitation.bids) {
      const existing = vendorMap.get(bid.vendor.id);

      solicitationVendorIds.add(bid.vendor.id);

      if (!existing) {
        vendorMap.set(bid.vendor.id, {
          id: bid.vendor.id,
          companyName: bid.vendor.companyName,
          userId: bid.vendor.userId,
          bidCount: 1,
          submittedBidCount: bid.submittedAt ? 1 : 0,
          latestBidDate: bid.submittedAt || bid.createdAt,
          solicitationCount: 0,
          statuses: [bid.status],
        });

        continue;
      }

      existing.bidCount += 1;

      if (bid.submittedAt) {
        existing.submittedBidCount += 1;
      }

      if (
        !existing.latestBidDate ||
        bid.submittedAt &&
          bid.submittedAt > existing.latestBidDate
      ) {
        existing.latestBidDate = bid.submittedAt;
      }

      if (!existing.statuses.includes(bid.status)) {
        existing.statuses.push(bid.status);
      }
    }

    for (const vendorId of solicitationVendorIds) {
      const vendor = vendorMap.get(vendorId);

      if (vendor) {
        vendor.solicitationCount += 1;
      }
    }
  }

  const vendors = Array.from(vendorMap.values()).sort((first, second) =>
    first.companyName.localeCompare(second.companyName),
  );

  const totalBids = procurement.solicitations.reduce(
    (total, solicitation) => total + solicitation.bids.length,
    0,
  );

  const submittedBids = procurement.solicitations.reduce(
    (total, solicitation) =>
      total +
      solicitation.bids.filter((bid) => Boolean(bid.submittedAt)).length,
    0,
  );

  const activeSolicitations = procurement.solicitations.filter(
    (solicitation) => solicitation.status === "OPEN",
  ).length;

  const multiBidVendors = vendors.filter(
    (vendor) => vendor.solicitationCount > 1,
  ).length;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href={`/dashboard/organization/procurements/${procurement.id}`}
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Procurement Details
          </Link>

          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
            Procurement Vendors
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            {procurement.title}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Reference: {procurement.referenceNumber}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/organization/procurements/${procurement.id}`}
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Procurement Overview
          </Link>

          <Link
            href={`/dashboard/organization/solicitations?procurementId=${procurement.id}`}
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Manage Solicitations
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Vendors"
          value={vendors.length.toString()}
          detail="Unique vendors with bids"
        />

        <MetricCard
          label="Total Bids"
          value={totalBids.toString()}
          detail="Across all solicitations"
        />

        <MetricCard
          label="Submitted"
          value={submittedBids.toString()}
          detail="Bids submitted"
        />

        <MetricCard
          label="Open Solicitations"
          value={activeSolicitations.toString()}
          detail="Currently open"
        />

        <MetricCard
          label="Multi-Solicitation"
          value={multiBidVendors.toString()}
          detail="Vendors bidding more than once"
        />
      </div>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Vendors
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Vendors that have submitted or started bids within this
            procurement.
          </p>
        </div>

        {vendors.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
              V
            </div>

            <h3 className="mt-4 text-base font-semibold text-slate-900">
              No vendors yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Vendors will appear here once they create bids against
              solicitations belonging to this procurement.
            </p>

            <Link
              href={`/dashboard/organization/solicitations?procurementId=${procurement.id}`}
              className="mt-5 inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
            >
              View Solicitations
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Vendor
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Solicitations
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bids
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Submitted
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Latest Activity
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Statuses
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-slate-50">
                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/vendors/${vendor.id}`}
                        className="font-semibold text-slate-900 hover:text-tenderhub-navy"
                      >
                        {vendor.companyName}
                      </Link>

                      <p className="mt-1 text-xs text-slate-500">
                        Vendor ID: {vendor.id}
                      </p>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {vendor.solicitationCount}
                    </td>

                    <td className="px-6 py-5 text-sm font-medium text-slate-900">
                      {vendor.bidCount}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {vendor.submittedBidCount}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-600">
                      {formatDate(vendor.latestBidDate)}
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {vendor.statuses.map((status) => (
                          <span
                            key={status}
                            className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
                          >
                            {formatLabel(status)}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <Link
                        href={`/dashboard/organization/vendors/${vendor.id}`}
                        className="text-sm font-semibold text-tenderhub-navy hover:underline"
                      >
                        View Vendor
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Vendor Participation
          </h2>

          <div className="mt-5 space-y-4">
            <ParticipationRow
              label="Unique vendors"
              value={vendors.length}
              description="Distinct vendors represented by bids."
            />

            <ParticipationRow
              label="Total bids"
              value={totalBids}
              description="All bid records associated with this procurement."
            />

            <ParticipationRow
              label="Submitted bids"
              value={submittedBids}
              description="Bids with a recorded submission timestamp."
            />

            <ParticipationRow
              label="Multiple solicitations"
              value={multiBidVendors}
              description="Vendors participating in more than one solicitation."
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Vendor Workflow
          </h2>

          <div className="mt-5 space-y-5">
            <WorkflowStep
              number="1"
              title="Discover"
              description="Vendors find relevant solicitations and review their requirements."
            />

            <WorkflowStep
              number="2"
              title="Prepare"
              description="Vendors prepare their bid information and supporting documents."
            />

            <WorkflowStep
              number="3"
              title="Submit"
              description="Completed bids are submitted through the solicitation workflow."
            />

            <WorkflowStep
              number="4"
              title="Evaluate"
              description="Submitted bids proceed through the organization's evaluation process."
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Solicitation Participation
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Review vendor participation by solicitation.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {procurement.solicitations.map((solicitation) => (
            <Link
              key={solicitation.id}
              href={`/dashboard/organization/solicitations/${solicitation.id}`}
              className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-slate-300 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {solicitation.title}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {solicitation.solicitationNumber}
                  </p>
                </div>

                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                  {formatLabel(solicitation.status)}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-500">Bids</span>

                <span className="font-semibold text-slate-900">
                  {solicitation.bids.length}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div>
        <Link
          href={`/dashboard/organization/procurements/${procurement.id}`}
          className="text-sm font-medium text-slate-500 hover:text-slate-900"
        >
          ← Back to Procurement
        </Link>
      </div>
    </div>
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

function ParticipationRow({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">{label}</p>

        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>

      <span className="text-xl font-bold text-slate-900">{value}</span>
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
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
        {number}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}