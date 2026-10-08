import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Plus,
  Settings2,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  generateRequirementSetCode,
  generateRequirementSetDescription,
  generateRequirementSetName,
} from "@/lib/vendor-onboarding/classification";

export default async function VendorOnboardingRequirementsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-900">
          Access denied
        </h1>

        <p className="mt-2 text-sm text-red-700">
          Administrator access is required to manage vendor onboarding
          requirements.
        </p>
      </div>
    );
  }

  const [sets, totalRequirements, activeRequirements] =
    await Promise.all([
      prisma.vendorRequirementSet.findMany({
        orderBy: [
          {
            active: "desc",
          },
          {
            name: "asc",
          },
        ],
        include: {
          companyType: true,
          industry: true,
          requirements: {
            where: {
              active: true,
            },
            include: {
              requirement: true,
            },
            orderBy: {
              requirement: {
                name: "asc",
              },
            },
          },
          _count: {
            select: {
              requirements: true,
              applications: true,
              vendors: true,
            },
          },
        },
      }),

      prisma.vendorRequirement.count(),

      prisma.vendorRequirement.count({
        where: {
          active: true,
        },
      }),
    ]);

  const activeSets = sets.filter(
    (set) => set.active,
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/dashboard/admin/vendor-onboarding"
            className="inline-flex items-center gap-2 text-sm font-medium text-tenderhub-navy transition hover:text-tenderhub-gold"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            Vendor onboarding
          </Link>

          <p className="mt-5 text-sm font-semibold text-tenderhub-gold">
            Verification Configuration
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Vendor compliance packages
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Configure the compliance framework TenderHub uses to determine
            what different classes of vendors must provide before approval.
          </p>
        </div>

        <Link
          href="/dashboard/admin/vendor-onboarding/requirements/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          Create compliance package
        </Link>
      </div>

      {/* Explanation */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">
              Classification-driven vendor verification
            </h2>

            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
              TenderHub uses company type and industry to determine which
              compliance framework applies to a vendor. Classification rules
              recommend the appropriate requirements, while each compliance
              package controls the final requirements, purpose and accepted
              evidence.
            </p>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Compliance packages"
          value={sets.length}
          description="Configured classifications"
          icon={
            <ClipboardCheck className="h-5 w-5" />
          }
        />

        <StatCard
          label="Active packages"
          value={activeSets}
          description="Available for onboarding"
          icon={
            <CheckCircle2 className="h-5 w-5" />
          }
        />

        <StatCard
          label="Master requirements"
          value={totalRequirements}
          description="Defined in TenderHub"
          icon={<Settings2 className="h-5 w-5" />}
        />

        <StatCard
          label="Active requirements"
          value={activeRequirements}
          description="Available for assignment"
          icon={<ShieldCheck className="h-5 w-5" />}
        />
      </div>

      {/* Package library */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Compliance packages
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Each package represents the onboarding requirements for a
            specific company type and industry combination.
          </p>
        </div>

        {sets.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <ClipboardCheck className="h-7 w-7 text-slate-500" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              No compliance packages configured
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Create a package by selecting a company type and industry.
              TenderHub will generate its standard identity automatically.
            </p>

            <Link
              href="/dashboard/admin/vendor-onboarding/requirements/new"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Create compliance package
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2">
            {sets.map((set) => {
              const requiredCount = set.requirements.filter(
                (item) => item.required,
              ).length;

              const activeRequirementCount =
                set.requirements.filter(
                  (item) => item.active,
                ).length;

              const evidenceConfiguredCount =
                set.requirements.filter(
                  (item) =>
                    item.allowedDocumentCategories
                      .length > 0,
                ).length;

              const generatedCode =
                set.companyType && set.industry
                  ? generateRequirementSetCode(
                      set.companyType.code,
                      set.industry.code,
                    )
                  : set.code;

              const generatedName =
                set.companyType && set.industry
                  ? generateRequirementSetName(
                      set.companyType.name,
                      set.industry.name,
                    )
                  : set.name;

              const generatedDescription =
                set.companyType && set.industry
                  ? generateRequirementSetDescription(
                      set.companyType.name,
                      set.industry.name,
                    )
                  : set.description;

              return (
                <Link
                  key={set.id}
                  href={`/dashboard/admin/vendor-onboarding/requirements/${set.id}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-tenderhub-gold hover:shadow-md"
                >
                  {/* Top */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {set.companyType && (
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {set.companyType.name}
                          </span>
                        )}

                        {set.industry && (
                          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                            {set.industry.name}
                          </span>
                        )}

                        {set.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            <XCircle className="h-3.5 w-3.5" />
                            Inactive
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-lg font-semibold text-slate-900 group-hover:text-tenderhub-navy">
                        {set.name}
                      </h3>

                      <p className="mt-1 font-mono text-xs text-slate-400">
                        {set.code}
                      </p>
                    </div>

                    <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-tenderhub-navy" />
                  </div>

                  {/* Classification identity */}
                  <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Classification code
                    </p>

                    <p className="mt-1 font-mono text-sm font-semibold text-tenderhub-navy">
                      {generatedCode}
                    </p>

                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {generatedName}
                    </p>
                  </div>

                  {/* Description */}
                  {generatedDescription && (
                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {generatedDescription}
                    </p>
                  )}

                  {/* Metrics */}
                  <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <Metric
                      label="Requirements"
                      value={
                        set._count.requirements
                      }
                    />

                    <Metric
                      label="Active"
                      value={activeRequirementCount}
                    />

                    <Metric
                      label="Required"
                      value={requiredCount}
                    />

                    <Metric
                      label="Evidence"
                      value={evidenceConfiguredCount}
                    />
                  </div>

                  {/* Usage */}
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <UsageMetric
                      label="Applications"
                      value={set._count.applications}
                    />

                    <UsageMetric
                      label="Vendors"
                      value={set._count.vendors}
                    />
                  </div>

                  {/* Footer */}
                  <div className="mt-6 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-semibold text-tenderhub-navy">
                      Configure compliance package
                    </span>

                    <span className="text-xs text-slate-400">
                      Updated{" "}
                      {new Intl.DateTimeFormat(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        },
                      ).format(set.updatedAt)}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Master requirements */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Master requirements
            </h2>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
              These are reusable TenderHub compliance controls. They are
              created once and can be assigned to multiple classification
              packages without duplicating the underlying requirement.
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            {totalRequirements} total
          </span>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <InfoCard
            title="Reusable"
            text="One master requirement can be used across multiple vendor classifications."
          />

          <InfoCard
            title="Configurable"
            text="Packages control required status, purpose and accepted evidence."
          />

          <InfoCard
            title="Controlled"
            text="Inactive master requirements cannot be added to new packages."
          />
        </div>
      </section>

      {/* Architecture */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex gap-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-tenderhub-navy" />

          <div>
            <h2 className="font-semibold text-slate-900">
              TenderHub compliance architecture
            </h2>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <ArchitectureStep
                number="1"
                text="Company type + industry classify the vendor."
              />

              <ArchitectureStep
                number="2"
                text="Classification rules recommend the appropriate compliance requirements."
              />

              <ArchitectureStep
                number="3"
                text="A compliance package defines the final requirements for that classification."
              />

              <ArchitectureStep
                number="4"
                text="Vendor applications inherit the configured requirements and accepted evidence types."
              />

              <ArchitectureStep
                number="5"
                text="TenderHub administrators review the evidence before vendor approval."
              />
            </div>
          </div>
        </div>
      </section>

      {/* Historical data principle */}
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Configuration principle
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Deactivating a compliance package or master requirement should
          affect future onboarding configuration only. Historical vendor
          applications, review decisions and submitted evidence must remain
          intact.
        </p>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-tenderhub-navy">
          {icon}
        </div>

        <span className="text-2xl font-bold text-slate-900">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-900">
        {label}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-lg font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-0.5 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}

function UsageMetric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-3">
      <p className="text-sm font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-0.5 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {text}
      </p>
    </div>
  );
}

function ArchitectureStep({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-xs font-bold text-white">
        {number}
      </div>

      <p>{text}</p>
    </div>
  );
}