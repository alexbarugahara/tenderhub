import Link from "next/link";

export const metadata = {
  title: "Page Not Found | TenderHub",
  description:
    "The page you are looking for could not be found on TenderHub.",
};

export default function NotFound() {
  return (
    <main className="min-h-[calc(100vh-8rem)] bg-background">
      <section className="relative flex min-h-[calc(100vh-8rem)] items-center overflow-hidden bg-tenderhub-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.18),transparent_35%)]" />

        <div className="relative mx-auto w-full max-w-4xl px-6 py-20 text-center sm:px-8 lg:px-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-tenderhub-gold text-2xl font-bold text-tenderhub-navy">
            TH
          </div>

          <p className="mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-tenderhub-gold">
            404 · Page not found
          </p>

          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            We couldn't find that page
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/70">
            The page may have been moved, removed, or the address may be
            incorrect. You can continue exploring procurement opportunities,
            organizations, and vendors on TenderHub.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg bg-tenderhub-gold px-6 py-3 text-sm font-semibold text-tenderhub-navy transition hover:opacity-90"
            >
              Back to home
            </Link>

            <Link
              href="/solicitations"
              className="inline-flex items-center justify-center rounded-lg border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Browse solicitations
            </Link>
          </div>

          <div className="mx-auto mt-14 grid max-w-2xl gap-4 sm:grid-cols-3">
            <Link
              href="/solicitations"
              className="rounded-xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10"
            >
              <p className="text-sm font-semibold text-tenderhub-gold">
                Solicitations
              </p>

              <p className="mt-2 text-sm leading-6 text-white/60">
                Discover current procurement opportunities.
              </p>
            </Link>

            <Link
              href="/organizations"
              className="rounded-xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10"
            >
              <p className="text-sm font-semibold text-tenderhub-gold">
                Organizations
              </p>

              <p className="mt-2 text-sm leading-6 text-white/60">
                Explore organizations publishing opportunities.
              </p>
            </Link>

            <Link
              href="/vendors"
              className="rounded-xl border border-white/10 bg-white/5 p-5 text-left transition hover:bg-white/10"
            >
              <p className="text-sm font-semibold text-tenderhub-gold">
                Vendors
              </p>

              <p className="mt-2 text-sm leading-6 text-white/60">
                Discover vendors and their capabilities.
              </p>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}