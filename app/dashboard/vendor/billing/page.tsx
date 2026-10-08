import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Crown,
  FileText,
  ShieldCheck,
} from "lucide-react";

import { prisma } from "@/lib/db/prisma";
import { Card } from "@/components/ui/Card";

const plans = [
  {
    name: "Free",
    price: "UGX 0",
    period: "forever",
    description: "Essential tools for vendors getting started.",
    features: [
      "Browse procurement opportunities",
      "Submit bids",
      "Manage vendor profile",
      "Save up to 5 opportunities",
    ],
    current: true,
  },
  {
    name: "Professional",
    price: "UGX 30,000",
    period: "per month",
    description: "More tools for vendors actively pursuing contracts.",
    features: [
      "Everything in Free",
      "More saved opportunities",
      "Enhanced procurement visibility",
      "Priority vendor tools",
    ],
    current: false,
  },
  {
    name: "Premium",
    price: "UGX 100,000",
    period: "per month",
    description: "Advanced capabilities for established vendors.",
    features: [
      "Everything in Professional",
      "Advanced vendor capabilities",
      "Enhanced alerts",
      "Premium procurement tools",
    ],
    current: false,
  },
];

export default async function VendorBillingPage() {
  const user = await prisma.user.findFirst({
    select: {
      id: true,
      name: true,
      email: true,
      vendor: {
        select: {
          id: true,
          companyName: true,
        },
      },
    },
  });

  if (!user?.vendor) {
    return (
      <div className="min-h-screen bg-tenderhub-background p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <div className="p-10 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-slate-300" />

              <h1 className="mt-4 text-xl font-semibold text-slate-900">
                Vendor Profile Required
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                A vendor profile is required to manage billing and
                subscriptions.
              </p>

              <Link
                href="/dashboard/vendor/profile"
                className="mt-6 inline-flex items-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white"
              >
                Complete Vendor Profile
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      plan: true,
      status: true,
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const payments = await prisma.payment.findMany({
    where: {
      userId: user.id,
    },
    select: {
      id: true,
      amount: true,
      currency: {
        select: {
          code: true,
          name: true,
        },
      },
      status: true,
      type: true,
      provider: true,
      transactionId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 10,
  });

  const currentPlan = subscription?.plan
    ? String(subscription.plan)
    : "FREE";

  const subscriptionStatus = subscription?.status
    ? String(subscription.status)
    : "ACTIVE";

  return (
    <div className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
              <CreditCard className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-medium text-slate-500">
                Vendor Portal
              </p>

              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                Billing & Subscription
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
            Manage your TenderHub vendor subscription, review your current
            plan, and view recent payment activity.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tenderhub-navy text-white">
                  <Crown className="h-5 w-5" />
                </div>

                <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                  {subscriptionStatus.replace(/_/g, " ")}
                </span>
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-slate-500">
                Current Plan
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {currentPlan.replace(/_/g, " ")}
              </p>

              {subscription?.startDate && (
                <p className="mt-2 text-xs text-slate-500">
                  Started {subscription.startDate.toLocaleDateString()}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-slate-500">
                Account
              </p>

              <p className="mt-1 truncate text-lg font-semibold text-slate-900">
                {user.vendor.companyName}
              </p>

              <p className="mt-2 truncate text-sm text-slate-500">
                {user.email}
              </p>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FileText className="h-5 w-5" />
              </div>

              <p className="mt-5 text-xs font-medium uppercase tracking-wide text-slate-500">
                Recent Payments
              </p>

              <p className="mt-1 text-2xl font-bold text-slate-900">
                {payments.length}
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Payment records on your account
              </p>
            </div>
          </Card>
        </div>

        <section>
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">
              Available Plans
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Choose the subscription level that matches your procurement
              activity.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent =
                plan.name.toUpperCase() === currentPlan.toUpperCase();

              return (
                <Card
                  key={plan.name}
                  className={
                    isCurrent
                      ? "border-2 border-tenderhub-gold"
                      : undefined
                  }
                >
                  <div className="flex h-full flex-col p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {plan.name}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-500">
                          {plan.description}
                        </p>
                      </div>

                      {isCurrent && (
                        <span className="shrink-0 rounded-full bg-tenderhub-gold/15 px-2.5 py-1 text-xs font-semibold text-slate-800">
                          Current
                        </span>
                      )}
                    </div>

                    <div className="mt-6">
                      <span className="text-2xl font-bold text-slate-900">
                        {plan.price}
                      </span>

                      <span className="ml-1 text-sm text-slate-500">
                        / {plan.period}
                      </span>
                    </div>

                    <div className="my-6 h-px bg-slate-200" />

                    <ul className="flex-1 space-y-3">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 text-sm text-slate-600"
                        >
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-7">
                      {isCurrent ? (
                        <div className="flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-600">
                          Current Plan
                        </div>
                      ) : (
                        <Link
                          href="/pricing"
                          className="flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          View Plan
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <Card>
          <div className="border-b border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900">
              Payment History
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Your most recent TenderHub payment records.
            </p>
          </div>

          {payments.length === 0 ? (
            <div className="p-10 text-center">
              <CreditCard className="mx-auto h-10 w-10 text-slate-300" />

              <h3 className="mt-4 font-semibold text-slate-900">
                No payments yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Your payment activity will appear here once payments are
                recorded.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Date
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Type
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {payment.createdAt.toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {String(payment.type).replace(/_/g, " ")}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {payment.currency?.code ?? ""}
                        {" "}
                        {Number(payment.amount).toLocaleString()}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {String(payment.provider).replace(/_/g, " ")}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {String(payment.status).replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}