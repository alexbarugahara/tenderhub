"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Code2,
  Factory,
  HeartPulse,
  Leaf,
  Truck,
  GraduationCap,
  BriefcaseBusiness,
  Wrench,
} from "lucide-react";

interface ProcurementCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  searchTerm: string;
}

const categories: ProcurementCategory[] = [
  {
    id: "construction",
    name: "Construction & Infrastructure",
    description:
      "Construction, civil works, infrastructure, renovation, and related services.",
    icon: Building2,
    searchTerm: "construction infrastructure",
  },
  {
    id: "technology",
    name: "Information Technology",
    description:
      "Software, hardware, cloud services, cybersecurity, and IT solutions.",
    icon: Code2,
    searchTerm: "information technology",
  },
  {
    id: "manufacturing",
    name: "Manufacturing & Supplies",
    description:
      "Equipment, machinery, manufactured goods, materials, and industrial supplies.",
    icon: Factory,
    searchTerm: "manufacturing supplies",
  },
  {
    id: "healthcare",
    name: "Healthcare & Medical",
    description:
      "Medical supplies, equipment, pharmaceuticals, healthcare services, and facilities.",
    icon: HeartPulse,
    searchTerm: "healthcare medical",
  },
  {
    id: "agriculture",
    name: "Agriculture & Food",
    description:
      "Agricultural products, farming equipment, food supplies, and related services.",
    icon: Leaf,
    searchTerm: "agriculture food",
  },
  {
    id: "transport",
    name: "Transport & Logistics",
    description:
      "Vehicles, transportation, freight, logistics, warehousing, and fleet services.",
    icon: Truck,
    searchTerm: "transport logistics",
  },
  {
    id: "education",
    name: "Education & Training",
    description:
      "Educational supplies, training services, learning technology, and consultancy.",
    icon: GraduationCap,
    searchTerm: "education training",
  },
  {
    id: "professional",
    name: "Professional Services",
    description:
      "Consulting, accounting, legal, financial, advisory, and professional services.",
    icon: BriefcaseBusiness,
    searchTerm: "professional services",
  },
  {
    id: "maintenance",
    name: "Maintenance & Technical Services",
    description:
      "Maintenance, repairs, engineering, installation, and technical support services.",
    icon: Wrench,
    searchTerm: "maintenance technical services",
  },
];

interface CategoriesProps {
  title?: string;
  description?: string;
  categories?: ProcurementCategory[];
  showAllLink?: boolean;
  className?: string;
}

export default function Categories({
  title = "Explore Procurement Categories",
  description = "Find opportunities across industries and service areas that match your business capabilities.",
  categories: customCategories,
  showAllLink = true,
  className = "",
}: CategoriesProps) {
  const items = customCategories ?? categories;

  return (
    <section className={`bg-tenderhub-background py-16 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
              Procurement Categories
            </p>

            <h2 className="text-3xl font-bold tracking-tight text-tenderhub-navy sm:text-4xl">
              {title}
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-600">
              {description}
            </p>
          </div>

          {showAllLink && (
            <Link
              href="/solicitations"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-tenderhub-navy transition hover:text-tenderhub-gold"
            >
              View all solicitations
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-sm text-slate-500">
              No procurement categories are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((category) => {
              const Icon = category.icon;

              return (
                <Link
                  key={category.id}
                  href={`/solicitations?search=${encodeURIComponent(
                    category.searchTerm
                  )}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-tenderhub-gold/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy/5 text-tenderhub-navy transition group-hover:bg-tenderhub-gold/15 group-hover:text-tenderhub-gold">
                      <Icon className="h-6 w-6" />
                    </div>

                    <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-tenderhub-gold" />
                  </div>

                  <h3 className="mt-5 text-lg font-semibold text-tenderhub-navy">
                    {category.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {category.description}
                  </p>

                  <div className="mt-5 text-sm font-semibold text-tenderhub-navy group-hover:text-tenderhub-gold">
                    Browse opportunities
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-tenderhub-navy/10 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-tenderhub-navy">
                Looking for a specific classification?
              </p>

              <p className="mt-1 text-sm text-slate-500">
                TenderHub can organize procurement using NAICS, PSC, UNSPSC,
                and custom classifications.
              </p>
            </div>

            <Link
              href="/solicitations"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:bg-tenderhub-navy/90"
            >
              Search classifications
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}