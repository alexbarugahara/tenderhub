import Link from "next/link";

import { prisma } from "@/lib/prisma";

export default async function OrganizationsPage() {
  const organizations = await prisma.organization.findMany({
    orderBy: {
      name: "asc",
    },
    take: 24,
    include: {
      country: true,
    },
  });

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#071A33] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[#D4AF37]">
              Organizations
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Organizations using TenderHub
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Discover organizations publishing procurement opportunities,
              managing solicitations, and connecting with vendors through
              TenderHub.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/solicitations"
                className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#071A33] transition hover:bg-[#e2c65c]"
              >
                Browse Solicitations
              </Link>

              <Link
                href="/auth/register"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Register Organization
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Directory */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#071A33]">
              Organization Directory
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Explore organizations participating in the TenderHub
              procurement ecosystem.
            </p>
          </div>

          <div className="text-sm text-slate-500">
            {organizations.length}{" "}
            {organizations.length === 1 ? "organization" : "organizations"}
          </div>
        </div>

        {organizations.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#071A33] text-lg font-bold text-[#D4AF37]">
              TH
            </div>

            <h3 className="mt-5 text-xl font-bold text-[#071A33]">
              No organizations yet
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Organizations will appear here as they join TenderHub and
              participate in the procurement platform.
            </p>

            <Link
              href="/auth/register"
              className="mt-6 inline-flex rounded-xl bg-[#071A33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0c2a50]"
            >
              Register an Organization
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {organizations.map((organization) => {
              const initials =
                organization.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((word) => word[0]?.toUpperCase())
                  .join("") || "O";

              return (
                <article
                  key={organization.id}
                  className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#071A33] text-lg font-bold text-[#D4AF37]">
                      {organization.logo ? (
                        <img
                          src={organization.logo}
                          alt={organization.name}
                          className="h-full w-full rounded-2xl object-cover"
                        />
                      ) : (
                        initials
                      )}
                    </div>

                    {organization.verifiedAt && (
                      <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        ✓ Verified
                      </span>
                    )}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xl font-bold text-[#071A33]">
                      {organization.name}
                    </h3>

                    {organization.legalName &&
                      organization.legalName !== organization.name && (
                        <p className="mt-1 text-sm text-slate-500">
                          {organization.legalName}
                        </p>
                      )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {organization.country?.name && (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
                        {organization.country.name}
                      </span>
                    )}

                    {organization.organizationType && (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium capitalize text-slate-600">
                        {formatLabel(organization.organizationType)}
                      </span>
                    )}
                  </div>

                  {organization.description ? (
                    <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-600">
                      {organization.description}
                    </p>
                  ) : (
                    <p className="mt-5 text-sm leading-6 text-slate-400">
                      No organization description provided.
                    </p>
                  )}

                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem
                        label="Country"
                        value={organization.country?.name || "Not specified"}
                      />

                      <InfoItem
                        label="Currency"
                        value={organization.currencyId || "Not specified"}
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <Link
                      href={`/organizations/${organization.id}`}
                      className="inline-flex w-full items-center justify-center rounded-xl border border-[#071A33] px-4 py-3 text-sm font-semibold text-[#071A33] transition hover:bg-[#071A33] hover:text-white"
                    >
                      View Organization
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <div className="rounded-3xl bg-[#071A33] px-6 py-10 text-center sm:px-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AF37] font-bold text-[#071A33]">
              TH
            </div>

            <h2 className="mt-5 text-2xl font-bold text-white">
              Bring your procurement process to TenderHub
            </h2>

            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Create and manage procurements, publish solicitations, evaluate
              bids, and manage vendor relationships from one platform.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                href="/auth/register"
                className="rounded-xl bg-[#D4AF37] px-5 py-3 text-sm font-bold text-[#071A33] transition hover:bg-[#e2c65c]"
              >
                Get Started
              </Link>

              <Link
                href="/pricing"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                View Pricing
              </Link>
            </div>
          </div>
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

      <p className="mt-1 truncate text-sm font-medium text-slate-700">
        {value}
      </p>
    </div>
  );
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
