"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Clock3, Upload } from "lucide-react";
import { $Enums } from "@prisma/client";

type DocumentCategory = $Enums.DocumentCategory;

type VendorRequirement = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  required: boolean;
  active: boolean;
  validityDays: number | null;
  allowedDocumentCategories: DocumentCategory[];
};

type VendorDocumentUploadFormProps = {
  vendorId: string;
  requirements: VendorRequirement[];
};

const DOCUMENT_CATEGORY_LABELS: Record<
  DocumentCategory,
  string
> = {
  COMPANY_REGISTRATION_CERTIFICATE:
    "Company Registration Certificate",

  CERTIFICATE_OF_INCORPORATION:
    "Certificate of Incorporation",

  TAX_IDENTIFICATION_CERTIFICATE:
    "Tax Identification Certificate",

  TAX_CLEARANCE_CERTIFICATE:
    "Tax Clearance Certificate",

  TRADING_LICENSE:
    "Trading License",

  COMPANY_PROFILE:
    "Company Profile",

  TECHNICAL_PROPOSAL:
    "Technical Proposal",

  FINANCIAL_PROPOSAL:
    "Financial Proposal",

  WORK_PLAN:
    "Work Plan",

  METHODOLOGY:
    "Methodology",

  EXPERIENCE_CERTIFICATES:
    "Experience Certificates",

  PREVIOUS_CONTRACTS:
    "Previous Contracts",

  KEY_PERSONNEL_CV:
    "Key Personnel CV",

  PROFESSIONAL_CERTIFICATIONS:
    "Professional Certification",

  QUALITY_CERTIFICATE:
    "Quality Certificate",

  INSURANCE_CERTIFICATE:
    "Insurance Certificate",

  BANK_ACCOUNT_CONFIRMATION:
    "Bank Account Confirmation",

  FINANCIAL_STATEMENTS:
    "Financial Statements",

  BID_SECURITY:
    "Bid Security",

  MANUFACTURER_AUTHORIZATION:
    "Manufacturer Authorization",

  REFERENCES:
    "References",

  SOLICITATION_DOCUMENT:
    "Solicitation Document",

  CONTRACT_DOCUMENT:
    "Contract Document",

  AWARD_DOCUMENT:
    "Award Document",

  OTHER:
    "Other Document",
};

function getDocumentCategoryLabel(
  category: DocumentCategory,
) {
  return (
    DOCUMENT_CATEGORY_LABELS[category] ??
    category.replace(/_/g, " ")
  );
}

export default function VendorDocumentUploadForm({
  vendorId,
  requirements,
}: VendorDocumentUploadFormProps) {
  const [requirementId, setRequirementId] =
    useState("");

  const [documentCategory, setDocumentCategory] =
    useState<DocumentCategory | "">("");

  const selectedRequirement = useMemo(
    () =>
      requirements.find(
        (requirement) =>
          requirement.id === requirementId,
      ),
    [requirements, requirementId],
  );

  /*
   * Only document categories explicitly configured
   * by the administrator for the selected requirement
   * are available to the vendor.
   */
  const allowedDocumentCategories =
    selectedRequirement?.allowedDocumentCategories ?? [];

  function handleRequirementChange(
    value: string,
  ) {
    setRequirementId(value);

    /*
     * Clear the previous document category whenever
     * the verification requirement changes.
     *
     * This prevents a document category belonging to
     * one requirement from being submitted against
     * another requirement.
     */
    setDocumentCategory("");
  }

  return (
    <form
      action={`/api/vendors/${vendorId}/documents`}
      method="POST"
      encType="multipart/form-data"
      className="space-y-5"
    >
      {/* =========================================================
          VERIFICATION REQUIREMENT
          ========================================================= */}
      <div>
        <label
          htmlFor="requirementId"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Verification Requirement
        </label>

        <select
          id="requirementId"
          name="requirementId"
          required
          value={requirementId}
          onChange={(event) =>
            handleRequirementChange(
              event.target.value,
            )
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 outline-none transition focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
        >
          <option value="" disabled>
            Select a requirement
          </option>

          {requirements.map((requirement) => (
            <option
              key={requirement.id}
              value={requirement.id}
            >
              {requirement.name}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs text-gray-500">
          Only requirements assigned to your TenderHub
          verification profile are shown here.
        </p>
      </div>

      {/* =========================================================
          REQUIREMENT DESCRIPTION
          ========================================================= */}
      {selectedRequirement?.description && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Requirement
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-900">
            {selectedRequirement.description}
          </p>
        </div>
      )}

      {/* =========================================================
          DOCUMENT NAME
          ========================================================= */}
      <div>
        <label
          htmlFor="documentCategory"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Document Name
        </label>

        <select
          id="documentCategory"
          name="documentCategory"
          required
          value={documentCategory}
          onChange={(event) =>
            setDocumentCategory(
              event.target.value as DocumentCategory,
            )
          }
          disabled={
            !selectedRequirement ||
            allowedDocumentCategories.length === 0
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-800 outline-none transition disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
        >
          <option value="">
            {!selectedRequirement
              ? "Select a verification requirement first"
              : allowedDocumentCategories.length === 0
                ? "No document categories configured"
                : "Select a document"}
          </option>

          {allowedDocumentCategories.map(
            (category) => (
              <option
                key={category}
                value={category}
              >
                {getDocumentCategoryLabel(category)}
              </option>
            ),
          )}
        </select>

        <p className="mt-2 text-xs text-gray-500">
          Select the document that satisfies the selected
          verification requirement.
        </p>

        {selectedRequirement &&
          allowedDocumentCategories.length === 0 && (
            <p className="mt-2 text-xs font-medium text-red-600">
              No document categories have been configured
              for this requirement. Please contact the
              TenderHub administrator.
            </p>
          )}
      </div>

      {/* =========================================================
          SELECTED DOCUMENT
          ========================================================= */}
      {selectedRequirement &&
        documentCategory && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />

              <div>
                <p className="text-sm font-semibold text-green-900">
                  Document selected
                </p>

                <p className="mt-1 text-sm text-green-800">
                  {getDocumentCategoryLabel(
                    documentCategory,
                  )}
                </p>

                <p className="mt-1 text-xs text-green-700">
                  This document will be submitted against{" "}
                  <span className="font-semibold">
                    {selectedRequirement.name}
                  </span>
                  .
                </p>
              </div>
            </div>
          </div>
        )}

      {/* =========================================================
          FILE
          ========================================================= */}
      <div>
        <label
          htmlFor="file"
          className="mb-2 block text-sm font-semibold text-gray-700"
        >
          Document File
        </label>

        <input
          id="file"
          name="file"
          type="file"
          required
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
          className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-white text-sm text-gray-600 file:mr-4 file:border-0 file:bg-tenderhub-navy file:px-4 file:py-3 file:text-sm file:font-medium file:text-white hover:file:opacity-90"
        />

        <p className="mt-2 text-xs text-gray-500">
          PDF, Word, Excel, JPG, PNG or WebP. Maximum 10
          MB.
        </p>
      </div>

      {/* =========================================================
          DATES
          ========================================================= */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="issueDate"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Issue Date
          </label>

          <input
            id="issueDate"
            name="issueDate"
            type="date"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
          />

          <p className="mt-2 text-xs text-gray-500">
            Optional.
          </p>
        </div>

        <div>
          <label
            htmlFor="expiryDate"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Expiry Date
          </label>

          <input
            id="expiryDate"
            name="expiryDate"
            type="date"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm outline-none transition focus:border-tenderhub-navy focus:ring-2 focus:ring-tenderhub-navy/10"
          />

          <p className="mt-2 text-xs text-gray-500">
            Optional. Use the actual expiry date where
            applicable.
          </p>
        </div>
      </div>

      {/* =========================================================
          VERIFICATION NOTICE
          ========================================================= */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />

          <div>
            <p className="text-sm font-semibold text-blue-900">
              Administrator verification
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-800">
              Uploaded documents are initially marked as
              pending. An authorized TenderHub administrator
              will review the evidence before it becomes
              approved.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================
          ACTIONS
          ========================================================= */}
      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
        <Link
          href="/dashboard/vendor/documents"
          className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button
          type="submit"
          disabled={
            !requirementId ||
            !documentCategory ||
            allowedDocumentCategories.length === 0
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-tenderhub-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </button>
      </div>
    </form>
  );
}