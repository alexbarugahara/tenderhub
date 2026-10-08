"use client";

import React, {
  FormEvent,
  useEffect,
  useState,
} from "react";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export type LotStatusValue =
  | "OPEN"
  | "CLOSED"
  | "AWARDED"
  | "CANCELLED";

export interface LotFormValues {
  number: string;
  title: string;
  description: string;
  estimatedValue: string;
  status: LotStatusValue;
}

export interface LotFormProps {
  initialValues?: Partial<LotFormValues>;
  currencyCode?: string | null;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (
    values: LotFormValues,
  ) => void | Promise<void>;
  onValuesChange?: (
    values: LotFormValues,
  ) => void;
  onCancel?: () => void;
  className?: string;
  children?: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
}

const defaultValues: LotFormValues = {
  number: "",
  title: "",
  description: "",
  estimatedValue: "",
  status: "OPEN",
};

const statusOptions = [
  {
    value: "OPEN",
    label: "Open",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
  {
    value: "AWARDED",
    label: "Awarded",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
];

export default function LotForm({
  initialValues,
  currencyCode,
  submitting = false,
  error = null,
  onSubmit,
  onValuesChange,
  onCancel,
  className = "",
  children,
  submitLabel = "Create Lot",
  cancelLabel = "Cancel",
}: LotFormProps) {
  const [values, setValues] =
    useState<LotFormValues>({
      ...defaultValues,
      ...initialValues,
    });

  const [validationError, setValidationError] =
    useState<string | null>(null);

  useEffect(() => {
    setValues({
      ...defaultValues,
      ...initialValues,
    });

    setValidationError(null);
  }, [initialValues]);

  function updateField<
    K extends keyof LotFormValues,
  >(
    field: K,
    value: LotFormValues[K],
  ) {
    setValues((current) => {
      const nextValues = {
        ...current,
        [field]: value,
      };

      onValuesChange?.(nextValues);

      return nextValues;
    });

    if (validationError) {
      setValidationError(null);
    }
  }

  function validate(): string | null {
    if (!values.number.trim()) {
      return "Lot number is required.";
    }

    const lotNumber = Number(
      values.number,
    );

    if (
      !Number.isInteger(lotNumber) ||
      lotNumber <= 0
    ) {
      return "Lot number must be a positive whole number.";
    }

    if (!values.title.trim()) {
      return "Lot title is required.";
    }

    if (values.estimatedValue.trim()) {
      const estimatedValue = Number(
        values.estimatedValue,
      );

      if (
        !Number.isFinite(
          estimatedValue,
        ) ||
        estimatedValue < 0
      ) {
        return "Estimated value must be a valid non-negative number.";
      }
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const validationMessage =
      validate();

    if (validationMessage) {
      setValidationError(
        validationMessage,
      );
      return;
    }

    setValidationError(null);

    await onSubmit({
      ...values,
      number:
        values.number.trim(),
      title:
        values.title.trim(),
      description:
        values.description.trim(),
      estimatedValue:
        values.estimatedValue.trim(),
    });
  }

  function handleCancel() {
    if (submitting) {
      return;
    }

    onCancel?.();
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

      {/* Lot Information */}

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Lot Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Enter the information that
            identifies and describes this
            lot.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="Lot Number"
            type="number"
            min="1"
            step="1"
            value={values.number}
            onChange={(event) =>
              updateField(
                "number",
                event.target.value,
              )
            }
            placeholder="1"
            required
            disabled={submitting}
          />

          <Select
            label="Status"
            value={values.status}
            onChange={(event) =>
              updateField(
                "status",
                event.target
                  .value as LotStatusValue,
              )
            }
            options={statusOptions}
            required
            disabled={submitting}
          />

          <div className="md:col-span-2">
            <Input
              label="Title"
              value={values.title}
              onChange={(event) =>
                updateField(
                  "title",
                  event.target.value,
                )
              }
              placeholder="Enter lot title"
              required
              disabled={submitting}
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="lot-description"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Description
            </label>

            <textarea
              id="lot-description"
              value={values.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              placeholder="Describe the goods, services, or works covered by this lot"
              rows={5}
              disabled={submitting}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>
      </section>

      {/* Financial Information */}

      <section className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Financial Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Provide the estimated value for
            this lot when available.
          </p>
        </div>

        <div className="max-w-md">
          <Input
            label={`Estimated Value${
              currencyCode
                ? ` (${currencyCode})`
                : ""
            }`}
            type="number"
            min="0"
            step="0.01"
            value={
              values.estimatedValue
            }
            onChange={(event) =>
              updateField(
                "estimatedValue",
                event.target.value,
              )
            }
            placeholder="0.00"
            disabled={submitting}
          />
        </div>
      </section>

      {/* Additional Content */}

      {children}

      {/* Form Actions */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={submitting}
          >
            {cancelLabel}
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={submitting}
        >
          {submitting
            ? "Saving..."
            : submitLabel}
        </Button>
      </div>
    </form>
  );
}