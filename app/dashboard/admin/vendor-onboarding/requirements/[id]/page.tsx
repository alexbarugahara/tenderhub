import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { randomUUID } from "crypto";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileCheck2,
  Info,
  Plus,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import {
  generateRequirementSetCode,
  generateRequirementSetDescription,
  generateRequirementSetName,
} from "@/lib/vendor-onboarding/classification";

async function addRequirementToSet(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const requirementSetId = String(
    formData.get("requirementSetId") ?? "",
  ).trim();

  const requirementId = String(
    formData.get("requirementId") ?? "",
  ).trim();

  if (!requirementSetId || !requirementId) {
    throw new Error("Requirement set and requirement are required.");
  }

  const requirementSet =
    await prisma.vendorRequirementSet.findUnique({
      where: {
        id: requirementSetId,
      },
      select: {
        id: true,
      },
    });

  if (!requirementSet) {
    throw new Error("Requirement set not found.");
  }

  const requirement = await prisma.vendorRequirement.findUnique({
    where: {
      id: requirementId,
    },
    select: {
      id: true,
      active: true,
      required: true,
      purpose: true,
      allowedDocumentCategories: true,
    },
  });

  if (!requirement) {
    throw new Error("Requirement not found.");
  }

  if (!requirement.active) {
    throw new Error("This requirement is inactive.");
  }

  await prisma.vendorRequirementSetRequirement.upsert({
    where: {
      requirementSetId_requirementId: {
        requirementSetId,
        requirementId,
      },
    },
    create: {
      id: randomUUID(),
      requirementSetId,
      requirementId,
      required: requirement.required,
      purpose: requirement.purpose,
      allowedDocumentCategories:
        requirement.allowedDocumentCategories,
      active: true,
    },
    update: {
      active: true,
      required: requirement.required,
      purpose: requirement.purpose,
      allowedDocumentCategories:
        requirement.allowedDocumentCategories,
    },
  });

  redirect(
    `/dashboard/admin/vendor-onboarding/requirements/${requirementSetId}`,
  );
}

async function removeRequirementFromSet(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const requirementSetId = String(
    formData.get("requirementSetId") ?? "",
  ).trim();

  const requirementId = String(
    formData.get("requirementId") ?? "",
  ).trim();

  if (!requirementSetId || !requirementId) {
    throw new Error("Requirement set and requirement are required.");
  }

  await prisma.vendorRequirementSetRequirement.deleteMany({
    where: {
      requirementSetId,
      requirementId,
    },
  });

  redirect(
    `/dashboard/admin/vendor-onboarding/requirements/${requirementSetId}`,
  );
}

async function updateRequirementConfiguration(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const assignmentId = String(
    formData.get("assignmentId") ?? "",
  ).trim();

  const requirementSetId = String(
    formData.get("requirementSetId") ?? "",
  ).trim();

  const purpose = String(
    formData.get("purpose") ?? "",
  ).trim();

  const required = formData.get("required") === "on";
  const active = formData.get("active") === "on";

  if (!assignmentId || !requirementSetId) {
    throw new Error("Requirement configuration is incomplete.");
  }

  const assignment =
    await prisma.vendorRequirementSetRequirement.findUnique({
      where: {
        id: assignmentId,
      },
      select: {
        id: true,
        requirementSetId: true,
      },
    });

  if (!assignment || assignment.requirementSetId !== requirementSetId) {
    throw new Error("Requirement assignment not found.");
  }

  await prisma.vendorRequirementSetRequirement.update({
    where: {
      id: assignmentId,
    },
    data: {
      required,
      active,
      purpose: purpose || null,
    },
  });

  redirect(
    `/dashboard/admin/vendor-onboarding/requirements/${requirementSetId}`,
  );
}

async function toggleRequirementSet(formData: FormData) {
  "use server";

  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const id = String(formData.get("id") ?? "").trim();

  if (!id) {
    throw new Error("Requirement set ID is required.");
  }

  const current = await prisma.vendorRequirementSet.findUnique({
    where: {
      id,
    },
    select: {
      active: true,
    },
  });

  if (!current) {
    throw new Error("Requirement set not found.");
  }

  await prisma.vendorRequirementSet.update({
    where: {
      id,
    },
    data: {
      active: !current.active,
    },
  });

  redirect(
    `/dashboard/admin/vendor-onboarding/requirements/${id}`,
  );
}

export default async function VendorRequirementSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h1 className="text-lg font-semibold text-red-900">
          Access denied
        </h1>

        <p className="mt-2 text-sm text-red-700">
          Administrator access is required.
        </p>
      </div>
    );
  }

  const { id } = await params;

  const requirementSet =
    await prisma.vendorRequirementSet.findUnique({
      where: {
        id,
      },
      include: {
        companyType: true,
        industry: true,
        requirements: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            requirement: true,
          },
        },
        _count: {
          select: {
            applications: true,
            vendors: true,
          },
        },
      },
    });

  if (!requirementSet) {
    notFound();
  }

  const assignedIds = new Set(
    requirementSet.requirements.map(
      (item) => item.requirementId,
    ),
  );

  /*
   * Classification rules are the source of recommended requirements.
   *
   * A rule is relevant only when the requirement set has both a company
   * type and an industry.
   */
  const recommendedRules =
    requirementSet.companyTypeId &&
    requirementSet.industryId
      ? await prisma.vendorRequirementRule.findMany({
          where: {
            companyTypeId: requirementSet.companyTypeId,
            industryId: requirementSet.industryId,
            active: true,
            requirement: {
              active: true,
            },
          },
          orderBy: [
            {
              priority: "asc",
            },
            {
              requirement: {
                name: "asc",
              },
            },
          ],
          include: {
            requirement: true,
          },
        })
      : [];

  const recommendedUnassigned = recommendedRules.filter(
    (rule) => !assignedIds.has(rule.requirementId),
  );

  const availableRequirements =
    await prisma.vendorRequirement.findMany({
      where: {
        active: true,
        id: {
          notIn: Array.from(assignedIds),
        },
      },
      orderBy: [
        {
          required: "desc",
        },
        {
          name: "asc",
        },
      ],
    });

  const requiredCount = requirementSet.requirements.filter(
    (item) => item.required && item.active,
  ).length;

  const activeCount = requirementSet.requirements.filter(
    (item) => item.active,
  ).length;

  const optionalCount = requirementSet.requirements.filter(
    (item) => !item.required && item.active,
  ).length;

  const configuredCount = requirementSet.requirements.filter(
    (item) =>
      item.active &&
      item.allowedDocumentCategories.length > 0,
  ).length;

  const generatedName =
    requirementSet.companyType && requirementSet.industry
      ? generateRequirementSetName(
          requirementSet.companyType.name,
          requirementSet.industry.name,
        )
      : requirementSet.name;

  const generatedCode =
    requirementSet.companyType && requirementSet.industry
      ? generateRequirementSetCode(
          requirementSet.companyType.code,
          requirementSet.industry.code,
        )
      : requirementSet.code;

  const generatedDescription =
    requirementSet.companyType && requirementSet.industry
      ? generateRequirementSetDescription(
          requirementSet.companyType.name,
          requirementSet.industry.name,
        )
      : requirementSet.description;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/admin/vendor-onboarding/requirements"
          className="inline-flex items-center gap-2 text-sm font-medium text-tenderhub-navy transition hover:text-tenderhub-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to requirement sets
        </Link>

        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-tenderhub-gold">
                Vendor Compliance Configuration
              </p>

              {requirementSet.active ? (
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

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {requirementSet.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold text-slate-600">
                {requirementSet.code}
              </span>

              {requirementSet.companyType && (
                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                  {requirementSet.companyType.name}
                </span>
              )}

              {requirementSet.industry && (
                <span className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                  {requirementSet.industry.name}
                </span>
              )}
            </div>

            {requirementSet.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                {requirementSet.description}
              </p>
            )}
          </div>

          <form action={toggleRequirementSet}>
            <input
              type="hidden"
              name="id"
              value={requirementSet.id}
            />

            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {requirementSet.active
                ? "Deactivate set"
                : "Activate set"}
            </button>
          </form>
        </div>
      </div>

      {/* Classification identity */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Classification
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              This package determines the standard TenderHub compliance
              framework for the selected vendor classification.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <IdentityCard
                label="Company type"
                value={
                  requirementSet.companyType?.name ??
                  "Not configured"
                }
              />

              <IdentityCard
                label="Industry"
                value={
                  requirementSet.industry?.name ??
                  "Not configured"
                }
              />

              <IdentityCard
                label="System code"
                value={generatedCode}
                mono
              />
            </div>

            {generatedName !== requirementSet.name ||
            generatedDescription !== requirementSet.description ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex gap-3">
                  <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Classification identity
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      The package was created with a custom identity that
                      differs from the current generated classification
                      identity.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard
          label="Assigned"
          value={requirementSet.requirements.length}
        />

        <SummaryCard
          label="Active"
          value={activeCount}
        />

        <SummaryCard
          label="Required"
          value={requiredCount}
        />

        <SummaryCard
          label="Optional"
          value={optionalCount}
        />

        <SummaryCard
          label="Evidence configured"
          value={configuredCount}
        />
      </div>

      {/* Recommended requirements */}
      {recommendedUnassigned.length > 0 && (
        <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-slate-900">
                Recommended for this classification
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                TenderHub has identified requirements configured for{" "}
                <span className="font-semibold">
                  {requirementSet.companyType?.name}
                </span>{" "}
                vendors operating in{" "}
                <span className="font-semibold">
                  {requirementSet.industry?.name}
                </span>
                . Review and add the recommendations that belong in this
                compliance package.
              </p>

              <div className="mt-5 space-y-3">
                {recommendedUnassigned.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-col gap-4 rounded-xl border border-blue-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {rule.requirement.name}
                        </h3>

                        {rule.required ? (
                          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Required
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Optional
                          </span>
                        )}
                      </div>

                      <p className="mt-1 font-mono text-xs text-slate-400">
                        {rule.requirement.code}
                      </p>

                      {(rule.purpose ||
                        rule.requirement.purpose) && (
                        <p className="mt-2 text-sm leading-5 text-slate-600">
                          {rule.purpose ||
                            rule.requirement.purpose}
                        </p>
                      )}
                    </div>

                    <form action={addRequirementToSet}>
                      <input
                        type="hidden"
                        name="requirementSetId"
                        value={requirementSet.id}
                      />

                      <input
                        type="hidden"
                        name="requirementId"
                        value={rule.requirementId}
                      />

                      <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 sm:w-auto"
                      >
                        <Plus className="h-4 w-4" />
                        Add
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Assigned requirements */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Compliance requirements
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Configure exactly what vendors in this classification must
            satisfy before TenderHub can approve their onboarding
            application.
          </p>
        </div>

        {requirementSet.requirements.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
              <FileCheck2 className="h-7 w-7 text-slate-500" />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-slate-900">
              No requirements configured
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
              Add the recommended requirements above or select an existing
              TenderHub requirement below.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requirementSet.requirements.map((assignment) => {
              const requirement = assignment.requirement;

              return (
                <div
                  key={assignment.id}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="p-5">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
                          <FileCheck2 className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-slate-900">
                              {requirement.name}
                            </h3>

                            {assignment.required ? (
                              <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                                Required
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                Optional
                              </span>
                            )}

                            {assignment.active ? (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                Active
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                                Inactive
                              </span>
                            )}
                          </div>

                          <p className="mt-1 font-mono text-xs text-slate-400">
                            {requirement.code}
                          </p>

                          {requirement.description && (
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                              {requirement.description}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {requirement.category}
                            </span>

                            {assignment.allowedDocumentCategories.length >
                              0 && (
                              <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                {
                                  assignment
                                    .allowedDocumentCategories
                                    .length
                                }{" "}
                                accepted evidence type
                                {assignment
                                  .allowedDocumentCategories
                                  .length !== 1
                                  ? "s"
                                  : ""}
                              </span>
                            )}

                            {requirement.validityDays && (
                              <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                                Valid for{" "}
                                {requirement.validityDays} days
                              </span>
                            )}
                          </div>

                          {assignment.purpose && (
                            <div className="mt-4 rounded-xl bg-slate-50 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Purpose
                              </p>

                              <p className="mt-1 text-sm leading-5 text-slate-700">
                                {assignment.purpose}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <form
                        action={removeRequirementFromSet}
                        className="shrink-0"
                      >
                        <input
                          type="hidden"
                          name="requirementSetId"
                          value={requirementSet.id}
                        />

                        <input
                          type="hidden"
                          name="requirementId"
                          value={requirement.id}
                        />

                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4" />
                          Remove
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Configuration */}
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5">
                    <form
                      action={updateRequirementConfiguration}
                      className="space-y-4"
                    >
                      <input
                        type="hidden"
                        name="assignmentId"
                        value={assignment.id}
                      />

                      <input
                        type="hidden"
                        name="requirementSetId"
                        value={requirementSet.id}
                      />

                      <div className="grid gap-5 lg:grid-cols-3">
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                          <input
                            type="checkbox"
                            name="required"
                            defaultChecked={assignment.required}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-tenderhub-navy focus:ring-tenderhub-navy"
                          />

                          <span>
                            <span className="block text-sm font-semibold text-slate-900">
                              Required
                            </span>

                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              Vendor must satisfy this requirement before
                              approval.
                            </span>
                          </span>
                        </label>

                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                          <input
                            type="checkbox"
                            name="active"
                            defaultChecked={assignment.active}
                            className="mt-1 h-4 w-4 rounded border-slate-300 text-tenderhub-navy focus:ring-tenderhub-navy"
                          />

                          <span>
                            <span className="block text-sm font-semibold text-slate-900">
                              Active
                            </span>

                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              Include this requirement in active onboarding
                              applications.
                            </span>
                          </span>
                        </label>

                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <p className="text-sm font-semibold text-slate-900">
                            Accepted evidence
                          </p>

                          {assignment.allowedDocumentCategories.length >
                          0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {assignment.allowedDocumentCategories.map(
                                (category) => (
                                  <span
                                    key={category}
                                    className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                  >
                                    {formatDocumentCategory(
                                      category,
                                    )}
                                  </span>
                                ),
                              )}
                            </div>
                          ) : (
                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              No evidence categories configured on this
                              assignment.
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor={`purpose-${assignment.id}`}
                          className="block text-sm font-semibold text-slate-900"
                        >
                          Requirement purpose
                        </label>

                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          Explain why TenderHub requires this evidence for
                          this vendor classification.
                        </p>

                        <textarea
                          id={`purpose-${assignment.id}`}
                          name="purpose"
                          rows={3}
                          defaultValue={
                            assignment.purpose ??
                            requirement.purpose ??
                            ""
                          }
                          placeholder="Explain the purpose of this requirement..."
                          className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center gap-2 rounded-xl bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Save configuration
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add requirement */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-tenderhub-navy text-white">
            <Plus className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Add another requirement
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Assign another active TenderHub master requirement to this
              classification package.
            </p>

            {availableRequirements.length === 0 ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-slate-900">
                  No additional requirements available
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  All active master requirements are already assigned to
                  this package.
                </p>
              </div>
            ) : (
              <form
                action={addRequirementToSet}
                className="mt-5 flex flex-col gap-3 sm:flex-row"
              >
                <input
                  type="hidden"
                  name="requirementSetId"
                  value={requirementSet.id}
                />

                <select
                  name="requirementId"
                  required
                  defaultValue=""
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
                >
                  <option value="" disabled>
                    Select a requirement
                  </option>

                  {availableRequirements.map(
                    (requirement) => (
                      <option
                        key={requirement.id}
                        value={requirement.id}
                      >
                        {requirement.name}
                        {requirement.required
                          ? " — Required"
                          : " — Optional"}
                      </option>
                    ),
                  )}
                </select>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-95"
                >
                  <Plus className="h-4 w-4" />
                  Add requirement
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <div className="flex gap-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-tenderhub-navy" />

          <div>
            <h2 className="font-semibold text-slate-900">
              How this compliance framework works
            </h2>

            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <WorkflowItem text="Company type and industry determine the vendor classification." />

              <WorkflowItem text="Classification rules recommend the requirements that normally apply to that vendor type." />

              <WorkflowItem text="The requirement set determines the final compliance package used by TenderHub." />

              <WorkflowItem text="Each requirement can be configured as required or optional and given a classification-specific purpose." />

              <WorkflowItem text="Accepted evidence types are stored with the package so the onboarding workflow knows what vendors may submit." />

              <WorkflowItem text="TenderHub administrators review the submitted evidence before the vendor is approved." />
            </div>
          </div>
        </div>
      </section>

      {/* Usage */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-tenderhub-navy">
          Package usage
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <UsageCard
            label="Vendor applications"
            value={requirementSet._count.applications}
            description="Applications using this package"
          />

          <UsageCard
            label="Approved vendors"
            value={requirementSet._count.vendors}
            description="Vendors currently linked to this package"
          />
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function IdentityCard({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p
        className={`mt-2 text-sm font-semibold text-slate-900 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function UsageCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-2xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {label}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function WorkflowItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <Circle className="mt-1 h-3.5 w-3.5 shrink-0" />

      <p>{text}</p>
    </div>
  );
}

function formatDocumentCategory(category: string) {
  return category
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}
