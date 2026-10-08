import Link from "next/link";

export default function AdminClassificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-tenderhub-gold">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          Classifications
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Manage procurement classification systems used to categorize
          solicitations and vendors.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Link
          href="/dashboard/admin/classifications/naics"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-tenderhub-gold hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tenderhub-navy text-lg font-bold text-tenderhub-gold">
            N
          </div>

          <h2 className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-tenderhub-navy">
            NAICS
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage North American Industry Classification System codes used
            for business and industry classification.
          </p>

          <span className="mt-5 inline-flex text-sm font-semibold text-tenderhub-navy">
            Manage NAICS →
          </span>
        </Link>

        <Link
          href="/dashboard/admin/classifications/psc"
          className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-tenderhub-gold hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tenderhub-navy text-lg font-bold text-tenderhub-gold">
            P
          </div>

          <h2 className="mt-5 text-lg font-semibold text-slate-900 group-hover:text-tenderhub-navy">
            PSC
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Manage Product and Service Codes used to classify products and
            services within procurement opportunities.
          </p>

          <span className="mt-5 inline-flex text-sm font-semibold text-tenderhub-navy">
            Manage PSC →
          </span>
        </Link>
      </div>
    </div>
  );
}