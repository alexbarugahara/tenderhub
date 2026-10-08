"use client";

import React, { FormEvent, useMemo, useState } from "react";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button from "@/components/ui/Button";

export interface VendorRegistrationValues {
  companyName: string;
  legalName: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  registrationNumber: string;
  taxNumber: string;
  countryId: string;
  businessType: string;
  numberOfEmployees: string;
  yearsOperating: string;
  operatingLocations: string;
  portfolioDescription: string;
}

export interface VendorRegistrationOption {
  value: string;
  label: string;
}

export interface VendorRegistrationProps {
  initialValues?: Partial<VendorRegistrationValues>;
  countryOptions?: VendorRegistrationOption[];
  businessTypeOptions?: VendorRegistrationOption[];
  submitLabel?: string;
  submitting?: boolean;
  error?: string | null;
  onSubmit: (
    values: VendorRegistrationValues,
  ) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const defaultValues: VendorRegistrationValues = {
  companyName: "",
  legalName: "",
  description: "",
  email: "",
  phone: "",
  website: "",
  address: "",
  registrationNumber: "",
  taxNumber: "",
  countryId: "",
  businessType: "",
  numberOfEmployees: "",
  yearsOperating: "",
  operatingLocations: "",
  portfolioDescription: "",
};

const steps = [
  {
    id: 1,
    title: "Company Profile",
    description: "Tell us about your business",
  },
  {
    id: 2,
    title: "Registration",
    description: "Provide legal and tax information",
  },
  {
    id: 3,
    title: "Operations",
    description: "Tell us how your business operates",
  },
  {
    id: 4,
    title: "Experience",
    description: "Show your capabilities and experience",
  },
  {
    id: 5,
    title: "Review",
    description: "Review your information before submitting",
  },
];

export default function VendorRegistration({
  initialValues,
  countryOptions = [],
  businessTypeOptions = [],
  submitLabel = "Submit for Review",
  submitting = false,
  error = null,
  onSubmit,
  onCancel,
  className = "",
}: VendorRegistrationProps) {
  const [values, setValues] =
    useState<VendorRegistrationValues>({
      ...defaultValues,
      ...initialValues,
    });

  const [currentStep, setCurrentStep] = useState(1);
  const [validationError, setValidationError] =
    useState<string | null>(null);

  const progress = useMemo(
    () => Math.round((currentStep / steps.length) * 100),
    [currentStep],
  );

  function updateField<K extends keyof VendorRegistrationValues>(
    field: K,
    value: VendorRegistrationValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (validationError) {
      setValidationError(null);
    }
  }

  function validateStep(step: number): string | null {
    if (step === 1) {
      if (!values.companyName.trim()) {
        return "Company name is required.";
      }

      if (!values.email.trim()) {
        return "Business email is required.";
      }

      if (!values.countryId.trim()) {
        return "Please select a country.";
      }
    }

    if (step === 2) {
      if (!values.legalName.trim()) {
        return "Legal name is required.";
      }

      if (!values.registrationNumber.trim()) {
        return "Company registration number is required.";
      }

      if (!values.taxNumber.trim()) {
        return "Tax number is required.";
      }
    }

    if (step === 3) {
      if (values.numberOfEmployees.trim()) {
        const employees = Number(values.numberOfEmployees);

        if (
          !Number.isInteger(employees) ||
          employees < 0
        ) {
          return "Number of employees must be a valid non-negative whole number.";
        }
      }

      if (values.yearsOperating.trim()) {
        const years = Number(values.yearsOperating);

        if (!Number.isInteger(years) || years < 0) {
          return "Years operating must be a valid non-negative whole number.";
        }
      }
    }

    return null;
  }

  function goNext() {
    const validationMessage = validateStep(currentStep);

    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    setValidationError(null);

    setCurrentStep((current) =>
      Math.min(current + 1, steps.length),
    );
  }

  function goBack() {
    setValidationError(null);

    setCurrentStep((current) =>
      Math.max(current - 1, 1),
    );
  }

  function goToStep(step: number) {
    if (step >= currentStep) {
      return;
    }

    setValidationError(null);
    setCurrentStep(step);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    for (let step = 1; step <= 4; step += 1) {
      const validationMessage = validateStep(step);

      if (validationMessage) {
        setCurrentStep(step);
        setValidationError(validationMessage);
        return;
      }
    }

    setValidationError(null);

    await onSubmit({
      companyName: values.companyName.trim(),
      legalName: values.legalName.trim(),
      description: values.description.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      website: values.website.trim(),
      address: values.address.trim(),
      registrationNumber:
        values.registrationNumber.trim(),
      taxNumber: values.taxNumber.trim(),
      countryId: values.countryId.trim(),
      businessType: values.businessType.trim(),
      numberOfEmployees:
        values.numberOfEmployees.trim(),
      yearsOperating:
        values.yearsOperating.trim(),
      operatingLocations:
        values.operatingLocations.trim(),
      portfolioDescription:
        values.portfolioDescription.trim(),
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`space-y-8 ${className}`}
    >
      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-medium text-tenderhub-gold">
              TenderHub Vendor Onboarding
            </p>

            <h1 className="mt-1 text-2xl font-bold text-tenderhub-navy">
              Register your business
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Complete your organization profile and provide
              the information required for TenderHub vendor
              verification.
            </p>
          </div>

          <div className="rounded-xl bg-tenderhub-navy px-4 py-3 text-right text-white">
            <p className="text-xs uppercase tracking-wide text-white/70">
              Step
            </p>

            <p className="text-xl font-bold">
              {currentStep} / {steps.length}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-gray-600">
              Onboarding progress
            </span>

            <span className="font-semibold text-tenderhub-navy">
              {progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-tenderhub-gold transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step navigation */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
          {steps.map((step) => {
            const active = currentStep === step.id;
            const completed = currentStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goToStep(step.id)}
                disabled={
                  submitting ||
                  step.id >= currentStep
                }
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-tenderhub-gold bg-tenderhub-gold/10"
                    : completed
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-white"
                } ${
                  step.id >= currentStep
                    ? "cursor-default"
                    : "cursor-pointer hover:border-tenderhub-gold"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      active
                        ? "bg-tenderhub-gold text-tenderhub-navy"
                        : completed
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {completed ? "✓" : step.id}
                  </span>

                  <span
                    className={`text-sm font-semibold ${
                      active
                        ? "text-tenderhub-navy"
                        : "text-gray-700"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                <p className="mt-2 pl-9 text-xs text-gray-500">
                  {step.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error */}
      {(validationError || error) && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {validationError || error}
        </div>
      )}

      {/* Step content */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        {/* STEP 1 */}
        {currentStep === 1 && (
          <section className="space-y-6">
            <div>
              <p className="text-sm font-medium text-tenderhub-gold">
                Step 1
              </p>

              <h2 className="mt-1 text-xl font-bold text-tenderhub-navy">
                Company Profile
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Start with the basic information about your
                business.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Input
                label="Company Name"
                value={values.companyName}
                onChange={(event) =>
                  updateField(
                    "companyName",
                    event.target.value,
                  )
                }
                placeholder="Enter company name"
                required
                disabled={submitting}
              />

              <Input
                label="Business Email"
                type="email"
                value={values.email}
                onChange={(event) =>
                  updateField(
                    "email",
                    event.target.value,
                  )
                }
                placeholder="company@example.com"
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
                label="Business Type"
                value={values.businessType}
                onChange={(event) =>
                  updateField(
                    "businessType",
                    event.target.value,
                  )
                }
                options={[
                  {
                    value: "",
                    label: "Select business type",
                  },
                  ...businessTypeOptions,
                ]}
                disabled={submitting}
              />

              <div className="md:col-span-2">
                <label
                  htmlFor="vendor-registration-address"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Business Address
                </label>

                <textarea
                  id="vendor-registration-address"
                  value={values.address}
                  onChange={(event) =>
                    updateField(
                      "address",
                      event.target.value,
                    )
                  }
                  placeholder="Enter the registered business address"
                  rows={3}
                  disabled={submitting}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="vendor-registration-description"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Company Description
                </label>

                <textarea
                  id="vendor-registration-description"
                  value={values.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="Describe the company and its main activities"
                  rows={5}
                  disabled={submitting}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
            </div>
          </section>
        )}

        {/* STEP 2 */}
        {currentStep === 2 && (
          <section className="space-y-6">
            <div>
              <p className="text-sm font-medium text-tenderhub-gold">
                Step 2
              </p>

              <h2 className="mt-1 text-xl font-bold text-tenderhub-navy">
                Legal & Registration
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Provide the legal information TenderHub will
                use during verification.
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">
                Why we need this
              </p>

              <p className="mt-1 text-sm leading-6 text-blue-800">
                These details help TenderHub establish the
                identity of your business before you can
                participate in procurement opportunities.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Input
                label="Legal Name"
                value={values.legalName}
                onChange={(event) =>
                  updateField(
                    "legalName",
                    event.target.value,
                  )
                }
                placeholder="Enter registered legal name"
                required
                disabled={submitting}
              />

              <Input
                label="Company Registration Number"
                value={values.registrationNumber}
                onChange={(event) =>
                  updateField(
                    "registrationNumber",
                    event.target.value,
                  )
                }
                placeholder="Enter registration number"
                required
                disabled={submitting}
              />

              <Input
                label="Tax Identification Number"
                value={values.taxNumber}
                onChange={(event) =>
                  updateField(
                    "taxNumber",
                    event.target.value,
                  )
                }
                placeholder="Enter tax identification number"
                required
                disabled={submitting}
              />
            </div>

            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tenderhub-navy text-sm font-bold text-white">
                  i
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-tenderhub-navy">
                    Supporting documents
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Your required registration and tax
                    documents will be collected through the
                    vendor compliance process after your
                    business profile is created.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* STEP 3 */}
        {currentStep === 3 && (
          <section className="space-y-6">
            <div>
              <p className="text-sm font-medium text-tenderhub-gold">
                Step 3
              </p>

              <h2 className="mt-1 text-xl font-bold text-tenderhub-navy">
                Business Operations
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Tell us about the size and operating footprint
                of your business.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <Input
                label="Number of Employees"
                type="number"
                min="0"
                step="1"
                value={values.numberOfEmployees}
                onChange={(event) =>
                  updateField(
                    "numberOfEmployees",
                    event.target.value,
                  )
                }
                placeholder="e.g. 25"
                disabled={submitting}
              />

              <Input
                label="Years Operating"
                type="number"
                min="0"
                step="1"
                value={values.yearsOperating}
                onChange={(event) =>
                  updateField(
                    "yearsOperating",
                    event.target.value,
                  )
                }
                placeholder="e.g. 10"
                disabled={submitting}
              />

              <div className="md:col-span-2">
                <label
                  htmlFor="vendor-operating-locations"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Operating Locations
                </label>

                <textarea
                  id="vendor-operating-locations"
                  value={values.operatingLocations}
                  onChange={(event) =>
                    updateField(
                      "operatingLocations",
                      event.target.value,
                    )
                  }
                  placeholder="List the countries, regions, or locations where the business operates"
                  rows={5}
                  disabled={submitting}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>
            </div>
          </section>
        )}

        {/* STEP 4 */}
        {currentStep === 4 && (
          <section className="space-y-6">
            <div>
              <p className="text-sm font-medium text-tenderhub-gold">
                Step 4
              </p>

              <h2 className="mt-1 text-xl font-bold text-tenderhub-navy">
                Experience & Capabilities
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Help procuring organizations understand what
                your business can deliver.
              </p>
            </div>

            <div>
              <label
                htmlFor="vendor-portfolio-description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Portfolio & Experience
              </label>

              <textarea
                id="vendor-portfolio-description"
                value={values.portfolioDescription}
                onChange={(event) =>
                  updateField(
                    "portfolioDescription",
                    event.target.value,
                  )
                }
                placeholder="Describe relevant projects, capabilities, products, services, previous contracts, certifications, and industry experience."
                rows={10}
                disabled={submitting}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Business
                </p>

                <p className="mt-1 text-sm font-semibold text-tenderhub-navy">
                  {values.companyName ||
                    "Not provided"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Registration
                </p>

                <p className="mt-1 text-sm font-semibold text-tenderhub-navy">
                  {values.registrationNumber ||
                    "Not provided"}
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Experience
                </p>

                <p className="mt-1 text-sm font-semibold text-tenderhub-navy">
                  {values.yearsOperating
                    ? `${values.yearsOperating} years`
                    : "Not provided"}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* STEP 5 */}
        {currentStep === 5 && (
          <section className="space-y-6">
            <div>
              <p className="text-sm font-medium text-tenderhub-gold">
                Step 5
              </p>

              <h2 className="mt-1 text-xl font-bold text-tenderhub-navy">
                Review Your Application
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Review the information below before creating
                your vendor onboarding application.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <ReviewItem
                label="Company Name"
                value={values.companyName}
              />

              <ReviewItem
                label="Legal Name"
                value={values.legalName}
              />

              <ReviewItem
                label="Business Email"
                value={values.email}
              />

              <ReviewItem
                label="Phone"
                value={values.phone}
              />

              <ReviewItem
                label="Registration Number"
                value={values.registrationNumber}
              />

              <ReviewItem
                label="Tax Number"
                value={values.taxNumber}
              />

              <ReviewItem
                label="Business Type"
                value={
                  businessTypeOptions.find(
                    (option) =>
                      option.value ===
                      values.businessType,
                  )?.label ||
                  values.businessType
                }
              />

              <ReviewItem
                label="Country"
                value={
                  countryOptions.find(
                    (option) =>
                      option.value ===
                      values.countryId,
                  )?.label ||
                  values.countryId
                }
              />

              <ReviewItem
                label="Number of Employees"
                value={values.numberOfEmployees}
              />

              <ReviewItem
                label="Years Operating"
                value={values.yearsOperating}
              />

              <div className="md:col-span-2">
                <ReviewItem
                  label="Business Address"
                  value={values.address}
                />
              </div>

              <div className="md:col-span-2">
                <ReviewItem
                  label="Company Description"
                  value={values.description}
                />
              </div>

              <div className="md:col-span-2">
                <ReviewItem
                  label="Operating Locations"
                  value={values.operatingLocations}
                />
              </div>

              <div className="md:col-span-2">
                <ReviewItem
                  label="Portfolio & Experience"
                  value={values.portfolioDescription}
                />
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-sm font-semibold text-amber-900">
                What happens next?
              </h3>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                Submitting this form creates your vendor
                onboarding profile. TenderHub verification
                requirements and supporting evidence are
                handled separately. Your account will not be
                treated as an approved vendor until the
                required verification process has been
                completed.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {onCancel && currentStep === 1 && (
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}

          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={goBack}
            >
              Back
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {currentStep < steps.length && (
            <Button
              type="button"
              variant="primary"
              disabled={submitting}
              onClick={goNext}
            >
              Continue
            </Button>
          )}

          {currentStep === steps.length && (
            <Button
              type="submit"
              variant="primary"
              disabled={submitting}
            >
              {submitting
                ? "Submitting..."
                : submitLabel}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}

function ReviewItem({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-gray-900">
        {value?.trim() || "Not provided"}
      </p>
    </div>
  );
}