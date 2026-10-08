"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export type EvaluationStatusValue =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "APPROVED";

export interface EvaluationFormValues {
  bidId: string;
  evaluatorId: string;
  status: EvaluationStatusValue;
  totalScore: string;
  comments: string;
  startedAt: string;
  completedAt: string;
}

export interface EvaluationFormOption {
  value: string;
  label: string;
}

export interface EvaluationFormProps {
  initialValues?: Partial<EvaluationFormValues>;
  bidOptions?: EvaluationFormOption[];
  evaluatorOptions?: EvaluationFormOption[];
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (values: EvaluationFormValues) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const defaultValues: EvaluationFormValues = {
  bidId: "",
  evaluatorId: "",
  status: "DRAFT",
  totalScore: "",
  comments: "",
  startedAt: "",
  completedAt: "",
};

const statusOptions: EvaluationFormOption[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "APPROVED", label: "Approved" },
];

export default function EvaluationForm({
  initialValues,
  bidOptions = [],
  evaluatorOptions = [],
  submitLabel = "Save Evaluation",
  cancelLabel = "Cancel",
  submitting = false,
  error = null,
  onSubmit,
  onCancel,
  className = "",
}: EvaluationFormProps) {
  const [values, setValues] = useState<EvaluationFormValues>({
    ...defaultValues,
    ...initialValues,
  });

  const [validationError, setValidationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setValues({
      ...defaultValues,
      ...initialValues,
    });
  }, [initialValues]);

  function updateField<K extends keyof EvaluationFormValues>(
    field: K,
    value: EvaluationFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (validationError) {
      setValidationError(null);
    }
  }

  function validate(): string | null {
    if (!values.bidId.trim()) {
      return "Please select a bid.";
    }

    if (!values.evaluatorId.trim()) {
      return "Please select an evaluator.";
    }

    if (values.totalScore.trim()) {
      const totalScore = Number(values.totalScore);

      if (!Number.isFinite(totalScore) || totalScore < 0) {
        return "Total score must be a valid non-negative number.";
      }
    }

    if (values.startedAt && values.completedAt) {
      const startedAt = new Date(values.startedAt);
      const completedAt = new Date(values.completedAt);

      if (
        Number.isNaN(startedAt.getTime()) ||
        Number.isNaN(completedAt.getTime())
      ) {
        return "Please enter valid evaluation dates.";
      }

      if (completedAt < startedAt) {
        return "Completed date cannot be earlier than the started date.";
      }
    }

    if (
      (values.status === "COMPLETED" || values.status === "APPROVED") &&
      !values.totalScore.trim()
    ) {
      return "A total score is required when the evaluation is completed or approved.";
    }

    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validate();

    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    setValidationError(null);

    await onSubmit({
      ...values,
      totalScore: values.totalScore.trim(),
      comments: values.comments.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`space-y-8 ${className}`}
    >
      {(validationError || error) && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {validationError || error}
        </div>
      )}

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Evaluation Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the bid and evaluator associated with this evaluation.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Select
              label="Bid"
              value={values.bidId}
              onChange={(event) =>
                updateField("bidId", event.target.value)
              }
              options={[
                { value: "", label: "Select bid" },
                ...bidOptions,
              ]}
              required
              disabled={submitting}
            />
          </div>

          <Select
            label="Evaluator"
            value={values.evaluatorId}
            onChange={(event) =>
              updateField("evaluatorId", event.target.value)
            }
            options={[
              { value: "", label: "Select evaluator" },
              ...evaluatorOptions,
            ]}
            required
            disabled={submitting}
          />

          <Select
            label="Status"
            value={values.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value as EvaluationStatusValue,
              )
            }
            options={statusOptions}
            required
            disabled={submitting}
          />

          <Input
            label="Total Score"
            type="number"
            min="0"
            step="0.01"
            value={values.totalScore}
            onChange={(event) =>
              updateField("totalScore", event.target.value)
            }
            placeholder="0.00"
            disabled={submitting}
          />
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Evaluation Timing
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Record when the evaluation started and when it was completed.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="Started At"
            type="datetime-local"
            value={values.startedAt}
            onChange={(event) =>
              updateField("startedAt", event.target.value)
            }
            disabled={submitting}
          />

          <Input
            label="Completed At"
            type="datetime-local"
            value={values.completedAt}
            onChange={(event) =>
              updateField("completedAt", event.target.value)
            }
            disabled={submitting}
          />
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Comments
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Add general comments or observations about the evaluation.
          </p>
        </div>

        <textarea
          id="evaluation-comments"
          value={values.comments}
          onChange={(event) =>
            updateField("comments", event.target.value)
          }
          placeholder="Enter evaluation comments"
          rows={6}
          disabled={submitting}
          className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
        />
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={submitting}
        >
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}