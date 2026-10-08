"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import Button from "@/components/ui/Button";

type Solicitation = {
  id: string;
  solicitationNumber: string;
  title: string;
  status: string;
};

type EvaluationCriterion = {
  id: string;
  solicitationId: string;
  name: string;
  description: string | null;
  weight: number;
  maxScore: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type CriterionForm = {
  name: string;
  description: string;
  weight: string;
  maxScore: string;
  sortOrder: string;
};

const emptyForm: CriterionForm = {
  name: "",
  description: "",
  weight: "",
  maxScore: "100",
  sortOrder: "0",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

export default function EvaluationCriteriaPage() {
  const params = useParams<{ id: string }>();
  const solicitationId = params?.id;

  const [solicitation, setSolicitation] = useState<Solicitation | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CriterionForm>(emptyForm);

  const isDraft = solicitation?.status === "DRAFT";

  const totalWeight = useMemo(
    () => criteria.reduce((total, criterion) => total + Number(criterion.weight || 0), 0),
    [criteria],
  );

  const weightDifference = 100 - totalWeight;

  const loadData = useCallback(async () => {
    if (!solicitationId) return;

    setLoading(true);
    setError("");

    try {
      const [solicitationResponse, criteriaResponse] = await Promise.all([
        fetch(`/api/solicitations/${solicitationId}`, {
          cache: "no-store",
        }),
        fetch(`/api/evaluation-criteria?solicitationId=${solicitationId}`, {
          cache: "no-store",
        }),
      ]);

      const solicitationData: ApiResponse<Solicitation> =
        await solicitationResponse.json();

      const criteriaData: ApiResponse<EvaluationCriterion[]> =
        await criteriaResponse.json();

      if (!solicitationResponse.ok || !solicitationData.success) {
        throw new Error(
          solicitationData.message || "Failed to load solicitation.",
        );
      }

      if (!criteriaResponse.ok || !criteriaData.success) {
        throw new Error(
          criteriaData.message || "Failed to load evaluation criteria.",
        );
      }

      setSolicitation(solicitationData.data ?? null);
      setCriteria(criteriaData.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load evaluation criteria.",
      );
    } finally {
      setLoading(false);
    }
  }, [solicitationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openAddForm() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sortOrder: String(criteria.length),
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(criterion: EvaluationCriterion) {
    setEditingId(criterion.id);
    setForm({
      name: criterion.name,
      description: criterion.description ?? "",
      weight: String(criterion.weight),
      maxScore: String(criterion.maxScore),
      sortOrder: String(criterion.sortOrder),
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function updateForm(field: keyof CriterionForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!solicitationId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const weight = Number(form.weight);
      const maxScore = Number(form.maxScore);
      const sortOrder = Number(form.sortOrder);

      if (!form.name.trim()) {
        throw new Error("Criterion name is required.");
      }

      if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
        throw new Error("Weight must be greater than 0 and no more than 100.");
      }

      if (!Number.isFinite(maxScore) || maxScore <= 0) {
        throw new Error("Maximum score must be greater than 0.");
      }

      if (!Number.isInteger(sortOrder) || sortOrder < 0) {
        throw new Error("Sort order must be a non-negative integer.");
      }

      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        weight,
        maxScore,
        sortOrder,
      };

      let response: Response;

      if (editingId) {
        response = await fetch(`/api/evaluation-criteria/${editingId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch("/api/evaluation-criteria", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            solicitationId,
            ...payload,
          }),
        });
      }

      const data: ApiResponse<EvaluationCriterion> =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            (editingId
              ? "Failed to update evaluation criterion."
              : "Failed to create evaluation criterion."),
        );
      }

      setSuccess(
        editingId
          ? "Evaluation criterion updated successfully."
          : "Evaluation criterion created successfully.",
      );

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save evaluation criterion.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(criterion: EvaluationCriterion) {
    if (!isDraft) {
      setError(
        "Evaluation criteria can only be deleted while the solicitation is in DRAFT status.",
      );
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${criterion.name}"?`,
    );

    if (!confirmed) return;

    setDeletingId(criterion.id);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/evaluation-criteria/${criterion.id}`,
        {
          method: "DELETE",
        },
      );

      const data: ApiResponse<null> = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to delete evaluation criterion.",
        );
      }

      setSuccess("Evaluation criterion deleted successfully.");

      if (editingId === criterion.id) {
        closeForm();
      }

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete evaluation criterion.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            Loading evaluation criteria...
          </p>
        </div>
      </div>
    );
  }

  if (!solicitation) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Solicitation not found
          </h2>
          <p className="mt-2 text-sm text-red-700">
            {error || "The requested solicitation could not be loaded."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link
              href={`/dashboard/organization/solicitations/${solicitationId}`}
              className="hover:text-gray-900"
            >
              Solicitation
            </Link>

            <span>›</span>

            <span>Evaluation Criteria</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Evaluation Criteria
          </h1>

          <p className="mt-1 text-sm text-gray-600">
            Configure how bids will be evaluated for this solicitation.
          </p>

          <div className="mt-3">
            <p className="font-medium text-gray-900">
              {solicitation.solicitationNumber}
            </p>
            <p className="text-sm text-gray-600">
              {solicitation.title}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}`}
          >
            <Button variant="outline">Back to Solicitation</Button>
          </Link>

          {isDraft && (
            <Button onClick={openAddForm}>
              Add Criterion
            </Button>
          )}
        </div>
      </div>

      {/* Status / messages */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">{success}</p>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Criteria</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {criteria.length}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Total Weight</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {formatNumber(totalWeight)}%
          </p>

          <p
            className={`mt-1 text-xs ${
              totalWeight === 100
                ? "text-green-600"
                : "text-amber-600"
            }`}
          >
            {totalWeight === 100
              ? "Weight is complete"
              : `${formatNumber(Math.abs(weightDifference))}% ${
                  weightDifference > 0 ? "remaining" : "over"
                }`}
          </p>
        </div>

        <div className="rounded-lg border bg-white p-5">
          <p className="text-sm text-gray-500">Status</p>

          <div className="mt-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                isDraft
                  ? "bg-amber-100 text-amber-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {solicitation.status}
            </span>
          </div>

          {!isDraft && (
            <p className="mt-2 text-xs text-gray-500">
              Criteria editing is locked because this solicitation is
              no longer in DRAFT status.
            </p>
          )}
        </div>
      </div>

      {/* Weight warning */}
      {criteria.length > 0 && totalWeight !== 100 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-amber-900">
            Evaluation weights do not total 100%
          </p>

          <p className="mt-1 text-sm text-amber-800">
            Current total is {formatNumber(totalWeight)}%. Adjust the
            criteria weights so that the final evaluation framework
            totals 100%.
          </p>
        </div>
      )}

      {/* Add/Edit form */}
      {showForm && isDraft && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId
                ? "Edit Evaluation Criterion"
                : "Add Evaluation Criterion"}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Define the criterion and its weighting for bid evaluation.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="criterion-name"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Criterion Name
              </label>

              <input
                id="criterion-name"
                type="text"
                value={form.name}
                onChange={(event) =>
                  updateForm("name", event.target.value)
                }
                placeholder="e.g. Technical Capability"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                disabled={saving}
                required
              />
            </div>

            <div>
              <label
                htmlFor="criterion-description"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Description
              </label>

              <textarea
                id="criterion-description"
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                placeholder="Describe what evaluators should consider..."
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                disabled={saving}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label
                  htmlFor="criterion-weight"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Weight (%)
                </label>

                <input
                  id="criterion-weight"
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={form.weight}
                  onChange={(event) =>
                    updateForm("weight", event.target.value)
                  }
                  placeholder="30"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  disabled={saving}
                  required
                />

                <p className="mt-1 text-xs text-gray-500">
                  Percentage contribution to the final score.
                </p>
              </div>

              <div>
                <label
                  htmlFor="criterion-max-score"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Maximum Score
                </label>

                <input
                  id="criterion-max-score"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.maxScore}
                  onChange={(event) =>
                    updateForm("maxScore", event.target.value)
                  }
                  placeholder="100"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  disabled={saving}
                  required
                />

                <p className="mt-1 text-xs text-gray-500">
                  Maximum score evaluators can award.
                </p>
              </div>

              <div>
                <label
                  htmlFor="criterion-sort-order"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Sort Order
                </label>

                <input
                  id="criterion-sort-order"
                  type="number"
                  min="0"
                  step="1"
                  value={form.sortOrder}
                  onChange={(event) =>
                    updateForm("sortOrder", event.target.value)
                  }
                  placeholder="0"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  disabled={saving}
                  required
                />

                <p className="mt-1 text-xs text-gray-500">
                  Lower numbers appear first.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t pt-5">
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </Button>

              <Button type="submit" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Criterion"
                    : "Add Criterion"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Criteria list */}
      <div className="rounded-lg border bg-white">
        <div className="border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">
            Configured Criteria
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Evaluation criteria are applied in sort order.
          </p>
        </div>

        {criteria.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto max-w-md">
              <h3 className="font-semibold text-gray-900">
                No evaluation criteria configured
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Add evaluation criteria to define how bids will be
                assessed for this solicitation.
              </p>

              {isDraft && (
                <div className="mt-5">
                  <Button onClick={openAddForm}>
                    Add First Criterion
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {criteria.map((criterion, index) => (
              <div
                key={criterion.id}
                className="p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                      {index + 1}
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {criterion.name}
                      </h3>

                      {criterion.description ? (
                        <p className="mt-1 max-w-3xl text-sm text-gray-600">
                          {criterion.description}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm italic text-gray-400">
                          No description provided.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-md bg-gray-50 px-4 py-2 text-center">
                      <p className="text-xs text-gray-500">
                        Weight
                      </p>
                      <p className="font-semibold text-gray-900">
                        {formatNumber(criterion.weight)}%
                      </p>
                    </div>

                    <div className="rounded-md bg-gray-50 px-4 py-2 text-center">
                      <p className="text-xs text-gray-500">
                        Max Score
                      </p>
                      <p className="font-semibold text-gray-900">
                        {formatNumber(criterion.maxScore)}
                      </p>
                    </div>

                    <div className="rounded-md bg-gray-50 px-4 py-2 text-center">
                      <p className="text-xs text-gray-500">
                        Order
                      </p>
                      <p className="font-semibold text-gray-900">
                        {criterion.sortOrder}
                      </p>
                    </div>
                  </div>
                </div>

                {isDraft && (
                  <div className="mt-5 flex justify-end gap-2 border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => openEditForm(criterion)}
                    >
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleDelete(criterion)}
                      disabled={deletingId === criterion.id}
                      className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      {deletingId === criterion.id
                        ? "Deleting..."
                        : "Delete"}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preparation navigation */}
      <div className="rounded-lg border bg-gray-50 p-5">
        <h2 className="font-semibold text-gray-900">
          Draft Preparation
        </h2>

        <p className="mt-1 text-sm text-gray-600">
          Continue preparing this solicitation.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}/requirements`}
          >
            <Button variant="outline">Requirements</Button>
          </Link>

          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}/lots`}
          >
            <Button variant="outline">Lots</Button>
          </Link>

          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}/documents`}
          >
            <Button variant="outline">Documents</Button>
          </Link>

          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}/evaluation-criteria`}
          >
            <Button variant="outline">Evaluation Criteria</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
