export default function Loading() {
  return (
    <main className="min-h-screen bg-background">
      <section className="border-b bg-tenderhub-navy">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <div className="h-4 w-32 animate-pulse rounded bg-tenderhub-gold/40" />

            <div className="mt-5 h-10 w-full max-w-2xl animate-pulse rounded-lg bg-white/15 sm:h-12" />

            <div className="mt-4 h-5 w-full max-w-xl animate-pulse rounded bg-white/10" />
            <div className="mt-2 h-5 w-4/5 max-w-lg animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12 sm:px-8 lg:px-12">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border bg-card shadow-sm"
            >
              <div className="aspect-[16/9] animate-pulse bg-muted" />

              <div className="p-6">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />

                <div className="mt-4 h-6 w-full animate-pulse rounded bg-muted" />
                <div className="mt-2 h-6 w-4/5 animate-pulse rounded bg-muted" />

                <div className="mt-5 h-4 w-full animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-11/12 animate-pulse rounded bg-muted" />
                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}