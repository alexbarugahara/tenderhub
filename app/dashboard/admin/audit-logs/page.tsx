import Link from "next/link";

export default function AdminAuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-tenderhub-gold">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Audit Logs
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Review recorded administrative and platform activity for
          accountability, security, and operational monitoring.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Total Events</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Recorded audit events
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Today</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Events recorded today
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Users</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Users with recorded activity
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Entities</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">—</p>
          <p className="mt-1 text-xs text-slate-500">
            Affected platform records
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Recent Activity
          </h2>

          <p className="mt-1 text-sm text-slate-600">
            Audit events will appear here as users and administrators perform
            actions across TenderHub.
          </p>
        </div>

        <div className="p-6">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl shadow-sm">
              ✓
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No audit events to display
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              When platform activity is recorded, audit events will be
              displayed in this area.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/dashboard/admin/settings"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Admin Settings
        </Link>

        <Link
          href="/dashboard/admin"
          className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Admin Dashboard
        </Link>
      </div>
    </div>
  );
}