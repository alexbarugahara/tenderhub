import Link from "next/link";

import { prisma } from "@/lib/db/prisma";

export default async function AdminCompliancePage() {
  const [
    totalRequirements,
    activeRequirements,
    totalApplications,
    submittedApplications,
    underReviewApplications,
    approvedApplications,
    needsInformationApplications,
    rejectedApplications,
    totalApplicationRequirements,
    satisfiedRequirements,
    outstandingRequirements,
    rejectedRequirements,
    needsInformationRequirements,
    totalEvidence,
    pendingEvidence,
    acceptedEvidence,
    rejectedEvidence,
    recentRequirements,
  ] = await Promise.all([
    prisma.vendorRequirement.count(),

    prisma.vendorRequirement.count({
      where: {
        active: true,
      },
    }),

    prisma.vendorApplication.count(),

    prisma.vendorApplication.count({
      where: {
        status: "SUBMITTED",
      },
    }),

    prisma.vendorApplication.count({
      where: {
        status: "UNDER_REVIEW",
      },
    }),

    prisma.vendorApplication.count({
      where: {
        status: "APPROVED",
      },
    }),

    prisma.vendorApplication.count({
      where: {
        status: "NEEDS_INFORMATION",
      },
    }),

    prisma.vendorApplication.count({
      where: {
        status: "REJECTED",
      },
    }),

    prisma.vendorApplicationRequirement.count(),

    prisma.vendorApplicationRequirement.count({
      where: {
        status: "SATISFIED",
      },
    }),

    prisma.vendorApplicationRequirement.count({
      where: {
        status: "OUTSTANDING",
      },
    }),

    prisma.vendorApplicationRequirement.count({
      where: {
        status: "REJECTED",
      },
    }),

    prisma.vendorApplicationRequirement.count({
      where: {
        status: "NEEDS_INFORMATION",
      },
    }),

    prisma.vendorApplicationEvidence.count(),

    prisma.vendorApplicationEvidence.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.vendorApplicationEvidence.count({
      where: {
        status: "ACCEPTED",
      },
    }),

    prisma.vendorApplicationEvidence.count({
      where: {
        status: "REJECTED",
      },
    }),

    prisma.vendorRequirement.findMany({
      take: 8,
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        category: true,
        required: true,
        active: true,
        allowedDocumentCategories: true,
        updatedAt: true,
      },
    }),
  ]);

  const requirementCompletionRate =
    totalApplicationRequirements > 0
      ? Math.round(
          (satisfiedRequirements /
            totalApplicationRequirements) *
            100
        )
      : 0;

  const evidenceAcceptanceRate =
    totalEvidence > 0
      ? Math.round(
          (acceptedEvidence / totalEvidence) * 100
        )
      : 0;

  const applicationReviewRate =
    totalApplications > 0
      ? Math.round(
          (approvedApplications / totalApplications) *
            100
        )
      : 0;

  return (
    <div className="space-y-8">
      <section>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-tenderhub-gold">
              Administration
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Vendor Compliance
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Monitor the vendor onboarding compliance framework,
              application requirements, submitted evidence, and
              verification readiness across TenderHub.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/admin/vendor-onboarding/applications"
              className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Vendor Applications
            </Link>

            <Link
              href="/dashboard/admin/vendor-onboarding/requirements"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Requirements
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            label="Vendor Requirements"
            value={totalRequirements}
            description={`${activeRequirements} active requirements`}
          />

          <MetricCard
            label="Vendor Applications"
            value={totalApplications}
            description={`${approvedApplications} approved`}
          />

          <MetricCard
            label="Requirement Completion"
            value={`${requirementCompletionRate}%`}
            description={`${satisfiedRequirements} satisfied requirements`}
          />

          <MetricCard
            label="Evidence Acceptance"
            value={`${evidenceAcceptanceRate}%`}
            description={`${acceptedEvidence} accepted evidence records`}
          />

          <MetricCard
            label="Submitted"
            value={submittedApplications}
            description="Awaiting review"
          />

          <MetricCard
            label="Under Review"
            value={underReviewApplications}
            description="Currently being reviewed"
          />

          <MetricCard
            label="Needs Information"
            value={needsInformationApplications}
            description="Applicant action required"
          />

          <MetricCard
            label="Rejected"
            value={rejectedApplications}
            description="Applications rejected"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Application Pipeline
              </h2>

              <p className="mt-1 text-sm text-slate-600">
                Current state of vendor onboarding applications.
              </p>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-tenderhub-gold">
              {applicationReviewRate}%
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <StatusRow
              label="Submitted"
              value={submittedApplications}
              total={totalApplications}
              tone="amber"
            />

            <StatusRow
              label="Under Review"
              value={underReviewApplications}
              total={totalApplications}
              tone="blue"
            />

            <StatusRow
              label="Approved"
              value={approvedApplications}
              total={totalApplications}
              tone="green"
            />

            <StatusRow
              label="Needs Information"
              value={needsInformationApplications}
              total={totalApplications}
              tone="orange"
            />

            <StatusRow
              label="Rejected"
              value={rejectedApplications}
              total={totalApplications}
              tone="red"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Requirement Verification
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Status of requirements across vendor applications.
            </p>
          </div>

          <div className="mt-6 space-y-4">
            <StatusRow
              label="Satisfied"
              value={satisfiedRequirements}
              total={totalApplicationRequirements}
              tone="green"
            />

            <StatusRow
              label="Outstanding"
              value={outstandingRequirements}
              total={totalApplicationRequirements}
              tone="amber"
            />

            <StatusRow
              label="Needs Information"
              value={needsInformationRequirements}
              total={totalApplicationRequirements}
              tone="orange"
            />

            <StatusRow
              label="Rejected"
              value={rejectedRequirements}
              total={totalApplicationRequirements}
              tone="red"
            />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">
              Evidence Review
            </p>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <MiniMetric
                label="Pending"
                value={pendingEvidence}
              />

              <MiniMetric
                label="Accepted"
                value={acceptedEvidence}
              />

              <MiniMetric
                label="Rejected"
                value={rejectedEvidence}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Vendor Onboarding Requirements
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Requirements currently configured for platform vendor
              approval.
            </p>
          </div>

          <Link
            href="/dashboard/admin/vendor-onboarding/requirements"
            className="text-sm font-semibold text-tenderhub-navy hover:underline"
          >
            Manage Requirements →
          </Link>
        </div>

        {recentRequirements.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg">
              ✓
            </div>

            <h3 className="mt-4 text-sm font-semibold text-slate-900">
              No vendor requirements configured
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add vendor onboarding requirements to establish the
              platform verification framework.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <TableHeader>Requirement</TableHeader>
                  <TableHeader>Code</TableHeader>
                  <TableHeader>Category</TableHeader>
                  <TableHeader>Evidence</TableHeader>
                  <TableHeader>Type</TableHeader>
                  <TableHeader>Status</TableHeader>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200 bg-white">
                {recentRequirements.map((requirement) => (
                  <tr
                    key={requirement.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {requirement.name}
                      </p>

                      {requirement.description ? (
                        <p className="mt-1 max-w-md text-xs leading-5 text-slate-500">
                          {requirement.description}
                        </p>
                      ) : null}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="font-mono text-xs text-slate-600">
                        {requirement.code}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span className="text-xs font-medium text-slate-600">
                        {formatEnum(requirement.category)}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      {requirement.allowedDocumentCategories.length >
                      0 ? (
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          Evidence required
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          No document rule
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      {requirement.required ? (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                          Required
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Optional
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      {requirement.active ? (
                        <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                          Active
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          Inactive
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <FrameworkCard
          title="Platform Requirement"
          description="Defines what a vendor must satisfy to become an approved TenderHub vendor."
        />

        <FrameworkCard
          title="Evidence"
          description="Documents and other evidence submitted by the vendor remain pending until an administrator reviews them."
        />

        <FrameworkCard
          title="Approval"
          description="Vendor approval occurs only after the required onboarding requirements have been satisfied."
        />
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          TenderHub Compliance Model
        </h2>

        <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
          TenderHub separates platform vendor verification from
          procurement-specific qualification. A VendorRequirement defines
          the platform requirement. A VendorApplicationRequirement records
          how that requirement applies to a particular vendor application.
          VendorApplicationEvidence stores submitted evidence, while
          administrator review determines whether the requirement is
          satisfied.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FrameworkItem
            title="Requirement"
            description="Defines the platform-level vendor obligation."
          />

          <FrameworkItem
            title="Application"
            description="Represents the vendor's onboarding request."
          />

          <FrameworkItem
            title="Evidence"
            description="Stores documents submitted to support a requirement."
          />

          <FrameworkItem
            title="Verification"
            description="Administrator review determines whether the vendor can be approved."
          />
        </div>
      </section>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  description: string;
}

function MetricCard({
  label,
  value,
  description,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

interface StatusRowProps {
  label: string;
  value: number;
  total: number;
  tone: "green" | "amber" | "blue" | "orange" | "red";
}

function StatusRow({
  label,
  value,
  total,
  tone,
}: StatusRowProps) {
  const percentage =
    total > 0
      ? Math.round((value / total) * 100)
      : 0;

  const barClasses: Record<
    StatusRowProps["tone"],
    string
  > = {
    green: "bg-green-600",
    amber: "bg-amber-500",
    blue: "bg-blue-600",
    orange: "bg-orange-500",
    red: "bg-red-600",
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-700">
          {label}
        </span>

        <span className="text-sm font-semibold text-slate-900">
          {value}
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${barClasses[tone]}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>

      <p className="mt-1 text-xs text-slate-500">
        {percentage}% of records
      </p>
    </div>
  );
}

interface MiniMetricProps {
  label: string;
  value: number;
}

function MiniMetric({
  label,
  value,
}: MiniMetricProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function TableHeader({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <th
      scope="col"
      className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
    >
      {children}
    </th>
  );
}

interface FrameworkItemProps {
  title: string;
  description: string;
}

function FrameworkItem({
  title,
  description,
}: FrameworkItemProps) {
  return (
    <div className="rounded-xl border border-amber-200 bg-white/70 p-4">
      <h3 className="text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-600">
        {description}
      </p>
    </div>
  );
}

interface FrameworkCardProps {
  title: string;
  description: string;
}

function FrameworkCard({
  title,
  description,
}: FrameworkCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {description}
      </p>
    </div>
  );
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}