"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type SubscriptionPlan =
  | "ORGANIZATION_STARTER"
  | "ORGANIZATION_PROFESSIONAL"
  | "ORGANIZATION_ENTERPRISE"
  | "VENDOR_FREE"
  | "VENDOR_PROFESSIONAL"
  | "VENDOR_PREMIUM";

type UserType = "ORGANIZATION" | "VENDOR";

type PricingPlan = {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price: string;
  period?: string;
  popular?: boolean;
  features: string[];
  buttonText: string;
};

const organizationPlans: PricingPlan[] = [
  {
    id: "ORGANIZATION_STARTER",
    name: "Starter",
    description:
      "For organizations getting started with structured digital procurement.",
    price: "Free",
    period: "forever",
    buttonText: "Get Started",
    features: [
      "Create procurement activities",
      "Publish solicitations",
      "Manage vendor bids",
      "Basic evaluation workflow",
      "Organization profile",
      "Procurement activity tracking",
    ],
  },
  {
    id: "ORGANIZATION_PROFESSIONAL",
    name: "Professional",
    description:
      "For organizations managing regular and growing procurement activity.",
    price: "$149",
    period: "per month",
    popular: true,
    buttonText: "Choose Professional",
    features: [
      "Everything in Starter",
      "Multiple active solicitations",
      "Advanced bid management",
      "Vendor shortlisting",
      "Evaluation and scoring tools",
      "Procurement reporting",
      "Multiple organization users",
      "Email notifications",
    ],
  },
  {
    id: "ORGANIZATION_ENTERPRISE",
    name: "Enterprise",
    description:
      "For institutions requiring advanced procurement workflows and support.",
    price: "Custom",
    period: "tailored to your organization",
    buttonText: "Contact Us",
    features: [
      "Everything in Professional",
      "Advanced procurement workflows",
      "Multiple departments",
      "Advanced evaluation workflows",
      "Contract management",
      "Compliance management",
      "Advanced reporting and analytics",
      "Enterprise support",
    ],
  },
];

const vendorPlans: PricingPlan[] = [
  {
    id: "VENDOR_FREE",
    name: "Free",
    description:
      "For vendors discovering procurement opportunities and building their profile.",
    price: "Free",
    period: "forever",
    buttonText: "Create Free Account",
    features: [
      "Browse public solicitations",
      "Search procurement opportunities",
      "Create vendor profile",
      "Save solicitations",
      "Submit bids",
      "Track bid activity",
    ],
  },
  {
    id: "VENDOR_PROFESSIONAL",
    name: "Professional",
    description:
      "For vendors actively pursuing procurement opportunities across markets.",
    price: "$29",
    period: "per month",
    popular: true,
    buttonText: "Go Professional",
    features: [
      "Everything in Free",
      "Advanced solicitation search",
      "Unlimited saved solicitations",
      "Deadline notifications",
      "Solicitation alerts",
      "Classification-based opportunities",
      "Advanced bid tracking",
      "Vendor compliance tracking",
    ],
  },
  {
    id: "VENDOR_PREMIUM",
    name: "Premium",
    description:
      "For established vendors managing a serious and growing bid pipeline.",
    price: "$99",
    period: "per month",
    buttonText: "Choose Premium",
    features: [
      "Everything in Professional",
      "Advanced opportunity discovery",
      "Vendor certifications management",
      "Compliance monitoring",
      "Bid pipeline management",
      "Contract and award tracking",
      "Advanced procurement insights",
      "Priority support",
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();

  const [userType, setUserType] =
    useState<UserType>("ORGANIZATION");

  const [loadingPlan, setLoadingPlan] =
    useState<SubscriptionPlan | null>(null);

  const plans =
    userType === "ORGANIZATION"
      ? organizationPlans
      : vendorPlans;

  function handlePlanSelection(plan: PricingPlan) {
    setLoadingPlan(plan.id);

    if (plan.id === "ORGANIZATION_ENTERPRISE") {
      router.push("/contact");
      return;
    }

    if (
      plan.id === "ORGANIZATION_STARTER" ||
      plan.id === "VENDOR_FREE"
    ) {
      if (!session?.user) {
        router.push(`/register?plan=${plan.id}`);
        return;
      }

      router.push(`/dashboard?plan=${plan.id}`);
      return;
    }

    if (!session?.user) {
      router.push(`/register?plan=${plan.id}`);
      return;
    }

    router.push(`/checkout?plan=${plan.id}`);
  }

  return (
    <main className="min-h-screen bg-[#071A33] px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#D4AF37]">
            Simple & Transparent Pricing
          </p>

          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">
            Procurement software that scales with you.
          </h1>

          <p className="mt-6 text-lg leading-8 text-slate-300">
            Whether you are managing procurement for an organization
            or pursuing contracts as a vendor, TenderHub provides
            tools for managing the procurement lifecycle.
          </p>
        </div>

        {/* Audience Toggle */}
        <div className="mt-12 flex justify-center">
          <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setUserType("ORGANIZATION")}
              className={`rounded-full px-6 py-3 text-sm font-bold transition ${
                userType === "ORGANIZATION"
                  ? "bg-[#D4AF37] text-[#071A33]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Organizations
            </button>

            <button
              type="button"
              onClick={() => setUserType("VENDOR")}
              className={`rounded-full px-6 py-3 text-sm font-bold transition ${
                userType === "VENDOR"
                  ? "bg-[#D4AF37] text-[#071A33]"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Vendors
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-3xl border p-8 ${
                plan.popular
                  ? "border-[#D4AF37] bg-white text-[#071A33] shadow-2xl"
                  : "border-white/10 bg-white/5 text-white"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#D4AF37] px-5 py-2 text-xs font-extrabold uppercase tracking-wider text-[#071A33]">
                  Most Popular
                </div>
              )}

              {/* Plan Name */}
              <h2 className="text-2xl font-extrabold">
                {plan.name}
              </h2>

              <p
                className={`mt-4 min-h-[84px] leading-7 ${
                  plan.popular
                    ? "text-slate-600"
                    : "text-slate-300"
                }`}
              >
                {plan.description}
              </p>

              {/* Price */}
              <div className="mt-8">
                <div className="text-4xl font-extrabold">
                  {plan.price}
                </div>

                {plan.period && (
                  <div
                    className={`mt-2 text-sm ${
                      plan.popular
                        ? "text-slate-500"
                        : "text-slate-400"
                    }`}
                  >
                    {plan.period}
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                type="button"
                onClick={() => handlePlanSelection(plan)}
                disabled={loadingPlan === plan.id}
                className={`mt-8 w-full rounded-xl px-5 py-4 font-bold transition ${
                  plan.popular
                    ? "bg-[#071A33] text-white hover:bg-[#0d2a4d]"
                    : "bg-[#D4AF37] text-[#071A33] hover:bg-[#e5c45a]"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {loadingPlan === plan.id
                  ? "Loading..."
                  : plan.buttonText}
              </button>

              {/* Features */}
              <div className="mt-10">
                <p
                  className={`text-sm font-bold uppercase tracking-wider ${
                    plan.popular
                      ? "text-slate-500"
                      : "text-slate-400"
                  }`}
                >
                  What's included
                </p>

                <ul className="mt-5 space-y-4">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3"
                    >
                      <span className="mt-1 font-bold text-[#D4AF37]">
                        ✓
                      </span>

                      <span
                        className={
                          plan.popular
                            ? "text-slate-700"
                            : "text-slate-300"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* International Procurement CTA */}
        <div className="mt-20 rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
            Enterprise Procurement
          </p>

          <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
            Need TenderHub configured for your organization?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-300">
            Talk to our team about departments, procurement
            workflows, multiple users, compliance requirements,
            integrations, reporting, and enterprise support.
          </p>

          <button
            type="button"
            onClick={() => router.push("/contact")}
            className="mt-7 rounded-xl bg-[#D4AF37] px-7 py-4 font-bold text-[#071A33] transition hover:bg-[#e5c45a]"
          >
            Talk to Our Team
          </button>
        </div>

        {/* Currency Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400">
            Prices shown in USD. Available payment and billing
            currencies may vary by region.
          </p>
        </div>
      </div>
    </main>
  );
}