"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";

export interface OrganizationSettingsValues {
  countryId: string;
  currencyId: string;
  organizationType: string;
}

export interface OrganizationSettingsOption {
  value: string;
  label: string;
}

export interface OrganizationSettingsProps {
  initialValues?: Partial<OrganizationSettingsValues>;
  countryOptions?: OrganizationSettingsOption[];
  currencyOptions?: OrganizationSettingsOption[];
  organizationTypeOptions?: OrganizationSettingsOption[];
  submitting?: boolean;
  error?: string | null;
  onSubmit: (
    values: OrganizationSettingsValues,
  ) => void | Promise<void>;
  className?: string;
}

const defaultValues: OrganizationSettingsValues = {
  countryId: "",
  currencyId: "",
  organizationType: "",
};

export default function OrganizationSettings({
  initialValues,
  countryOptions = [],
  currencyOptions = [],
  organizationTypeOptions = [],
  submitting = false,
  error = null,
  onSubmit,
  className = "",
}: OrganizationSettingsProps) {
  const [values, setValues] =
    useState<OrganizationSettingsValues>({
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
  }, [initialValues]);

  function updateField(
    field: keyof OrganizationSettingsValues,
    value: string,
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
    if (!values.countryId.trim()) {
      return "Please select a country.";
    }

    if (!values.currencyId.trim()) {
      return "Please select a currency.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage = validate();

    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    setValidationError(null);

    await onSubmit({
      countryId: values.countryId.trim(),
      currencyId: values.currencyId.trim(),
      organizationType:
        values.organizationType.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`space-y-6 ${className}`}
      noValidate
    >
      {(validationError || error) && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {validationError || error}
        </div>
      )}

      <Card className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Organization Settings
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Configure the organization&apos;s country, currency, and
            organization type.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Select
            label="Country"
            value={values.countryId}
            onChange={(event) =>
              updateField(
                "countryId",
                event.target.value,
              )
            }
            options={[
              {
                value: "",
                label: "Select country",
              },
              ...countryOptions,
            ]}
            required
            disabled={submitting}
          />

          <Select
            label="Currency"
            value={values.currencyId}
            onChange={(event) =>
              updateField(
                "currencyId",
                event.target.value,
              )
            }
            options={[
              {
                value: "",
                label: "Select currency",
              },
              ...currencyOptions,
            ]}
            required
            disabled={submitting}
          />

          <Select
            label="Organization Type"
            value={values.organizationType}
            onChange={(event) =>
              updateField(
                "organizationType",
                event.target.value,
              )
            }
            options={[
              {
                value: "",
                label: "Select organization type",
              },
              ...organizationTypeOptions,
            ]}
            disabled={submitting}
          />
        </div>

        <div className="mt-6 flex justify-end border-t border-gray-200 pt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>
    </form>
  );
}