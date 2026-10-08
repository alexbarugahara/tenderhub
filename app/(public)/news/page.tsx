import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Procurement News & Insights | TenderHub",
  description:
    "Stay informed with procurement news, business insights, tender developments, and procurement trends from TenderHub.",
};

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getInitials(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export default async function NewsPage() {
  const articles = await prisma.news.findMany({
    where: {
      published: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 24,
    select: {
      id: true,
      title: true,
      slug: true,
      summary: true,
      image: true,
      createdAt: true,
    },
  });

  const featuredArticle = articles[0];
  const latestArticles = articles.slice(1);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-tenderhub-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              TenderHub Insights
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              Procurement News & Insights
            </h1>

            <p className="mt-6 text-lg leading-8 text-white/75">
              Stay informed about procurement developments, business trends,
              tender opportunities, and practical insights for organizations
              and vendors.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/solicitations"
                className="inline-flex items-center justify-center rounded-lg bg-tenderhub-gold px-6 py-3 text-sm font-semibold text-tenderhub-navy transition hover:opacity-90"
              >
                Browse solicitations
              </Link>

              <Link
                href="/about"
                className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                About TenderHub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* News content */}
      {articles.length === 0 ? (
        <section className="mx-auto max-w-4xl px-6 py-20 text-center sm:px-8">
          <div className="rounded-2xl border bg-card p-10 shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-tenderhub-navy text-xl font-bold text-tenderhub-gold">
              TH
            </div>

            <h2 className="mt-6 text-2xl font-bold">
              Procurement insights are coming soon
            </h2>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
              TenderHub will publish procurement news, business insights, and
              industry developments here.
            </p>

            <Link
              href="/solicitations"
              className="mt-7 inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Browse solicitations
            </Link>
          </div>
        </section>
      ) : (
        <>
          {/* Featured article */}
          {featuredArticle && (
            <section>
              <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12">
                <div className="grid overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid-cols-2">
                  <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden bg-tenderhub-navy">
                    {featuredArticle.image ? (
                      <img
                        src={featuredArticle.image}
                        alt={featuredArticle.title}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <div className="relative text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-tenderhub-gold text-2xl font-bold text-tenderhub-navy">
                          {getInitials(featuredArticle.title)}
                        </div>

                        <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
                          Featured insight
                        </p>

                        <p className="mt-2 text-2xl font-bold text-white">
                          Smarter Procurement.
                          <span className="block text-white/70">
                            Better Opportunities.
                          </span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-8 sm:p-10">
                    <span className="inline-flex rounded-full bg-tenderhub-navy/10 px-3 py-1 text-xs font-semibold text-tenderhub-navy">
                      Featured
                    </span>

                    <h2 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
                      {featuredArticle.title}
                    </h2>

                    <p className="mt-4 leading-7 text-muted-foreground">
                      {featuredArticle.summary}
                    </p>

                    <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground">
                      <span>TenderHub Editorial</span>
                      <span>•</span>
                      <span>{formatDate(featuredArticle.createdAt)}</span>
                    </div>

                    <Link
                      href={`/news/${featuredArticle.slug}`}
                      className="mt-7 inline-flex items-center text-sm font-semibold text-tenderhub-navy hover:underline"
                    >
                      Read article
                      <span className="ml-2" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Latest articles */}
          <section className="border-t bg-muted/30">
            <div className="mx-auto max-w-7xl px-6 py-14 sm:px-8 lg:px-12 lg:py-20">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
                  Latest
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight">
                  News & insights
                </h2>

                <p className="mt-2 text-muted-foreground">
                  Practical information for organizations and vendors.
                </p>
              </div>

              {latestArticles.length > 0 ? (
                <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {latestArticles.map((article) => (
                    <article
                      key={article.id}
                      className="group flex flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      {article.image ? (
                        <div className="aspect-[16/9] overflow-hidden bg-muted">
                          <img
                            src={article.image}
                            alt={article.title}
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[16/9] items-center justify-center bg-tenderhub-navy">
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-tenderhub-gold text-lg font-bold text-tenderhub-navy">
                            {getInitials(article.title)}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full bg-tenderhub-navy/10 px-3 py-1 text-xs font-semibold text-tenderhub-navy">
                            Procurement
                          </span>

                          <span className="text-xs text-muted-foreground">
                            {formatDate(article.createdAt)}
                          </span>
                        </div>

                        <h2 className="mt-5 text-xl font-bold leading-7 tracking-tight group-hover:text-tenderhub-navy">
                          {article.title}
                        </h2>

                        <p className="mt-4 flex-1 text-sm leading-6 text-muted-foreground">
                          {article.summary}
                        </p>

                        <div className="mt-6 border-t pt-4">
                          <Link
                            href={`/news/${article.slug}`}
                            className="text-sm font-semibold text-tenderhub-navy hover:underline"
                          >
                            Read article →
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-10 rounded-2xl border bg-card p-8 text-center">
                  <p className="text-muted-foreground">
                    More procurement insights will be published soon.
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {/* For organizations and vendors */}
      <section>
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12 lg:py-20">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              Procurement knowledge
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight">
              Insights for the entire procurement ecosystem
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">
              Whether you publish procurement opportunities or compete for
              them, TenderHub insights are designed to help you make better
              decisions.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border bg-card p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-tenderhub-navy text-sm font-bold text-tenderhub-gold">
                O
              </div>

              <h3 className="mt-5 text-xl font-bold">For organizations</h3>

              <p className="mt-3 leading-7 text-muted-foreground">
                Learn about procurement trends, supplier participation,
                digital procurement workflows, and ways organizations can
                improve how they publish and manage opportunities.
              </p>

              <Link
                href="/register"
                className="mt-5 inline-flex text-sm font-semibold text-tenderhub-navy hover:underline"
              >
                Join as an organization →
              </Link>
            </div>

            <div className="rounded-2xl border bg-card p-7 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-tenderhub-navy text-sm font-bold text-tenderhub-gold">
                V
              </div>

              <h3 className="mt-5 text-xl font-bold">For vendors</h3>

              <p className="mt-3 leading-7 text-muted-foreground">
                Get practical guidance on finding relevant solicitations,
                understanding requirements, preparing bids, and improving your
                procurement readiness.
              </p>

              <Link
                href="/solicitations"
                className="mt-5 inline-flex text-sm font-semibold text-tenderhub-navy hover:underline"
              >
                Find opportunities →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
            Stay informed
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight">
            Never miss important procurement updates
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-muted-foreground">
            Stay up to date with procurement insights, business opportunities,
            and developments relevant to organizations and vendors.
          </p>

          <form
            action="#"
            className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row"
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>

            <input
              id="newsletter-email"
              type="email"
              placeholder="Enter your email address"
              className="min-w-0 flex-1 rounded-lg border bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-tenderhub-navy"
            />

            <button
              type="submit"
              className="rounded-lg bg-tenderhub-navy px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Subscribe
            </button>
          </form>

          <p className="mt-3 text-xs text-muted-foreground">
            We respect your inbox and will only send relevant updates.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-tenderhub-navy">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center sm:px-8 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
            Take the next step
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Turn procurement information into opportunities
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-white/70">
            Explore current solicitations on TenderHub or create an account to
            participate in the procurement ecosystem.
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