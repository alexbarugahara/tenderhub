import Link from "next/link";

import { prisma } from "@/lib/prisma";

function formatDate(date: Date | null) {
  if (!date) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-UG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function BidsPage() {
  const solicitations = await prisma.solicitation.findMany({
    where: {
      status: {
        in: ["PUBLISHED", "OPEN"],
      },
      OR: [
        {
          closingDate: null,
        },
        {
          closingDate: {
            gte: new Date(),
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      solicitationNumber: true,
      type: true,
      status: true,
      closingDate: true,
      organization: {
        select: {
          name: true,
        },
      },
      currency: {
        select: {
          code: true,
          symbol: true,
        },
      },
    },
    orderBy: {
      closingDate: "asc",
    },
    take: 12,
  });

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              TenderHub bidding
            </p>

            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Submit bids for procurement opportunities
            </h1>

            <p className="mt-4 text-lg leading-7 text-muted-foreground">
              Discover active solicitations, review procurement requirements,
              and submit your bid through TenderHub.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/solicitations"
                className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Browse solicitations
              </Link>

              <Link
                href="/dashboard/vendor"
                className="inline-flex items-center justify-center rounded-lg border bg-background px-5 py-3 text-sm font-semibold transition hover:bg-muted"
              >
                Vendor dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How bidding works */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight">
              How bidding works
            </h2>

            <p className="mt-2 text-muted-foreground">
              TenderHub gives vendors a structured way to discover
              opportunities and submit compliant bids.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
                1
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Find an opportunity
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Browse published solicitations and find procurement
                opportunities relevant to your business.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
                2
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Review requirements
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Review the solicitation requirements, documents, lots,
                evaluation criteria, deadlines, and submission conditions.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
                3
              </div>

              <h3 className="mt-5 text-lg font-semibold">
                Submit your bid
              </h3>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Prepare your proposal, provide the required documentation,
                respond to requirements, and submit your bid securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Active opportunities */}
      <section className="border-t bg-muted/20">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
                Current opportunities
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight">
                Opportunities currently accepting bids
              </h2>

              <p className="mt-2 text-sm text-muted-foreground">
                Review an opportunity before preparing your bid.
              </p>
            </div>

            <Link
              href="/solicitations"
              className="text-sm font-semibold text-tenderhub-navy hover:underline"
            >
              View all solicitations →
            </Link>
          </div>

          {solicitations.length === 0 ? (
            <div className="mt-8 rounded-2xl border bg-card px-6 py-14 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-tenderhub-navy/10 text-xl">
                📋
              </div>

              <h3 className="mt-4 text-lg font-semibold">
                No opportunities are currently accepting bids
              </h3>

              <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
                New procurement opportunities will appear here when
                organizations publish them.
              </p>

              <Link
                href="/solicitations"
                className="mt-5 inline-flex items-center text-sm font-semibold text-tenderhub-navy hover:underline"
              >
                Browse solicitations →
              </Link>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {solicitations.map((solicitation) => (
                <article
                  key={solicitation.id}
                  className="rounded-2xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-tenderhub-navy/10 px-3 py-1 text-xs font-semibold text-tenderhub-navy">
                      {solicitation.status === "OPEN"
                        ? "Open"
                        : "Published"}
                    </span>

                    <span className="text-xs text-muted-foreground">
                      {solicitation.type}
                    </span>
                  </div>

                  <h3 className="mt-5 line-clamp-2 text-lg font-bold">
                    {solicitation.title}
                  </h3>

                  <p className="mt-2 text-xs font-medium text-muted-foreground">
                    {solicitation.solicitationNumber}
                  </p>

                  <div className="mt-5 space-y-3 border-t pt-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Organization
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {solicitation.organization.name}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Bid deadline
                      </p>

                      <p className="mt-1 text-sm font-semibold">
                        {formatDate(solicitation.closingDate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 border-t pt-4">
                    <Link
                      href={`/solicitations/${solicitation.id}`}
                      className="inline-flex items-center text-sm font-semibold text-tenderhub-navy hover:underline"
                    >
                      Review and bid
                      <span className="ml-2" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Vendor CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12">
          <div className="rounded-2xl bg-tenderhub-navy px-6 py-10 text-white sm:px-10">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
                Ready to participate?
              </p>

              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">
                Register your business and start bidding
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
                Create a vendor account to manage your business profile,
                prepare bids, upload documents, respond to solicitation
                requirements, and track your procurement activity.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center rounded-lg bg-tenderhub-gold px-5 py-3 text-sm font-semibold text-tenderhub-navy transition hover:opacity-90"
                >
                  Register as a vendor
                </Link>

                <Link
                  href="/auth/login"
                  className="inline-flex items-center justify-center rounded-lg border border-white/30 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
