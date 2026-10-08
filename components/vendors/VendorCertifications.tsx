"use client";

import React, { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export interface VendorCertificationData {
  id: string;
  name: string;
  issuingOrganization?: string | null;
  certificateNumber?: string | null;
  issuedAt?: string | Date | null;
  expiresAt?: string | Date | null;
  documentUrl?: string | null;
  status?: string | null;
}

export interface VendorCertificationValues {
  name: string;
  issuingOrganization: string;
  certificateNumber: string;
  issuedAt: string;
  expiresAt: string;
  documentUrl: string;
}

export interface VendorCertificationsProps {
  certifications?: VendorCertificationData[];
  loading?: boolean;
  submitting?: boolean;
  canManage?: boolean;
  error?: string | null;
  onAdd?: (
    values: VendorCertificationValues,
  ) => void | Promise<void>;
  onEdit?: (
    certification: VendorCertificationData,
  ) => void;
  onDelete?: (
    certification: VendorCertificationData,
  ) => void | Promise<void>;
  onViewDocument?: (
    certification: VendorCertificationData,
  ) => void;
  className?: string;
}

const emptyValues: VendorCertificationValues = {
  name: "",
  issuingOrganization: "",
  certificateNumber: "",
  issuedAt: "",
  expiresAt: "",
  documentUrl: "",
};

function formatDate(
  value?: string | Date | null,
): string {
  if (!value) {
    return "Not provided";
  }

  const date =
    value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not provided";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getStatus(
  certification: VendorCertificationData,
): string {
  if (certification.status) {
    return certification.status;
  }

  if (certification.expiresAt) {
    const expiry =
      certification.expiresAt instanceof Date
        ? certification.expiresAt
        : new Date(certification.expiresAt);

    if (!Number.isNaN(expiry.getTime())) {
      if (expiry.getTime() < Date.now()) {
        return "EXPIRED";
      }

      const thirtyDays =
        30 * 24 * 60 * 60 * 1000;

      if (
        expiry.getTime() - Date.now() <=
        thirtyDays
      ) {
        return "EXPIRING";
      }
    }
  }

  return "ACTIVE";
}

function getStatusVariant(
  status: string,
): "success" | "warning" | "danger" | "default" {
  const normalized = status.toUpperCase();

  if (
    normalized === "ACTIVE" ||
    normalized === "VALID" ||
    normalized === "APPROVED"
  ) {
    return "success";
  }

  if (
    normalized === "EXPIRING" ||
    normalized === "PENDING" ||
    normalized === "UNDER_REVIEW"
  ) {
    return "warning";
  }

  if (
    normalized === "EXPIRED" ||
    normalized === "REJECTED" ||
    normalized === "INVALID"
  ) {
    return "danger";
  }

  return "default";
}

function formatStatus(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

export default function VendorCertifications({
  certifications = [],
  loading = false,
  submitting = false,
  canManage = true,
  error = null,
  onAdd,
  onEdit,
  onDelete,
  onViewDocument,
  className = "",
}: VendorCertificationsProps) {
  const [showForm, setShowForm] = useState(false);
  const [values, setValues] =
    useState<VendorCertificationValues>(
      emptyValues,
    );
  const [formError, setFormError] =
    useState<string | null>(null);

  function updateField(
    field: keyof VendorCertificationValues,
    value: string,
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));

    if (formError) {
      setFormError(null);
    }
  }

  function validateForm(): string | null {
    if (!values.name.trim()) {
      return "Certification name is required.";
    }

    if (
      values.issuedAt &&
      values.expiresAt &&
      new Date(values.expiresAt).getTime() <
        new Date(values.issuedAt).getTime()
    ) {
      return "The expiry date cannot be earlier than the issue date.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    if (!onAdd) {
      return;
    }

    setFormError(null);

    try {
      await onAdd({
        name: values.name.trim(),
        issuingOrganization:
          values.issuingOrganization.trim(),
        certificateNumber:
          values.certificateNumber.trim(),
        issuedAt: values.issuedAt,
        expiresAt: values.expiresAt,
        documentUrl: values.documentUrl.trim(),
      });

      setValues(emptyValues);
      setShowForm(false);
    } catch (submissionError) {
      setFormError(
        submissionError instanceof Error
          ? submissionError.message
          : "The certification could not be saved.",
      );
    }
  }

  function handleCancel() {
    setValues(emptyValues);
    setFormError(null);
    setShowForm(false);
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-tenderhub-navy">
              Certifications
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage professional, industry, and other certifications
              associated with this vendor.
            </p>
          </div>

          {canManage && onAdd && !showForm && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              Add Certification
            </Button>
          )}
        </div>

        {showForm && canManage && (
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-6">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-gray-900">
                Add Certification
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Enter the certification details below.
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              >
                {formError}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-5"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Input
                  label="Certification Name"
                  value={values.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="e.g. ISO 9001"
                  required
                  disabled={submitting}
                />

                <Input
                  label="Issuing Organization"
                  value={values.issuingOrganization}
                  onChange={(event) =>
                    updateField(
                      "issuingOrganization",
                      event.target.value,
                    )
                  }
                  placeholder="Enter issuing organization"
                  disabled={submitting}
                />

                <Input
                  label="Certificate Number"
                  value={values.certificateNumber}
                  onChange={(event) =>
                    updateField(
                      "certificateNumber",
                      event.target.value,
                    )
                  }
                  placeholder="Enter certificate number"
                  disabled={submitting}
                />

                <Input
                  label="Issued Date"
                  type="date"
                  value={values.issuedAt}
                  onChange={(event) =>
                    updateField(
                      "issuedAt",
                      event.target.value,
                    )
                  }
                  disabled={submitting}
                />

                <Input
                  label="Expiry Date"
                  type="date"
                  value={values.expiresAt}
                  onChange={(event) =>
                    updateField(
                      "expiresAt",
                      event.target.value,
                    )
                  }
                  disabled={submitting}
                />

                <Input
                  label="Document URL"
                  type="url"
                  value={values.documentUrl}
                  onChange={(event) =>
                    updateField(
                      "documentUrl",
                      event.target.value,
                    )
                  }
                  placeholder="https://..."
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
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
                  {submitting
                    ? "Saving..."
                    : "Save Certification"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[220px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : certifications.length === 0 ? (
          <div className="px-6 py-10">
            <EmptyState
              title="No certifications"
              description="No vendor certifications have been added yet."
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {certifications.map((certification) => {
              const status = getStatus(certification);

              return (
                <div
                  key={certification.id}
                  className="px-6 py-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-gray-900">
                          {certification.name}
                        </h3>

                        <Badge
                          variant={getStatusVariant(
                            status,
                          )}
                        >
                          {formatStatus(status)}
                        </Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-sm text-gray-600 sm:grid-cols-2">
                        <p>
                          <span className="font-medium text-gray-800">
                            Issuing organization:
                          </span>{" "}
                          {certification.issuingOrganization ||
                            "Not provided"}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            Certificate number:
                          </span>{" "}
                          {certification.certificateNumber ||
                            "Not provided"}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            Issued:
                          </span>{" "}
                          {formatDate(
                            certification.issuedAt,
                          )}
                        </p>

                        <p>
                          <span className="font-medium text-gray-800">
                            Expires:
                          </span>{" "}
                          {formatDate(
                            certification.expiresAt,
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {certification.documentUrl &&
                        onViewDocument && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              onViewDocument(
                                certification,
                              )
                            }
                          >
                            View Document
                          </Button>
                        )}

                      {canManage && onEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onEdit(certification)
                          }
                        >
                          Edit
                        </Button>
                      )}

                      {canManage && onDelete && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            onDelete(certification)
                          }
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}