"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Search,
  ShieldCheck,
} from "lucide-react";

interface VendorCTAProps {
  title?: string;
  description?: string;
  className?: string;
}

const benefits = [
  {
    id: "opportunities",
    icon: Search,
    title: "Find relevant opportunities",
    description:
      "Discover solicitations that match your business capabilities and classifications.",
  },
  {
    id: "bids",
    icon: FileText,
    title: "Prepare and submit bids",
    description:
      "Manage bid information, requirements, documents, and submissions from one place.",
  },
  {
    id: "compliance",
    icon: ShieldCheck,
    title: "Manage compliance",
    description:
      "Keep important company, tax, licensing, insurance, and professional records organized.",
  },
];

export default function VendorCTA({
  title = "Grow Your Business Through Better Procurement",
  description = "Create your vendor profile, discover procurement opportunities, and manage your bids through TenderHub.",
  className = "",
}: VendorCTAProps) {
  return (
    <section className={`bg-white py-16 sm:py-20 ${className}`}>
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        <div className="overflow-hidden rounded-3xl bg-tenderhub-navy">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-8 sm:p-10 lg:p-14">
              <div className="inline-flex items-center rounded-full border border-tenderhub-gold/30 bg-tenderhub-gold/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-tenderhub-gold">
                For Vendors
              </div>

              <h2 className="mt-6 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {title}
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">
                {description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-tenderhub-gold px-6 py-3 text-sm font-semibold text-tenderhub-navy transition hover:opacity-90"
                >
                  Register as a Vendor
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/solicitations"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Browse Opportunities
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-2 text-sm text-white/60">
                <CheckCircle2 className="h-4 w-4 text-tenderhub-gold" />
                <span>
                  Build your profile once and manage your procurement activity
                  in one place.
                </span>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/5 p-8 sm:p-10 lg:border-l lg:border-t-0 lg:p-14">
              <div className="space-y-6">
                {benefits.map((benefit) => {
                  const Icon = benefit.icon;

                  return (
                    <div
                      key={benefit.id}
                      className="flex gap-4"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tenderhub-gold/10 text-tenderhub-gold">
                        <Icon className="h-5 w-5" />
                      </div>

                      <div>
                        <h3 className="text-base font-semibold text-white">
                          {benefit.title}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-white/60">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/10 p-5">
                <p className="text-sm font-semibold text-white">
                  Ready to participate?
                </p>

                <p className="mt-2 text-sm leading-6 text-white/60">
                  Create your vendor account and start exploring available
                  procurement opportunities.
                </p>

                <Link
                  href="/auth/register"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-tenderhub-gold transition hover:text-white"
                >
                  Create Vendor Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}