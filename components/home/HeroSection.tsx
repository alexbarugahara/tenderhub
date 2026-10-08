"use client";

import Link from "next/link";
import { Search, ArrowRight, Building2, Store } from "lucide-react";
import { useState } from "react";

interface HeroSectionProps {
  solicitationCount?: number;
  organizationCount?: number;
  vendorCount?: number;
}

export default function HeroSection({
  solicitationCount,
  organizationCount,
  vendorCount,
}: HeroSectionProps) {
  const [search, setSearch] = useState("");

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const query = search.trim();

    if (!query) {
      window.location.href = "/solicitations";
      return;
    }

    window.location.href = `/solicitations?search=${encodeURIComponent(query)}`;
  };

  return (
    <section className="relative overflow-hidden bg-tenderhub-navy text-white">
      <div className="absolute inset-0">
        <div className="absolute left-[-120px] top-[-120px] h-[360px] w-[360px] rounded-full bg-tenderhub-gold/10 blur-3xl" />
        <div className="absolute bottom-[-180px] right-[-120px] h-[420px] w-[420px] rounded-full bg-white/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center rounded-full border border-tenderhub-gold/30 bg-white/5 px-4 py-2 text-sm font-medium text-tenderhub-gold">
            Smarter Procurement. Stronger Business.
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Find Procurement Opportunities.
            <span className="block text-tenderhub-gold">
              Submit Competitive Bids.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-white/75 sm:text-lg">
            TenderHub connects organizations with qualified vendors through a
            structured procurement platform for solicitations, bids,
            evaluations, awards, and contracts.
          </p>

          <form
            onSubmit={handleSearch}
            className="mx-auto mt-10 flex max-w-3xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-2xl sm:flex-row"
          >
            <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-white px-4">
              <Search className="mr-3 h-5 w-5 shrink-0 text-slate-400" />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search solicitations, services, or procurement opportunities..."
                className="w-full border-0 bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                aria-label="Search procurement opportunities"
              />
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-tenderhub-gold px-6 py-3 font-semibold text-tenderhub-navy transition hover:opacity-90"
            >
              Search
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/solicitations"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-tenderhub-navy transition hover:bg-white/90"
            >
              Browse Solicitations
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Create an Account
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-gold/15 text-tenderhub-gold">
              <Search className="h-5 w-5" />
            </div>

            <p className="text-2xl font-bold">
              {typeof solicitationCount === "number"
                ? solicitationCount.toLocaleString()
                : "—"}
            </p>

            <p className="mt-1 text-sm text-white/60">
              Procurement Opportunities
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-gold/15 text-tenderhub-gold">
              <Building2 className="h-5 w-5" />
            </div>

            <p className="text-2xl font-bold">
              {typeof organizationCount === "number"
                ? organizationCount.toLocaleString()
                : "—"}
            </p>

            <p className="mt-1 text-sm text-white/60">
              Organizations
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-gold/15 text-tenderhub-gold">
              <Store className="h-5 w-5" />
            </div>

            <p className="text-2xl font-bold">
              {typeof vendorCount === "number"
                ? vendorCount.toLocaleString()
                : "—"}
            </p>

            <p className="mt-1 text-sm text-white/60">
              Registered Vendors
            </p>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-4xl text-center">
          <p className="text-xs leading-5 text-white/45">
            Discover opportunities, manage procurement processes, and build
            stronger commercial relationships through one platform.
          </p>
        </div>
      </div>
    </section>
  );
}