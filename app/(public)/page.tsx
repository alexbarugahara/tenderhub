import Link from "next/link";

import { prisma } from "@/lib/prisma";

const lifecycle = [
  {
    number: "01",
    title: "Plan",
    description:
      "Build your procurement pipeline, organize activities, and prepare upcoming purchases.",
    dark: true,
  },
  {
    number: "02",
    title: "Publish",
    description:
      "Create structured solicitations, define lots and requirements, and publish opportunities.",
  },
  {
    number: "03",
    title: "Receive",
    description:
      "Give vendors a centralized way to discover opportunities and submit bids digitally.",
  },
  {
    number: "04",
    title: "Evaluate",
    description:
      "Evaluate bids against defined criteria and manage the procurement evaluation process.",
    dark: true,
  },
  {
    number: "05",
    title: "Award",
    description:
      "Manage procurement decisions, awards, and the transition from evaluation to contract.",
  },
  {
    number: "06",
    title: "Contract",
    description:
      "Move successful procurements into contract management and track the resulting relationship.",
  },
];

const features = [
  {
    title: "Structured Procurement",
    description:
      "Manage procurement planning, solicitations, lots, requirements, bids, evaluations, awards, and contracts through one connected workflow.",
  },
  {
    title: "Better Vendor Participation",
    description:
      "Give vendors a centralized place to discover relevant opportunities, maintain their profiles, and participate in procurement processes.",
  },
  {
    title: "Transparent Evaluation",
    description:
      "Define evaluation criteria and manage structured bid evaluations within the procurement workflow.",
  },
  {
    title: "Procurement Visibility",
    description:
      "Keep procurement activities, opportunities, vendor participation, evaluations, and awards organized in one platform.",
  },
];

const platformAreas = [
  {
    title: "For Organizations",
    description:
      "Plan procurements, publish solicitations, manage requirements, receive bids, evaluate submissions, issue awards, and manage contracts.",
    href: "/auth/register",
    action: "Start Managing Procurement",
  },
  {
    title: "For Vendors",
    description:
      "Build your company profile, discover relevant solicitations, submit bids, manage compliance information, and track procurement participation.",
    href: "/auth/register",
    action: "Join TenderHub as a Vendor",
  },
];

export default async function PublicHomePage() {
  const recentSolicitations = await prisma.solicitation.findMany({
    where: {
      status: {
        in: ["PUBLISHED", "OPEN"],
      },
    },
    orderBy: {
      publishedAt: "desc",
    },
    take: 6,
    include: {
      organization: {
        select: {
          id: true,
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
  });

  return (
    <div className="bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-tenderhub-navy/10 via-background to-tenderhub-gold/10" />

        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 sm:py-28 lg:px-12">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-6 inline-flex items-center rounded-full border bg-background/80 px-4 py-2 text-sm font-medium shadow-sm backdrop-blur">
                Modern U.S. Procurement Platform
              </div>

              <h1 className="max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Run your entire procurement process{" "}
                <span className="text-tenderhub-gold">in one place.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Plan procurements, publish solicitations, receive bids,
                evaluate vendors, issue awards, and manage contracts through
                one connected digital platform.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/solicitations"
                  className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                >
                  Explore Opportunities
                </Link>

                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center rounded-lg border border-tenderhub-navy px-6 py-3.5 text-sm font-semibold text-tenderhub-navy transition hover:bg-tenderhub-navy hover:text-white"
                >
                  Start Managing Procurement
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span>✓ Procurement planning</span>
                <span>✓ Digital solicitations</span>
                <span>✓ Bid evaluation</span>
                <span>✓ Awards & contracts</span>
              </div>
            </div>

            {/* Product preview */}
            <div className="relative">
              <div className="overflow-hidden rounded-2xl border bg-card shadow-2xl">
                <div className="border-b bg-muted/40 px-5 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        TenderHub
                      </p>

                      <p className="mt-1 font-semibold">
                        Procurement Workspace
                      </p>
                    </div>

                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                      Active
                    </span>
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <DashboardPreviewCard
                    label="Procurements"
                    value="12"
                    detail="Across active workflows"
                  />

                  <DashboardPreviewCard
                    label="Solicitations"
                    value="8"
                    detail="Published & open"
                  />

                  <DashboardPreviewCard
                    label="Bids"
                    value="34"
                    detail="Vendor submissions"
                  />

                  <DashboardPreviewCard
                    label="Evaluations"
                    value="6"
                    detail="Currently in review"
                  />
                </div>

                <div className="mx-5 mb-5 rounded-xl border bg-muted/20 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">
                        Procurement lifecycle
                      </p>

                      <p className="mt-1 font-semibold">
                        Plan → Publish → Receive → Evaluate
                      </p>
                    </div>

                    <div className="rounded-lg bg-tenderhub-navy px-3 py-2 text-xs font-semibold text-white">
                      View
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Procurement Lifecycle */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              One platform. Every stage.
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From procurement planning to contract management.
            </h2>

            <p className="mt-5 leading-7 text-muted-foreground">
              TenderHub connects the major stages of the procurement lifecycle
              so organizations can manage procurement activities through one
              structured workflow.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lifecycle.map((item) => (
              <ProcessCard
                key={item.number}
                number={item.number}
                title={item.title}
                description={item.description}
                dark={item.dark}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Recent Opportunities */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
                Opportunities
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Explore procurement opportunities
              </h2>

              <p className="mt-4 max-w-2xl text-muted-foreground">
                Discover current solicitations published through TenderHub.
              </p>
            </div>

            <Link
              href="/solicitations"
              className="text-sm font-semibold text-tenderhub-navy hover:underline"
            >
              View all opportunities →
            </Link>
          </div>

          {recentSolicitations.length > 0 ? (
            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {recentSolicitations.map((solicitation) => (
                <Link
                  key={solicitation.id}
                  href={`/solicitations/${solicitation.id}`}
                  className="group rounded-2xl border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <span className="rounded-full bg-tenderhub-navy/5 px-3 py-1.5 text-xs font-semibold text-tenderhub-navy">
                      {solicitation.solicitationNumber}
                    </span>

                    <span className="rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                      {formatStatus(solicitation.status)}
                    </span>
                  </div>

                  <h3 className="mt-5 line-clamp-2 text-lg font-semibold transition group-hover:text-tenderhub-navy">
                    {solicitation.title}
                  </h3>

                  <p className="mt-2 text-sm text-muted-foreground">
                    {solicitation.organization.name}
                  </p>

                  <div className="mt-6 space-y-3 border-t pt-5">
                    <OpportunityRow
                      label="Type"
                      value={formatStatus(solicitation.type)}
                    />

                    <OpportunityRow
                      label="Estimated value"
                      value={
                        solicitation.estimatedValue !== null
                          ? formatAmount(
                              solicitation.estimatedValue,
                              solicitation.currency?.code
                            )
                          : "Not specified"
                      }
                    />

                    <OpportunityRow
                      label="Closing"
                      value={
                        solicitation.closingDate
                          ? formatDate(solicitation.closingDate)
                          : "Not specified"
                      }
                    />
                  </div>

                  <div className="mt-6 text-sm font-semibold text-tenderhub-navy">
                    View opportunity →
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border bg-card p-12 text-center shadow-sm">
              <h3 className="text-lg font-semibold">
                No active opportunities yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                Procurement opportunities will appear here as organizations
                publish solicitations on TenderHub.
              </p>

              <Link
                href="/auth/register"
                className="mt-6 inline-flex rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white"
              >
                Register an Organization
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Why TenderHub */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              Why TenderHub
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              One platform for the procurement workflow.
            </h2>

            <p className="mt-4 text-muted-foreground">
              A structured digital environment for organizations and vendors.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border bg-card p-7 shadow-sm"
              >
                <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-lg bg-tenderhub-navy text-lg font-bold text-white">
                  ✓
                </div>

                <h3 className="text-lg font-semibold">{feature.title}</h3>

                <p className="mt-3 leading-7 text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Organizations / Vendors */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              Built for both sides of procurement
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Organizations and vendors, connected.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {platformAreas.map((area) => (
              <div
                key={area.title}
                className="rounded-2xl border bg-card p-8 shadow-sm"
              >
                <h2 className="text-2xl font-bold">{area.title}</h2>

                <p className="mt-4 leading-7 text-muted-foreground">
                  {area.description}
                </p>

                <Link
                  href={area.href}
                  className="mt-6 inline-flex items-center text-sm font-semibold text-tenderhub-navy hover:underline"
                >
                  {area.action}

                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* U.S. Procurement */}
      <section className="border-t">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
                Built for U.S. procurement
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Modern procurement across the United States.
              </h2>

              <p className="mt-4 leading-7 text-muted-foreground">
                TenderHub provides organizations and vendors with a structured
                digital environment for discovering opportunities,
                participating in solicitations, managing bids, and moving
                procurement activities through the lifecycle.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/organizations"
                  className="rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
                >
                  Organizations
                </Link>

                <Link
                  href="/vendors"
                  className="rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
                >
                  Vendors
                </Link>

                <Link
                  href="/categories"
                  className="rounded-lg border px-4 py-2.5 text-sm font-semibold transition hover:bg-muted"
                >
                  Classifications
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
                Procurement workflow
              </p>

              <h3 className="mt-3 text-2xl font-bold">
                Plan. Publish. Evaluate. Award.
              </h3>

              <p className="mt-4 leading-7 text-muted-foreground">
                Keep procurement activities organized through a connected
                workflow designed for organizations and their vendor
                communities.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  "Planning",
                  "Solicitations",
                  "Requirements",
                  "Bid submissions",
                  "Evaluations",
                  "Awards",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-lg bg-muted px-4 py-3 text-sm font-medium"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t bg-tenderhub-navy text-white">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to make procurement smarter?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/75">
            Discover procurement opportunities or bring your organization
            online with TenderHub.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/solicitations"
              className="inline-flex items-center justify-center rounded-lg bg-tenderhub-gold px-6 py-3.5 text-sm font-semibold text-tenderhub-navy transition hover:opacity-90"
            >
              Explore Opportunities
            </Link>

            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center rounded-lg border border-white/30 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function DashboardPreviewCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border bg-background p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <div className="mt-2 text-2xl font-bold text-tenderhub-navy">
        {value}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function ProcessCard({
  number,
  title,
  description,
  dark = false,
}: {
  number: string;
  title: string;
  description: string;
  dark?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-6 shadow-sm ${
        dark ? "bg-tenderhub-navy text-white" : "bg-card"
      }`}
    >
      <div className="text-xs font-bold tracking-widest text-tenderhub-gold">
        {number}
      </div>

      <div
        className={`mt-4 text-xl font-bold ${
          dark ? "text-white" : "text-tenderhub-navy"
        }`}
      >
        {title}
      </div>

      <p
        className={`mt-2 text-sm leading-6 ${
          dark ? "text-white/70" : "text-muted-foreground"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

function OpportunityRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-medium text-muted-foreground">
        {label}
      </span>

      <span className="truncate text-right text-xs font-semibold text-foreground">
        {value}
      </span>
    </div>
  );
}

function formatStatus(value: string) {
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

  const formatted = amount.toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return currencyCode ? `${currencyCode} ${formatted}` : formatted;
}
