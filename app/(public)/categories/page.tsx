import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Globe2,
  Layers3,
  Search,
  ShieldCheck,
} from "lucide-react";

import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Categories & Classifications | TenderHub",
  description:
    "Explore procurement categories and classification systems used to organize solicitations and vendor capabilities on TenderHub.",
};

const classificationTypes = [
  {
    type: "UNSPSC",
    title: "UNSPSC",
    description:
      "A global classification system for products and services used across procurement and supply chains.",
    icon: Globe2,
  },
  {
    type: "NAICS",
    title: "NAICS",
    description:
      "Industry classification used to identify and organize businesses by economic activity.",
    icon: Building2,
  },
  {
    type: "PSC",
    title: "PSC",
    description:
      "Product and Service Codes used to classify products and services in procurement.",
    icon: BriefcaseBusiness,
  },
  {
    type: "CUSTOM",
    title: "Custom Classifications",
    description:
      "Organization-specific classifications for procurement requirements and specialized categories.",
    icon: Layers3,
  },
];

export default async function CategoriesPage() {
  const classifications = await prisma.classification.findMany({
    where: {
      parentId: null,
    },
    orderBy: [
      {
        type: "asc",
      },
      {
        name: "asc",
      },
    ],
    include: {
      children: {
        orderBy: {
          name: "asc",
        },
        take: 6,
      },
    },
  });

  const groupedClassifications = classificationTypes.map((system) => ({
    ...system,
    items: classifications.filter(
      (classification) => classification.type === system.type
    ),
  }));

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#071A33] py-24 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,175,55,0.16),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
              Procurement Classifications
            </p>

            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Explore procurement categories.
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Discover how products, services, industries, and procurement
              opportunities are organized across TenderHub&apos;s
              classification systems.
            </p>
          </div>
        </div>
      </section>

      {/* Search / Intro */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#071A33] text-[#D4AF37]">
                <Search size={21} />
              </div>

              <h2 className="mt-5 text-2xl font-extrabold text-[#071A33]">
                Find opportunities by category
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                Classification systems make it easier for organizations
                to structure procurement requirements and for vendors to
                identify opportunities relevant to their capabilities.
              </p>
            </div>

            <Link
              href="/solicitations"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#071A33] px-6 py-3.5 font-bold text-white transition hover:bg-[#0d2a4d]"
            >
              Browse Solicitations
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Classification Systems */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Classification Systems
          </p>

          <h2 className="mt-3 text-3xl font-extrabold text-[#071A33]">
            Organize procurement globally
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-600">
            TenderHub supports multiple classification approaches so
            organizations and vendors can work with procurement structures
            appropriate to their markets and industries.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {groupedClassifications.map((system) => {
            const Icon = system.icon;

            return (
              <div
                key={system.type}
                className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#071A33] text-[#D4AF37]">
                    <Icon size={23} />
                  </div>

                  <span className="rounded-full bg-[#D4AF37]/15 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#806510]">
                    {system.type}
                  </span>
                </div>

                <h3 className="mt-6 text-2xl font-extrabold text-[#071A33]">
                  {system.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600">
                  {system.description}
                </p>

                <div className="mt-6">
                  {system.items.length > 0 ? (
                    <div className="space-y-2">
                      {system.items.slice(0, 4).map((classification) => (
                        <div
                          key={classification.id}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                        >
                          <div>
                            <p className="font-semibold text-[#071A33]">
                              {classification.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-500">
                              {classification.code}
                            </p>
                          </div>

                          {classification.children.length > 0 && (
                            <span className="text-xs font-semibold text-slate-500">
                              {classification.children.length}{" "}
                              {classification.children.length === 1
                                ? "subcategory"
                                : "subcategories"}
                            </span>
                          )}
                        </div>
                      ))}

                      {system.items.length > 4 && (
                        <p className="pt-2 text-sm font-semibold text-[#806510]">
                          Showing 4 of {system.items.length} classifications
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-6 text-center">
                      <p className="text-sm text-slate-500">
                        No classifications have been published yet.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Classification Matters */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
              Why classifications matter
            </p>

            <h2 className="mt-4 text-3xl font-extrabold text-[#071A33] sm:text-4xl">
              Better classification. Better procurement discovery.
            </h2>

            <p className="mt-5 leading-8 text-slate-600">
              Structured classifications help connect procurement
              requirements with vendors that provide the relevant products
              and services.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 p-7">
              <Globe2 className="text-[#D4AF37]" size={28} />

              <h3 className="mt-5 text-xl font-bold text-[#071A33]">
                Global structure
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Use recognized classification systems across different
                countries, industries, and procurement environments.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-7">
              <Search className="text-[#D4AF37]" size={28} />

              <h3 className="mt-5 text-xl font-bold text-[#071A33]">
                Easier discovery
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Help vendors find relevant solicitations and help
                organizations reach vendors with appropriate capabilities.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-7">
              <ShieldCheck className="text-[#D4AF37]" size={28} />

              <h3 className="mt-5 text-xl font-bold text-[#071A33]">
                Structured procurement
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                Maintain consistent procurement categories across
                solicitations, vendor profiles, and procurement activities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#071A33] py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Get started
          </p>

          <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
            Ready to explore procurement opportunities?
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-8 text-slate-300">
            Browse active solicitations or create a vendor profile to
            discover opportunities relevant to your business.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/solicitations"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-7 py-4 font-bold text-[#071A33] transition hover:bg-[#e5c45a]"
            >
              Browse Solicitations
              <ArrowRight size={18} />
            </Link>

            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 px-7 py-4 font-bold text-white transition hover:bg-white/10"
            >
              Create an Account
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}