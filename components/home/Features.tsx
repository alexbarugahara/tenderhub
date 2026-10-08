"use client";

import Link from "next/link";
import {
  ArrowRight,
  ClipboardCheck,
  FileCheck2,
  Gavel,
  Handshake,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const features: Feature[] = [
  {
    id: "opportunities",
    title: "Discover Opportunities",
    description:
      "Search and explore published solicitations by industry, procurement type, location, classification, and closing date.",
    icon: SearchCheck,
    href: "/solicitations",
  },
  {
    id: "bidding",
    title: "Manage Bids",
    description:
      "Prepare bid responses, upload required documents, respond to requirements, and submit bids through a structured workflow.",
    icon: ClipboardCheck,
    href: "/bids",
  },
  {
    id: "evaluation",
    title: "Structured Evaluation",
    description:
      "Organizations can evaluate bids against defined criteria, assign scores, record comments, and manage evaluation workflows.",
    icon: FileCheck2,
    href: "/auth/register",
  },
  {
    id: "awards",
    title: "Transparent Awards",
    description:
      "Manage award decisions, award amounts, vendors, notices, and the transition from evaluated bids to awarded contracts.",
    icon: Gavel,
    href: "/auth/register",
  },
  {
    id: "contracts",
    title: "Contract Management",
    description:
      "Track contracts, documents, milestones, payments, status changes, and important contract dates in one place.",
    icon: Handshake,
    href: "/auth/register",
  },
  {
    id: "compliance",
    title: "Vendor Compliance",
    description:
      "Manage registration, tax, licensing, insurance, financial, professional, and other vendor compliance requirements.",
    icon: ShieldCheck,
    href: "/auth/register",
  },
];

interface FeaturesProps {
  features?: Feature[];
  title?: string;
  description?: string;
  showAction?: boolean;
  className?: string;
}

export default function Features({
  features: customFeatures,
  title = "Everything You Need for Modern Procurement",
  description = "TenderHub brings procurement organizations and vendors together through one structured platform, from opportunity discovery to contract management.",
  showAction = true,
  className = "",
}: FeaturesProps) {
  const items = customFeatures ?? features;

  return (
    <section className={`bg-white py-16 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-tenderhub-gold">
            One Procurement Platform
          </p>

          <h2 className="text-3xl font-bold tracking-tight text-tenderhub-navy sm:text-4xl">
            {title}
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
            {description}
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((feature) => {
            const Icon = feature.icon;

            return (
              <Link
                key={feature.id}
                href={feature.href}
                className="group rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-tenderhub-gold/40 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tenderhub-navy/5 text-tenderhub-navy transition group-hover:bg-tenderhub-gold/15 group-hover:text-tenderhub-gold">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="mt-6 text-lg font-semibold text-tenderhub-navy">
                  {feature.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-tenderhub-navy transition group-hover:text-tenderhub-gold">
                  Learn more
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {showAction && (
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-tenderhub-navy px-6 py-3 text-sm font-semibold text-white transition hover:bg-tenderhub-navy/90"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-tenderhub-navy transition hover:border-tenderhub-gold/50 hover:bg-slate-50"
            >
              View Plans
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}