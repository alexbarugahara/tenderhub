"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
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
  | "RFQ"
  | "DIRECT"
  | "NEGOTIATED";

export interface ProcurementFilterValues {
  search: string;
  status: string;
  procurementMethod: string;
  organizationId: string;
  departmentId: string;
  countryId: string;
  minValue: string;
  maxValue: string;
  plannedStartFrom: string;
  plannedStartTo: string;
}

export interface ProcurementFilterOption {
  value: string;
  label: string;
}

export interface ProcurementFiltersProps {
  initialValues?: Partial<ProcurementFilterValues>;
  organizationOptions?: ProcurementFilterOption[];
  departmentOptions?: ProcurementFilterOption[];
  countryOptions?: ProcurementFilterOption[];
  onApply: (filters: ProcurementFilterValues) => void;
  onReset?: () => void;
  className?: string;
}

const defaultValues: ProcurementFilterValues = {
  search: "",
  status: "",
  procurementMethod: "",
  organizationId: "",
  departmentId: "",
  countryId: "",
  minValue: "",
  maxValue: "",
  plannedStartFrom: "",
  plannedStartTo: "",
};

const statusOptions = [
  { value: "", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ARCHIVED", label: "Archived" },
];

const procurementMethodOptions = [
  { value: "", label: "All methods" },
  { value: "OPEN", label: "Open" },
  { value: "RESTRICTED", label: "Restricted" },
  {
    value: "RFQ",
    label: "Request for Quotation",
  },
  { value: "DIRECT", label: "Direct" },
  { value: "NEGOTIATED", label: "Negotiated" },
];

export default function ProcurementFilters({
  initialValues,
  organizationOptions = [],
  departmentOptions = [],
  countryOptions = [],
  onApply,
  onReset,
  className = "",
}: ProcurementFiltersProps) {
  const [values, setValues] = useState<ProcurementFilterValues>({
    ...defaultValues,
    ...initialValues,
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues({
      ...defaultValues,
      ...initialValues,
    });
  }, [initialValues]);

  function updateField<K extends keyof ProcurementFilterValues>(
    field: K,
    value: ProcurementFilterValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (error) {
      setError(null);
    }
  }

  function validate(): string | null {
    const minValue = values.minValue
      ? Number(values.minValue)
      : null;

    const maxValue = values.maxValue
      ? Number(values.maxValue)
      : null;

    if (
      minValue !== null &&
      (!Number.isFinite(minValue) || minValue < 0)
    ) {
      return "Minimum value must be a valid non-negative number.";
    }

    if (
      maxValue !== null &&
      (!Number.isFinite(maxValue) || maxValue < 0)
    ) {
      return "Maximum value must be a valid non-negative number.";
    }

    if (
      minValue !== null &&
      maxValue !== null &&
      minValue > maxValue
    ) {
      return "Minimum value cannot be greater than maximum value.";
    }

    if (values.plannedStartFrom && values.plannedStartTo) {
      const fromDate = new Date(values.plannedStartFrom);
      const toDate = new Date(values.plannedStartTo);

      if (
        !Number.isNaN(fromDate.getTime()) &&
        !Number.isNaN(toDate.getTime()) &&
        fromDate > toDate
      ) {
        return "The start date range is invalid.";
      }
    }

    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    onApply(values);
  }

  function handleReset() {
    setValues(defaultValues);
    setError(null);
    onReset?.();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-tenderhub-navy">
          Filter Procurements
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Narrow procurement records by status, method, organization,
          value, or planned schedule.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-3">
          <Input
            label="Search"
            value={values.search}
            onChange={(event) =>
              updateField("search", event.target.value)
            }
            placeholder="Search by title or reference number"
          />
        </div>

        <Select
          label="Status"
          value={values.status}
          onChange={(event) =>
            updateField("status", event.target.value)
          }
          options={statusOptions}
        />

        <Select
          label="Procurement Method"
          value={values.procurementMethod}
          onChange={(event) =>
            updateField("procurementMethod", event.target.value)
          }
          options={procurementMethodOptions}
        />

        <Select
          label="Organization"
          value={values.organizationId}
          onChange={(event) =>
            updateField("organizationId", event.target.value)
          }
          options={[
            { value: "", label: "All organizations" },
            ...organizationOptions,
          ]}
        />

        <Select
          label="Department"
          value={values.departmentId}
          onChange={(event) =>
            updateField("departmentId", event.target.value)
          }
          options={[
            { value: "", label: "All departments" },
            ...departmentOptions,
          ]}
        />

        <Select
          label="Country"
          value={values.countryId}
          onChange={(event) =>
            updateField("countryId", event.target.value)
          }
          options={[
            { value: "", label: "All countries" },
            ...countryOptions,
          ]}
        />

        <Input
          label="Minimum Estimated Value"
          type="number"
          min="0"
          step="0.01"
          value={values.minValue}
          onChange={(event) =>
            updateField("minValue", event.target.value)
          }
          placeholder="0.00"
        />

        <Input
          label="Maximum Estimated Value"
          type="number"
          min="0"
          step="0.01"
          value={values.maxValue}
          onChange={(event) =>
            updateField("maxValue", event.target.value)
          }
          placeholder="0.00"
        />

        <Input
          label="Planned Start From"
          type="date"
          value={values.plannedStartFrom}
          onChange={(event) =>
            updateField("plannedStartFrom", event.target.value)
          }
        />

        <Input
          label="Planned Start To"
          type="date"
          value={values.plannedStartTo}
          onChange={(event) =>
            updateField("plannedStartTo", event.target.value)
          }
        />
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleReset}
        >
          Reset Filters
        </Button>

        <Button type="submit" variant="primary">
          Apply Filters
        </Button>
      </div>
    </form>
  );
}
