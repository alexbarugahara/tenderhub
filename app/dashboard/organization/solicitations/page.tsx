import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

import {
  SOLICITATION_TYPES,
  getSolicitationTypeConfig,
} from "@/lib/solicitations/types";

export const dynamic = "force-dynamic";

interface SolicitationsPageProps {
  searchParams: Promise<{
    type?: string;
    status?: string;
    search?: string;
  }>;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  OPEN: "Open",
  UNDER_EVALUATION: "Under Evaluation",
  AWARDED: "Awarded",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
  SUSPENDED: "Suspended",
  ARCHIVED: "Archived",
};

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  PUBLISHED: "bg-blue-100 text-blue-700",
  OPEN: "bg-emerald-100 text-emerald-700",
  UNDER_EVALUATION: "bg-amber-100 text-amber-700",
  AWARDED: "bg-purple-100 text-purple-700",
  CLOSED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
  SUSPENDED: "bg-orange-100 text-orange-700",
  ARCHIVED: "bg-gray-100 text-gray-600",
};

function formatDate(value: Date | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(
  value: number | string | null | undefined,
  currencyCode?: string | null,
) {
  if (value === null || value === undefined) {
    return "—";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return "—";
  }

  return `${currencyCode ?? ""} ${numericValue.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`.trim();
}

function getTypeDetails(type: string) {
  return getSolicitationTypeConfig(type as never);
}

export default async function SolicitationsPage({
  searchParams,
}: SolicitationsPageProps) {
  const session = await auth();

  const userId = session?.user?.id;

  if (!userId) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          You must be signed in to access solicitations.
        </div>
      </div>
    );
  }

  const params = await searchParams;

  const selectedType = params.type?.trim() || "";
  const selectedStatus = params.status?.trim() || "";
  const searchQuery = params.search?.trim() || "";

  /*
   * ---------------------------------------------------------
   * Resolve current organization
   * ---------------------------------------------------------
   */

  const membership =
    await prisma.organizationMember.findFirst({
      where: {
        userId,
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  if (!membership?.organization) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <h2 className="text-lg font-semibold text-amber-900">
            No Organization Found
          </h2>

          <p className="mt-2 text-sm text-amber-800">
            Your account is not currently associated with
            an organization.
          </p>
        </div>
      </div>
    );
  }

  const organizationId =
    membership.organization.id;

  /*
   * ---------------------------------------------------------
   * Load solicitations
   * ---------------------------------------------------------
   *
   * We intentionally load the organization's
   * solicitations first and apply the register filters
   * below. This preserves the working organization
   * filtering and avoids the previous query/filter issue.
   */

  const solicitations =
    await prisma.solicitation.findMany({
      where: {
        organizationId,
      },
      include: {
        procurement: {
          select: {
            id: true,
            referenceNumber: true,
            title: true,
            status: true,
            procurementMethod: true,
          },
        },
        currency: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        _count: {
          select: {
            bids: true,
            lots: true,
            requirements: true,
            documents: true,
            evaluationCriteria: true,
            awards: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  /*
   * ---------------------------------------------------------
   * Statistics
   * ---------------------------------------------------------
   */

  const totalCount = solicitations.length;

  const activeCount = solicitations.filter(
    (solicitation) =>
      solicitation.status === "PUBLISHED" ||
      solicitation.status === "OPEN" ||
      solicitation.status === "UNDER_EVALUATION",
  ).length;

  const draftCount = solicitations.filter(
    (solicitation) =>
      solicitation.status === "DRAFT",
  ).length;

  const awardedCount = solicitations.filter(
    (solicitation) =>
      solicitation.status === "AWARDED",
  ).length;

  const totalBids = solicitations.reduce(
    (total, solicitation) =>
      total + solicitation._count.bids,
    0,
  );

  const totalLots = solicitations.reduce(
    (total, solicitation) =>
      total + solicitation._count.lots,
    0,
  );

  const publishedCount = solicitations.filter(
    (solicitation) =>
      solicitation.status === "PUBLISHED",
  ).length;

  const openCount = solicitations.filter(
    (solicitation) =>
      solicitation.status === "OPEN",
  ).length;

  const underEvaluationCount =
    solicitations.filter(
      (solicitation) =>
        solicitation.status ===
        "UNDER_EVALUATION",
    ).length;

  const awardedClosedCount =
    solicitations.filter(
      (solicitation) =>
        solicitation.status === "AWARDED" ||
        solicitation.status === "CLOSED",
    ).length;

  const cancelledCount = solicitations.filter(
    (solicitation) =>
      solicitation.status === "CANCELLED",
  ).length;

  /*
   * ---------------------------------------------------------
   * Type counts
   * ---------------------------------------------------------
   */

  const typeCounts: Record<string, number> = {};

  for (const solicitation of solicitations) {
    typeCounts[solicitation.type] =
      (typeCounts[solicitation.type] || 0) + 1;
  }

  /*
   * ---------------------------------------------------------
   * Register filtering
   * ---------------------------------------------------------
   */

  const filteredSolicitations =
    solicitations.filter((solicitation) => {
      const matchesType =
        !selectedType ||
        solicitation.type === selectedType;

      const matchesStatus =
        !selectedStatus ||
        solicitation.status === selectedStatus;

      const normalizedSearch =
        searchQuery.toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        solicitation.title
          .toLowerCase()
          .includes(normalizedSearch) ||
        solicitation.solicitationNumber
          .toLowerCase()
          .includes(normalizedSearch) ||
        solicitation.procurement.referenceNumber
          .toLowerCase()
          .includes(normalizedSearch) ||
        solicitation.procurement.title
          .toLowerCase()
          .includes(normalizedSearch);

      return (
        matchesType &&
        matchesStatus &&
        matchesSearch
      );
    });

  return (
    <div className="space-y-6 p-6">
      {/* =====================================================
          PAGE HEADER
          ===================================================== */}

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/dashboard/organization"
              className="hover:text-tenderhub-navy"
            >
              Organization
            </Link>

            <span>/</span>

            <span>Solicitations</span>
          </div>

          <h1 className="text-2xl font-bold text-tenderhub-navy">
            Solicitations
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage procurement solicitations for{" "}
            <span className="font-medium text-gray-700">
              {membership.organization.name}
            </span>
            .
          </p>
        </div>

        <Link
          href="/dashboard/organization/solicitations/new"
          className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
        >
          + New Solicitation
        </Link>
      </div>

      {/* =====================================================
          SUMMARY CARDS
          ===================================================== */}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link
          href="/dashboard/organization/solicitations"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-tenderhub-gold/50"
        >
          <p className="text-sm text-gray-500">
            Total
          </p>

          <p className="mt-2 text-2xl font-bold text-tenderhub-navy">
            {totalCount}
          </p>
        </Link>

        <Link
          href="/dashboard/organization/solicitations"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-tenderhub-gold/50"
        >
          <p className="text-sm text-gray-500">
            Active
          </p>

          <p className="mt-2 text-2xl font-bold text-emerald-600">
            {activeCount}
          </p>
        </Link>

        <Link
          href="/dashboard/organization/solicitations?status=DRAFT"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-tenderhub-gold/50"
        >
          <p className="text-sm text-gray-500">
            Draft
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-700">
            {draftCount}
          </p>
        </Link>

        <Link
          href="/dashboard/organization/solicitations?status=AWARDED"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-tenderhub-gold/50"
        >
          <p className="text-sm text-gray-500">
            Awarded
          </p>

          <p className="mt-2 text-2xl font-bold text-purple-600">
            {awardedCount}
          </p>
        </Link>
      </div>

      {/* =====================================================
          SECONDARY STATISTICS
          ===================================================== */}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">
            Bids
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-800">
            {totalBids}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">
            Lots
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-800">
            {totalLots}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">
            Published
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-800">
            {publishedCount}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">
            Open
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-800">
            {openCount}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">
            Under Evaluation
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-800">
            {underEvaluationCount}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">
            Awarded/Closed
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-800">
            {awardedClosedCount}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">
            Cancelled
          </p>
          <p className="mt-1 text-lg font-semibold text-gray-800">
            {cancelledCount}
          </p>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-xs text-gray-500">
            Organization
          </p>
          <p className="mt-1 truncate text-lg font-semibold text-gray-800">
            {membership.organization.name}
          </p>
        </div>
      </div>

      {/* =====================================================
          FILTERS
          ===================================================== */}

      <form
        method="GET"
        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Search */}

          <div>
            <label
              htmlFor="search"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Search solicitations
            </label>

            <input
              id="search"
              name="search"
              type="text"
              defaultValue={searchQuery}
              placeholder="Search number, title or procurement..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
            />
          </div>

          {/* Type */}

          <div>
            <label
              htmlFor="type"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Type
            </label>

            <select
              id="type"
              name="type"
              defaultValue={selectedType}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
            >
              <option value="">
                All types
              </option>

              {SOLICITATION_TYPES.map(
                (type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.shortLabel} —{" "}
                    {type.label}
                  </option>
                ),
              )}
            </select>
          </div>

          {/* Status */}

          <div>
            <label
              htmlFor="status"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Status
            </label>

            <select
              id="status"
              name="status"
              defaultValue={selectedStatus}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20"
            >
              <option value="">
                All statuses
              </option>

              {Object.entries(
                STATUS_LABELS,
              ).map(([value, label]) => (
                <option
                  key={value}
                  value={value}
                >
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            className="rounded-lg bg-tenderhub-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Search
          </button>

          <Link
            href="/dashboard/organization/solicitations"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Clear
          </Link>
        </div>
      </form>

      {/* =====================================================
          TYPE QUICK FILTERS
          ===================================================== */}

      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/organization/solicitations"
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${!selectedType
              ? "border-tenderhub-navy bg-tenderhub-navy text-white"
              : "border-gray-200 bg-white text-gray-600 hover:border-tenderhub-gold"
            }`}
        >
          All Types
        </Link>

        {SOLICITATION_TYPES.map(
          (type) => {
            const isSelected =
              selectedType === type.value;

            return (
              <Link
                key={type.value}
                href={`/dashboard/organization/solicitations?type=${type.value}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${isSelected
                    ? "border-tenderhub-navy bg-tenderhub-navy text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-tenderhub-gold"
                  }`}
              >
                {type.shortLabel}
                {typeCounts[type.value]
                  ? ` (${typeCounts[type.value]})`
                  : ""}
              </Link>
            );
          },
        )}
      </div>

      {/* =====================================================
          REGISTER
          ===================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-2 border-b border-gray-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Solicitation Register
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {filteredSolicitations.length}{" "}
              {filteredSolicitations.length === 1
                ? "solicitation"
                : "solicitations"}
              .
            </p>
          </div>
        </div>

        {filteredSolicitations.length ===
          0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto max-w-md">
              <h3 className="text-base font-semibold text-gray-900">
                No solicitations found
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {searchQuery ||
                  selectedType ||
                  selectedStatus
                  ? "Try changing your search or filters."
                  : "Create a solicitation from an existing procurement."}
              </p>

              {!searchQuery &&
                !selectedType &&
                !selectedStatus && (
                  <Link
                    href="/dashboard/organization/solicitations/new"
                    className="mt-5 inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                  >
                    + Create Solicitation
                  </Link>
                )}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Solicitation
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Type
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Procurement
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Closing
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Value
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Bids
                  </th>

                  <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Lots
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredSolicitations.map(
                  (solicitation) => {
                    const typeDetails =
                      getTypeDetails(
                        solicitation.type,
                      );

                    const statusClass =
                      STATUS_CLASSES[
                      solicitation.status
                      ] ||
                      "bg-gray-100 text-gray-700";

                    const statusLabel =
                      STATUS_LABELS[
                      solicitation.status
                      ] ||
                      solicitation.status;

                    return (
                      <tr
                        key={solicitation.id}
                        className="align-top transition hover:bg-slate-50"
                      >
                        {/* =================================================
                            SOLICITATION IDENTITY
                            ================================================= */}

                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/organization/solicitations/${solicitation.id}`}
                            className="group block min-w-[250px]"
                          >
                            <div className="font-semibold text-tenderhub-navy group-hover:text-tenderhub-gold">
                              {solicitation.solicitationNumber}
                            </div>

                            <div className="mt-1 text-sm font-medium text-gray-900">
                              {solicitation.title}
                            </div>

                            <div className="mt-1 text-xs text-gray-500">
                              ID: {solicitation.id}
                            </div>
                          </Link>
                        </td>

                        {/* =================================================
                            TYPE
                            ================================================= */}

                        <td className="px-5 py-4">
                          <div className="min-w-[170px]">
                            <div className="font-semibold text-gray-800">
                              {typeDetails?.shortLabel ||
                                solicitation.type}
                            </div>

                            <div className="mt-1 text-xs leading-5 text-gray-500">
                              {typeDetails?.label ||
                                solicitation.type}
                            </div>
                          </div>
                        </td>

                        {/* =================================================
                            PROCUREMENT
                            ================================================= */}

                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/organization/procurements/${solicitation.procurement.id}`}
                            className="block min-w-[170px]"
                          >
                            <div className="font-semibold text-tenderhub-navy hover:text-tenderhub-gold">
                              {
                                solicitation
                                  .procurement
                                  .referenceNumber
                              }
                            </div>

                            <div className="mt-1 text-xs leading-5 text-gray-500">
                              {
                                solicitation
                                  .procurement
                                  .title
                              }
                            </div>
                          </Link>
                        </td>

                        {/* =================================================
                            STATUS
                            ================================================= */}

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass}`}
                          >
                            {statusLabel}
                          </span>
                        </td>

                        {/* =================================================
                            CLOSING
                            ================================================= */}

                        <td className="px-5 py-4 text-sm text-gray-700">
                          <div className="whitespace-nowrap">
                            {formatDate(
                              solicitation.closingDate,
                            )}
                          </div>
                        </td>

                        {/* =================================================
                            VALUE
                            ================================================= */}

                        <td className="px-5 py-4 text-sm font-medium text-gray-800">
                          <div className="whitespace-nowrap">
                            {formatMoney(
                              solicitation.estimatedValue === null
                                ? null
                                : Number(solicitation.estimatedValue),
                              solicitation.currency?.code,
                            )}
                          </div>
                        </td>

                        {/* =================================================
                            BIDS
                            ================================================= */}

                        <td className="px-5 py-4 text-center text-sm text-gray-700">
                          {solicitation._count
                            .bids}
                        </td>

                        {/* =================================================
                            LOTS
                            ================================================= */}

                        <td className="px-5 py-4 text-center text-sm text-gray-700">
                          {solicitation._count
                            .lots}
                        </td>

                        {/* =================================================
                            ACTION
                            ================================================= */}

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/dashboard/organization/solicitations/${solicitation.id}`}
                            className="inline-flex items-center rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-tenderhub-gold hover:text-tenderhub-navy"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =====================================================
          FOOTER
          ===================================================== */}

      <div className="text-center text-xs text-gray-400">
        © {new Date().getFullYear()} TenderHub Uganda.
        All rights reserved.
      </div>
    </div>
  );
}
