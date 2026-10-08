"use client";

import React, { FormEvent, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export interface DepartmentData {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
}

export interface DepartmentValues {
  name: string;
  code: string;
  description: string;
}

export interface DepartmentManagerProps {
  departments?: DepartmentData[];
  loading?: boolean;
  submitting?: boolean;
  canManage?: boolean;
  error?: string | null;
  onCreate?: (
    values: DepartmentValues,
  ) => void | Promise<void>;
  onEdit?: (department: DepartmentData) => void;
  onDelete?: (
    department: DepartmentData,
  ) => void | Promise<void>;
  className?: string;
}

const defaultValues: DepartmentValues = {
  name: "",
  code: "",
  description: "",
};

export default function DepartmentManager({
  departments = [],
  loading = false,
  submitting = false,
  canManage = true,
  error = null,
  onCreate,
  onEdit,
  onDelete,
  className = "",
}: DepartmentManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [values, setValues] =
    useState<DepartmentValues>(defaultValues);
  const [formError, setFormError] =
    useState<string | null>(null);

  function updateField(
    field: keyof DepartmentValues,
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

  function resetForm() {
    setValues(defaultValues);
    setFormError(null);
    setShowForm(false);
  }

  function validate(): string | null {
    if (!values.name.trim()) {
      return "Department name is required.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage = validate();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    if (!onCreate) {
      return;
    }

    setFormError(null);

    try {
      await onCreate({
        name: values.name.trim(),
        code: values.code.trim(),
        description: values.description.trim(),
      });

      resetForm();
    } catch (submissionError) {
      setFormError(
        submissionError instanceof Error
          ? submissionError.message
          : "The department could not be created.",
      );
    }
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
              Departments
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Organize procurement activities by department.
            </p>
          </div>

          {canManage && onCreate && !showForm && (
            <Button
              type="button"
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              Add Department
            </Button>
          )}
        </div>

        {showForm && canManage && (
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-6">
            <div className="mb-5">
              <h3 className="text-base font-semibold text-gray-900">
                Add Department
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Enter the department information below.
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
                  label="Department Name"
                  value={values.name}
                  onChange={(event) =>
                    updateField(
                      "name",
                      event.target.value,
                    )
                  }
                  placeholder="e.g. Procurement"
                  required
                  disabled={submitting}
                />

                <Input
                  label="Department Code"
                  value={values.code}
                  onChange={(event) =>
                    updateField(
                      "code",
                      event.target.value,
                    )
                  }
                  placeholder="e.g. PROC"
                  disabled={submitting}
                />
              </div>

              <div>
                <label
                  htmlFor="department-description"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Description
                </label>

                <textarea
                  id="department-description"
                  value={values.description}
                  onChange={(event) =>
                    updateField(
                      "description",
                      event.target.value,
                    )
                  }
                  placeholder="Describe the department and its responsibilities"
                  rows={4}
                  disabled={submitting}
                  className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={submitting}
                  onClick={resetForm}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                >
                  {submitting
                    ? "Creating..."
                    : "Create Department"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[240px] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : departments.length === 0 ? (
          <div className="px-6 py-10">
            <EmptyState
              title="No departments"
              description="No departments have been created for this organization yet."
            />
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {departments.map((department) => (
              <div
                key={department.id}
                className="px-6 py-5 transition hover:bg-gray-50"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {department.name}
                      </h3>

                      {department.code && (
                        <Badge variant="default">
                          {department.code}
                        </Badge>
                      )}
                    </div>

                    {department.description && (
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                        {department.description}
                      </p>
                    )}
                  </div>

                  {canManage && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {onEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onEdit(department)
                          }
                        >
                          Edit
                        </Button>
                      )}

                      {onDelete && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            onDelete(department)
                          }
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}