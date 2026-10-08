"use client";

import React, { FormEvent, useEffect, useState } from "react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";

export interface OrganizationProfileValues {
  name: string;
  legalName: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  logo: string;
  description: string;
  registrationNumber: string;
  taxNumber: string;
  organizationType: string;
  countryId: string;
  currencyId: string;
}

export interface OrganizationProfileOption {
  value: string;
  label: string;
}

export interface OrganizationProfileProps {
  initialValues?: Partial<OrganizationProfileValues>;
  countryOptions?: OrganizationProfileOption[];
  currencyOptions?: OrganizationProfileOption[];
  organizationTypeOptions?: OrganizationProfileOption[];
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onSubmit: (
    values: OrganizationProfileValues,
  ) => void | Promise<void>;
  className?: string;
}

const defaultValues: OrganizationProfileValues = {
  name: "",
  legalName: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  logo: "",
  description: "",
  registrationNumber: "",
  taxNumber: "",
  organizationType: "",
  countryId: "",
  currencyId: "",
};

export default function OrganizationProfile({
  initialValues,
  countryOptions = [],
  currencyOptions = [],
  organizationTypeOptions = [],
  submitting = false,
  error = null,
  submitLabel = "Save Changes",
  onSubmit,
  className = "",
}: OrganizationProfileProps) {
  const [values, setValues] =
    useState<OrganizationProfileValues>({
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
    field: keyof OrganizationProfileValues,
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
    if (!values.name.trim()) {
      return "Organization name is required.";
    }

    if (!values.email.trim()) {
      return "Organization email is required.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        values.email.trim(),
      )
    ) {
      return "Please enter a valid organization email.";
    }

    if (!values.countryId.trim()) {
      return "Please select the organization's country.";
    }

    if (!values.currencyId.trim()) {
      return "Please select the organization's currency.";
    }

    if (values.website.trim()) {
      try {
        const website = values.website.trim();
        const normalizedWebsite =
          /^https?:\/\//i.test(website)
            ? website
            : `https://${website}`;

        new URL(normalizedWebsite);
      } catch {
        return "Please enter a valid website URL.";
      }
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
      name: values.name.trim(),
      legalName: values.legalName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      website: values.website.trim(),
      address: values.address.trim(),
      logo: values.logo.trim(),
      description: values.description.trim(),
      registrationNumber:
        values.registrationNumber.trim(),
      taxNumber: values.taxNumber.trim(),
      organizationType:
        values.organizationType.trim(),
      countryId: values.countryId.trim(),
      currencyId: values.currencyId.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`space-y-6 ${className}`}
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
            Organization Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Manage the organization&apos;s core identity and contact
            information.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="Organization Name"
            value={values.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
            placeholder="Enter organization name"
            required
            disabled={submitting}
          />

          <Input
            label="Legal Name"
            value={values.legalName}
            onChange={(event) =>
              updateField(
                "legalName",
                event.target.value,
              )
            }
            placeholder="Enter legal name"
            disabled={submitting}
          />

          <Input
            label="Email"
            type="email"
            value={values.email}
            onChange={(event) =>
              updateField(
                "email",
                event.target.value,
              )
            }
            placeholder="organization@example.com"
            required
            disabled={submitting}
          />

          <Input
            label="Phone"
            type="tel"
            value={values.phone}
            onChange={(event) =>
              updateField(
                "phone",
                event.target.value,
              )
            }
            placeholder="+256..."
            disabled={submitting}
          />

          <Input
            label="Website"
            type="url"
            value={values.website}
            onChange={(event) =>
              updateField(
                "website",
                event.target.value,
              )
            }
            placeholder="https://example.com"
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

          <Input
            label="Registration Number"
            value={values.registrationNumber}
            onChange={(event) =>
              updateField(
                "registrationNumber",
                event.target.value,
              )
            }
            placeholder="Enter registration number"
            disabled={submitting}
          />

          <Input
            label="Tax Number"
            value={values.taxNumber}
            onChange={(event) =>
              updateField(
                "taxNumber",
                event.target.value,
              )
            }
            placeholder="Enter tax number"
            disabled={submitting}
          />

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

          <Input
            label="Logo URL"
            type="url"
            value={values.logo}
            onChange={(event) =>
              updateField(
                "logo",
                event.target.value,
              )
            }
            placeholder="https://example.com/logo.png"
            disabled={submitting}
          />

          <div>
            <label
              htmlFor="organization-profile-address"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Address
            </label>

            <textarea
              id="organization-profile-address"
              value={values.address}
              onChange={(event) =>
                updateField(
                  "address",
                  event.target.value,
                )
              }
              placeholder="Enter organization address"
              rows={3}
              disabled={submitting}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="organization-profile-description"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Description
          </label>

          <textarea
            id="organization-profile-description"
            value={values.description}
            onChange={(event) =>
              updateField(
                "description",
                event.target.value,
              )
            }
            placeholder="Describe the organization and its activities"
            rows={6}
            disabled={submitting}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>

        <div className="mt-6 flex justify-end border-t border-gray-200 pt-6">
          <Button
            type="submit"
            variant="primary"
            disabled={submitting}
          >
            {submitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </Card>
    </form>
  );
}