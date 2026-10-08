"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

interface Criterion {
  id: string;
  name: string;
  description: string | null;
  weight: number;
  maxScore: number;
  sortOrder: number;
}

interface EvaluationCriteriaClientProps {
  solicitationId: string;
  lotId: string;
  initialCriteria: Criterion[];
  initialTotalWeight: number;
  initialIsComplete: boolean;
  isDraft: boolean;
}

interface FormState {
  name: string;
  description: string;
  weight: string;
  maxScore: string;
}

const emptyForm: FormState = {
  name: "",
  description: "",
  weight: "",
  maxScore: "100",
};

export default function EvaluationCriteriaClient({
  solicitationId,
  lotId,
  initialCriteria,
  initialTotalWeight,
  initialIsComplete,
  isDraft,
}: EvaluationCriteriaClientProps) {
  const [criteria, setCriteria] =
    useState<Criterion[]>(initialCriteria);

  const [form, setForm] = useState<FormState>(emptyForm);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const totalWeight = useMemo(
    () =>
      criteria.reduce(
        (total, criterion) => total + Number(criterion.weight),
        0,
      ),
    [criteria],
  );

  const isComplete = Math.abs(totalWeight - 100) < 0.0001;

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function startAdd() {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  function startEdit(criterion: Criterion) {
    setEditingId(criterion.id);

    setForm({
      name: criterion.name,
      description: criterion.description ?? "",
      weight: String(criterion.weight),
      maxScore: String(criterion.maxScore),
    });

    setError("");
    setShowForm(true);
  }

  async function refreshCriteria() {
    const response = await fetch(
      `/api/evaluation-criteria?lotId=${encodeURIComponent(lotId)}`,
      {
        cache: "no-store",
      },
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.message ||
          data?.error ||
          "Failed to refresh evaluation criteria.",
      );
    }

    const refreshed = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data?.criteria)
        ? data.criteria
        : Array.isArray(data)
          ? data
          : [];

    setCriteria(
      refreshed.map((criterion: any) => ({
        id: criterion.id,
        name: criterion.name,
        description: criterion.description ?? null,
        weight: Number(criterion.weight),
        maxScore: Number(criterion.maxScore),
        sortOrder: Number(criterion.sortOrder),
      })),
    );
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError("");

    if (!isDraft) {
      setError(
        "Evaluation criteria can only be changed while the solicitation is in DRAFT status.",
      );
      return;
    }

    const name = form.name.trim();
    const description = form.description.trim();

    const weight = Number(form.weight);
    const maxScore = Number(form.maxScore);

    if (!name) {
      setError("Criterion name is required.");
      return;
    }

    if (!Number.isFinite(weight) || weight <= 0 || weight > 100) {
      setError("Weight must be greater than 0 and no more than 100.");
      return;
    }

    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      setError("Maximum score must be greater than 0.");
      return;
    }

    const otherWeight = criteria
      .filter((criterion) => criterion.id !== editingId)
      .reduce(
        (total, criterion) => total + Number(criterion.weight),
        0,
      );

    if (otherWeight + weight > 100.0001) {
      setError(
        `The total weight cannot exceed 100%. The remaining available weight is ${Math.max(
          0,
          100 - otherWeight,
        ).toFixed(2)}%.`,
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        editingId
          ? `/api/evaluation-criteria/${editingId}`
          : "/api/evaluation-criteria",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            editingId
              ? {
                  name,
                  description: description || null,
                  weight,
                  maxScore,
                }
              : {
                  lotId,
                  name,
                  description: description || null,
                  weight,
                  maxScore,
                  sortOrder: criteria.length + 1,
                },
          ),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to save evaluation criterion.",
        );
      }

      /*
       * The API returns:
       *
       * {
       *   success: true,
       *   data: { ...criterion }
       * }
       *
       * Therefore the created/updated criterion is data.data,
       * not data.criterion.
       */
      const savedCriterion = data?.data;

      if (editingId) {
        if (savedCriterion) {
          setCriteria((current) =>
            current.map((criterion) =>
              criterion.id === editingId
                ? {
                    ...criterion,
                    id: savedCriterion.id,
                    name: savedCriterion.name,
                    description:
                      savedCriterion.description ?? null,
                    weight: Number(savedCriterion.weight),
                    maxScore: Number(savedCriterion.maxScore),
                    sortOrder: Number(savedCriterion.sortOrder),
                  }
                : criterion,
            ),
          );
        } else {
          await refreshCriteria();
        }
      } else {
        if (savedCriterion) {
          setCriteria((current) => [
            ...current,
            {
              id: savedCriterion.id,
              name: savedCriterion.name,
              description:
                savedCriterion.description ?? null,
              weight: Number(savedCriterion.weight),
              maxScore: Number(savedCriterion.maxScore),
              sortOrder: Number(savedCriterion.sortOrder),
            },
          ]);
        } else {
          await refreshCriteria();
        }
      }

      resetForm();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save evaluation criterion.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!isDraft) {
      setError(
        "Evaluation criteria can only be changed while the solicitation is in DRAFT status.",
      );
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to delete this evaluation criterion?",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `/api/evaluation-criteria/${id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Failed to delete evaluation criterion.",
        );
      }

      setCriteria((current) =>
        current.filter((criterion) => criterion.id !== id),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete evaluation criterion.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Criteria"
          value={criteria.length}
          description="Configured for this lot"
        />

        <SummaryCard
          label="Total Weight"
          value={`${totalWeight.toFixed(2)}%`}
          description={
            isComplete
              ? "Weight is complete"
              : totalWeight < 100
                ? `${(100 - totalWeight).toFixed(2)}% remaining`
                : "Weight exceeds 100%"
          }
        />

        <SummaryCard
          label="Status"
          value={isComplete ? "Ready" : "Incomplete"}
          description={
            isComplete
              ? "Criteria total 100%"
              : "Criteria must total 100%"
          }
        />
      </section>

      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Configured Criteria
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Evaluation criteria are applied in sort order and belong only to
            this lot.
          </p>
        </div>

        {isDraft && (
          <button
            type="button"
            onClick={startAdd}
            className="inline-flex items-center justify-center rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Add Criterion
          </button>
        )}
      </section>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && isDraft && (
        <Card>
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {editingId
                  ? "Edit Evaluation Criterion"
                  : "Add Evaluation Criterion"}
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Configure the criterion used to evaluate bids for this lot.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Criterion Name
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Technical Compliance"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Describe how this criterion will be assessed."
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Weight (%)
                </label>

                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={form.weight}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      weight: event.target.value,
                    }))
                  }
                  placeholder="40"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Maximum Score
                </label>

                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.maxScore}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      maxScore: event.target.value,
                    }))
                  }
                  placeholder="100"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm shadow-sm outline-none focus:border-tenderhub-navy focus:ring-1 focus:ring-tenderhub-navy"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingId
                    ? "Update Criterion"
                    : "Add Criterion"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Criteria List */}
      {criteria.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <h3 className="text-base font-semibold text-gray-900">
              No evaluation criteria configured
            </h3>

            <p className="mt-2 text-sm text-gray-600">
              Add evaluation criteria to define how bids for this lot will
              be assessed.
            </p>

            {isDraft && (
              <button
                type="button"
                onClick={startAdd}
                className="mt-5 rounded-lg bg-tenderhub-navy px-4 py-2.5 text-sm font-semibold text-white"
              >
                Add First Criterion
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {criteria
            .slice()
            .sort((a, b) => {
              if (a.sortOrder !== b.sortOrder) {
                return a.sortOrder - b.sortOrder;
              }

              return a.name.localeCompare(b.name);
            })
            .map((criterion, index) => (
              <Card key={criterion.id}>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                        {index + 1}
                      </span>

                      <h3 className="text-lg font-semibold text-gray-900">
                        {criterion.name}
                      </h3>
                    </div>

                    {criterion.description && (
                      <p className="mt-3 text-sm leading-6 text-gray-600">
                        {criterion.description}
                      </p>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <InfoItem
                        label="Weight"
                        value={`${criterion.weight.toFixed(2)}%`}
                      />

                      <InfoItem
                        label="Max Score"
                        value={criterion.maxScore.toFixed(2)}
                      />

                      <InfoItem
                        label="Order"
                        value={String(criterion.sortOrder)}
                      />
                    </div>
                  </div>

                  {isDraft && (
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(criterion)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                        disabled={loading}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(criterion.id)
                        }
                        className="rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
        </div>
      )}

      {/* Weight Progress */}
      <Card>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                Weight Allocation
              </h3>

              <p className="mt-1 text-sm text-gray-600">
                Lot evaluation criteria must total exactly 100%.
              </p>
            </div>

            <span
              className={`text-sm font-semibold ${
                isComplete
                  ? "text-green-700"
                  : totalWeight > 100
                    ? "text-red-700"
                    : "text-amber-700"
              }`}
            >
              {totalWeight.toFixed(2)}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-100">
            <div
              className={`h-full rounded-full transition-all ${
                totalWeight > 100
                  ? "bg-red-500"
                  : isComplete
                    ? "bg-green-500"
                    : "bg-tenderhub-gold"
              }`}
              style={{
                width: `${Math.min(totalWeight, 100)}%`,
              }}
            />
          </div>

          <p className="text-xs text-gray-500">
            {isComplete
              ? "The lot evaluation criteria are fully weighted."
              : totalWeight < 100
                ? `${(100 - totalWeight).toFixed(
                    2,
                  )}% of the weighting remains to be allocated.`
                : "The weighting exceeds 100%. Please adjust the criteria."}
          </p>
        </div>
      </Card>

      {/* Navigation */}
      <Card>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Lot Preparation
          </h2>

          <p className="mt-1 text-sm text-gray-600">
            Continue configuring this lot.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}/requirements`}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Requirements
          </Link>

          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}`}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Lot Details
          </Link>

          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}/evaluation-criteria`}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Solicitation Criteria
          </Link>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}