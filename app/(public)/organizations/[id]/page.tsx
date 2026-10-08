import Link from "next/link";
import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrganizationDetailPage({
  params,
}: PageProps) {
  const { id } = await params;

  const organization = await prisma.organization.findUnique({
    where: {
      id,
    },
    include: {
      country: true,
      procurements: {
        orderBy: {
          createdAt: "desc",
        },
        take: 6,
        include: {
          department: true,
          country: true,
          currency: true,
          solicitations: {
            select: {
              id: true,
              solicitationNumber: true,
              title: true,
              status: true,
              closingDate: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 3,
          },
        },
      },
      solicitations: {
        where: {
          status: {
            in: ["PUBLISHED", "OPEN", "UNDER_EVALUATION"],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
        include: {
          currency: true,
        },
      },
    },
  });

  if (!organization) {
    notFound();
  }

  const initials =
    organization.name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase())
      .join("") || "O";

  const activeSolicitations = organization.solicitations.length;

  const totalProcurements = organization.procurements.length;

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#071A33] text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          <div className="mb-8">
            <Link
              href="/organizations"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              ← Back to Organizations
            </Link>
          </div>

          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-2xl font-bold text-[#071A33]">
                {organization.logo ? (
                  <img
                    src={organization.logo}
                    alt={organization.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {organization.verifiedAt && (
                    <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                      ✓ Verified Organization
                    </span>
                  )}

                  {organization.country?.name && (
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-300">
                      {organization.country.name}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  {organization.name}
                </h1>

                {organization.legalName &&
                  organization.legalName !== organization.name && (
                    <p className="mt-2 text-slate-300">
                      {organization.legalName}
                    </p>
                  )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/solicitations"
                className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#071A33] transition hover:bg-[#e2c65c]"
              >
                View Solicitations
              </Link>

              <Link
                href="/organizations"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                All Organizations
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="space-y-8 lg:col-span-2">
            {/* About */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-[#071A33]">
                About the Organization
              </h2>

              <div className="mt-5">
                {organization.description ? (
                  <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                    {organization.description}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">
                    No organization description has been provided.
                  </p>
                )}
              </div>
            </section>

            {/* Active Solicitations */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-[#071A33]">
                    Active Solicitations
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Current procurement opportunities published by this
                    organization.
                  </p>
                </div>

                {activeSolicitations > 0 && (
                  <Link
                    href="/solicitations"
                    className="text-sm font-semibold text-[#071A33] hover:underline"
                  >
                    View all →
                  </Link>
                )}
              </div>

              {organization.solicitations.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {organization.solicitations.map((solicitation) => (
                    <Link
                      key={solicitation.id}
                      href={`/solicitations/${solicitation.id}`}
                      className="block rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-slate-200 hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {solicitation.solicitationNumber}
                            </span>

                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                              {formatLabel(solicitation.status)}
                            </span>
                          </div>

                          <h3 className="mt-2 text-base font-bold text-[#071A33]">
                            {solicitation.title}
                          </h3>
                        </div>

                        <div className="shrink-0 text-left sm:text-right">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Closing
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-700">
                            {solicitation.closingDate
                              ? formatDate(solicitation.closingDate)
                              : "Not specified"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    This organization currently has no active solicitations.
                  </p>
                </div>
              )}
            </section>

            {/* Procurement Activity */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div>
                <h2 className="text-xl font-bold text-[#071A33]">
                  Procurement Activity
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Recent procurement processes associated with this
                  organization.
                </p>
              </div>

              {organization.procurements.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {organization.procurements.map((procurement) => (
                    <div
                      key={procurement.id}
                      className="rounded-2xl border border-slate-100 p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                              {procurement.referenceNumber}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              {formatLabel(procurement.status)}
                            </span>
                          </div>

                          <h3 className="mt-2 text-base font-bold text-[#071A33]">
                            {procurement.title}
                          </h3>

                          {procurement.department?.name && (
                            <p className="mt-1 text-sm text-slate-500">
                              Department: {procurement.department.name}
                            </p>
                          )}
                        </div>

                        {procurement.estimatedValue !== null &&
                          procurement.estimatedValue !== undefined && (
                            <div className="shrink-0 sm:text-right">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Estimated Value
                              </p>

                              <p className="mt-1 text-sm font-bold text-slate-800">
                                {formatAmount(
                                  procurement.estimatedValue,
                                  procurement.currency?.code
                                )}
                              </p>
                            </div>
                          )}
                      </div>

                      {procurement.description && (
                        <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                          {procurement.description}
                        </p>
                      )}

                      {procurement.solicitations.length > 0 && (
                        <div className="mt-4 border-t border-slate-100 pt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Solicitations
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {procurement.solicitations.map((solicitation) => (
                              <Link
                                key={solicitation.id}
                                href={`/solicitations/${solicitation.id}`}
                                className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-[#071A33] transition hover:bg-slate-100"
                              >
                                {solicitation.solicitationNumber}
                              </Link>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-slate-50 p-8 text-center">
                  <p className="text-sm text-slate-500">
                    No procurement activity is currently available.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            {/* Organization Information */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#071A33]">
                Organization Information
              </h2>

              <div className="mt-5 space-y-5">
                <InfoItem
                  label="Country"
                  value={organization.country?.name || "Not specified"}
                />

                <InfoItem
                  label="Organization Type"
                  value="Organization"
                />

                <InfoItem
                  label="Registration Number"
                  value={
                    organization.registrationNumber || "Not provided"
                  }
                />

                <InfoItem
                  label="Tax Number"
                  value={organization.taxNumber || "Not provided"}
                />

                <InfoItem
                  label="Currency"
                  value={organization.currencyId || "Not specified"}
                />
              </div>
            </section>

            {/* Contact */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#071A33]">
                Contact Information
              </h2>

              <div className="mt-5 space-y-5">
                {organization.email && (
                  <ContactItem
                    label="Email"
                    value={organization.email}
                    href={`mailto:${organization.email}`}
                  />
                )}

                {organization.phone && (
                  <ContactItem
                    label="Phone"
                    value={organization.phone}
                    href={`tel:${organization.phone}`}
                  />
                )}

                {organization.website && (
                  <ContactItem
                    label="Website"
                    value={organization.website.replace(/^https?:\/\//, "")}
                    href={
                      organization.website.startsWith("http")
                        ? organization.website
                        : `https://${organization.website}`
                    }
                    external
                  />
                )}

                {organization.address && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Address
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {organization.address}
                    </p>
                  </div>
                )}

                {!organization.email &&
                  !organization.phone &&
                  !organization.website &&
                  !organization.address && (
                    <p className="text-sm leading-6 text-slate-500">
                      Contact information has not been provided publicly.
                    </p>
                  )}
              </div>
            </section>

            {/* Statistics */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#071A33]">
                Platform Activity
              </h2>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <StatCard
                  value={String(activeSolicitations)}
                  label="Active solicitations"
                />

                <StatCard
                  value={String(totalProcurements)}
                  label="Recent procurements"
                />
              </div>
            </section>

            {/* CTA */}
            <section className="rounded-3xl bg-[#071A33] p-6 text-white shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4AF37] text-sm font-bold text-[#071A33]">
                TH
              </div>

              <h2 className="mt-5 text-lg font-bold">
                Explore procurement opportunities
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Browse active solicitations published by organizations across
                the TenderHub procurement network.
              </p>

              <Link
                href="/solicitations"
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-bold text-[#071A33] transition hover:bg-slate-100"
              >
                Browse Solicitations
              </Link>
            </section>
          </aside>
        </div>
      </section>
    </main>
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
    </div>
  );
}

function ContactItem({
  label,
  value,
  href,
  external = false,
}: {
  label: string;
  value: string;
  href: string;
  external?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="mt-1 block break-all text-sm font-medium text-[#071A33] hover:underline"
      >
        {value}
      </a>
    </div>
  );
}

function StatCard({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-2xl font-bold text-[#071A33]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{label}</p>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatAmount(
  value: unknown,
  currencyCode?: string | null
) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not specified";
  }

  return `${currencyCode || ""} ${amount.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`.trim();
}