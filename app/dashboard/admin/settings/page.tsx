import Link from "next/link";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-sm font-medium text-tenderhub-gold">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Admin Settings
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Manage platform-level configuration, administration preferences, and
          operational settings.
        </p>
      </div>

      {/* Platform Settings */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Platform Settings
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Configure the services and administrative features used across
            TenderHub.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Integrations */}
          <Link
            href="/dashboard/admin/integrations"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-tenderhub-gold hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-tenderhub-navy">
              Integrations
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage connected procurement platforms, government systems,
              accounting systems, ERP systems, payment providers, and other
              integrations.
            </p>

            <span className="mt-4 inline-flex text-sm font-semibold text-tenderhub-navy">
              Manage integrations →
            </span>
          </Link>

          {/* Classifications */}
          <Link
            href="/dashboard/admin/classifications"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-tenderhub-gold hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-tenderhub-navy">
              Classifications
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Manage classification systems used to organize vendors,
              solicitations, products, and services.
            </p>

            <span className="mt-4 inline-flex text-sm font-semibold text-tenderhub-navy">
              Manage classifications →
            </span>
          </Link>

          {/* Audit Logs */}
          <Link
            href="/dashboard/admin/audit-logs"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-tenderhub-gold hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-tenderhub-navy">
              Audit Logs
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review platform activity and recorded administrative events for
              accountability and security monitoring.
            </p>

            <span className="mt-4 inline-flex text-sm font-semibold text-tenderhub-navy">
              View audit logs →
            </span>
          </Link>

          {/* Subscriptions */}
          <Link
            href="/dashboard/admin/subscriptions"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-tenderhub-gold hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-slate-900 group-hover:text-tenderhub-navy">
              Subscriptions
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Monitor organization and vendor subscription plans and their
              current status.
            </p>

            <span className="mt-4 inline-flex text-sm font-semibold text-tenderhub-navy">
              Manage subscriptions →
            </span>
          </Link>
        </div>
      </section>

      {/* Verification Configuration */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Verification Configuration
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            Configure the requirements used when reviewing and verifying
            organizations and vendors on TenderHub.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Organization Verification Requirements */}
          <Link
            href="/dashboard/admin/organization-verification-requirements"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-tenderhub-gold hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-sm font-bold text-white">
                O
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-tenderhub-navy">
                  Organization Requirements
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Configure the documents and requirements that organizations
                  must satisfy during verification.
                </p>

                <span className="mt-4 inline-flex text-sm font-semibold text-tenderhub-navy">
                  Manage organization requirements →
                </span>
              </div>
            </div>
          </Link>

          {/* Vendor Verification Requirements */}
          <Link
            href="/dashboard/admin/vendor-onboarding/requirements"
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-tenderhub-gold hover:shadow-md"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-sm font-bold text-white">
                V
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 group-hover:text-tenderhub-navy">
                  Vendor Requirements
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Configure the TenderHub requirements that vendors must
                  satisfy before they can be approved for participation in
                  procurement opportunities.
                </p>

                <span className="mt-4 inline-flex text-sm font-semibold text-tenderhub-navy">
                  Manage vendor requirements →
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Configuration Notice */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Platform Configuration
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Additional platform configuration should be introduced only when
          the corresponding setting, database field, API, or service exists.
          This prevents the admin interface from exposing configuration that
          TenderHub cannot actually persist or enforce.
        </p>
      </section>
    </div>
  );
}