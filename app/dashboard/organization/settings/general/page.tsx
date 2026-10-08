"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Lock,
  Pencil,
  Save,
  ShieldAlert,
  X,
} from "lucide-react";

interface OrganizationData {
  id: string;
  name: string;
  legalName: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  description: string | null;
  registrationNumber: string | null;
  taxNumber: string | null;
  organizationType: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  country: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  currency: {
    id: string;
    code: string;
    name: string;
    symbol: string | null;
  } | null;
}

interface OrganizationResponse {
  organization: OrganizationData;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  description: string;
}

export default function GeneralSettingsPage() {
  const [organization, setOrganization] =
    useState<OrganizationData | null>(null);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    phone: "",
    website: "",
    address: "",
    description: "",
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    loadOrganization();
  }, []);

  async function loadOrganization() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/organization/settings/general",
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data = (await response.json()) as
        | OrganizationResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Failed to load organization settings.",
        );
      }

      const result = data as OrganizationResponse;

      setOrganization(result.organization);

      setForm({
        name: result.organization.name ?? "",
        email: result.organization.email ?? "",
        phone: result.organization.phone ?? "",
        website: result.organization.website ?? "",
        address: result.organization.address ?? "",
        description: result.organization.description ?? "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load organization settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSuccess("");
    setError("");
  }

  function startEditing() {
    if (!organization) {
      return;
    }

    setForm({
      name: organization.name ?? "",
      email: organization.email ?? "",
      phone: organization.phone ?? "",
      website: organization.website ?? "",
      address: organization.address ?? "",
      description: organization.description ?? "",
    });

    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEditing() {
    if (!organization) {
      return;
    }

    setForm({
      name: organization.name ?? "",
      email: organization.email ?? "",
      phone: organization.phone ?? "",
      website: organization.website ?? "",
      address: organization.address ?? "",
      description: organization.description ?? "",
    });

    setError("");
    setSuccess("");
    setEditing(false);
  }

  async function saveChanges() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/organization/settings/general",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        },
      );

      const data = (await response.json()) as
        | OrganizationResponse
        | { error?: string };

      if (!response.ok) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "Failed to save organization settings.",
        );
      }

      const result = data as OrganizationResponse;

      setOrganization(result.organization);

      setForm({
        name: result.organization.name ?? "",
        email: result.organization.email ?? "",
        phone: result.organization.phone ?? "",
        website: result.organization.website ?? "",
        address: result.organization.address ?? "",
        description: result.organization.description ?? "",
      });

      setSuccess(
        "Organization information updated successfully.",
      );

      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save organization settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/dashboard/organization/settings"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Organization Settings
          </Link>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            General Settings
          </h1>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm text-slate-500">
            Loading organization information...
          </p>
        </div>
      </div>
    );
  }

  if (error && !organization) {
    return (
      <div className="space-y-8">
        <div>
          <Link
            href="/dashboard/organization/settings"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
          >
            ← Organization Settings
          </Link>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            General Settings
          </h1>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-900">
            Unable to load organization
          </h2>

          <p className="mt-2 text-sm text-red-800">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/dashboard/organization/settings"
          className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
        >
          ← Organization Settings
        </Link>

        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              General Settings
            </h1>

            <p className="mt-1 text-sm text-slate-600">
              Manage your organization&apos;s basic information and business
              details.
            </p>
          </div>

          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Pencil className="h-4 w-4" />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">
            {error}
          </p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

          <p className="text-sm font-medium text-emerald-800">
            {success}
          </p>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Organization Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {editing
              ? "Update your organization's normal contact and operating information."
              : "Your organization's normal contact and operating information."}
          </p>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          {editing ? (
            <>
              <EditableField
                label="Organization Name"
                value={form.name}
                onChange={(value) => updateField("name", value)}
              />

              <EditableField
                label="Organization Email"
                type="email"
                value={form.email}
                onChange={(value) => updateField("email", value)}
              />

              <EditableField
                label="Phone"
                value={form.phone}
                onChange={(value) => updateField("phone", value)}
              />

              <EditableField
                label="Website"
                value={form.website}
                onChange={(value) => updateField("website", value)}
              />

              <div className="md:col-span-2">
                <EditableField
                  label="Description"
                  value={form.description}
                  onChange={(value) =>
                    updateField("description", value)
                  }
                  multiline
                />
              </div>
            </>
          ) : (
            <>
              <DisplayField
                label="Organization Name"
                value={organization.name}
              />

              <DisplayField
                label="Organization Email"
                value={organization.email}
              />

              <DisplayField
                label="Phone"
                value={organization.phone}
              />

              <DisplayField
                label="Website"
                value={organization.website}
              />

              <div className="md:col-span-2">
                <DisplayField
                  label="Description"
                  value={organization.description}
                  multiline
                />
              </div>
            </>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Business Address
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {editing
              ? "Update the organization's primary business or operating address."
              : "The organization's primary business or operating address."}
          </p>
        </div>

        <div className="p-6">
          {editing ? (
            <EditableField
              label="Business Address"
              value={form.address}
              onChange={(value) => updateField("address", value)}
              multiline
            />
          ) : (
            <DisplayField
              label="Business Address"
              value={organization.address}
              multiline
            />
          )}
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 shadow-sm">
        <div className="border-b border-amber-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Legal &amp; Verified Information
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                These fields establish the legal identity of your
                organization. They cannot be changed directly by the
                organization because changes may affect verification.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          <ProtectedField
            label="Legal Name"
            value={organization.legalName}
          />

          <ProtectedField
            label="Registration Number"
            value={organization.registrationNumber}
          />

          <ProtectedField
            label="Tax Number"
            value={organization.taxNumber}
          />

          <ProtectedField
            label="Organization Type"
            value={
              organization.organizationType
                ? formatEnumValue(organization.organizationType)
                : null
            }
          />

          <ProtectedField
            label="Country"
            value={
              organization.country
                ? `${organization.country.name}${
                    organization.country.code
                      ? ` (${organization.country.code})`
                      : ""
                  }`
                : null
            }
          />

          <ProtectedField
            label="Currency"
            value={
              organization.currency
                ? `${organization.currency.code}${
                    organization.currency.name
                      ? ` — ${organization.currency.name}`
                      : ""
                  }`
                : null
            }
          />
        </div>

        <div className="border-t border-amber-200 px-6 py-5">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />

            <p className="text-sm leading-6 text-slate-600">
              Need to change legal or verified information? Contact a
              TenderHub administrator. Supporting documentation may be
              required before the change can be approved.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="px-6 py-5">
          <h2 className="text-lg font-semibold text-slate-900">
            Organization Status
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Verification
              </p>

              <p className="mt-2 text-sm font-medium text-slate-900">
                {organization.verifiedAt
                  ? "Verified"
                  : "Not verified"}
              </p>

              {organization.verifiedAt && (
                <p className="mt-1 text-xs text-slate-500">
                  Verified on{" "}
                  {formatDateTime(organization.verifiedAt)}
                </p>
              )}
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Organization Record
              </p>

              <p className="mt-2 text-sm font-medium text-slate-900">
                Active
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Created on {formatDateTime(organization.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          Last updated: {formatDateTime(organization.updatedAt)}
        </p>

        {editing && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={cancelEditing}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>

            <button
              type="button"
              onClick={saveChanges}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface EditableFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
}

function EditableField({
  label,
  value,
  onChange,
  type = "text",
  multiline = false,
}: EditableFieldProps) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
        />
      )}
    </div>
  );
}

interface DisplayFieldProps {
  label: string;
  value: string | null | undefined;
  multiline?: boolean;
}

function DisplayField({
  label,
  value,
  multiline = false,
}: DisplayFieldProps) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>

      <div
        className={`mt-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 ${
          multiline ? "min-h-[104px] whitespace-pre-wrap" : ""
        }`}
      >
        {value || "Not provided"}
      </div>
    </div>
  );
}

interface ProtectedFieldProps {
  label: string;
  value: string | null | undefined;
}

function ProtectedField({
  label,
  value,
}: ProtectedFieldProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </label>

        <Lock className="h-3.5 w-3.5 text-slate-400" />
      </div>

      <div className="mt-2 rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-700">
        {value || "Not provided"}
      </div>

      <p className="mt-1.5 text-xs text-slate-500">
        Admin approval required to change this field.
      </p>
    </div>
  );
}

function formatEnumValue(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));
}