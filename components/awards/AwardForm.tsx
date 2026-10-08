"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export type AwardStatusValue =
  | "PENDING"
  | "APPROVED"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED";

export interface AwardFormValues {
  solicitationId: string;
  lotId: string;
  bidId: string;
  vendorId: string;
  awardNumber: string;
  status: AwardStatusValue;
  awardAmount: string;
  awardDate: string;
  notes: string;
}

export interface AwardFormOption {
  value: string;
  label: string;
}

export interface AwardFormProps {
  initialValues?: Partial<AwardFormValues>;
  solicitationOptions?: AwardFormOption[];
  lotOptions?: AwardFormOption[];
  bidOptions?: AwardFormOption[];
  vendorOptions?: AwardFormOption[];
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (values: AwardFormValues) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const defaultValues: AwardFormValues = {
  solicitationId: "",
  lotId: "",
  bidId: "",
  vendorId: "",
  awardNumber: "",
  status: "PENDING",
  awardAmount: "",
  awardDate: "",
  notes: "",
};

const statusOptions: AwardFormOption[] = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "DECLINED", label: "Declined" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function AwardForm({
  initialValues,
  solicitationOptions = [],
  lotOptions = [],
  bidOptions = [],
  vendorOptions = [],
  submitLabel = "Save Award",
  cancelLabel = "Cancel",
  submitting = false,
  error = null,
  onSubmit,
  onCancel,
  className = "",
}: AwardFormProps) {
  const [values, setValues] = useState<AwardFormValues>({
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

  function updateField<K extends keyof AwardFormValues>(
    field: K,
    value: AwardFormValues[K],
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
    if (!values.solicitationId.trim()) {
      return "Please select a solicitation.";
    }

    if (!values.bidId.trim()) {
      return "Please select the awarded bid.";
    }

    if (!values.vendorId.trim()) {
      return "Please select the awarded vendor.";
    }

    if (!values.awardNumber.trim()) {
      return "Award number is required.";
    }

    if (!values.awardAmount.trim()) {
      return "Award amount is required.";
    }

    const awardAmount = Number(values.awardAmount);

    if (!Number.isFinite(awardAmount) || awardAmount < 0) {
      return "Award amount must be a valid non-negative number.";
    }

    if (!values.awardDate.trim()) {
      return "Award date is required.";
    }

    const awardDate = new Date(values.awardDate);

    if (Number.isNaN(awardDate.getTime())) {
      return "Please enter a valid award date.";
    }

    if (values.lotId && !values.solicitationId) {
      return "A lot cannot be selected without a solicitation.";
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
      solicitationId: values.solicitationId.trim(),
      lotId: values.lotId.trim(),
      bidId: values.bidId.trim(),
      vendorId: values.vendorId.trim(),
      awardNumber: values.awardNumber.trim(),
      awardAmount: values.awardAmount.trim(),
      awardDate: values.awardDate.trim(),
      notes: values.notes.trim(),
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
            Award Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select the solicitation, bid, and vendor associated with
            this award.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Select
              label="Solicitation"
              value={values.solicitationId}
              onChange={(event) =>
                updateField("solicitationId", event.target.value)
              }
              options={[
                { value: "", label: "Select solicitation" },
                ...solicitationOptions,
              ]}
              required
              disabled={submitting}
            />
          </div>

          <Select
            label="Lot"
            value={values.lotId}
            onChange={(event) =>
              updateField("lotId", event.target.value)
            }
            options={[
              { value: "", label: "No specific lot" },
              ...lotOptions,
            ]}
            disabled={submitting}
          />

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

          <Select
            label="Vendor"
            value={values.vendorId}
            onChange={(event) =>
              updateField("vendorId", event.target.value)
            }
            options={[
              { value: "", label: "Select vendor" },
              ...vendorOptions,
            ]}
            required
            disabled={submitting}
          />

          <Input
            label="Award Number"
            value={values.awardNumber}
            onChange={(event) =>
              updateField("awardNumber", event.target.value)
            }
            placeholder="e.g. AWARD-2026-001"
            required
            disabled={submitting}
          />

          <Select
            label="Status"
            value={values.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value as AwardStatusValue,
              )
            }
            options={statusOptions}
            required
            disabled={submitting}
          />
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Award Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the awarded amount, award date, and any relevant
            notes.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="Award Amount"
            type="number"
            min="0"
            step="0.01"
            value={values.awardAmount}
            onChange={(event) =>
              updateField("awardAmount", event.target.value)
            }
            placeholder="0.00"
            required
            disabled={submitting}
          />

          <Input
            label="Award Date"
            type="date"
            value={values.awardDate}
            onChange={(event) =>
              updateField("awardDate", event.target.value)
            }
            required
            disabled={submitting}
          />
        </div>

        <div>
          <label
            htmlFor="award-notes"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Notes
          </label>

          <textarea
            id="award-notes"
            value={values.notes}
            onChange={(event) =>
              updateField("notes", event.target.value)
            }
            placeholder="Add award notes or observations"
            rows={6}
            disabled={submitting}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>
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