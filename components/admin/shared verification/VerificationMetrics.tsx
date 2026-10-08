"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  FileText,
} from "lucide-react";

interface VerificationMetricsProps {
  passed: number;
  pending: number;
  failed: number;
  documentsApproved: number;
  documentsTotal: number;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  iconClassName: string;
}

function MetricCard({
  label,
  value,
  description,
  icon,
  iconClassName,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>

          <p className="mt-2 text-2xl font-semibold text-tenderhub-navy">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function VerificationMetrics({
  passed,
  pending,
  failed,
  documentsApproved,
  documentsTotal,
}: VerificationMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        label="Compliance"
        value={`${passed} Passed`}
        description="Compliance checks completed successfully"
        icon={<CheckCircle2 className="h-5 w-5" />}
        iconClassName="bg-green-50 text-green-600"
      />

      <MetricCard
        label="Pending"
        value={`${pending} Awaiting review`}
        description="Checks requiring attention"
        icon={<Clock3 className="h-5 w-5" />}
        iconClassName="bg-amber-50 text-amber-600"
      />

      <MetricCard
        label="Failed"
        value={`${failed} Exceptions`}
        description="Checks that did not pass"
        icon={<AlertCircle className="h-5 w-5" />}
        iconClassName="bg-red-50 text-red-600"
      />

      <MetricCard
        label="Documents"
        value={`${documentsApproved} / ${documentsTotal}`}
        description="Documents approved"
        icon={<FileText className="h-5 w-5" />}
        iconClassName="bg-blue-50 text-blue-600"
      />
    </div>
  );
}