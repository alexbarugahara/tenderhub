import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Globe2,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Vendors | TenderHub",
  description:
    "Discover vendors and businesses participating in procurement opportunities on TenderHub.",
};

export default async function VendorsPage() {
  const vendors = await prisma.vendor.findMany({
    orderBy: {
      companyName: "asc",
    },
    take: 24,
    include: {
      user: {
        select: {
          image: true,
        },
      },
      country: true,
      classifications: {
        include: {
          classification: true,
        },
        take: 4,
      },
    },
  });

  const verifiedVendors = vendors.filter(
    (vendor) => vendor.verifiedAt !== null
  );

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#071A33] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              Vendor Directory
            </p>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Discover vendors and businesses.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Explore businesses participating in procurement opportunities
              across industries, markets, and locations through TenderHub.
            </p>
          </div>
        </div>
      </section>

      {/* Search / Intro */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#071A33] text-[#D4AF37]">
                <Search size={22} />
              </div>

              <h2 className="mt-5 text-2xl font-extrabold text-[#071A33]">
                Find businesses by capability
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Vendors can build profiles around their products, services,
                classifications, operating locations, certifications, and
                procurement capabilities.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 px-5 py-4 text-center">
                <div className="text-2xl font-extrabold text-[#071A33]">
                  {vendors.length}
                </div>

                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Vendors shown
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 px-5 py-4 text-center">
                <div className="text-2xl font-extrabold text-[#071A33]">
                  {verifiedVendors.length}
                </div>

                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Verified
                </div>
              </div>

              <div className="col-span-2 rounded-2xl bg-slate-50 px-5 py-4 text-center sm:col-span-1">
                <div className="text-2xl font-extrabold text-[#071A33]">
                  {
                    new Set(
                      vendors
                        .map((vendor) => vendor.country?.name)
                        .filter(Boolean)
                    ).size
                  }
                </div>

                <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Countries
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Directory */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Vendor Directory
            </p>

            <h2 className="mt-3 text-3xl font-extrabold text-[#071A33]">
              Featured vendors
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Browse vendor profiles and explore the businesses registered
              on the TenderHub procurement platform.
            </p>
          </div>

          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071A33] px-6 py-3 font-bold text-white transition hover:bg-[#0d2a4d]"
          >
            Register as a Vendor
            <ArrowRight size={18} />
          </Link>
        </div>

        {vendors.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {vendors.map((vendor) => (
              <article
                key={vendor.id}
                className="group flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Vendor Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#071A33] text-[#D4AF37]">
                    {vendor.user?.image ? (
                      <img
                        src={vendor.user.image}
                        alt={vendor.companyName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 size={26} />
                    )}
                  </div>

                  {vendor.verifiedAt && (
                    <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                      <ShieldCheck size={14} />
                      Verified
                    </div>
                  )}
                </div>

                {/* Company */}
                <div className="mt-6">
                  <h3 className="text-xl font-extrabold text-[#071A33] transition group-hover:text-[#806510]">
                    {vendor.companyName}
                  </h3>

                  {vendor.legalName &&
                    vendor.legalName !== vendor.companyName && (
                      <p className="mt-1 text-sm text-slate-500">
                        {vendor.legalName}
                      </p>
                    )}
                </div>

                {/* Description */}
                <p className="mt-4 line-clamp-3 min-h-[72px] leading-6 text-slate-600">
                  {vendor.description ||
                    "Vendor profile information and procurement capabilities are available on the company profile."}
                </p>

                {/* Location */}
                <div className="mt-6 flex items-center gap-2 text-sm text-slate-600">
                  <Globe2
                    size={17}
                    className="shrink-0 text-[#9c7d18]"
                  />

                  <span>
                    {vendor.country?.name || "International"}
                  </span>
                </div>

                {/* Business Information */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {vendor.businessType && (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {vendor.businessType}
                    </span>
                  )}

                  {vendor.numberOfEmployees && (
                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                      {vendor.numberOfEmployees} employees
                    </span>
                  )}
                </div>

                {/* Classifications */}
                {vendor.classifications.length > 0 && (
                  <div className="mt-6 border-t border-slate-100 pt-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Classifications
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {vendor.classifications.map((item) => (
                        <span
                          key={item.id}
                          className="rounded-lg bg-[#D4AF37]/10 px-3 py-1.5 text-xs font-semibold text-[#806510]"
                        >
                          {item.classification.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* View Profile */}
                <div className="mt-auto pt-7">
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#071A33] px-5 py-3 font-bold text-[#071A33] transition hover:bg-[#071A33] hover:text-white"
                  >
                    View Vendor Profile
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#071A33] text-[#D4AF37]">
              <Users size={30} />
            </div>

            <h3 className="mt-6 text-2xl font-extrabold text-[#071A33]">
              No vendors available yet
            </h3>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-slate-600">
              Vendor profiles will appear here as businesses join the
              TenderHub procurement platform.
            </p>

            <Link
              href="/register"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-6 py-3.5 font-bold text-[#071A33] transition hover:bg-[#e5c45a]"
            >
              Become a Vendor
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>

      {/* Why Join */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              For Vendors
            </p>

            <h2 className="mt-4 text-3xl font-extrabold text-[#071A33] sm:text-4xl">
              Build your procurement presence.
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              Create a professional vendor profile and connect your
              capabilities with procurement opportunities.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-7">
              <Building2 size={28} className="text-[#D4AF37]" />

              <h3 className="mt-5 text-xl font-bold text-[#071A33]">
                Professional profile
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Present your organization, experience, capabilities,
                locations, and business information in one place.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-7">
              <Globe2 size={28} className="text-[#D4AF37]" />

              <h3 className="mt-5 text-xl font-bold text-[#071A33]">
                Global opportunities
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Discover procurement opportunities across countries,
                industries, and classification systems.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-7">
              <ShieldCheck size={28} className="text-[#D4AF37]" />

              <h3 className="mt-5 text-xl font-bold text-[#071A33]">
                Compliance readiness
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Organize certifications, documents, and compliance
                information relevant to procurement participation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#071A33] py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Join TenderHub
          </p>

          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Ready to grow your procurement opportunities?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-300">
            Create your vendor profile and start discovering procurement
            opportunities relevant to your business.
          </p>

          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-7 py-4 font-bold text-[#071A33] transition hover:bg-[#e5c45a]"
          >
            Create Vendor Account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
