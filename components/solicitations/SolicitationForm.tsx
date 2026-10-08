"use client";

import React, { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

import {
  SOLICITATION_TYPES,
  getSolicitationTypeConfig,
} from "@/lib/solicitations/types";

export interface SolicitationFormValues {
  procurementId: string;
  solicitationNumber: string;
  title: string;
  description: string;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "OPEN"
    | "UNDER_EVALUATION"
    | "AWARDED"
    | "CLOSED"
    | "CANCELLED"
    | "SUSPENDED"
    | "ARCHIVED";
  type:
    | "RFI"
    | "EOI"
    | "RFQ"
    | "RFP"
    | "ITB"
    | "ITT"
    | "IFB"
    | "OTHER";
  openingDate: string;
  closingDate: string;
  bidSecurityRequired: boolean;
  bidSecurityAmount: string;
  applicationFeeRequired: boolean;
  applicationFeeAmount: string;
}

export interface SolicitationFormProps {
  initialValues?: Partial<SolicitationFormValues>;

  apiEndpoint?: string;
  apiMethod?: "POST" | "PATCH";

  procurement: {
    id: string;
    referenceNumber: string;
    title: string;
    status?: string | null;
    procurementMethod?: string | null;
    estimatedValue?: number | string | null;
    currency: {
      id: string;
      code: string;
      name: string;
    };
  };

  loading?: boolean;
  submitLabel?: string;
  onSubmit?: (values: SolicitationFormValues) => void;
  onCancel?: () => void;
  className?: string;
}

const defaultValues: SolicitationFormValues = {
  procurementId: "",
  solicitationNumber: "",
  title: "",
  description: "",
  status: "DRAFT",
  type: "RFP",
  openingDate: "",
  closingDate: "",
  bidSecurityRequired: false,
  bidSecurityAmount: "",
  applicationFeeRequired: false,
  applicationFeeAmount: "",
};

const statusOptions = [
  {
    value: "DRAFT",
    label: "Draft",
  },
  {
    value: "PUBLISHED",
    label: "Published",
  },
  {
    value: "OPEN",
    label: "Open",
  },
  {
    value: "UNDER_EVALUATION",
    label: "Under Evaluation",
  },
  {
    value: "AWARDED",
    label: "Awarded",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
  {
    value: "CANCELLED",
    label: "Cancelled",
  },
  {
    value: "SUSPENDED",
    label: "Suspended",
  },
  {
    value: "ARCHIVED",
    label: "Archived",
  },
];

export default function SolicitationForm({
  initialValues,
  apiEndpoint = "/api/solicitations",
  apiMethod = "POST",
  procurement,
  loading = false,
  submitLabel = "Save Solicitation",
  onSubmit,
  onCancel,
  className = "",
}: SolicitationFormProps) {
  const router = useRouter();

  const [values, setValues] =
    useState<SolicitationFormValues>({
      ...defaultValues,
      ...initialValues,
      procurementId: procurement.id,
    });

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBusy = loading || isSubmitting;
  const isEditing = apiMethod === "PATCH";

  const updateValue = <
    K extends keyof SolicitationFormValues
  >(
    field: K,
    value: SolicitationFormValues[K],
  ) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setError("");

    if (isBusy) {
      return;
    }

    /*
     * ---------------------------------------------------------
     * Procurement validation
     * ---------------------------------------------------------
     *
     * Procurement is the parent/source of truth.
     *
     * Inherited from Procurement:
     * - organization
     * - currency
     * - procurement method
     * - estimated value
     */

    if (!procurement.id) {
      setError(
        "The Procurement could not be identified. Please return to the Procurement and try again.",
      );
      return;
    }

    if (!values.procurementId) {
      setError(
        "The Procurement could not be identified. Please return to the Procurement and try again.",
      );
      return;
    }

    if (values.procurementId !== procurement.id) {
      setError(
        "The selected Procurement is invalid. Please return to the Procurement and try again.",
      );
      return;
    }

    if (!procurement.currency?.id) {
      setError(
        "The selected Procurement does not have a currency. Please configure the Procurement currency first.",
      );
      return;
    }

    /*
     * ---------------------------------------------------------
     * Required fields
     * ---------------------------------------------------------
     */

    if (!values.solicitationNumber.trim()) {
      setError("Solicitation number is required.");
      return;
    }

    if (!values.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!values.type) {
      setError("Solicitation type is required.");
      return;
    }

    /*
     * ---------------------------------------------------------
     * Bid Security
     * ---------------------------------------------------------
     */

    if (
      values.bidSecurityRequired &&
      !values.bidSecurityAmount.trim()
    ) {
      setError(
        "Bid security amount is required when bid security is enabled.",
      );
      return;
    }

    if (values.bidSecurityRequired) {
      const bidSecurityAmount = Number(
        values.bidSecurityAmount,
      );

      if (
        Number.isNaN(bidSecurityAmount) ||
        !Number.isFinite(bidSecurityAmount) ||
        bidSecurityAmount < 0
      ) {
        setError(
          "Bid security amount must be a valid non-negative number.",
        );
        return;
      }
    }

    /*
     * ---------------------------------------------------------
     * Application Fee
     * ---------------------------------------------------------
     */

    if (
      values.applicationFeeRequired &&
      !values.applicationFeeAmount.trim()
    ) {
      setError(
        "Application fee amount is required when an application fee is enabled.",
      );
      return;
    }

    if (values.applicationFeeRequired) {
      const applicationFeeAmount = Number(
        values.applicationFeeAmount,
      );

      if (
        Number.isNaN(applicationFeeAmount) ||
        !Number.isFinite(applicationFeeAmount) ||
        applicationFeeAmount < 0
      ) {
        setError(
          "Application fee amount must be a valid non-negative number.",
        );
        return;
      }
    }

    /*
     * ---------------------------------------------------------
     * Dates
     * ---------------------------------------------------------
     */

    if (
      values.openingDate &&
      values.closingDate
    ) {
      const openingDate = new Date(
        values.openingDate,
      );

      const closingDate = new Date(
        values.closingDate,
      );

      if (
        Number.isNaN(openingDate.getTime()) ||
        Number.isNaN(closingDate.getTime())
      ) {
        setError(
          "Please enter valid opening and closing dates.",
        );
        return;
      }

      if (closingDate <= openingDate) {
        setError(
          "Closing date must be after the opening date.",
        );
        return;
      }
    }

    /*
     * ---------------------------------------------------------
     * Prepare API payload
     * ---------------------------------------------------------
     *
     * Only Solicitation-owned fields are submitted.
     *
     * NOT submitted:
     * - organizationId
     * - currencyId
     * - procurementMethod
     * - estimatedValue
     *
     * Procurement remains the source of truth.
     */

    const payload = {
      procurementId: procurement.id,

      solicitationNumber:
        values.solicitationNumber.trim(),

      title: values.title.trim(),

      description:
        values.description.trim(),

      status: values.status,

      type: values.type,

      openingDate:
        values.openingDate || null,

      closingDate:
        values.closingDate || null,

      bidSecurityRequired:
        values.bidSecurityRequired,

      bidSecurityAmount:
        values.bidSecurityRequired
          ? values.bidSecurityAmount
          : null,

      applicationFeeRequired:
        values.applicationFeeRequired,

      applicationFeeAmount:
        values.applicationFeeRequired
          ? values.applicationFeeAmount
          : null,
    };

    try {
      setIsSubmitting(true);

      const response = await fetch(
        apiEndpoint,
        {
          method: apiMethod,

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(payload),
        },
      );

      /*
       * The API may return different successful
       * response shapes. We only use HTTP status
       * to determine whether the request succeeded.
       */

      const result = await response
        .json()
        .catch(() => null);

      /*
       * IMPORTANT:
       *
       * Do NOT require result.success === true.
       *
       * The POST /api/solicitations endpoint
       * currently returns HTTP 201 when creation
       * succeeds. The previous code incorrectly
       * treated that successful response as an error
       * because the response did not necessarily contain
       * { success: true }.
       */

      if (!response.ok) {
        throw new Error(
          result?.error ||
            (isEditing
              ? "Failed to update the solicitation."
              : "Failed to create the solicitation."),
        );
      }

      /*
       * Preserve compatibility with an
       * optional parent onSubmit handler.
       */

      onSubmit?.({
        ...values,
        procurementId: procurement.id,
      });

      /*
       * Support the possible API response shapes:
       *
       * {
       *   data: {...}
       * }
       *
       * {
       *   solicitation: {...}
       * }
       *
       * or a direct solicitation object.
       */

      const savedSolicitation =
        result?.data ??
        result?.solicitation ??
        (result?.id ? result : null);

      /*
       * If the API returned the newly created
       * solicitation, go directly to its detail page.
       */

      if (savedSolicitation?.id) {
        router.push(
          `/dashboard/organization/solicitations/${savedSolicitation.id}`,
        );

        router.refresh();

        return;
      }

      /*
       * If the API succeeded but did not return
       * the solicitation ID, return to the register.
       */

      router.push(
        "/dashboard/organization/solicitations",
      );

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : isEditing
            ? "Failed to update the solicitation."
            : "Failed to create the solicitation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedType =
    getSolicitationTypeConfig(values.type);

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      {/* =====================================================
          HEADER
          ===================================================== */}

      <div>
        <h2 className="text-xl font-semibold text-tenderhub-navy">
          Solicitation Information
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {isEditing
            ? "Update the solicitation information under the selected Procurement."
            : "Enter the details for the new solicitation."}
        </p>
      </div>

      {/* =====================================================
          ERROR
          ===================================================== */}

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* =====================================================
          BASIC INFORMATION
          ===================================================== */}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Solicitation Number */}

        <Input
          label="Solicitation Number"
          value={values.solicitationNumber}
          onChange={(event) =>
            updateValue(
              "solicitationNumber",
              event.target.value,
            )
          }
          placeholder="e.g. RFP-2026-001"
          required
          disabled={isBusy}
        />

        {/* Title */}

        <Input
          label="Title"
          value={values.title}
          onChange={(event) =>
            updateValue(
              "title",
              event.target.value,
            )
          }
          placeholder="Enter the solicitation title"
          required
          disabled={isBusy}
        />

        {/* Description */}

        <div className="md:col-span-2">
          <label
            htmlFor="solicitation-description"
            className="mb-1.5 block text-sm font-medium text-gray-700"
          >
            Description
          </label>

          <textarea
            id="solicitation-description"
            value={values.description}
            onChange={(event) =>
              updateValue(
                "description",
                event.target.value,
              )
            }
            placeholder="Describe the procurement opportunity..."
            rows={5}
            disabled={isBusy}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-slate-50"
          />
        </div>
      </div>

      {/* =====================================================
          SOLICITATION DETAILS
          ===================================================== */}

      <div className="border-t border-gray-100 pt-6">
        <div>
          <h3 className="text-base font-semibold text-tenderhub-navy">
            Solicitation Details
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Select the solicitation type and
            current status.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Solicitation Type */}

          <div>
            <label
              htmlFor="solicitation-type"
              className="mb-1.5 block text-sm font-medium text-gray-700"
            >
              Solicitation Type
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              id="solicitation-type"
              value={values.type}
              onChange={(event) =>
                updateValue(
                  "type",
                  event.target
                    .value as SolicitationFormValues["type"],
                )
              }
              disabled={isBusy}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-slate-50"
            >
              {SOLICITATION_TYPES.map(
                (type) => (
                  <option
                    key={type.value}
                    value={type.value}
                  >
                    {type.shortLabel} —{" "}
                    {type.label}
                  </option>
                ),
              )}
            </select>

            {selectedType && (
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium text-slate-700">
                  {selectedType.shortLabel} —{" "}
                  {selectedType.label}
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {selectedType.description}
                </p>
              </div>
            )}
          </div>

          {/* Status */}

          <div>
            <Select
              label="Status"
              value={values.status}
              options={statusOptions}
              onChange={(event) =>
                updateValue(
                  "status",
                  event.target
                    .value as SolicitationFormValues["status"],
                )
              }
              required
              disabled={isBusy}
            />
          </div>
        </div>
      </div>

      {/* =====================================================
          DATES
          ===================================================== */}

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-base font-semibold text-tenderhub-navy">
          Solicitation Dates
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Set the period during which the
          solicitation will be open.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Opening Date */}

          <Input
            label="Opening Date"
            type="datetime-local"
            value={values.openingDate}
            onChange={(event) =>
              updateValue(
                "openingDate",
                event.target.value,
              )
            }
            required
            disabled={isBusy}
          />

          {/* Closing Date */}

          <Input
            label="Closing Date"
            type="datetime-local"
            value={values.closingDate}
            onChange={(event) =>
              updateValue(
                "closingDate",
                event.target.value,
              )
            }
            required
            disabled={isBusy}
          />
        </div>
      </div>

      {/* =====================================================
          BID SECURITY
          ===================================================== */}

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-base font-semibold text-tenderhub-navy">
          Bid Security
        </h3>

        <div className="mt-4 flex items-start gap-3">
          <input
            id="bid-security-required"
            type="checkbox"
            checked={
              values.bidSecurityRequired
            }
            onChange={(event) =>
              updateValue(
                "bidSecurityRequired",
                event.target.checked,
              )
            }
            disabled={isBusy}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-tenderhub-navy focus:ring-tenderhub-gold"
          />

          <div>
            <label
              htmlFor="bid-security-required"
              className="text-sm font-medium text-gray-700"
            >
              Bid security required
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Require vendors to provide bid
              security for this solicitation.
            </p>
          </div>
        </div>

        {values.bidSecurityRequired && (
          <div className="mt-4 max-w-md">
            <Input
              label={`Bid Security Amount (${procurement.currency.code})`}
              type="number"
              min="0"
              step="0.01"
              value={
                values.bidSecurityAmount
              }
              onChange={(event) =>
                updateValue(
                  "bidSecurityAmount",
                  event.target.value,
                )
              }
              placeholder="0.00"
              required
              disabled={isBusy}
            />

            <p className="mt-1.5 text-xs text-slate-500">
              Amount is expressed in{" "}
              {procurement.currency.code}.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          APPLICATION FEE
          ===================================================== */}

      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-base font-semibold text-tenderhub-navy">
          Application Fee
        </h3>

        <div className="mt-4 flex items-start gap-3">
          <input
            id="application-fee-required"
            type="checkbox"
            checked={
              values.applicationFeeRequired
            }
            onChange={(event) =>
              updateValue(
                "applicationFeeRequired",
                event.target.checked,
              )
            }
            disabled={isBusy}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-tenderhub-navy focus:ring-tenderhub-gold"
          />

          <div>
            <label
              htmlFor="application-fee-required"
              className="text-sm font-medium text-gray-700"
            >
              Application fee required
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Require vendors to pay an
              application fee before submission.
            </p>
          </div>
        </div>

        {values.applicationFeeRequired && (
          <div className="mt-4 max-w-md">
            <Input
              label={`Application Fee Amount (${procurement.currency.code})`}
              type="number"
              min="0"
              step="0.01"
              value={
                values.applicationFeeAmount
              }
              onChange={(event) =>
                updateValue(
                  "applicationFeeAmount",
                  event.target.value,
                )
              }
              placeholder="0.00"
              required
              disabled={isBusy}
            />

            <p className="mt-1.5 text-xs text-slate-500">
              Amount is expressed in{" "}
              {procurement.currency.code}.
            </p>
          </div>
        )}
      </div>

      {/* =====================================================
          ACTIONS
          ===================================================== */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={isBusy}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={isBusy}
          className="w-full sm:w-auto"
        >
          {isBusy
            ? "Saving..."
            : submitLabel}
        </Button>
      </div>
    </form>
  );
}
