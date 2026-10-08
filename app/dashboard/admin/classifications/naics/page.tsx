import NaicsSelector from "@/components/classifications/NaicsSelector";

export default function AdminNaicsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-tenderhub-gold">
          Administration / Classifications
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
          NAICS Classifications
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Search and manage North American Industry Classification System
          codes used across TenderHub.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <NaicsSelector />
      </div>
    </div>
  );
}