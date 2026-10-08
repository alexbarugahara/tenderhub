import Link from "next/link";

export default function AdminSubscriptionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-tenderhub-gold">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Subscriptions
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Monitor organization and vendor subscription plans, statuses,
          billing periods, and subscription activity across TenderHub.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Active</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Active subscriptions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Awaiting activation
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Cancelled</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Cancelled subscriptions
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Expired</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Expired subscriptions
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Subscription Plans
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              TenderHub supports separate subscription plans for organizations
              and vendors.
            </p>
          </div>

          <Link
            href="/dashboard/admin/payments"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            View Payments
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900">
              Organization Plans
            </h3>

            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Organization Starter</li>
              <li>Organization Professional</li>
              <li>Organization Enterprise</li>
            </ul>
          </div>

          <div className="rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900">
              Vendor Plans
            </h3>

            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>Vendor Free</li>
              <li>Vendor Professional</li>
              <li>Vendor Premium</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}