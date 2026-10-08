"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import LotForm, {
  LotFormValues,
} from "@/components/lots/LotForm";
import Button from "@/components/ui/Button";

interface EditLotFormClientProps {
  lotId: string;
  solicitationId: string;
  currencyCode?: string | null;
  initialValues: LotFormValues;
}

export default function EditLotFormClient({
  lotId,
  solicitationId,
  currencyCode,
  initialValues,
}: EditLotFormClientProps) {
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(values: LotFormValues) {
    setSubmitting(true);
    setError(null);

    try {
      const lotResponse = await fetch(`/api/lots/${lotId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          number: Number(values.number),
          title: values.title.trim(),
          description:
            values.description?.trim() || null,
          estimatedValue:
            values.estimatedValue === ""
              ? null
              : Number(values.estimatedValue),
          status: values.status,
        }),
      });

      const lotResult = await lotResponse
        .json()
        .catch(() => null);

      if (!lotResponse.ok) {
        throw new Error(
          lotResult?.error || "Failed to update lot.",
        );
      }

      router.push(
        `/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}`,
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save lot.",
      );

      setSubmitting(false);
    }
  }

  function handleCancel() {
    router.push(
      `/dashboard/organization/solicitations/${solicitationId}/lots/${lotId}`,
    );
  }

  return (
    <LotForm
      initialValues={initialValues}
      currencyCode={currencyCode}
      submitting={submitting}
      error={error}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={handleCancel}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          variant="primary"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </LotForm>
  );
}