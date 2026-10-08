"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type DocumentStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

type CheckStatus =
  | "PENDING"
  | "PASSED"
  | "FAILED"
  | "NEEDS_INFORMATION"
  | "NOT_APPLICABLE";

type OrganizationType =
  | "GOVERNMENT"
  | "LOCAL_GOVERNMENT"
  | "NGO"
  | "INTERNATIONAL_NGO"
  | "PRIVATE_COMPANY"
  | "SCHOOL_UNIVERSITY"
  | "HOSPITAL"
  | "BANK_FINANCIAL_INSTITUTION"
  | "DEVELOPMENT_AGENCY"
  | "OTHER";

type DocumentCategory =
  | "CERTIFICATE_OF_INCORPORATION"
  | "ARTICLES_OF_INCORPORATION"
  | "CERTIFICATE_OF_FORMATION"
  | "BUSINESS_REGISTRATION"
  | "CERTIFICATE_OF_GOOD_STANDING"
  | "TAX_IDENTIFICATION"
  | "TAX_CLEARANCE"
  | "BUSINESS_LICENSE"
  | "PROOF_OF_ADDRESS"
  | "AUTHORIZED_REPRESENTATIVE_ID"
  | "AUTHORIZATION_LETTER"
  | "OWNERSHIP_INFORMATION"
  | "BENEFICIAL_OWNERSHIP"
  | "GOVERNMENT_REGISTRATION"
  | "UEI_DOCUMENT"
  | "SAM_REGISTRATION"
  | "PROFESSIONAL_LICENSE"
  | "INSURANCE_CERTIFICATE"
  | "COMPANY_PROFILE"
  | "OTHER";

type VerificationCheck = {
  id: string;
  code: string;
  name: string;
  category: string;
  description?: string | null;
  required: boolean;
  status: CheckStatus;
  documentId?: string | null;
  checkedAt?: string | null;
  notes?: string | null;
};

type OrganizationDocument = {
  id: string;
  name: string;
  category: DocumentCategory;
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: number | null;
  status: DocumentStatus;
  uploadedAt: string;
  updatedAt: string;
  rejectionReason?: string | null;
  expiryDate?: string | null;
};

type Organization = {
  id: string;
  name: string;
  legalName?: string | null;
  type?: OrganizationType | null;
  email?: string | null;
  registrationNumber?: string | null;
  address?: string | null;
};

type Verification = {
  id: string;
  status: string;
  submittedAt?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  adminNotes?: string | null;
  checks: VerificationCheck[];
};

type VerificationResponse = {
  organization: Organization;
  verification: Verification | null;
  documents: OrganizationDocument[];
};

const ORGANIZATION_TYPES: Array<{
  value: OrganizationType;
  label: string;
}> = [
  {
    value: "GOVERNMENT",
    label: "Government",
  },
  {
    value: "LOCAL_GOVERNMENT",
    label: "Local Government",
  },
  {
    value: "NGO",
    label: "NGO",
  },
  {
    value: "INTERNATIONAL_NGO",
    label: "International NGO",
  },
  {
    value: "PRIVATE_COMPANY",
    label: "Private Company",
  },
  {
    value: "SCHOOL_UNIVERSITY",
    label: "School / University",
  },
  {
    value: "HOSPITAL",
    label: "Hospital",
  },
  {
    value: "BANK_FINANCIAL_INSTITUTION",
    label: "Bank / Financial Institution",
  },
  {
    value: "DEVELOPMENT_AGENCY",
    label: "Development Agency",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

const DOCUMENT_CATEGORIES: Array<{
  value: DocumentCategory;
  label: string;
}> = [
  {
    value: "BUSINESS_REGISTRATION",
    label: "Business Registration",
  },
  {
    value: "CERTIFICATE_OF_INCORPORATION",
    label: "Certificate of Incorporation",
  },
  {
    value: "CERTIFICATE_OF_FORMATION",
    label: "Certificate of Formation",
  },
  {
    value: "ARTICLES_OF_INCORPORATION",
    label: "Articles of Incorporation",
  },
  {
    value: "GOVERNMENT_REGISTRATION",
    label: "Government Registration",
  },
  {
    value: "CERTIFICATE_OF_GOOD_STANDING",
    label: "Certificate of Good Standing",
  },
  {
    value: "TAX_IDENTIFICATION",
    label: "Tax Identification",
  },
  {
    value: "TAX_CLEARANCE",
    label: "Tax Clearance",
  },
  {
    value: "PROOF_OF_ADDRESS",
    label: "Proof of Address",
  },
  {
    value: "AUTHORIZED_REPRESENTATIVE_ID",
    label: "Authorized Representative ID",
  },
  {
    value: "AUTHORIZATION_LETTER",
    label: "Authorization Letter",
  },
  {
    value: "OWNERSHIP_INFORMATION",
    label: "Ownership Information",
  },
  {
    value: "BENEFICIAL_OWNERSHIP",
    label: "Beneficial Ownership",
  },
  {
    value: "BUSINESS_LICENSE",
    label: "Business License",
  },
  {
    value: "PROFESSIONAL_LICENSE",
    label: "Professional License",
  },
  {
    value: "UEI_DOCUMENT",
    label: "UEI Document",
  },
  {
    value: "SAM_REGISTRATION",
    label: "SAM Registration",
  },
  {
    value: "INSURANCE_CERTIFICATE",
    label: "Insurance Certificate",
  },
  {
    value: "COMPANY_PROFILE",
    label: "Company Profile",
  },
  {
    value: "OTHER",
    label: "Other",
  },
];

/*
 * Which requirements are supported by each document.
 */
const DOCUMENT_REQUIREMENT_MAP: Record<
  DocumentCategory,
  string[]
> = {
  BUSINESS_REGISTRATION: [
    "LEGAL_NAME",
    "ORGANIZATION_TYPE",
    "REGISTRATION_NUMBER",
    "REGISTRATION_DOCUMENT",
  ],

  CERTIFICATE_OF_INCORPORATION: [
    "LEGAL_NAME",
    "ORGANIZATION_TYPE",
    "REGISTRATION_NUMBER",
    "REGISTRATION_DOCUMENT",
  ],

  CERTIFICATE_OF_FORMATION: [
    "LEGAL_NAME",
    "ORGANIZATION_TYPE",
    "REGISTRATION_NUMBER",
    "REGISTRATION_DOCUMENT",
  ],

  ARTICLES_OF_INCORPORATION: [
    "LEGAL_NAME",
    "ORGANIZATION_TYPE",
    "REGISTRATION_DOCUMENT",
  ],

  GOVERNMENT_REGISTRATION: [
    "LEGAL_NAME",
    "ORGANIZATION_TYPE",
    "REGISTRATION_NUMBER",
    "REGISTRATION_DOCUMENT",
  ],

  CERTIFICATE_OF_GOOD_STANDING: [
    "REGISTRATION_DOCUMENT",
  ],

  TAX_IDENTIFICATION: [
    "TAX_IDENTIFICATION",
  ],

  TAX_CLEARANCE: [
    "TAX_IDENTIFICATION",
  ],

  PROOF_OF_ADDRESS: [
    "BUSINESS_ADDRESS",
  ],

  AUTHORIZED_REPRESENTATIVE_ID: [
    "AUTHORIZED_REPRESENTATIVE",
  ],

  AUTHORIZATION_LETTER: [
    "AUTHORIZED_REPRESENTATIVE",
  ],

  OWNERSHIP_INFORMATION: [
    "OWNERSHIP_INFORMATION",
  ],

  BENEFICIAL_OWNERSHIP: [
    "OWNERSHIP_INFORMATION",
  ],

  BUSINESS_LICENSE: [
    "LICENSING",
  ],

  PROFESSIONAL_LICENSE: [
    "LICENSING",
  ],

  UEI_DOCUMENT: [],

  SAM_REGISTRATION: [],

  INSURANCE_CERTIFICATE: [],

  COMPANY_PROFILE: [],

  OTHER: [],
};

/*
 * Which documents TenderHub should suggest for each requirement.
 */
const REQUIREMENT_DOCUMENT_SUGGESTIONS: Record<
  string,
  DocumentCategory[]
> = {
  LEGAL_NAME: [
    "BUSINESS_REGISTRATION",
    "CERTIFICATE_OF_INCORPORATION",
    "CERTIFICATE_OF_FORMATION",
    "GOVERNMENT_REGISTRATION",
  ],

  ORGANIZATION_TYPE: [
    "BUSINESS_REGISTRATION",
    "CERTIFICATE_OF_INCORPORATION",
    "CERTIFICATE_OF_FORMATION",
    "GOVERNMENT_REGISTRATION",
  ],

  REGISTRATION_NUMBER: [
    "BUSINESS_REGISTRATION",
    "CERTIFICATE_OF_INCORPORATION",
    "CERTIFICATE_OF_FORMATION",
    "GOVERNMENT_REGISTRATION",
  ],

  REGISTRATION_DOCUMENT: [
    "BUSINESS_REGISTRATION",
    "CERTIFICATE_OF_INCORPORATION",
    "CERTIFICATE_OF_FORMATION",
    "GOVERNMENT_REGISTRATION",
    "CERTIFICATE_OF_GOOD_STANDING",
  ],

  TAX_IDENTIFICATION: [
    "TAX_IDENTIFICATION",
    "TAX_CLEARANCE",
  ],

  BUSINESS_ADDRESS: [
    "PROOF_OF_ADDRESS",
  ],

  AUTHORIZED_REPRESENTATIVE: [
    "AUTHORIZED_REPRESENTATIVE_ID",
    "AUTHORIZATION_LETTER",
  ],

  OWNERSHIP_INFORMATION: [
    "OWNERSHIP_INFORMATION",
    "BENEFICIAL_OWNERSHIP",
  ],

  LICENSING: [
    "BUSINESS_LICENSE",
    "PROFESSIONAL_LICENSE",
  ],
};

const REQUIREMENT_DESCRIPTIONS: Record<
  string,
  string
> = {
  LEGAL_NAME:
    "Evidence showing the organization's registered legal name.",

  ORGANIZATION_TYPE:
    "Evidence showing the legal or registered nature of the organization.",

  REGISTRATION_NUMBER:
    "Evidence showing the official registration number.",

  REGISTRATION_DOCUMENT:
    "An official registration or incorporation document.",

  TAX_IDENTIFICATION:
    "Evidence showing the organization's tax identification or tax registration.",

  BUSINESS_ADDRESS:
    "A document confirming the organization's registered or operating address.",

  AUTHORIZED_REPRESENTATIVE:
    "Evidence confirming the identity and authority of the person representing the organization.",

  OWNERSHIP_INFORMATION:
    "Evidence showing the organization's ownership or beneficial ownership structure.",

  LICENSING:
    "A business, operating, professional, or sector-specific licence where applicable.",
};

function getDocumentCategoryLabel(
  category: DocumentCategory
) {
  const item = DOCUMENT_CATEGORIES.find(
    (entry) => entry.value === category
  );

  return (
    item?.label ??
    category.replace(/_/g, " ")
  );
}

function getRequirementLabel(code: string) {
  const labels: Record<string, string> = {
    LEGAL_NAME: "Legal business name",
    ORGANIZATION_TYPE: "Organization type",
    REGISTRATION_NUMBER: "Registration number",
    REGISTRATION_DOCUMENT: "Registration document",
    TAX_IDENTIFICATION: "Tax identification",
    BUSINESS_ADDRESS: "Business address",
    AUTHORIZED_REPRESENTATIVE:
      "Authorized representative",
    OWNERSHIP_INFORMATION:
      "Ownership information",
    LICENSING:
      "Business or professional licensing",
    SANCTIONS_SCREENING:
      "Sanctions and exclusion screening",
  };

  return (
    labels[code] ??
    code.replace(/_/g, " ")
  );
}

function getCheckStatusLabel(
  status: CheckStatus
) {
  switch (status) {
    case "PASSED":
      return "Verified";

    case "FAILED":
      return "Failed";

    case "NEEDS_INFORMATION":
      return "Needs information";

    case "NOT_APPLICABLE":
      return "Not applicable";

    default:
      return "Pending verification";
  }
}

function getCheckStatusClass(
  status: CheckStatus
) {
  switch (status) {
    case "PASSED":
      return "border-green-200 bg-green-50 text-green-700";

    case "FAILED":
      return "border-red-200 bg-red-50 text-red-700";

    case "NEEDS_INFORMATION":
      return "border-amber-200 bg-amber-50 text-amber-700";

    case "NOT_APPLICABLE":
      return "border-slate-200 bg-slate-100 text-slate-600";

    default:
      return "border-blue-200 bg-blue-50 text-blue-700";
  }
}

function formatFileSize(
  size?: number | null
) {
  if (!size) {
    return "Unknown size";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(
    1
  )} MB`;
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString();
}

export default function SupportingDocumentsPage() {
  const [data, setData] =
    useState<VerificationResponse | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);

  const [uploadCategory, setUploadCategory] =
    useState<DocumentCategory>(
      "BUSINESS_REGISTRATION"
    );

  const [form, setForm] = useState({
    name: "",
    legalName: "",
    type: "" as OrganizationType | "",
    email: "",
    registrationNumber: "",
    address: "",
  });

  async function loadVerification() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/organization/verification",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to load verification information."
        );
      }

      setData(result);

      setForm({
        name:
          result.organization?.name ??
          "",
        legalName:
          result.organization?.legalName ??
          "",
        type:
          result.organization?.type ??
          "",
        email:
          result.organization?.email ??
          "",
        registrationNumber:
          result.organization
            ?.registrationNumber ??
          "",
        address:
          result.organization?.address ??
          "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load verification information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVerification();
  }, []);

  const documents =
    data?.documents ?? [];

  const checks =
    data?.verification?.checks ?? [];

  const verificationStatus =
    data?.verification?.status ??
    "DRAFT";

  const isLocked =
    verificationStatus ===
      "SUBMITTED" ||
    verificationStatus ===
      "UNDER_REVIEW" ||
    verificationStatus ===
      "APPROVED";

  const hasRegistrationDocument =
    documents.some((document) =>
      [
        "BUSINESS_REGISTRATION",
        "CERTIFICATE_OF_INCORPORATION",
        "CERTIFICATE_OF_FORMATION",
        "GOVERNMENT_REGISTRATION",
      ].includes(
        document.category
      )
    );

  const organizationFieldsComplete =
    Boolean(form.name.trim()) &&
    Boolean(form.legalName.trim()) &&
    Boolean(form.type) &&
    Boolean(form.email.trim()) &&
    Boolean(
      form.registrationNumber.trim()
    ) &&
    Boolean(form.address.trim());

  const canSubmit =
    !isLocked &&
    organizationFieldsComplete &&
    hasRegistrationDocument;

  const documentEvidence =
    useMemo(() => {
      const evidenceMap =
        new Map<
          string,
          OrganizationDocument[]
        >();

      for (const document of documents) {
        const codes =
          DOCUMENT_REQUIREMENT_MAP[
            document.category
          ] ?? [];

        for (const code of codes) {
          const existing =
            evidenceMap.get(code) ??
            [];

          existing.push(document);

          evidenceMap.set(
            code,
            existing
          );
        }
      }

      return evidenceMap;
    }, [documents]);

  /*
   * Select a suggested document type
   * and move the user to the upload area.
   */
  function selectSuggestedDocument(
    category: DocumentCategory
  ) {
    if (isLocked) {
      return;
    }

    setUploadCategory(category);
    setSuccess("");

    window.setTimeout(() => {
      document
        .getElementById(
          "upload-supporting-evidence"
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  async function saveDraft() {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/organization/verification",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "SAVE_DRAFT",
            organization: {
              name: form.name,
              legalName:
                form.legalName,
              type: form.type,
              email: form.email,
              registrationNumber:
                form.registrationNumber,
              address: form.address,
            },
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to save verification details."
        );
      }

      await loadVerification();

      setSuccess(
        "Verification information saved successfully."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to save verification information."
      );
    } finally {
      setSaving(false);
    }
  }

  async function uploadDocument() {
    if (!selectedFile) {
      setError(
        "Please select a document first."
      );
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const formData =
        new FormData();

      formData.append(
        "file",
        selectedFile
      );

      formData.append(
        "category",
        uploadCategory
      );

      const response = await fetch(
        "/api/organization/verification/documents",
        {
          method: "POST",
          body: formData,
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to upload document."
        );
      }

      setSelectedFile(null);

      const input =
        document.getElementById(
          "verification-file"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      setSuccess(
        `${getDocumentCategoryLabel(
          uploadCategory
        )} uploaded successfully. The related verification requirements now show the evidence as received.`
      );

      await loadVerification();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload document."
      );
    } finally {
      setUploading(false);
    }
  }

  async function deleteDocument(
    documentId: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this document?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(documentId);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/organization/verification/documents/${documentId}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to delete document."
        );
      }

      setSuccess(
        "Document deleted successfully."
      );

      await loadVerification();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete document."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function submitVerification() {
    if (!canSubmit) {
      setError(
        "Please complete the required organization information and upload at least one registration document before submitting."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/organization/verification",
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "SUBMIT",
            organization: {
              name: form.name,
              legalName:
                form.legalName,
              type: form.type,
              email: form.email,
              registrationNumber:
                form.registrationNumber,
              address: form.address,
            },
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to submit verification application."
        );
      }

      await loadVerification();

      setSuccess(
        "Verification application submitted successfully. Your evidence is now pending administrator review."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit verification application."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Loading verification documents...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">

        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <Link
            href="/dashboard/organization"
            className="hover:text-slate-900"
          >
            Organization
          </Link>

          <span>/</span>

          <Link
            href="/dashboard/organization/verification"
            className="hover:text-slate-900"
          >
            Verification
          </Link>

          <span>/</span>

          <span className="text-slate-700">
            Supporting Documents
          </span>
        </div>

        {/* Header */}
        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Supporting Documents
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Provide your organization information and upload
            the evidence suggested for your verification requirements.
          </p>
        </div>

        {/* Three-step workflow */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-3">

            <Link
              href="/dashboard/organization/verification/requirements"
              className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step 1
              </div>

              <div className="mt-1 font-semibold text-slate-900">
                Verification Requirements
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Understand what is required.
              </div>
            </Link>

            <Link
              href="/dashboard/organization/verification/administrator-checks"
              className="rounded-lg border border-slate-200 p-4 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Step 2
              </div>

              <div className="mt-1 font-semibold text-slate-900">
                Administrator Checks
              </div>

              <div className="mt-1 text-xs text-slate-500">
                Understand how TenderHub reviews evidence.
              </div>
            </Link>

            <div className="rounded-lg bg-[#071A33] p-4 text-white">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
                Step 3
              </div>

              <div className="mt-1 font-semibold">
                Supporting Documents
              </div>

              <div className="mt-1 text-xs text-slate-300">
                Submit your information and evidence.
              </div>
            </div>

          </div>
        </section>

        {/* Alerts */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-700">
              {success}
            </p>
          </div>
        )}

        {/* Status */}
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Verification application
              </p>

              <p className="mt-1 text-lg font-semibold text-slate-900">
                {verificationStatus.replace(
                  /_/g,
                  " "
                )}
              </p>
            </div>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                verificationStatus ===
                "APPROVED"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : verificationStatus ===
                      "REJECTED"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : verificationStatus ===
                        "NEEDS_INFORMATION"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : verificationStatus ===
                          "UNDER_REVIEW" ||
                        verificationStatus ===
                          "SUBMITTED"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 bg-slate-100 text-slate-700"
              }`}
            >
              {verificationStatus.replace(
                /_/g,
                " "
              )}
            </span>
          </div>

          {data?.verification?.adminNotes && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                Administrator note
              </p>

              <p className="mt-1 text-sm leading-6 text-amber-800">
                {data.verification.adminNotes}
              </p>
            </div>
          )}

          {data?.verification?.rejectionReason && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-900">
                Rejection reason
              </p>

              <p className="mt-1 text-sm leading-6 text-red-800">
                {data.verification.rejectionReason}
              </p>
            </div>
          )}
        </section>

        {/* Organization information */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-slate-900">
            Organization information
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            This information forms part of your verification application.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Organization name
              </label>

              <input
                value={form.name}
                disabled={isLocked}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Legal business name
              </label>

              <input
                value={form.legalName}
                disabled={isLocked}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    legalName: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Organization type
              </label>

              <select
                value={form.type}
                disabled={isLocked}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    type:
                      event.target
                        .value as OrganizationType,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
              >
                <option value="">
                  Select organization type
                </option>

                {ORGANIZATION_TYPES.map(
                  (type) => (
                    <option
                      key={type.value}
                      value={type.value}
                    >
                      {type.label}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Email address
              </label>

              <input
                type="email"
                value={form.email}
                disabled={isLocked}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Registration number
              </label>

              <input
                value={form.registrationNumber}
                disabled={isLocked}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    registrationNumber:
                      event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Business address
              </label>

              <input
                value={form.address}
                disabled={isLocked}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    address: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
              />
            </div>

          </div>

          {!isLocked && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={saveDraft}
                disabled={saving}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : "Save information"}
              </button>
            </div>
          )}
        </section>

        {/* Document suggestions */}
        <section className="mt-8 rounded-xl border border-[#D4AF37]/40 bg-white p-6 shadow-sm">

          <div className="flex flex-wrap items-start justify-between gap-4">

            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Documents suggested for your verification
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                TenderHub identifies the supporting documents that can
                provide evidence for each verification requirement.
              </p>
            </div>

            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Evidence guidance
            </span>

          </div>

          <div className="mt-6 space-y-4">

            {checks.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-5">
                <p className="text-sm text-slate-600">
                  Verification requirements will appear here once the
                  verification application is initialized.
                </p>
              </div>
            ) : (
              checks.map((check) => {
                const evidence =
                  documentEvidence.get(
                    check.code
                  ) ?? [];

                const suggestions =
                  REQUIREMENT_DOCUMENT_SUGGESTIONS[
                    check.code
                  ] ?? [];

                const isVerified =
                  check.status ===
                  "PASSED";

                const isNotApplicable =
                  check.status ===
                  "NOT_APPLICABLE";

                const isMissingEvidence =
                  evidence.length === 0 &&
                  !isNotApplicable;

                return (
                  <div
                    key={check.id}
                    className={`rounded-xl border p-5 ${
                      isVerified
                        ? "border-green-200 bg-green-50/30"
                        : isMissingEvidence
                          ? "border-amber-200 bg-amber-50/30"
                          : "border-slate-200 bg-white"
                    }`}
                  >

                    <div className="flex flex-wrap items-start justify-between gap-4">

                      <div className="max-w-2xl">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-semibold text-slate-900">
                            {check.name ||
                              getRequirementLabel(
                                check.code
                              )}
                          </h3>

                          {check.required && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                              Required
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {check.description ||
                            REQUIREMENT_DESCRIPTIONS[
                              check.code
                            ] ||
                            "Supporting evidence may be required for this verification check."}
                        </p>

                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCheckStatusClass(
                          check.status
                        )}`}
                      >
                        {getCheckStatusLabel(
                          check.status
                        )}
                      </span>

                    </div>

                    {evidence.length > 0 && (
                      <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">

                        <p className="text-sm font-semibold text-green-800">
                          Evidence received
                        </p>

                        <p className="mt-1 text-xs text-green-700">
                          {evidence.length} supporting document
                          {evidence.length ===
                          1
                            ? ""
                            : "s"}{" "}
                          received for this requirement.
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {evidence.map(
                            (document) => (
                              <a
                                key={document.id}
                                href={
                                  document.fileUrl
                                }
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-green-200 bg-white px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50"
                              >
                                {document.name}
                              </a>
                            )
                          )}
                        </div>

                      </div>
                    )}

                    {isMissingEvidence &&
                      suggestions.length > 0 && (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-white p-4">

                          <div className="flex items-start gap-3">

                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                              !
                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="font-semibold text-slate-900">
                                Suggested supporting documents
                              </p>

                              <p className="mt-1 text-sm text-slate-500">
                                Upload one or more of the following
                                documents to provide evidence for this
                                requirement.
                              </p>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2">

                                {suggestions.map(
                                  (category) => (
                                    <div
                                      key={category}
                                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3"
                                    >

                                      <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                          {getDocumentCategoryLabel(
                                            category
                                          )}
                                        </p>

                                        <p className="mt-0.5 text-xs text-slate-500">
                                          Supports{" "}
                                          {getRequirementLabel(
                                            check.code
                                          )}
                                        </p>
                                      </div>

                                      {!isLocked && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            selectSuggestedDocument(
                                              category
                                            )
                                          }
                                          className="rounded-lg bg-[#071A33] px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
                                        >
                                          Upload
                                        </button>
                                      )}

                                    </div>
                                  )
                                )}

                              </div>

                            </div>

                          </div>

                        </div>
                      )}

                    {isMissingEvidence &&
                      suggestions.length === 0 && (
                        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">

                          <p className="text-sm font-semibold text-blue-800">
                            Administrator verification
                          </p>

                          <p className="mt-1 text-sm leading-6 text-blue-700">
                            No organization document is currently suggested
                            for this check. TenderHub administrators will
                            perform this verification as part of the
                            administrator review.
                          </p>

                        </div>
                      )}

                    {check.status ===
                      "NEEDS_INFORMATION" &&
                      check.notes && (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">

                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-900">
                            Additional information requested
                          </p>

                          <p className="mt-1 text-sm leading-6 text-amber-800">
                            {check.notes}
                          </p>

                        </div>
                      )}

                  </div>
                );
              })
            )}

          </div>
        </section>

        {/* Upload section */}
        <section
          id="upload-supporting-evidence"
          className="mt-8 scroll-mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Upload supporting evidence
            </h2>

            <p className="mt-1 text-sm leading-6 text-slate-500">
              Upload a document suggested above or select another document
              type manually.
            </p>
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">

            <div>
              <label className="text-sm font-medium text-slate-700">
                Document type
              </label>

              <select
                value={uploadCategory}
                disabled={
                  isLocked ||
                  uploading
                }
                onChange={(event) =>
                  setUploadCategory(
                    event.target
                      .value as DocumentCategory
                  )
                }
                className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
              >
                {DOCUMENT_CATEGORIES.map(
                  (category) => (
                    <option
                      key={category.value}
                      value={category.value}
                    >
                      {category.label}
                    </option>
                  )
                )}
              </select>

              <p className="mt-2 text-xs text-slate-500">
                Selected:{" "}
                <span className="font-semibold text-slate-700">
                  {getDocumentCategoryLabel(
                    uploadCategory
                  )}
                </span>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                File
              </label>

              <input
                id="verification-file"
                type="file"
                disabled={
                  isLocked ||
                  uploading
                }
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(event) =>
                  setSelectedFile(
                    event.target.files?.[0] ??
                      null
                  )
                }
                className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              />
            </div>

          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">

            <p className="text-xs text-slate-500">
              Maximum file size: 10 MB. Accepted formats:
              PDF, JPG, PNG, DOC and DOCX.
            </p>

            {!isLocked && (
              <button
                type="button"
                onClick={uploadDocument}
                disabled={
                  !selectedFile ||
                  uploading
                }
                className="rounded-lg bg-[#071A33] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading
                  ? "Uploading..."
                  : "Upload document"}
              </button>
            )}

          </div>
        </section>

        {/* Submitted documents */}
        <section className="mt-8">

          <h2 className="text-xl font-semibold text-slate-900">
            Submitted evidence
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Review the documents submitted for this verification
            application.
          </p>

          {documents.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-medium text-slate-700">
                No supporting documents submitted yet.
              </p>

              <p className="mt-1 text-sm text-slate-500">
                TenderHub will suggest the appropriate evidence above.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-5">

              {documents.map(
                (document) => {
                  const requirementCodes =
                    DOCUMENT_REQUIREMENT_MAP[
                      document.category
                    ] ?? [];

                  return (
                    <div
                      key={document.id}
                      className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                    >

                      <div className="flex flex-wrap items-start justify-between gap-4">

                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {document.name}
                          </h3>

                          <div className="mt-2 flex flex-wrap gap-2 text-xs">

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                              {getDocumentCategoryLabel(
                                document.category
                              )}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                              {formatFileSize(
                                document.fileSize
                              )}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 font-medium ${
                                document.status ===
                                "APPROVED"
                                  ? "bg-green-50 text-green-700"
                                  : document.status ===
                                      "REJECTED"
                                    ? "bg-red-50 text-red-700"
                                    : document.status ===
                                        "EXPIRED"
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-blue-50 text-blue-700"
                              }`}
                            >
                              {document.status}
                            </span>

                          </div>

                          <p className="mt-3 text-xs text-slate-400">
                            Uploaded{" "}
                            {formatDate(
                              document.uploadedAt
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">

                          <a
                            href={
                              document.fileUrl
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            View
                          </a>

                          {!isLocked && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteDocument(
                                  document.id
                                )
                              }
                              disabled={
                                deletingId ===
                                document.id
                              }
                              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              {deletingId ===
                              document.id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}

                        </div>
                      </div>

                      {requirementCodes.length >
                        0 && (
                        <div className="mt-6 border-t border-slate-100 pt-5">

                          <h4 className="text-sm font-semibold text-slate-900">
                            Requirements supported by this document
                          </h4>

                          <div className="mt-4 space-y-3">

                            {requirementCodes.map(
                              (code) => {
                                const matchingCheck =
                                  checks.find(
                                    (check) =>
                                      check.code ===
                                      code
                                  );

                                const evidenceDocuments =
                                  documentEvidence.get(
                                    code
                                  ) ?? [];

                                return (
                                  <div
                                    key={code}
                                    className="rounded-lg border border-slate-200 p-4"
                                  >

                                    <div className="flex flex-wrap items-start justify-between gap-3">

                                      <div>
                                        <p className="font-medium text-slate-800">
                                          {getRequirementLabel(
                                            code
                                          )}
                                        </p>

                                        <p className="mt-1 text-xs text-slate-500">
                                          {
                                            evidenceDocuments.length
                                          }{" "}
                                          supporting document
                                          {evidenceDocuments.length ===
                                          1
                                            ? ""
                                            : "s"}{" "}
                                          received
                                        </p>
                                      </div>

                                      {matchingCheck ? (
                                        <span
                                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCheckStatusClass(
                                            matchingCheck.status
                                          )}`}
                                        >
                                          {getCheckStatusLabel(
                                            matchingCheck.status
                                          )}
                                        </span>
                                      ) : (
                                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                          Evidence received · Pending
                                          verification
                                        </span>
                                      )}

                                    </div>

                                    {matchingCheck?.status ===
                                      "PENDING" && (
                                      <p className="mt-3 text-sm text-blue-700">
                                        Evidence received. This
                                        requirement is still pending
                                        administrator verification.
                                      </p>
                                    )}

                                    {matchingCheck?.status ===
                                      "NEEDS_INFORMATION" &&
                                      matchingCheck.notes && (
                                        <div className="mt-3 rounded-lg bg-amber-50 p-3">
                                          <p className="text-xs font-semibold text-amber-900">
                                            Additional information requested
                                          </p>

                                          <p className="mt-1 text-sm text-amber-800">
                                            {
                                              matchingCheck.notes
                                            }
                                          </p>
                                        </div>
                                      )}

                                    {matchingCheck?.status ===
                                      "PASSED" && (
                                      <p className="mt-3 text-sm text-green-700">
                                        This requirement has been verified
                                        by a TenderHub administrator.
                                      </p>
                                    )}

                                    {matchingCheck?.status ===
                                      "FAILED" &&
                                      matchingCheck.notes && (
                                        <div className="mt-3 rounded-lg bg-red-50 p-3">
                                          <p className="text-xs font-semibold text-red-900">
                                            Administrator notes
                                          </p>

                                          <p className="mt-1 text-sm text-red-800">
                                            {
                                              matchingCheck.notes
                                            }
                                          </p>
                                        </div>
                                      )}

                                  </div>
                                );
                              }
                            )}

                          </div>
                        </div>
                      )}

                    </div>
                  );
                }
              )}

            </div>
          )}
        </section>

        {/* Verification overview */}
        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-xl font-semibold text-slate-900">
            Verification evidence overview
          </h2>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Evidence received and administrator verification are shown
            separately.
          </p>

          {checks.length === 0 ? (
            <div className="mt-5 rounded-lg bg-slate-50 p-4">
              <p className="text-sm text-slate-600">
                Verification checks will appear here once the verification
                application is created.
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">

              {checks.map((check) => {
                const evidence =
                  documentEvidence.get(
                    check.code
                  ) ?? [];

                const suggestions =
                  REQUIREMENT_DOCUMENT_SUGGESTIONS[
                    check.code
                  ] ?? [];

                return (
                  <div
                    key={check.id}
                    className="rounded-lg border border-slate-200 p-4"
                  >

                    <div className="flex flex-wrap items-start justify-between gap-4">

                      <div>
                        <p className="font-medium text-slate-800">
                          {check.name ||
                            getRequirementLabel(
                              check.code
                            )}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {evidence.length > 0
                            ? `${evidence.length} evidence document${
                                evidence.length ===
                                1
                                  ? ""
                                  : "s"
                              } received`
                            : suggestions.length >
                                0
                              ? `Suggested: ${suggestions
                                  .map(
                                    getDocumentCategoryLabel
                                  )
                                  .join(
                                    ", "
                                  )}`
                              : "No supporting document required from the organization"}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">

                        {evidence.length >
                          0 &&
                          check.status ===
                            "PENDING" && (
                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              Evidence received
                            </span>
                          )}

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${getCheckStatusClass(
                            check.status
                          )}`}
                        >
                          {getCheckStatusLabel(
                            check.status
                          )}
                        </span>

                      </div>

                    </div>

                    {evidence.length ===
                      0 &&
                      suggestions.length >
                        0 &&
                      !isLocked && (
                        <button
                          type="button"
                          onClick={() =>
                            selectSuggestedDocument(
                              suggestions[0]
                            )
                          }
                          className="mt-3 text-sm font-semibold text-[#071A33] hover:underline"
                        >
                          Upload suggested document →
                        </button>
                      )}

                  </div>
                );
              })}

            </div>
          )}
        </section>

        {/* Important distinction */}
        <section className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-6">

          <h2 className="font-semibold text-amber-900">
            Evidence is not the same as verification
          </h2>

          <p className="mt-2 text-sm leading-6 text-amber-800">
            Uploading a document only records that TenderHub has received
            evidence. It does not automatically verify the organization.
            An authorized TenderHub administrator must review the evidence
            and record the verification result.
          </p>

        </section>

        {/* Submission */}
        <section className="mt-8 rounded-xl border border-[#D4AF37]/50 bg-white p-6 shadow-sm">

          <div className="flex flex-wrap items-start justify-between gap-6">

            <div className="max-w-2xl">

              <h2 className="text-xl font-semibold text-slate-900">
                Submit verification application
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Once submitted, TenderHub administrators will review the
                organization information and supporting evidence.
              </p>

              <div className="mt-5 space-y-2 text-sm">

                <div
                  className={
                    organizationFieldsComplete
                      ? "text-green-700"
                      : "text-red-700"
                  }
                >
                  {organizationFieldsComplete
                    ? "✓"
                    : "○"}{" "}
                  Organization information complete
                </div>

                <div
                  className={
                    hasRegistrationDocument
                      ? "text-green-700"
                      : "text-red-700"
                  }
                >
                  {hasRegistrationDocument
                    ? "✓"
                    : "○"}{" "}
                  Registration evidence submitted
                </div>

              </div>

              <div className="mt-5 rounded-lg bg-amber-50 p-4">
                <p className="text-sm leading-6 text-amber-800">
                  <strong>Important:</strong> submitting evidence does not
                  automatically verify your organization. The evidence remains
                  pending until reviewed by an authorized TenderHub
                  administrator.
                </p>
              </div>

            </div>

            {!isLocked && (
              <button
                type="button"
                onClick={submitVerification}
                disabled={
                  !canSubmit ||
                  submitting
                }
                className="rounded-lg bg-[#071A33] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting
                  ? "Submitting..."
                  : "Submit for verification"}
              </button>
            )}

          </div>
        </section>

        {/* Bottom navigation */}
        <div className="mt-8 flex flex-wrap justify-between gap-3">

          <Link
            href="/dashboard/organization/verification/administrator-checks"
            className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            ← Administrator Checks
          </Link>

          <Link
            href="/dashboard/organization/verification"
            className="rounded-lg bg-[#071A33] px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Verification Overview
          </Link>

        </div>

      </div>
    </main>
  );
}