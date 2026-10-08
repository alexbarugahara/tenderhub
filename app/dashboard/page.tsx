import Link from "next/link";

import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  const user = session?.user;
  const role = user?.role;

  const dashboardPath =
    role === "ADMIN"
      ? "/dashboard/admin"
      : role === "ORGANIZATION"
        ? "/dashboard/organization"
        : "/dashboard/vendor";

  const dashboardLabel =
    role === "ADMIN"
      ? "Admin Dashboard"
      : role === "ORGANIZATION"
        ? "Organization Dashboard"
        : "Vendor Dashboard";

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-tenderhub-navy px-6 py-8 text-white shadow-sm sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-tenderhub-gold">
            TenderHub
          </p>

          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome to your dashboard
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Manage procurement activities, solicitations, bids, evaluations,
            contracts, vendors, and other procurement operations from one
            platform.
          </p>

          {user?.name && (
            <p className="mt-4 text-sm text-slate-300">
              Signed in as{" "}
              <span className="font-semibold text-white">{user.name}</span>
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
              📋
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              Procurement
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create and manage procurement processes, solicitations, lots,
              requirements, and procurement documents.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
              💼
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              Bids &amp; Evaluation
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage vendor bids, requirements, evaluation criteria, scoring,
              awards, and procurement decisions.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-xl">
              📄
            </div>

            <h2 className="mt-5 text-lg font-semibold text-slate-900">
              Contracts
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Track awarded contracts, milestones, payments, documents, and
              contract activity.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Continue to your workspace
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Open the dashboard that matches your TenderHub account.
            </p>
          </div>

          <Link
            href={dashboardPath}
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-gold px-5 py-3 text-sm font-semibold text-tenderhub-navy transition hover:opacity-90"
          >
            Open {dashboardLabel}
          </Link>
        </div>
      </section>
    </div>
  );
}