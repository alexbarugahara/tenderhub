"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export type BidStatusValue =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "COMPLIANT"
  | "NON_COMPLIANT"
  | "SHORTLISTED"
  | "EVALUATED"
  | "WITHDRAWN"
  | "REJECTED"
  | "AWARDED";

export interface BidFormValues {
  solicitationId: string;
  lotId: string;
  vendorId: string;
  submittedById: string;
  currencyId: string;
  bidNumber: string;
  status: BidStatusValue;
  title: string;
  summary: string;
  totalAmount: string;
}

export interface BidFormOption {
  value: string;
  label: string;
}

export interface BidFormProps {
  initialValues?: Partial<BidFormValues>;
  solicitationOptions?: BidFormOption[];
  lotOptions?: BidFormOption[];
  vendorOptions?: BidFormOption[];
  userOptions?: BidFormOption[];
  currencyOptions?: BidFormOption[];
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (values: BidFormValues) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const defaultValues: BidFormValues = {
  solicitationId: "",
  lotId: "",
  vendorId: "",
  submittedById: "",
  currencyId: "",
  bidNumber: "",
  status: "DRAFT",
  title: "",
  summary: "",
  totalAmount: "",
};

const statusOptions: BidFormOption[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "COMPLIANT", label: "Compliant" },
  { value: "NON_COMPLIANT", label: "Non-Compliant" },
  { value: "SHORTLISTED", label: "Shortlisted" },
  { value: "EVALUATED", label: "Evaluated" },
  { value: "WITHDRAWN", label: "Withdrawn" },
  { value: "REJECTED", label: "Rejected" },
  { value: "AWARDED", label: "Awarded" },
];

export default function BidForm({
  initialValues,
  solicitationOptions = [],
  lotOptions = [],
  vendorOptions = [],
  userOptions = [],
  currencyOptions = [],
  submitLabel = "Save Bid",
  cancelLabel = "Cancel",
  submitting = false,
  error = null,
  onSubmit,
  onCancel,
  className = "",
}: BidFormProps) {
  const [values, setValues] = useState<BidFormValues>({
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

  function updateField<K extends keyof BidFormValues>(
    field: K,
    value: BidFormValues[K],
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

    if (!values.vendorId.trim()) {
      return "Please select a vendor.";
    }

    if (!values.submittedById.trim()) {
      return "Please select the user submitting the bid.";
    }

    if (!values.bidNumber.trim()) {
      return "Bid number is required.";
    }

    if (!values.totalAmount.trim()) {
      return "Total bid amount is required.";
    }

    const totalAmount = Number(values.totalAmount);

    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      return "Total bid amount must be a valid non-negative number.";
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
      bidNumber: values.bidNumber.trim(),
      title: values.title.trim(),
      summary: values.summary.trim(),
      totalAmount: values.totalAmount.trim(),
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
            Bid Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the solicitation and vendor information associated with
            this bid.
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
            label="Bid Number"
            value={values.bidNumber}
            onChange={(event) =>
              updateField("bidNumber", event.target.value)
            }
            placeholder="e.g. BID-2026-001"
            required
            disabled={submitting}
          />

          <Select
            label="Status"
            value={values.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value as BidStatusValue,
              )
            }
            options={statusOptions}
            required
            disabled={submitting}
          />

          <Select
            label="Submitted By"
            value={values.submittedById}
            onChange={(event) =>
              updateField("submittedById", event.target.value)
            }
            options={[
              { value: "", label: "Select user" },
              ...userOptions,
            ]}
            required
            disabled={submitting}
          />

          <Select
            label="Currency"
            value={values.currencyId}
            onChange={(event) =>
              updateField("currencyId", event.target.value)
            }
            options={[
              { value: "", label: "Select currency" },
              ...currencyOptions,
            ]}
            disabled={submitting}
          />

          <div className="md:col-span-2">
            <Input
              label="Bid Title"
              value={values.title}
              onChange={(event) =>
                updateField("title", event.target.value)
              }
              placeholder="Enter bid title"
              disabled={submitting}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="bid-summary"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Summary
            </label>

            <textarea
              id="bid-summary"
              value={values.summary}
              onChange={(event) =>
                updateField("summary", event.target.value)
              }
              placeholder="Provide a summary of the bid"
              rows={5}
              disabled={submitting}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Financial Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the total amount offered by the vendor.
          </p>
        </div>

        <div className="max-w-md">
          <Input
            label="Total Bid Amount"
            type="number"
            min="0"
            step="0.01"
            value={values.totalAmount}
            onChange={(event) =>
              updateField("totalAmount", event.target.value)
            }
            placeholder="0.00"
            required
            disabled={submitting}
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