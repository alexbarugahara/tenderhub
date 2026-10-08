"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export type ContractStatusValue =
  | "DRAFT"
  | "PENDING_SIGNATURE"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "TERMINATED"
  | "EXPIRED";

export interface ContractFormValues {
  awardId: string;
  vendorId: string;
  organizationId: string;
  contractNumber: string;
  title: string;
  description: string;
  status: ContractStatusValue;
  contractValue: string;
  startDate: string;
  endDate: string;
  signedDate: string;
  completedDate: string;
  terminatedDate: string;
  terminationReason: string;
}

export interface ContractFormOption {
  value: string;
  label: string;
}

export interface ContractFormProps {
  initialValues?: Partial<ContractFormValues>;
  awardOptions?: ContractFormOption[];
  vendorOptions?: ContractFormOption[];
  organizationOptions?: ContractFormOption[];
  submitLabel?: string;
  cancelLabel?: string;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (values: ContractFormValues) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const defaultValues: ContractFormValues = {
  awardId: "",
  vendorId: "",
  organizationId: "",
  contractNumber: "",
  title: "",
  description: "",
  status: "DRAFT",
  contractValue: "",
  startDate: "",
  endDate: "",
  signedDate: "",
  completedDate: "",
  terminatedDate: "",
  terminationReason: "",
};

const statusOptions: ContractFormOption[] = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_SIGNATURE", label: "Pending Signature" },
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "EXPIRED", label: "Expired" },
];

function isValidDate(value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  return !Number.isNaN(new Date(value).getTime());
}

export default function ContractForm({
  initialValues,
  awardOptions = [],
  vendorOptions = [],
  organizationOptions = [],
  submitLabel = "Save Contract",
  cancelLabel = "Cancel",
  submitting = false,
  error = null,
  onSubmit,
  onCancel,
  className = "",
}: ContractFormProps) {
  const [values, setValues] = useState<ContractFormValues>({
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

  function updateField<K extends keyof ContractFormValues>(
    field: K,
    value: ContractFormValues[K],
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
    if (!values.awardId.trim()) {
      return "Please select an award.";
    }

    if (!values.vendorId.trim()) {
      return "Please select a vendor.";
    }

    if (!values.contractNumber.trim()) {
      return "Contract number is required.";
    }

    if (!values.title.trim()) {
      return "Contract title is required.";
    }

    if (!values.contractValue.trim()) {
      return "Contract value is required.";
    }

    const contractValue = Number(values.contractValue);

    if (!Number.isFinite(contractValue) || contractValue < 0) {
      return "Contract value must be a valid non-negative number.";
    }

    if (!isValidDate(values.startDate)) {
      return "Please enter a valid start date.";
    }

    if (!isValidDate(values.endDate)) {
      return "Please enter a valid end date.";
    }

    if (!isValidDate(values.signedDate)) {
      return "Please enter a valid signed date.";
    }

    if (!isValidDate(values.completedDate)) {
      return "Please enter a valid completed date.";
    }

    if (!isValidDate(values.terminatedDate)) {
      return "Please enter a valid terminated date.";
    }

    if (values.startDate && values.endDate) {
      const startDate = new Date(values.startDate);
      const endDate = new Date(values.endDate);

      if (endDate < startDate) {
        return "End date cannot be earlier than the start date.";
      }
    }

    if (values.status === "TERMINATED") {
      if (!values.terminatedDate.trim()) {
        return "A terminated date is required for a terminated contract.";
      }

      if (!values.terminationReason.trim()) {
        return "A termination reason is required for a terminated contract.";
      }
    }

    if (values.status === "COMPLETED" && !values.completedDate.trim()) {
      return "A completed date is required for a completed contract.";
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
      awardId: values.awardId.trim(),
      vendorId: values.vendorId.trim(),
      organizationId: values.organizationId.trim(),
      contractNumber: values.contractNumber.trim(),
      title: values.title.trim(),
      description: values.description.trim(),
      contractValue: values.contractValue.trim(),
      startDate: values.startDate.trim(),
      endDate: values.endDate.trim(),
      signedDate: values.signedDate.trim(),
      completedDate: values.completedDate.trim(),
      terminatedDate: values.terminatedDate.trim(),
      terminationReason: values.terminationReason.trim(),
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
            Contract Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the award, vendor, and core contract information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Select
            label="Award"
            value={values.awardId}
            onChange={(event) =>
              updateField("awardId", event.target.value)
            }
            options={[
              { value: "", label: "Select award" },
              ...awardOptions,
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

          <Select
            label="Organization"
            value={values.organizationId}
            onChange={(event) =>
              updateField("organizationId", event.target.value)
            }
            options={[
              { value: "", label: "Select organization" },
              ...organizationOptions,
            ]}
            disabled={submitting}
          />

          <Input
            label="Contract Number"
            value={values.contractNumber}
            onChange={(event) =>
              updateField("contractNumber", event.target.value)
            }
            placeholder="e.g. CONTRACT-2026-001"
            required
            disabled={submitting}
          />

          <div className="md:col-span-2">
            <Input
              label="Contract Title"
              value={values.title}
              onChange={(event) =>
                updateField("title", event.target.value)
              }
              placeholder="Enter contract title"
              required
              disabled={submitting}
            />
          </div>

          <Select
            label="Status"
            value={values.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target.value as ContractStatusValue,
              )
            }
            options={statusOptions}
            required
            disabled={submitting}
          />

          <Input
            label="Contract Value"
            type="number"
            min="0"
            step="0.01"
            value={values.contractValue}
            onChange={(event) =>
              updateField("contractValue", event.target.value)
            }
            placeholder="0.00"
            required
            disabled={submitting}
          />

          <div className="md:col-span-2">
            <label
              htmlFor="contract-description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="contract-description"
              value={values.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Describe the contract scope and purpose"
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
            Contract Dates
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Record the key dates associated with the contract lifecycle.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="Start Date"
            type="date"
            value={values.startDate}
            onChange={(event) =>
              updateField("startDate", event.target.value)
            }
            disabled={submitting}
          />

          <Input
            label="End Date"
            type="date"
            value={values.endDate}
            onChange={(event) =>
              updateField("endDate", event.target.value)
            }
            disabled={submitting}
          />

          <Input
            label="Signed Date"
            type="date"
            value={values.signedDate}
            onChange={(event) =>
              updateField("signedDate", event.target.value)
            }
            disabled={submitting}
          />

          <Input
            label="Completed Date"
            type="date"
            value={values.completedDate}
            onChange={(event) =>
              updateField("completedDate", event.target.value)
            }
            disabled={submitting}
          />

          <Input
            label="Terminated Date"
            type="date"
            value={values.terminatedDate}
            onChange={(event) =>
              updateField("terminatedDate", event.target.value)
            }
            disabled={submitting}
          />
        </div>
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Termination Details
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Complete these details when the contract has been terminated.
          </p>
        </div>

        <div>
          <label
            htmlFor="termination-reason"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Termination Reason
          </label>

          <textarea
            id="termination-reason"
            value={values.terminationReason}
            onChange={(event) =>
              updateField("terminationReason", event.target.value)
            }
            placeholder="Enter the reason for termination"
            rows={5}
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