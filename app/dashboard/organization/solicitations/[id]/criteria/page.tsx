"use client";

import React, { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import EvaluationCriteria, {
  EvaluationCriterion,
} from "@/components/evaluations/EvaluationCriteria";

interface Solicitation {
  id: string;
  solicitationNumber: string;
  title: string;
  status: string;
}

interface CriterionForm {
  name: string;
  description: string;
  weight: string;
  maxScore: string;
  sortOrder: string;
}

const initialForm: CriterionForm = {
  name: "",
  description: "",
  weight: "",
  maxScore: "100",
  sortOrder: "0",
};

function formatStatus(value: string) {
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function EvaluationCriteriaPage() {
  const params = useParams<{ id: string }>();
  const solicitationId = params.id;

  const [solicitation, setSolicitation] =
    useState<Solicitation | null>(null);
  const [criteria, setCriteria] = useState<EvaluationCriterion[]>([]);
  const [form, setForm] = useState<CriterionForm>(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [solicitationResponse, criteriaResponse] = await Promise.all([
        fetch(`/api/solicitations/${solicitationId}`, {
          cache: "no-store",
        }),
        fetch(
          `/api/evaluation-criteria?solicitationId=${encodeURIComponent(
            solicitationId,
          )}`,
          {
            cache: "no-store",
          },
        ),
      ]);

      const solicitationData = await solicitationResponse.json();
      const criteriaData = await criteriaResponse.json();

      if (!solicitationResponse.ok) {
        throw new Error(
          solicitationData.message || "Failed to load solicitation.",
        );
      }

      if (!criteriaResponse.ok) {
        throw new Error(
          criteriaData.message || "Failed to load evaluation criteria.",
        );
      }

      setSolicitation(solicitationData.data);
      setCriteria(criteriaData.data || []);
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
    if (solicitationId) {
      loadData();
    }
  }, [solicitationId, loadData]);

  const totalWeight = useMemo(
    () =>
      criteria.reduce(
        (total, criterion) => total + Number(criterion.weight || 0),
        0,
      ),
    [criteria],
  );

  const isDraft = solicitation?.status === "DRAFT";

  function updateField(
    field: keyof CriterionForm,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingId(null);
  }

  function startEditing(criterion: EvaluationCriterion) {
    setEditingId(criterion.id);

    setForm({
      name: criterion.name,
      description: criterion.description ?? "",
      weight:
        criterion.weight === null || criterion.weight === undefined
          ? ""
          : String(criterion.weight),
      maxScore:
        criterion.maxScore === null || criterion.maxScore === undefined
          ? "100"
          : String(criterion.maxScore),
      sortOrder:
        criterion.sortOrder === null ||
        criterion.sortOrder === undefined
          ? "0"
          : String(criterion.sortOrder),
    });

    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isDraft) {
      setError(
        "Evaluation criteria can only be configured while the solicitation is in DRAFT status.",
      );
      return;
    }

    setError("");
    setSuccess("");

    const weight = Number(form.weight);
    const maxScore = Number(form.maxScore);
    const sortOrder = Number(form.sortOrder);

    if (!form.name.trim()) {
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

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      setError("Sort order must be a non-negative integer.");
      return;
    }

    if (
      !editingId &&
      totalWeight + weight > 100.0001
    ) {
      setError(
        `This criterion would make the total weight ${(
          totalWeight + weight
        ).toFixed(2)}%. The total cannot exceed 100%.`,
      );
      return;
    }

    if (editingId) {
      const existingWeight =
        criteria.find((criterion) => criterion.id === editingId)
          ?.weight ?? 0;

      const projectedTotal =
        totalWeight - Number(existingWeight) + weight;

      if (projectedTotal > 100.0001) {
        setError(
          `The updated criteria would have a total weight of ${projectedTotal.toFixed(
            2,
          )}%. The total cannot exceed 100%.`,
        );
        return;
      }
    }

    try {
      setSaving(true);

      const response = await fetch(
        editingId
          ? `/api/evaluation-criteria/${editingId}`
          : "/api/evaluation-criteria",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(editingId ? {} : { solicitationId }),
            name: form.name.trim(),
            description: form.description.trim() || null,
            weight,
            maxScore,
            sortOrder,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save evaluation criterion.",
        );
      }

      setSuccess(
        editingId
          ? "Evaluation criterion updated successfully."
          : "Evaluation criterion added successfully.",
      );

      resetForm();
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

  async function handleDelete(id: string) {
    const criterion = criteria.find((item) => item.id === id);

    if (!criterion) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the evaluation criterion "${criterion.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setError("");
    setSuccess("");

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
          data.message ||
            "Failed to delete evaluation criterion.",
        );
      }

      if (editingId === id) {
        resetForm();
      }

      setSuccess("Evaluation criterion deleted successfully.");
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
      <main className="min-h-screen bg-tenderhub-background">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">
              Loading evaluation criteria...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!solicitation) {
    return (
      <main className="min-h-screen bg-tenderhub-background">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700">
              {error || "Solicitation not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-tenderhub-background">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <Link
            href={`/dashboard/organization/solicitations/${solicitationId}`}
            className="text-sm font-medium text-tenderhub-navy hover:underline"
          >
            ← Back to Solicitation
          </Link>

          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {solicitation.solicitationNumber}
              </p>

              <h1 className="mt-1 text-2xl font-bold text-tenderhub-navy">
                Configure Evaluation Criteria
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Define the criteria and weighting that will be used to
                evaluate bids submitted for this solicitation.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
                {formatStatus(solicitation.status)}
              </span>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                  Math.abs(totalWeight - 100) < 0.0001
                    ? "bg-emerald-100 text-emerald-700"
                    : totalWeight > 100
                      ? "bg-red-100 text-red-700"
                      : "bg-amber-100 text-amber-700"
                }`}
              >
                Total Weight: {totalWeight.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        {!isDraft && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-800">
              This solicitation is no longer in DRAFT status.
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Evaluation criteria are locked after the solicitation leaves
              the draft stage.
            </p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <Card>
            <div>
              <h2 className="text-lg font-semibold text-tenderhub-navy">
                {editingId
                  ? "Edit Criterion"
                  : "Add Criterion"}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Configure how bids will be scored for this solicitation.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-5 space-y-4"
            >
              <Input
                label="Criterion Name"
                value={form.name}
                onChange={(event) =>
                  updateField("name", event.target.value)
                }
                placeholder="e.g. Technical Approach"
                disabled={!isDraft || saving}
              />

              <div>
                <label
                  htmlFor="criterion-description"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Description
                </label>

                <textarea
                  id="criterion-description"
                  value={form.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="Describe what evaluators should consider..."
                  rows={4}
                  disabled={!isDraft || saving}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              <Input
                label="Weight (%)"
                type="number"
                min="0.01"
                max="100"
                step="0.01"
                value={form.weight}
                onChange={(event) =>
                  updateField("weight", event.target.value)
                }
                placeholder="e.g. 40"
                disabled={!isDraft || saving}
              />

              <Input
                label="Maximum Score"
                type="number"
                min="0.01"
                step="0.01"
                value={form.maxScore}
                onChange={(event) =>
                  updateField(
                    "maxScore",
                    event.target.value,
                  )
                }
                placeholder="100"
                disabled={!isDraft || saving}
              />

              <Input
                label="Sort Order"
                type="number"
                min="0"
                step="1"
                value={form.sortOrder}
                onChange={(event) =>
                  updateField(
                    "sortOrder",
                    event.target.value,
                  )
                }
                placeholder="0"
                disabled={!isDraft || saving}
              />

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={!isDraft || saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Criterion"
                      : "Add Criterion"}
                </Button>

                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Card>

          <div className="space-y-6">
            <EvaluationCriteria
              criteria={criteria}
              title="Configured Evaluation Criteria"
              description="These criteria define how submitted bids will be scored for this solicitation."
              emptyMessage="No evaluation criteria have been configured yet."
              showDescription
              showWeight
              showScore
              showMandatory={false}
            />

            {criteria.length > 0 && (
              <Card>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-tenderhub-navy">
                      Manage Criteria
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Edit or remove criteria while the solicitation is
                      still in draft.
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      Criteria
                    </p>
                    <p className="text-xl font-bold text-tenderhub-navy">
                      {criteria.length}
                    </p>
                  </div>
                </div>

                <div className="mt-5 divide-y divide-slate-200 rounded-lg border border-slate-200">
                  {criteria
                    .slice()
                    .sort(
                      (a, b) =>
                        (a.sortOrder ?? 0) -
                        (b.sortOrder ?? 0),
                    )
                    .map((criterion, index) => (
                      <div
                        key={criterion.id}
                        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-xs font-semibold text-white">
                              {index + 1}
                            </span>

                            <div className="min-w-0">
                              <p className="font-medium text-slate-800">
                                {criterion.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Weight:{" "}
                                {Number(
                                  criterion.weight ?? 0,
                                ).toFixed(2)}
                                % · Max Score:{" "}
                                {Number(
                                  criterion.maxScore ?? 0,
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              startEditing(criterion)
                            }
                            disabled={
                              !isDraft ||
                              saving ||
                              deletingId === criterion.id
                            }
                          >
                            Edit
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              handleDelete(criterion.id)
                            }
                            disabled={
                              !isDraft ||
                              saving ||
                              deletingId === criterion.id
                            }
                          >
                            {deletingId === criterion.id
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}