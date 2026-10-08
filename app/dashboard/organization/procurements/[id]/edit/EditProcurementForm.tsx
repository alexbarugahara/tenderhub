"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import ProcurementForm, {
  type ProcurementFormOption,
  type ProcurementFormValues,
} from "@/components/procurement/ProcurementForm";

interface EditProcurementFormClientProps {
  procurementId: string;
  initialValues: ProcurementFormValues;
  organizationOptions: ProcurementFormOption[];
  departmentOptions: ProcurementFormOption[];
  countryOptions: ProcurementFormOption[];
  currencyOptions: ProcurementFormOption[];
}

export default function EditProcurementFormClient({
  procurementId,
  initialValues,
  organizationOptions,
  departmentOptions,
  countryOptions,
  currencyOptions,
}: EditProcurementFormClientProps) {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(values: ProcurementFormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/procurements/${procurementId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        },
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result?.error || "Failed to update procurement.",
        );
      }

      router.push(
        `/dashboard/organization/procurements/${procurementId}`,
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update procurement.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    router.push(
      `/dashboard/organization/procurements/${procurementId}`,
    );
  }

  return (
    <ProcurementForm
      initialValues={initialValues}
      organizationOptions={organizationOptions}
      departmentOptions={departmentOptions}
      countryOptions={countryOptions}
      currencyOptions={currencyOptions}
      submitLabel="Save Changes"
      cancelLabel="Cancel"
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
    />
  );
}
