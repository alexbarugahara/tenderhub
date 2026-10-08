import Link from "next/link";

export const metadata = {
  title: "About TenderHub | Smarter Procurement",
  description:
    "Learn about TenderHub, a digital procurement platform connecting organizations and vendors through structured procurement workflows.",
};

const features = [
  {
    title: "Procurement Management",
    text: "Plan and organize procurement activities before opportunities are published, with structured procurement records, methods, departments, timelines, and estimated values.",
  },
  {
    title: "Solicitation Management",
    text: "Create and publish structured solicitations with requirements, lots, documents, classifications, deadlines, bid security, fees, and evaluation criteria.",
  },
  {
    title: "Vendor Participation",
    text: "Give vendors a structured environment to discover opportunities, review requirements, prepare bids, submit documents, and track their participation.",
  },
  {
    title: "Evaluation & Awards",
    text: "Support structured bid evaluation, scoring, compliance review, award decisions, and the transition from procurement activity to contract management.",
  },
];

const platformAreas = [
  {
    number: "01",
    title: "For Organizations",
    text: "Plan procurements, create solicitations, define requirements, publish documents, manage bids, evaluate submissions, make awards, and manage contracts.",
  },
  {
    number: "02",
    title: "For Vendors",
    text: "Build a business profile, discover relevant opportunities, review requirements, maintain compliance information, prepare bids, submit documents, and track procurement participation.",
  },
  {
    number: "03",
    title: "Across the Procurement Lifecycle",
    text: "Connect procurement planning, solicitation, bidding, evaluation, awards, contracts, payments, compliance, notifications, and reporting within one digital environment.",
  },
];

const lifecycle = [
  {
    number: "01",
    title: "Plan",
    text: "Organizations define procurement needs, departments, methods, timelines, and estimated values.",
  },
  {
    number: "02",
    title: "Publish",
    text: "Procurement opportunities are transformed into structured solicitations with requirements, documents, lots, and evaluation criteria.",
  },
  {
    number: "03",
    title: "Bid",
    text: "Vendors discover opportunities and submit structured bids and supporting documentation.",
  },
  {
    number: "04",
    title: "Evaluate",
    text: "Organizations review compliance, evaluate submissions, score bids, and progress through the evaluation process.",
  },
  {
    number: "05",
    title: "Award",
    text: "Successful bids can progress to formal awards and notifications.",
  },
  {
    number: "06",
    title: "Contract",
    text: "Awards can progress into contracts with milestones, documents, payments, and ongoing contract activity.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-tenderhub-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="max-w-4xl">
            <span className="inline-flex rounded-full border border-tenderhub-gold/40 bg-tenderhub-gold/10 px-4 py-1.5 text-sm font-semibold text-tenderhub-gold">
              About TenderHub
            </span>

            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Smarter procurement.
              <span className="block text-tenderhub-gold">
                Better opportunities.
              </span>
            </h1>

            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/75 sm:text-xl">
              TenderHub is a digital procurement platform designed to connect
              organizations and vendors while bringing the procurement
              lifecycle into one structured environment.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/solicitations"
                className="inline-flex items-center justify-center rounded-lg bg-tenderhub-gold px-6 py-3 text-sm font-semibold text-tenderhub-navy transition hover:opacity-90"
              >
                Explore opportunities
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Join TenderHub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
                Our platform
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Bringing the procurement lifecycle into one digital
                environment
              </h2>

              <div className="mt-6 space-y-5 text-base leading-8 text-muted-foreground">
                <p>
                  Procurement involves more than publishing an opportunity. It
                  can include planning, requirements, solicitation documents,
                  vendor participation, bid submission, evaluation, awards,
                  contracts, compliance, payments, and ongoing activity.
                </p>

                <p>
                  TenderHub is designed to connect these stages through a
                  structured digital platform. Organizations can manage
                  procurement activities and solicitations, while vendors can
                  discover opportunities and participate through consistent
                  bidding workflows.
                </p>

                <p>
                  The goal is to make procurement information easier to
                  organize, discover, understand, and manage while creating
                  better connections between organizations and capable vendors.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border bg-card p-8 shadow-sm">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-tenderhub-navy text-xl font-bold text-tenderhub-gold">
                TH
              </div>

              <h3 className="mt-6 text-2xl font-bold">
                Smarter Procurement.
                <span className="block text-tenderhub-navy">
                  Better Connections.
                </span>
              </h3>

              <p className="mt-4 leading-7 text-muted-foreground">
                A digital procurement platform built around organizations,
                procurements, solicitations, vendors, bids, evaluations,
                awards, contracts, compliance, and structured workflows.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What TenderHub does */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              What we do
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              A connected platform for procurement
            </h2>

            <p className="mt-4 text-lg leading-7 text-muted-foreground">
              TenderHub brings the major stages of procurement participation
              into a connected digital experience.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border bg-card p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-tenderhub-navy/10 text-sm font-bold text-tenderhub-navy">
                  ✓
                </div>

                <h3 className="mt-5 text-xl font-bold">{feature.title}</h3>

                <p className="mt-3 leading-7 text-muted-foreground">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Procurement lifecycle */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              The procurement lifecycle
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              From procurement planning to contract management
            </h2>

            <p className="mt-4 text-lg leading-7 text-muted-foreground">
              TenderHub is structured around the stages organizations and
              vendors move through during procurement.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {lifecycle.map((stage) => (
              <div
                key={stage.number}
                className="rounded-2xl border bg-card p-7 shadow-sm"
              >
                <span className="text-sm font-bold text-tenderhub-gold">
                  {stage.number}
                </span>

                <h3 className="mt-4 text-xl font-bold">{stage.title}</h3>

                <p className="mt-3 leading-7 text-muted-foreground">
                  {stage.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform areas */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              The TenderHub ecosystem
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Built for the procurement ecosystem
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">
              TenderHub connects the organizations creating procurement
              opportunities with the vendors participating in them while
              supporting the wider procurement lifecycle.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {platformAreas.map((area) => (
              <div
                key={area.number}
                className="rounded-2xl border bg-card p-7 shadow-sm"
              >
                <span className="text-sm font-bold text-tenderhub-gold">
                  {area.number}
                </span>

                <h3 className="mt-4 text-xl font-bold">{area.title}</h3>

                <p className="mt-3 leading-7 text-muted-foreground">
                  {area.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
                Our mission
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                Make procurement more accessible and structured
              </h2>

              <p className="mt-5 leading-8 text-muted-foreground">
                Our mission is to provide organizations and vendors with a
                trusted digital environment where procurement activities and
                opportunities can be planned, published, discovered,
                evaluated, awarded, and managed through structured workflows.
              </p>
            </div>

            <div className="rounded-2xl border bg-card p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
                Our vision
              </p>

              <h2 className="mt-3 text-2xl font-bold">
                A more connected global procurement ecosystem
              </h2>

              <p className="mt-5 leading-8 text-muted-foreground">
                We envision a procurement ecosystem where organizations can
                reach capable vendors more efficiently and businesses can
                discover and participate in opportunities across markets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why TenderHub */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
                Why TenderHub
              </p>

              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Designed around how procurement actually works
              </h2>

              <p className="mt-5 leading-8 text-muted-foreground">
                TenderHub is designed to keep procurement information
                structured from the initial procurement plan through
                solicitation, bidding, evaluation, award, and contract
                management.
              </p>

              <Link
                href="/solicitations"
                className="mt-7 inline-flex items-center text-sm font-semibold text-tenderhub-navy hover:underline"
              >
                Explore current solicitations
                <span className="ml-2" aria-hidden="true">
                  →
                </span>
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-bold">Structured information</h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Requirements, deadlines, documents, lots, classifications,
                  currencies, and evaluation criteria can be organized in a
                  consistent format.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-bold">Better discovery</h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Vendors can discover procurement opportunities through a
                  centralized digital platform.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-bold">Structured bidding</h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Vendors can prepare bids around the specific requirements,
                  lots, documents, and criteria of each solicitation.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-bold">Connected workflows</h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Procurement activities can progress from planning to
                  solicitation, evaluation, award, and contract management
                  within connected workflows.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-bold">Compliance support</h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Vendor documents, certifications, and compliance records can
                  support procurement readiness and participation.
                </p>
              </div>

              <div className="rounded-xl border bg-card p-6">
                <h3 className="font-bold">International foundation</h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Countries, currencies, classifications, organizations, and
                  vendors are part of the platform's broader international
                  architecture.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-tenderhub-navy">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
            Get started
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Build better procurement connections
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/70">
            Explore active procurement opportunities or create your TenderHub
            account and become part of the procurement ecosystem.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/solicitations"
              className="inline-flex items-center justify-center rounded-lg bg-tenderhub-gold px-6 py-3 text-sm font-semibold text-tenderhub-navy transition hover:opacity-90"
            >
              Browse solicitations
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}