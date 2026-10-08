import Link from "next/link";

export default function AdminPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-tenderhub-gold">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Payments
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Monitor payments processed through TenderHub, including subscription
          payments, application fees, refunds, and other transactions.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Payments</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Payment records
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Paid</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Successfully completed
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Awaiting confirmation
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Refunded</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Refunded transactions
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Payment Management
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Payment administration will use the Payment records and payment
              APIs defined in TenderHub.
            </p>
          </div>

          <Link
            href="/dashboard/admin/subscriptions"
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            View Subscriptions
          </Link>
        </div>
      </div>
    </div>
  );
}