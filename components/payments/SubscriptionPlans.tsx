"use client";

import React, { useMemo, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

export type SubscriptionPlanType =
  | "STARTER"
  | "PROFESSIONAL"
  | "ENTERPRISE"
  | "FREE"
  | "PREMIUM";

export type SubscriptionAudience =
  | "ORGANIZATION"
  | "VENDOR";

export interface SubscriptionPlanFeature {
  id?: string;
  label: string;
  included: boolean;
  description?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  type: SubscriptionPlanType;
  audience: SubscriptionAudience;
  description?: string;
  price: number;
  currency: string;
  billingInterval?: "MONTHLY" | "YEARLY" | "CUSTOM";
  features: SubscriptionPlanFeature[];
  popular?: boolean;
  current?: boolean;
  disabled?: boolean;
  ctaLabel?: string;
}

export interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  audience?: SubscriptionAudience;
  currentPlanId?: string;
  loading?: boolean;
  error?: string | null;
  onSelectPlan?: (plan: SubscriptionPlan) => void;
  className?: string;
}

function formatPrice(
  price: number,
  currency: string,
): string {
  if (!Number.isFinite(price)) {
    return "—";
  }

  if (!currency) {
    return price.toLocaleString("en-US");
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString("en-US")}`;
  }
}

function getBillingLabel(
  interval?: SubscriptionPlan["billingInterval"],
): string {
  switch (interval) {
    case "YEARLY":
      return "/year";

    case "CUSTOM":
      return "custom pricing";

    case "MONTHLY":
    default:
      return "/month";
  }
}

function getPlanDescription(
  plan: SubscriptionPlan,
): string {
  if (plan.description) {
    return plan.description;
  }

  switch (plan.type) {
    case "STARTER":
      return "Essential procurement tools for organizations getting started.";

    case "PROFESSIONAL":
      return "Advanced procurement capabilities for growing organizations.";

    case "ENTERPRISE":
      return "Flexible procurement capabilities for larger organizations.";

    case "FREE":
      return "Essential tools for vendors exploring procurement opportunities.";

    case "PREMIUM":
      return "Advanced tools for vendors managing a larger opportunity pipeline.";

    default:
      return "";
  }
}

function getDefaultCta(
  plan: SubscriptionPlan,
  currentPlanId?: string,
): string {
  if (
    plan.current ||
    plan.id === currentPlanId
  ) {
    return "Current Plan";
  }

  if (plan.type === "ENTERPRISE") {
    return "Contact Sales";
  }

  if (plan.price === 0) {
    return "Get Started";
  }

  return "Choose Plan";
}

export default function SubscriptionPlans({
  plans,
  audience,
  currentPlanId,
  loading = false,
  error = null,
  onSelectPlan,
  className = "",
}: SubscriptionPlansProps) {
  const [selectedPlanId, setSelectedPlanId] =
    useState<string | null>(null);

  const visiblePlans = useMemo(() => {
    if (!audience) {
      return plans;
    }

    return plans.filter(
      (plan) => plan.audience === audience,
    );
  }, [audience, plans]);

  const handleSelect = (
    plan: SubscriptionPlan,
  ) => {
    if (
      plan.disabled ||
      plan.current ||
      plan.id === currentPlanId
    ) {
      return;
    }

    setSelectedPlanId(plan.id);

    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  if (loading) {
    return (
      <div
        className={`grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}
        aria-busy="true"
      >
        {[1, 2, 3].map((item) => (
          <Card key={item}>
            <div className="animate-pulse space-y-5">
              <div className="h-5 w-28 rounded bg-gray-200" />
              <div className="h-4 w-3/4 rounded bg-gray-200" />
              <div className="h-9 w-40 rounded bg-gray-200" />

              <div className="space-y-3">
                {[1, 2, 3, 4].map(
                  (feature) => (
                    <div
                      key={feature}
                      className="h-4 w-full rounded bg-gray-200"
                    />
                  ),
                )}
              </div>

              <div className="h-10 w-full rounded bg-gray-200" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      </Card>
    );
  }

  if (visiblePlans.length === 0) {
    return (
      <Card className={className}>
        <div className="py-8 text-center">
          <h3 className="text-base font-semibold text-gray-900">
            No plans available
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            There are currently no subscription plans
            available for this account type.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3 ${className}`}
    >
      {visiblePlans.map((plan) => {
        const isCurrent =
          plan.current ||
          plan.id === currentPlanId;

        const isSelected =
          selectedPlanId === plan.id;

        const buttonLabel =
          plan.ctaLabel ||
          getDefaultCta(plan, currentPlanId);

        return (
          <Card
            key={plan.id}
            className={`relative flex h-full flex-col ${
              plan.popular
                ? "border-2 border-tenderhub-gold"
                : ""
            } ${
              isSelected
                ? "ring-2 ring-tenderhub-gold/40"
                : ""
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge variant="warning">
                  Most Popular
                </Badge>
              </div>
            )}

            <div className="flex flex-1 flex-col">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold text-tenderhub-navy">
                      {plan.name}
                    </h2>

                    <p className="mt-2 min-h-12 text-sm leading-6 text-gray-500">
                      {getPlanDescription(plan)}
                    </p>
                  </div>

                  {isCurrent && (
                    <Badge variant="success">
                      Current
                    </Badge>
                  )}
                </div>

                <div className="mt-6">
                  {plan.type === "ENTERPRISE" ? (
                    <div>
                      <p className="text-3xl font-bold text-tenderhub-navy">
                        Custom
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {getBillingLabel(
                          plan.billingInterval,
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-tenderhub-navy">
                        {formatPrice(
                          plan.price,
                          plan.currency,
                        )}
                      </span>

                      <span className="text-sm text-gray-500">
                        {getBillingLabel(
                          plan.billingInterval,
                        )}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="my-6 border-t border-gray-200" />

              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">
                  Included features
                </h3>

                <ul className="mt-4 space-y-3">
                  {plan.features.map(
                    (feature, index) => (
                      <li
                        key={
                          feature.id ||
                          `${plan.id}-${index}`
                        }
                        className="flex items-start gap-3"
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            feature.included
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-400"
                          }`}
                          aria-hidden="true"
                        >
                          {feature.included
                            ? "✓"
                            : "×"}
                        </span>

                        <div className="min-w-0">
                          <p
                            className={`text-sm ${
                              feature.included
                                ? "text-gray-700"
                                : "text-gray-400 line-through"
                            }`}
                          >
                            {feature.label}
                          </p>

                          {feature.description && (
                            <p className="mt-1 text-xs leading-5 text-gray-400">
                              {feature.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ),
                  )}
                </ul>
              </div>

              <div className="mt-8">
                <Button
                  type="button"
                  variant={
                    plan.popular
                      ? "primary"
                      : "outline"
                  }
                  className="w-full"
                  disabled={
                    plan.disabled ||
                    isCurrent
                  }
                  onClick={() =>
                    handleSelect(plan)
                  }
                >
                  {buttonLabel}
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}