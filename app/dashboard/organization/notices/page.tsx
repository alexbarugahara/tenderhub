import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

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

function formatDateTime(date: Date | null) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusClasses(published: boolean) {
  return published
    ? "bg-emerald-50 text-emerald-700"
    : "bg-amber-50 text-amber-700";
}

function getStatusLabel(published: boolean) {
  return published ? "Published" : "Draft";
}

export default async function OrganizationNoticesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    notFound();
  }

  const organizationMember = await prisma.organizationMember.findFirst({
    where: {
      userId: session.user.id,
    },
    select: {
      organizationId: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!organizationMember) {
    notFound();
  }

  const organization = await prisma.organization.findUnique({
    where: {
      id: organizationMember.organizationId,
    },
    select: {
      id: true,
      name: true,
      solicitations: {
        select: {
          id: true,
          solicitationNumber: true,
          title: true,
          status: true,
          procurement: {
            select: {
              id: true,
              title: true,
              referenceNumber: true,
            },
          },
          notices: {
            select: {
              id: true,
              title: true,
              content: true,
              type: true,
              published: true,
              publishedAt: true,
              createdAt: true,
              updatedAt: true,
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

  if (!organization) {
    notFound();
  }

  const notices = organization.solicitations.flatMap((solicitation) =>
    solicitation.notices.map((notice) => ({
      ...notice,
      solicitation,
    })),
  );

  const publishedNotices = notices.filter(
    (notice) => notice.published,
  );

  const draftNotices = notices.filter(
    (notice) => !notice.published,
  );

  const distinctSolicitations = new Set(
    notices.map((notice) => notice.solicitation.id),
  );

  const publicationRate =
    notices.length > 0
      ? Math.round(
          (publishedNotices.length / notices.length) * 100,
        )
      : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {organization.name}
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Notices
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review procurement notices associated with your
            organization&apos;s solicitations, including publication
            status and notice content.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/organization/solicitations"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Solicitations
          </Link>

          <Link
            href="/dashboard/organization/awards"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Awards
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Notices"
          value={notices.length.toString()}
          detail="Total notice records"
        />

        <MetricCard
          label="Published"
          value={publishedNotices.length.toString()}
          detail="Published notices"
        />

        <MetricCard
          label="Draft"
          value={draftNotices.length.toString()}
          detail="Not yet published"
        />

        <MetricCard
          label="Solicitations"
          value={distinctSolicitations.size.toString()}
          detail="With associated notices"
        />
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <SummaryCard
          title="Published Notices"
          value={publishedNotices.length.toString()}
          description="Notices currently marked as published."
        />

        <SummaryCard
          title="Draft Notices"
          value={draftNotices.length.toString()}
          description="Notices that have not yet been published."
        />

        <SummaryCard
          title="Publication Rate"
          value={`${publicationRate}%`}
          description="Share of notices currently marked as published."
        />
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Notice Register
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Notices associated with your organization&apos;s
              solicitations.
            </p>
          </div>

          <span className="text-sm text-slate-500">
            {notices.length} record{notices.length === 1 ? "" : "s"}
          </span>
        </div>

        {notices.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Notice</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Solicitation</TableHeader>
                  <TableHeader>Procurement</TableHeader>
                  <TableHeader>Status</TableHeader>
                  <TableHeader>Published</TableHeader>
                  <TableHeader>Updated</TableHeader>
                  <TableHeader>Action</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {notices.map((notice) => (
                  <tr
                    key={notice.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/notices/${notice.id}`}
                        className="text-sm font-semibold text-slate-900 hover:text-tenderhub-navy"
                      >
                        {notice.title}
                      </Link>

                      <p className="mt-1 max-w-sm truncate text-xs text-slate-500">
                        {notice.content}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span className="text-sm text-slate-700">
                        {formatLabel(notice.type)}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/solicitations/${notice.solicitation.id}`}
                        className="text-sm font-semibold text-slate-800 hover:text-tenderhub-navy"
                      >
                        {notice.solicitation.solicitationNumber}
                      </Link>

                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {notice.solicitation.title}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/procurements/${notice.solicitation.procurement.id}`}
                        className="text-sm font-semibold text-slate-800 hover:text-tenderhub-navy"
                      >
                        {notice.solicitation.procurement.referenceNumber}
                      </Link>

                      <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
                        {notice.solicitation.procurement.title}
                      </p>
                    </td>

                    <td className="px-6 py-5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          notice.published,
                        )}`}
                      >
                        {getStatusLabel(notice.published)}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-500">
                      {formatDate(notice.publishedAt)}
                    </td>

                    <td className="px-6 py-5 text-sm text-slate-500">
                      {formatDate(notice.updatedAt)}
                    </td>

                    <td className="px-6 py-5">
                      <Link
                        href={`/dashboard/organization/notices/${notice.id}`}
                        className="text-sm font-semibold text-tenderhub-navy hover:underline"
                      >
                        View
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
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Notices
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              The latest notice records in the organization.
            </p>
          </div>

          {notices.length === 0 ? (
            <EmptyState message="No recent notice activity is available." />
          ) : (
            <div className="divide-y divide-slate-100">
              {notices.slice(0, 6).map((notice) => (
                <Link
                  key={notice.id}
                  href={`/dashboard/organization/notices/${notice.id}`}
                  className="block p-5 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {notice.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-700">
                        {notice.solicitation.solicitationNumber}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {notice.solicitation.title}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatLabel(notice.type)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                        notice.published,
                      )}`}
                    >
                      {getStatusLabel(notice.published)}
                    </span>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    Created {formatDateTime(notice.createdAt)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 py-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Publication Workflow
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Key stages for managing procurement notices.
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-5">
              <WorkflowStep
                number="1"
                title="Prepare"
                description="Create and review the notice content associated with the relevant procurement event."
              />

              <WorkflowStep
                number="2"
                title="Review"
                description="Confirm that the notice accurately reflects the solicitation or procurement information."
              />

              <WorkflowStep
                number="3"
                title="Publish"
                description="Mark the notice as published when the procurement process requires public or participant communication."
              />

              <WorkflowStep
                number="4"
                title="Monitor"
                description="Track publication information and retain the notice as part of the procurement record."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-base font-semibold text-slate-900">
          Notice Management
        </h2>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Notices provide a formal communication layer around
          procurement events. Use the notice records together with
          solicitations, evaluations, awards, and contracts to maintain
          a clear procurement history.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/dashboard/organization/solicitations"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Solicitations
          </Link>

          <Link
            href="/dashboard/organization/awards"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            View Awards
          </Link>

          <Link
            href="/dashboard/organization/contracts"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            View Contracts
          </Link>
        </div>
      </section>
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

      <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">{title}</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </th>
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
        <h3 className="text-sm font-semibold text-slate-900">
          {title}
        </h3>

        <p className="mt-1 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

function EmptyState({
  message = "No notices have been recorded yet.",
}: {
  message?: string;
}) {
  return (
    <div className="p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
        N
      </div>

      <h3 className="mt-4 text-base font-semibold text-slate-900">
        No notices
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {message}
      </p>
    </div>
  );
}