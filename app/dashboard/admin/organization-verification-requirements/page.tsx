"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type OrganizationCategory =
  | "LEGAL_IDENTITY"
  | "REGISTRATION"
  | "TAX"
  | "ADDRESS"
  | "REPRESENTATIVE"
  | "OWNERSHIP"
  | "LICENSING"
  | "GOVERNMENT_REGISTRATION"
  | "SANCTIONS_SCREENING"
  | "SUPPORTING_DOCUMENTATION"
  | "OTHER";

type RequirementStatus = "ACTIVE" | "INACTIVE";

type OrganizationRequirement = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: OrganizationCategory;
  required: boolean;
  validityDays: number | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  verificationCheckCount: number;
};

type RequirementForm = {
  code: string;
  name: string;
  description: string;
  category: OrganizationCategory;
  required: boolean;
  validityDays: string;
  active: boolean;
};

const CATEGORY_LABELS: Record<
  OrganizationCategory,
  string
> = {
  LEGAL_IDENTITY: "Legal Identity",
  REGISTRATION: "Registration",
  TAX: "Tax",
  ADDRESS: "Address",
  REPRESENTATIVE: "Representative",
  OWNERSHIP: "Ownership",
  LICENSING: "Licensing",
  GOVERNMENT_REGISTRATION:
    "Government Registration",
  SANCTIONS_SCREENING:
    "Sanctions Screening",
  SUPPORTING_DOCUMENTATION:
    "Supporting Documentation",
  OTHER: "Other",
};

const CATEGORY_OPTIONS: Array<{
  value: OrganizationCategory;
  label: string;
}> = Object.entries(CATEGORY_LABELS).map(
  ([value, label]) => ({
    value: value as OrganizationCategory,
    label,
  }),
);

function emptyForm(): RequirementForm {
  return {
    code: "",
    name: "",
    description: "",
    category: "LEGAL_IDENTITY",
    required: true,
    validityDays: "",
    active: true,
  };
}

function generateCode(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function categoryLabel(
  category: OrganizationCategory,
) {
  return CATEGORY_LABELS[category] ?? category;
}

export default function OrganizationVerificationRequirementsPage() {
  const [requirements, setRequirements] =
    useState<OrganizationRequirement[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [category, setCategory] = useState<
    "ALL" | OrganizationCategory
  >("ALL");

  const [statusFilter, setStatusFilter] =
    useState<
      "ALL" | RequirementStatus
    >("ALL");

  const [showForm, setShowForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [form, setForm] =
    useState<RequirementForm>(
      emptyForm(),
    );

  async function loadRequirements() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/admin/organization-compliance-requirements",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load organization verification requirements.",
        );
      }

      const rows =
        Array.isArray(data?.requirements)
          ? data.requirements
          : [];

      setRequirements(rows);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load organization verification requirements.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequirements();
  }, []);

  const filteredRequirements =
    useMemo(() => {
      const query =
        search.trim().toLowerCase();

      return requirements.filter(
        (requirement) => {
          const matchesSearch =
            !query ||
            requirement.name
              .toLowerCase()
              .includes(query) ||
            requirement.code
              .toLowerCase()
              .includes(query) ||
            (requirement.description ??
              "")
              .toLowerCase()
              .includes(query);

          const matchesCategory =
            category === "ALL" ||
            requirement.category ===
              category;

          const matchesStatus =
            statusFilter === "ALL" ||
            (requirement.active
              ? "ACTIVE"
              : "INACTIVE") ===
              statusFilter;

          return (
            matchesSearch &&
            matchesCategory &&
            matchesStatus
          );
        },
      );
    }, [
      requirements,
      search,
      category,
      statusFilter,
    ]);

  const activeCount =
    requirements.filter(
      (item) => item.active,
    ).length;

  const requiredCount =
    requirements.filter(
      (item) => item.required,
    ).length;

  const validityCount =
    requirements.filter(
      (item) =>
        item.validityDays !== null,
    ).length;

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(
    requirement: OrganizationRequirement,
  ) {
    setEditingId(requirement.id);

    setForm({
      code: requirement.code,
      name: requirement.name,
      description:
        requirement.description ?? "",
      category: requirement.category,
      required: requirement.required,
      validityDays:
        requirement.validityDays !==
        null
          ? String(
              requirement.validityDays,
            )
          : "",
      active: requirement.active,
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  async function saveRequirement() {
    const name =
      form.name.trim();

    if (!name) {
      setError(
        "Requirement name is required.",
      );
      return;
    }

    const code =
      form.code.trim() ||
      generateCode(name);

    if (!code) {
      setError(
        "Requirement code is required.",
      );
      return;
    }

    let validityDays:
      | number
      | null = null;

    if (form.validityDays.trim()) {
      const parsed = Number(
        form.validityDays.trim(),
      );

      if (
        !Number.isInteger(parsed) ||
        parsed < 0
      ) {
        setError(
          "Validity days must be a non-negative whole number.",
        );
        return;
      }

      validityDays = parsed;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const isEditing =
        Boolean(editingId);

      const response = await fetch(
        isEditing
          ? `/api/admin/organization-compliance-requirements/${editingId}`
          : "/api/admin/organization-compliance-requirements",
        {
          method: isEditing
            ? "PUT"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            code,
            name,
            description:
              form.description.trim() ||
              null,
            category: form.category,
            required: form.required,
            validityDays,
            active: form.active,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to save organization requirement.",
        );
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());

      await loadRequirements();

      setSuccess(
        isEditing
          ? "Organization verification requirement updated successfully."
          : "Organization verification requirement created successfully.",
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to save organization verification requirement.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateRequirement(
    id: string,
    changes: Partial<OrganizationRequirement>,
  ) {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/admin/organization-compliance-requirements/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(
            changes,
          ),
        },
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update organization requirement.",
        );
      }

      await loadRequirements();

      setSuccess(
        "Requirement updated successfully.",
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to update requirement.",
      );

      await loadRequirements();
    }
  }

  async function toggleRequired(
    requirement: OrganizationRequirement,
  ) {
    await updateRequirement(
      requirement.id,
      {
        required:
          !requirement.required,
      },
    );
  }

  async function toggleStatus(
    requirement: OrganizationRequirement,
  ) {
    await updateRequirement(
      requirement.id,
      {
        active:
          !requirement.active,
      },
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
              <Link
                href="/dashboard/admin"
                className="hover:text-gray-900"
              >
                Admin
              </Link>

              <span>/</span>

              <span className="text-gray-700">
                Organization Requirements
              </span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Organization Verification Requirements
            </h1>

            <p className="mt-1 max-w-3xl text-sm text-gray-600">
              Configure the information,
              documents and compliance
              checks organizations must
              complete before they can be
              verified on TenderHub.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/dashboard/admin/organizations"
              className="inline-flex items-center justify-center rounded-lg border border-[#071A33] bg-white px-4 py-2.5 text-sm font-semibold text-[#071A33] shadow-sm transition hover:bg-gray-50"
            >
              Review Organizations
            </Link>

            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center justify-center rounded-lg bg-[#071A33] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#10294A]"
            >
              + Add Requirement
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </div>
        )}

        <section className="rounded-xl border border-[#071A33]/10 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[#071A33]">
                Requirement configuration
              </p>

              <p className="mt-1 max-w-3xl text-sm text-gray-600">
                These requirements are
                stored in the TenderHub
                database and are used by the
                organization verification
                workflow. Changes here affect
                future verification checks.
              </p>
            </div>

            <Link
              href="/dashboard/admin/organizations"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#071A33] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#10294A]"
            >
              Go to Organization Management →
            </Link>
          </div>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Total Requirements
            </p>

            <p className="mt-2 text-3xl font-bold text-gray-900">
              {requirements.length}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Configured requirements
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Active
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {activeCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Currently enforced
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Required
            </p>

            <p className="mt-2 text-3xl font-bold text-[#071A33]">
              {requiredCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Mandatory requirements
            </p>
          </div>

          <div className="rounded-xl border bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Validity Rules
            </p>

            <p className="mt-2 text-3xl font-bold text-[#D4AF37]">
              {validityCount}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Requirements with expiry
              periods
            </p>
          </div>
        </div>

        {showForm && (
          <section className="rounded-xl border bg-white shadow-sm">
            <div className="border-b px-6 py-5">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId
                  ? "Edit Organization Requirement"
                  : "Add Organization Requirement"}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Define the rule stored in the
                organization verification
                configuration.
              </p>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Requirement name
                </label>

                <input
                  value={form.name}
                  onChange={(event) => {
                    const name =
                      event.target.value;

                    setForm((current) => ({
                      ...current,
                      name,
                      code:
                        current.code ||
                        generateCode(name),
                    }));
                  }}
                  placeholder="e.g. Certificate of Incorporation"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#071A33] focus:ring-1 focus:ring-[#071A33]"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Requirement code
                </label>

                <input
                  value={form.code}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        code: event.target.value
                          .toUpperCase(),
                      }),
                    )
                  }
                  placeholder="e.g. CERTIFICATE_OF_INCORPORATION"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono outline-none focus:border-[#071A33] focus:ring-1 focus:ring-[#071A33]"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Unique system code used by
                  the verification workflow.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Category
                </label>

                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        category:
                          event.target
                            .value as OrganizationCategory,
                      }),
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#071A33]"
                >
                  {CATEGORY_OPTIONS.map(
                    (item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Validity days
                </label>

                <input
                  type="number"
                  min={0}
                  value={
                    form.validityDays
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        validityDays:
                          event.target.value,
                      }),
                    )
                  }
                  placeholder="Leave blank if not applicable"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#071A33]"
                />

                <p className="mt-1 text-xs text-gray-500">
                  Optional number of days
                  before the requirement
                  expires.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        description:
                          event.target.value,
                      }),
                    )
                  }
                  rows={3}
                  placeholder="Explain what the organization must provide or demonstrate."
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#071A33]"
                />
              </div>

              <label className="flex items-start gap-3 rounded-lg border p-4">
                <input
                  type="checkbox"
                  checked={
                    form.required
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        required:
                          event.target
                            .checked,
                      }),
                    )
                  }
                  className="mt-1"
                />

                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Required requirement
                  </span>

                  <span className="mt-1 block text-xs text-gray-500">
                    Required checks must be
                    satisfied before
                    verification can be
                    approved.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-lg border p-4">
                <input
                  type="checkbox"
                  checked={
                    form.active
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,
                        active:
                          event.target
                            .checked,
                      }),
                    )
                  }
                  className="mt-1"
                />

                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    Active requirement
                  </span>

                  <span className="mt-1 block text-xs text-gray-500">
                    Active requirements are
                    available to the
                    verification workflow.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="rounded-lg border bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  saveRequirement
                }
                disabled={saving}
                className="rounded-lg bg-[#071A33] px-4 py-2 text-sm font-semibold text-white hover:bg-[#10294A] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Add Requirement"}
              </button>
            </div>
          </section>
        )}

        <section className="rounded-xl border bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="sr-only">
                Search requirements
              </label>

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Search requirements..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#071A33]"
              />
            </div>

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target
                    .value as
                    | "ALL"
                    | OrganizationCategory,
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#071A33]"
            >
              <option value="ALL">
                All categories
              </option>

              {CATEGORY_OPTIONS.map(
                (item) => (
                  <option
                    key={item.value}
                    value={item.value}
                  >
                    {item.label}
                  </option>
                ),
              )}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "ALL"
                    | RequirementStatus,
                )
              }
              className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#071A33]"
            >
              <option value="ALL">
                All statuses
              </option>

              <option value="ACTIVE">
                Active
              </option>

              <option value="INACTIVE">
                Inactive
              </option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white shadow-sm">
          <div className="border-b px-6 py-5">
            <h2 className="text-lg font-semibold text-gray-900">
              Organization Requirements
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Requirements currently
              configured for organization
              verification.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">
                    Requirement
                  </th>

                  <th className="px-6 py-3">
                    Category
                  </th>

                  <th className="px-6 py-3">
                    Code
                  </th>

                  <th className="px-6 py-3">
                    Required
                  </th>

                  <th className="px-6 py-3">
                    Status
                  </th>

                  <th className="px-6 py-3">
                    Usage
                  </th>

                  <th className="px-6 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-gray-500"
                    >
                      Loading organization
                      requirements...
                    </td>
                  </tr>
                ) : filteredRequirements.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center"
                    >
                      <p className="font-medium text-gray-900">
                        No requirements
                        found
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Try changing your
                        search or filters,
                        or add a new
                        requirement.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRequirements.map(
                    (requirement) => (
                      <tr
                        key={
                          requirement.id
                        }
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">
                            {
                              requirement.name
                            }
                          </p>

                          {requirement.description && (
                            <p className="mt-1 max-w-xl text-xs leading-5 text-gray-500">
                              {
                                requirement.description
                              }
                            </p>
                          )}
                        </td>

                        <td className="px-6 py-4">
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                            {categoryLabel(
                              requirement.category,
                            )}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <span className="font-mono text-xs text-gray-600">
                            {
                              requirement.code
                            }
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              toggleRequired(
                                requirement,
                              )
                            }
                            disabled={
                              saving
                            }
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              requirement.required
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {requirement.required
                              ? "Required"
                              : "Optional"}
                          </button>
                        </td>

                        <td className="px-6 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              toggleStatus(
                                requirement,
                              )
                            }
                            disabled={
                              saving
                            }
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              requirement.active
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {requirement.active
                              ? "Active"
                              : "Inactive"}
                          </button>
                        </td>

                        <td className="px-6 py-4 text-xs text-gray-600">
                          <div>
                            {requirement.validityDays !==
                            null
                              ? `${requirement.validityDays} days validity`
                              : "No expiry"}
                          </div>

                          <div className="mt-1">
                            {
                              requirement.verificationCheckCount
                            }{" "}
                            verification checks
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openEditForm(
                                requirement,
                              )
                            }
                            className="text-sm font-medium text-[#071A33] hover:underline"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">
                How Organization
                Verification Works
              </h2>

              <p className="mt-1 max-w-3xl text-sm text-gray-600">
                Configuration and approval
                are separate stages of the
                verification workflow.
              </p>
            </div>

            <Link
              href="/dashboard/admin/organizations"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-[#071A33] bg-white px-4 py-2 text-sm font-semibold text-[#071A33] hover:bg-gray-50"
            >
              Review Organizations →
            </Link>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white/70 p-4">
              <p className="text-sm font-semibold text-[#071A33]">
                1. Configure
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Administrators define the
                requirements organizations
                must satisfy.
              </p>
            </div>

            <div className="rounded-lg bg-white/70 p-4">
              <p className="text-sm font-semibold text-[#071A33]">
                2. Submit
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Organizations provide
                information and supporting
                documents.
              </p>
            </div>

            <div className="rounded-lg bg-white/70 p-4">
              <p className="text-sm font-semibold text-[#071A33]">
                3. Review
              </p>

              <p className="mt-1 text-sm text-gray-600">
                Administrators inspect
                documents and verification
                checks.
              </p>
            </div>

            <div className="rounded-lg bg-white/70 p-4">
              <p className="text-sm font-semibold text-[#071A33]">
                4. Approve
              </p>

              <p className="mt-1 text-sm text-gray-600">
                The organization can be
                approved after the required
                checks are satisfied.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}