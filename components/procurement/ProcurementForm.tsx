"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export type ProcurementStatusValue =
  | "DRAFT"
  | "PLANNED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "ARCHIVED";

export type ProcurementMethodValue =
  | "OPEN"
  | "RESTRICTED"
  | "REQUEST_FOR_QUOTATION"
  | "DIRECT"
  | "NEGOTIATED";

export interface ProcurementFormValues {
  organizationId: string;
  departmentId: string;
  countryId: string;
  currencyId: string;
  title: string;
  description: string;
  referenceNumber: string;
  status: ProcurementStatusValue;
  procurementMethod: ProcurementMethodValue;
  estimatedValue: string;
  plannedStartDate: string;
  plannedEndDate: string;
}

export interface ProcurementFormOption {
  value: string;
  label: string;
}

export interface ProcurementFormProps {
  initialValues?: Partial<ProcurementFormValues>;
  organizationOptions?: ProcurementFormOption[];
  departmentOptions?: ProcurementFormOption[];
  countryOptions?: ProcurementFormOption[];
  currencyOptions?: ProcurementFormOption[];
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (
    values: ProcurementFormValues,
  ) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const defaultValues: ProcurementFormValues = {
  organizationId: "",
  departmentId: "",
  countryId: "",
  currencyId: "",
  title: "",
  description: "",
  referenceNumber: "",
  status: "DRAFT",
  procurementMethod: "OPEN",
  estimatedValue: "",
  plannedStartDate: "",
  plannedEndDate: "",
};

const statusOptions: ProcurementFormOption[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ARCHIVED", label: "Archived" },
];

const procurementMethodOptions: ProcurementFormOption[] = [
  { value: "OPEN", label: "Open" },
  { value: "RESTRICTED", label: "Restricted" },
  {
    value: "REQUEST_FOR_QUOTATION",
    label: "Request for Quotation",
  },
  { value: "DIRECT", label: "Direct" },
  { value: "NEGOTIATED", label: "Negotiated" },
];

const selectClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10 disabled:cursor-not-allowed disabled:bg-slate-100";

const labelClassName =
  "mb-2 block text-sm font-medium text-slate-700";

export default function ProcurementForm({
  initialValues,
  organizationOptions = [],
  departmentOptions = [],
  countryOptions = [],
  currencyOptions = [],
  submitLabel = "Save Procurement",
  cancelLabel = "Cancel",
  submitting = false,
  error = null,
  onSubmit,
  onCancel,
  className = "",
}: ProcurementFormProps) {
  const [values, setValues] = useState<ProcurementFormValues>({
    ...defaultValues,
    ...initialValues,
  });

  const [validationError, setValidationError] = useState<string | null>(
    null,
  );

  const [serverError, setServerError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const busy = submitting || isSubmitting;

  useEffect(() => {
    setValues({
      ...defaultValues,
      ...initialValues,
    });
  }, [initialValues]);

  function updateField<K extends keyof ProcurementFormValues>(
    field: K,
    value: ProcurementFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (validationError) {
      setValidationError(null);
    }

    if (serverError) {
      setServerError(null);
    }
  }

  function validate(): string | null {
    if (!values.organizationId.trim()) {
      return "Please select an organization.";
    }

    if (!values.title.trim()) {
      return "Procurement title is required.";
    }

    if (!values.referenceNumber.trim()) {
      return "Reference number is required.";
    }

    if (!values.estimatedValue.trim()) {
      return "Estimated value is required.";
    }

    const estimatedValue = Number(values.estimatedValue);

    if (!Number.isFinite(estimatedValue) || estimatedValue < 0) {
      return "Estimated value must be a valid non-negative number.";
    }

    if (values.plannedStartDate && values.plannedEndDate) {
      const startDate = new Date(values.plannedStartDate);
      const endDate = new Date(values.plannedEndDate);

      if (
        !Number.isNaN(startDate.getTime()) &&
        !Number.isNaN(endDate.getTime()) &&
        endDate < startDate
      ) {
        return "Planned end date cannot be before the planned start date.";
      }
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const errorMessage = validate();

    if (errorMessage) {
      setValidationError(errorMessage);
      return;
    }

    setValidationError(null);
    setServerError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        ...values,
        title: values.title.trim(),
        description: values.description.trim(),
        referenceNumber: values.referenceNumber.trim(),
        estimatedValue: values.estimatedValue.trim(),
      });
    } catch (submitError) {
      console.error("Procurement submission failed:", submitError);

      setServerError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to create the procurement. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-8 ${className}`}
      noValidate
    >
      {(validationError || serverError || error) && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {validationError || serverError || error}
        </div>
      )}

      {/* Procurement Information */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Procurement Information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Enter the core information for this procurement.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Organization */}
          <div>
            <label
              htmlFor="organizationId"
              className={labelClassName}
            >
              Organization
            </label>

            <select
              id="organizationId"
              value={values.organizationId}
              onChange={(event) =>
                updateField(
                  "organizationId",
                  event.target.value,
                )
              }
              disabled={busy || organizationOptions.length === 0}
              className={selectClassName}
            >
              <option value="">Select organization</option>

              {organizationOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label
              htmlFor="departmentId"
              className={labelClassName}
            >
              Department
            </label>

            <select
              id="departmentId"
              value={values.departmentId}
              onChange={(event) =>
                updateField(
                  "departmentId",
                  event.target.value,
                )
              }
              disabled={busy}
              className={selectClassName}
            >
              <option value="">
                {departmentOptions.length > 0
                  ? "Select department"
                  : "No departments available"}
              </option>

              {departmentOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>

            {departmentOptions.length === 0 && (
              <p className="mt-2 text-xs text-amber-600">
                No departments have been configured for this
                organization yet.
              </p>
            )}
          </div>

          {/* Reference Number */}
          <div>
            <label
              htmlFor="referenceNumber"
              className={labelClassName}
            >
              Reference Number
            </label>

            <Input
              id="referenceNumber"
              value={values.referenceNumber}
              onChange={(event) =>
                updateField(
                  "referenceNumber",
                  event.target.value,
                )
              }
              placeholder="e.g. YOUNG/PROC/2026/001"
              disabled={busy}
            />
          </div>

          {/* Status */}
          <div>
            <label
              htmlFor="status"
              className={labelClassName}
            >
              Status
            </label>

            <select
              id="status"
              value={values.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value as ProcurementStatusValue,
                )
              }
              disabled={busy}
              className={selectClassName}
            >
              {statusOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="md:col-span-2">
            <label
              htmlFor="title"
              className={labelClassName}
            >
              Title
            </label>

            <Input
              id="title"
              value={values.title}
              onChange={(event) =>
                updateField("title", event.target.value)
              }
              placeholder="Enter procurement title"
              disabled={busy}
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className={labelClassName}
            >
              Description
            </label>

            <textarea
              id="description"
              value={values.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              placeholder="Describe the procurement..."
              rows={5}
              disabled={busy}
              className={`${selectClassName} resize-y`}
            />
          </div>
        </div>
      </section>

      {/* Procurement Method */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Procurement Method
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Select the method that will be used for this
            procurement.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Procurement Method */}
          <div>
            <label
              htmlFor="procurementMethod"
              className={labelClassName}
            >
              Procurement Method
            </label>

            <select
              id="procurementMethod"
              value={values.procurementMethod}
              onChange={(event) =>
                updateField(
                  "procurementMethod",
                  event.target.value as ProcurementMethodValue,
                )
              }
              disabled={busy}
              className={selectClassName}
            >
              {procurementMethodOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Currency */}
          <div>
            <label
              htmlFor="currencyId"
              className={labelClassName}
            >
              Currency
            </label>

            <select
              id="currencyId"
              value={values.currencyId}
              onChange={(event) =>
                updateField(
                  "currencyId",
                  event.target.value,
                )
              }
              disabled={busy}
              className={selectClassName}
            >
              <option value="">Select currency</option>

              {currencyOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Estimated Value */}
          <div>
            <label
              htmlFor="estimatedValue"
              className={labelClassName}
            >
              Estimated Value
            </label>

            <Input
              id="estimatedValue"
              type="number"
              min="0"
              step="0.01"
              value={values.estimatedValue}
              onChange={(event) =>
                updateField(
                  "estimatedValue",
                  event.target.value,
                )
              }
              placeholder="0.00"
              disabled={busy}
            />
          </div>

          {/* Country */}
          <div>
            <label
              htmlFor="countryId"
              className={labelClassName}
            >
              Country
            </label>

            <select
              id="countryId"
              value={values.countryId}
              onChange={(event) =>
                updateField(
                  "countryId",
                  event.target.value,
                )
              }
              disabled={busy}
              className={selectClassName}
            >
              <option value="">Select country</option>

              {countryOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Planned Schedule */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Planned Schedule
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Set the planned start and end dates for the
            procurement.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Start Date */}
          <div>
            <label
              htmlFor="plannedStartDate"
              className={labelClassName}
            >
              Planned Start Date
            </label>

            <Input
              id="plannedStartDate"
              type="date"
              value={values.plannedStartDate}
              onChange={(event) =>
                updateField(
                  "plannedStartDate",
                  event.target.value,
                )
              }
              disabled={busy}
            />
          </div>

          {/* End Date */}
          <div>
            <label
              htmlFor="plannedEndDate"
              className={labelClassName}
            >
              Planned End Date
            </label>

            <Input
              id="plannedEndDate"
              type="date"
              value={values.plannedEndDate}
              onChange={(event) =>
                updateField(
                  "plannedEndDate",
                  event.target.value,
                )
              }
              disabled={busy}
            />
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </Button>
        )}

        <Button
          type="submit"
          disabled={busy}
        >
          {busy ? "Creating Procurement..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}