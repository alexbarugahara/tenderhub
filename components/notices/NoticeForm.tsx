"use client";

import React, { FormEvent, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

export interface NoticeFormValues {
  title: string;
  content: string;
  noticeType: string;
  publishedAt: string;
  expiresAt: string;
  solicitationId: string;
}

export interface NoticeFormProps {
  initialValues?: Partial<NoticeFormValues>;
  noticeTypeOptions?: Array<{
    value: string;
    label: string;
  }>;
  solicitationOptions?: Array<{
    value: string;
    label: string;
  }>;
  submitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onSubmit?: (
    values: NoticeFormValues,
  ) => void | Promise<void>;
  onCancel?: () => void;
  className?: string;
}

const defaultValues: NoticeFormValues = {
  title: "",
  content: "",
  noticeType: "",
  publishedAt: "",
  expiresAt: "",
  solicitationId: "",
};

export default function NoticeForm({
  initialValues,
  noticeTypeOptions = [],
  solicitationOptions = [],
  submitting = false,
  error = null,
  submitLabel = "Save Notice",
  onSubmit,
  onCancel,
  className = "",
}: NoticeFormProps) {
  const [values, setValues] =
    useState<NoticeFormValues>({
      ...defaultValues,
      ...initialValues,
    });

  const [formError, setFormError] =
    useState<string | null>(null);

  function updateField(
    field: keyof NoticeFormValues,
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

  function validate(): string | null {
    if (!values.title.trim()) {
      return "Notice title is required.";
    }

    if (!values.content.trim()) {
      return "Notice content is required.";
    }

    return null;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationError = validate();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!onSubmit) {
      return;
    }

    setFormError(null);

    try {
      await onSubmit({
        title: values.title.trim(),
        content: values.content.trim(),
        noticeType: values.noticeType,
        publishedAt: values.publishedAt,
        expiresAt: values.expiresAt,
        solicitationId: values.solicitationId,
      });
    } catch (submissionError) {
      setFormError(
        submissionError instanceof Error
          ? submissionError.message
          : "The notice could not be saved.",
      );
    }
  }

  return (
    <Card className={className}>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        <div>
          <h2 className="text-lg font-semibold text-tenderhub-navy">
            Notice Information
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Create or update a procurement notice.
          </p>
        </div>

        {(error || formError) && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {formError ?? error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Input
            label="Notice Title"
            value={values.title}
            onChange={(event) =>
              updateField(
                "title",
                event.target.value,
              )
            }
            placeholder="Enter notice title"
            required
            disabled={submitting}
          />

          {noticeTypeOptions.length > 0 ? (
            <div>
              <label
                htmlFor="notice-type"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Notice Type
              </label>

              <select
                id="notice-type"
                value={values.noticeType}
                onChange={(event) =>
                  updateField(
                    "noticeType",
                    event.target.value,
                  )
                }
                disabled={submitting}
                className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  Select notice type
                </option>

                {noticeTypeOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <Input
              label="Notice Type"
              value={values.noticeType}
              onChange={(event) =>
                updateField(
                  "noticeType",
                  event.target.value,
                )
              }
              placeholder="e.g. General Notice"
              disabled={submitting}
            />
          )}
        </div>

        {solicitationOptions.length > 0 && (
          <div>
            <label
              htmlFor="notice-solicitation"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Related Solicitation
            </label>

            <select
              id="notice-solicitation"
              value={values.solicitationId}
              onChange={(event) =>
                updateField(
                  "solicitationId",
                  event.target.value,
                )
              }
              disabled={submitting}
              className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">
                No related solicitation
              </option>

              {solicitationOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label
            htmlFor="notice-content"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Notice Content
          </label>

          <textarea
            id="notice-content"
            value={values.content}
            onChange={(event) =>
              updateField(
                "content",
                event.target.value,
              )
            }
            placeholder="Write the notice content..."
            rows={8}
            required
            disabled={submitting}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm leading-6 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
          />

          <p className="mt-1 text-xs text-gray-500">
            Provide clear and complete information for
            recipients.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="notice-published-at"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Publication Date
            </label>

            <input
              id="notice-published-at"
              type="datetime-local"
              value={values.publishedAt}
              onChange={(event) =>
                updateField(
                  "publishedAt",
                  event.target.value,
                )
              }
              disabled={submitting}
              className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>

          <div>
            <label
              htmlFor="notice-expires-at"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Expiry Date
            </label>

            <input
              id="notice-expires-at"
              type="datetime-local"
              value={values.expiresAt}
              onChange={(event) =>
                updateField(
                  "expiresAt",
                  event.target.value,
                )
              }
              disabled={submitting}
              className="block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none transition focus:border-tenderhub-gold focus:ring-2 focus:ring-tenderhub-gold/20 disabled:cursor-not-allowed disabled:bg-gray-100"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              disabled={submitting}
              onClick={onCancel}
            >
              Cancel
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
    </Card>
  );
}